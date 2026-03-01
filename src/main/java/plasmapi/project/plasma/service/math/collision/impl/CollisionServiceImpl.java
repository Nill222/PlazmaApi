package plasmapi.project.plasma.service.math.collision.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.dto.mathDto.collision.CollisionResult;
import plasmapi.project.plasma.model.atom.AtomList;
import plasmapi.project.plasma.model.res.Ion;
import plasmapi.project.plasma.service.PhysicalConstants;
import plasmapi.project.plasma.service.math.collision.CollisionService;

@Service
@RequiredArgsConstructor
public class CollisionServiceImpl implements CollisionService {

    private static final double A0 = 0.529e-10; // бор радиус, м
    private static final double ZBL_CONST = 0.4685e-10; // постоянная в формуле ZBL

    /**
     * Моделирует столкновение иона с атомом.
     * @param ion ион
     * @param atom атом мишени
     * @param ionEnergyEv энергия иона в эВ
     * @param impactParameter прицельный параметр, м
     * @param surfaceBindingEnergy эВ, энергия связи на поверхности (для порога смещения)
     * @return результат столкновения
     */
    @Override
    public CollisionResult simulate(Ion ion, AtomList atom, double ionEnergyEv,
                                    double impactParameter, double surfaceBindingEnergy) {
        // Атомные номера
        int Z1 = ion.getCharge();      // предполагаем, что такое поле есть
        int Z2 = atom.getValence();     // аналогично

        // Массы в кг
        double M1 = ion.getMass();         // метод, возвращающий массу в кг
        double M2 = atom.getMass();        // атомная масса в кг (из молярной массы / NA)

        // Энергия иона в джоулях (для перевода в СИ при необходимости)
        double E = ionEnergyEv * PhysicalConstants.EV;

        // Максимальная переданная энергия в Ц-системе
        double Tmax = 4 * M1 * M2 / ((M1 + M2) * (M1 + M2)) * E;

        // Угол рассеяния в системе центра масс (ZBL)
        double thetaCM = zblScatteringAngle(Z1, Z2, M1, M2, E, impactParameter);

        // Переданная энергия
        double transferred = Tmax * Math.pow(Math.sin(thetaCM / 2), 2);

        // Энергия, переданная в электронные потери (NRT)
        double eps = reducedEnergyLindhard(Z1, Z2, M1, M2, E);
        double kg = electronicStoppingFactor(Z1, Z2, eps);
        double damageEnergy = 0.8 * transferred / (1 + kg); // NRT damage energy

        // Пороговая энергия смещения (обычно 2 * поверхностная энергия связи)
        double displacementThreshold = 2 * surfaceBindingEnergy * PhysicalConstants.EV;

        return CollisionResult.builder()
                .transferredEnergy(transferred / PhysicalConstants.EV) // обратно в эВ
                .damageEnergy(damageEnergy / PhysicalConstants.EV)
                .thetaCM(thetaCM)
                .impactParameter(impactParameter)
                .build();
    }

    /**
     * Расчёт угла рассеяния по модели ZBL.
     */
    private double zblScatteringAngle(int Z1, int Z2, double M1, double M2, double E, double b) {
        double a = ZBL_CONST / (Math.pow(Z1, 0.23) + Math.pow(Z2, 0.23));
        double eps = reducedEnergyLindhard(Z1, Z2, M1, M2, E);
        double s = Math.log(1 + 1.138 * eps) / (2 * eps);
        double t = b / a;
        return 2 * Math.atan(s * Math.exp(-t / (2 * s)));
    }

    /**
     * Приведённая энергия Линдхарда (безразмерная).
     */
    private double reducedEnergyLindhard(int Z1, int Z2, double M1, double M2, double E) {
        double aU = 0.8854 * A0 / (Math.pow(Z1, 0.23) + Math.pow(Z2, 0.23));
        double e2 = PhysicalConstants.E_CHARGE_SQ / (4 * Math.PI * PhysicalConstants.EPS0); // e^2/(4pi eps0) в Дж*м
        return (aU * M2 * E) / (Z1 * Z2 * e2 * (M1 + M2));
    }

    /**
     * Электронный тормозной фактор k*g(ε) по NRT.
     */
    private double electronicStoppingFactor(int Z1, int Z2, double eps) {
        // Формула из NRT: k = 0.133 * Z1^(2/3) * Z2^(1/2) / (Z1^(1/2) + Z2^(1/2))^(2/3)?
        // Упрощённый вариант, используемый в коде:
        return 0.133 * Math.pow(Z1, 2.0/3) * Math.pow(Z2, 1.0/3) * Math.pow(Z1 + Z2, 0.5) * Math.pow(eps, 1.0/3);
    }
}
