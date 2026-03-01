package plasmapi.project.plasma.service.math.diffusion.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.dto.mathDto.collision.CollisionResult;
import plasmapi.project.plasma.dto.mathDto.potential.PotentialParameters;
import plasmapi.project.plasma.model.atom.AtomList;
import plasmapi.project.plasma.model.res.Ion;
import plasmapi.project.plasma.model.res.PlasmaConfiguration;
import plasmapi.project.plasma.service.PhysicalConstants;
import plasmapi.project.plasma.service.math.collision.CollisionService;
import plasmapi.project.plasma.service.math.diffusion.DiffusionProfile;
import plasmapi.project.plasma.service.math.diffusion.DiffusionService;
import plasmapi.project.plasma.service.math.plazma.PlasmaResult;
import plasmapi.project.plasma.service.math.plazma.PlasmaService;
import plasmapi.project.plasma.service.math.potential.PotentialService;
import plasmapi.project.plasma.service.math.resonanse.ResonanceService;
import plasmapi.project.plasma.service.math.slr.SLRService;
import plasmapi.project.plasma.service.math.thermal.ThermalResult;
import plasmapi.project.plasma.service.math.thermal.ThermalService;
import plasmapi.project.plasma.service.math.thermal.impl.ThermalServiceImpl;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DiffusionServiceImpl implements DiffusionService {

    private final PotentialService potentialService;
    private final CollisionService collisionService;
    private final PlasmaService plasmaService;
    private final ThermalService thermalService;
    private final SLRService slrService;
    private final ResonanceService resonanceService;

    // Физические константы
    private static final double R = PhysicalConstants.R;           // Дж/(моль·К)
    private static final double KB = PhysicalConstants.KB;         // Дж/К
    private static final double NA = PhysicalConstants.NA;         // моль⁻¹
    private static final double EV = PhysicalConstants.EV;         // Дж/эВ

    // Эмпирические коэффициенты (можно вынести в application.properties)
    private static final double MIN_D = 1e-40;      // минимальный коэффициент диффузии, м²/с
    private static final double MAX_D = 1e-6;       // максимальный коэффициент диффузии, м²/с
    private static final double ALPHA = 0.25;        // вклад жёсткости в энергию активации
    private static final double BETA = 1e-3;         // подавление диффузии жёсткостью
    private static final double RADIATION_FACTOR = 20.0; // множитель в экспоненте радиационного ускорения
    private static final double SLR_COUPLING = 0.05; // вклад SLR-фактора
    private static final double DEFAULT_IMPACT_PARAMETER_FACTOR = 0.5; // доля от re для прицельного параметра

    /**
     * Рассчитывает профиль диффузии под облучением.
     *
     * @param atom         материал мишени
     * @param ion          тип иона
     * @param plasmaConfig конфигурация плазмы/пучка
     * @param exposureTime время облучения, с
     * @param ambientTemp  температура окружающей среды, К
     * @return объект с результатами диффузии
     */
    public DiffusionProfile calculateProfile(
            AtomList atom,
            Ion ion,
            PlasmaConfiguration plasmaConfig,
            double exposureTime,
            double ambientTemp
    ) {
        // 1. Термический расчёт (температура меняется со временем)
        ThermalDtoAdapter adapter = new ThermalDtoAdapter(plasmaConfig, ambientTemp, exposureTime);
        ThermalResult thermal = thermalService.simulate(
                plasmaConfig,
                adapter.getT0(),
                adapter.getTMax(),
                adapter.getDt(),
                adapter.getThickness(),
                adapter.getPowerInput(),
                adapter.getProjectedRange(),
                adapter.getBoundaryCondition(),
                ambientTemp, // или adapter.getAmbientTemp()? уже есть
                adapter.getH(),
                adapter.getN()
        );
        // Для простоты используем конечную температуру как характеристическую
        List<Double> temps = thermal.times(); // если ThermalResult хранит список средних температур
        double finalT = temps.get(temps.size() - 1);

        // 2. Плазменные параметры
        PlasmaResult plasma = plasmaService.calculate(plasmaConfig, ion, null);
        double ionEnergyEv = plasma.ionEnergyEv();
        double ionFlux = plasma.ionFlux();
        double fluence = ionFlux * exposureTime;

        // 3. Базовые свойства атома
        // TODO: заменить valence на atomicNumber, когда появится
        int Z = atom.getValence(); // временно

        // 4. Предэкспоненциальные множители диффузии (пока из packingFactor, TODO заменить на отдельные поля)
        double D1 = atom.getPackingFactor1() != null ? atom.getPackingFactor1() : 1e-18;
        double D2 = atom.getPackingFactor2() != null ? atom.getPackingFactor2() : 1e-19;

        // 5. Энергии активации (Дж/моль)
        double Q1 = getActivationEnergy(atom, true);
        double Q2 = getActivationEnergy(atom, false);

        // 6. Потенциал – используем равновесное расстояние для оценки жёсткости
        //    Сначала вычислим потенциал при любом разумном r (например, равновесном)
        PotentialParameters potential = potentialService.computePotential(atom.getA() * 1e-10, atom);
        double stiffness = potential.stiffness();
        double re = potential.re(); // равновесное расстояние, м

        // Модификация энергий активации под действием напряжений (эмпирика)
        double Veff = stiffness * re; // эффективная энергия (размерность Дж·м? но эмпирика)
        double Q1_mod = Q1 + ALPHA * Veff;
        double Q2_mod = Q2 + ALPHA * Veff;

        // 7. Термический коэффициент диффузии
        double term1 = D1 * Math.exp(-Q1_mod / (R * finalT));
        double term2 = D2 * Math.exp(-Q2_mod / (R * finalT));
        double D_thermal = (term1 + term2) * Math.exp(-BETA * stiffness);
        D_thermal = clamp(D_thermal);

        // 8. Радиационно-стимулированная диффузия (столкновительное усиление)
        double Esurf = plasmaConfig.getSurfaceBindingEnergy() != null ? plasmaConfig.getSurfaceBindingEnergy() : 3.0;
        double impactParam = re * DEFAULT_IMPACT_PARAMETER_FACTOR; // характерный прицельный параметр
        CollisionResult collision = collisionService.simulate(
                ion, atom, ionEnergyEv, impactParam, Esurf
        );
        double transferredJ = collision.transferredEnergy() * EV; // в Дж
        double ionEnergyJ = ionEnergyEv * EV;
        double E_total = Math.max(transferredJ + ionEnergyJ, 0.0);
        double exponent = Math.min(E_total / (RADIATION_FACTOR * KB * finalT), 20.0); // ограничиваем
        double D_collision = D_thermal * Math.exp(exponent);
        D_collision = clamp(D_collision);

        // 9. Учёт ионного перемешивания (SLR)
        double thetaRad = Math.toRadians(plasmaConfig.getIonIncidenceAngle());
        double slrFactor = slrService.computeFactor(fluence, thetaRad);
        slrFactor = Math.min(Math.max(slrFactor, 0.0), 10.0);
        double D_slr = D_collision * (1.0 + SLR_COUPLING * slrFactor);
        D_slr = clamp(D_slr);

        // 10. Резонансный фактор (используем новые поля атома)
        double xi = resonanceService.computeXi(atom, ionEnergyEv);
        double D_effective = D_slr * Math.max(1.0, Math.log1p(xi));
        D_effective = clamp(D_effective);

        // 11. Профиль диффузии (экспоненциальное приближение)
        double meanDepth = Math.sqrt(2 * D_effective * exposureTime);
        if (meanDepth < 1e-12) meanDepth = 1e-12;

        List<Double> depths = new ArrayList<>();
        List<Double> conc = new ArrayList<>();
        double dx = meanDepth * 6.0 / 199; // до 6 сигм
        for (int i = 0; i < 200; i++) {
            double x = i * dx;
            depths.add(x);
            conc.add(Math.exp(-x / meanDepth));
        }

        return new DiffusionProfile(
                D1, D2,
                Q1 / (NA * EV), Q2 / (NA * EV), // обратно в эВ
                D_thermal,
                D_effective,
                meanDepth,
                depths,
                conc
        );
    }

    // Ограничитель коэффициента диффузии
    private double clamp(double D) {
        if (Double.isNaN(D) || D < MIN_D) return MIN_D;
        return Math.min(D, MAX_D);
    }

    /**
     * Возвращает энергию активации для канала диффузии в Дж/моль.
     * Если в атоме есть специальные поля activationEnergyEv1/2, используем их,
     * иначе оцениваем как долю от энергии когезии.
     *
     * @param atom  атом
     * @param first true для первого канала, false для второго
     */
    private double getActivationEnergy(AtomList atom, boolean first) {
        // Пытаемся получить из специальных полей (пока не добавлены, поэтому закомментировано)
        // Double ev = first ? atom.getActivationEnergyEv1() : atom.getActivationEnergyEv2();
        // if (ev != null) return ev * EV * NA;

        // Оценка из энергии когезии
        Double cohEv = first ? atom.getCohesiveEnergyEv1() : atom.getCohesiveEnergyEv2();
        if (cohEv == null) {
            cohEv = 4.3; // значение по умолчанию для многих металлов
        }
        double fraction = first ? 0.25 : 0.45; // коэффициенты из оригинальной модели
        return cohEv * EV * NA * fraction;
    }

    private static class ThermalDtoAdapter {
        private final PlasmaConfiguration cfg;
        private final double ambientTemp;
        private final double exposureTime;
        // Можно добавить поля для projectedRange, boundaryCondition, h, N, если они должны передаваться извне
        // Но пока сделаем методы, возвращающие значения по умолчанию или из cfg.

        ThermalDtoAdapter(PlasmaConfiguration cfg, double ambientTemp, double exposureTime) {
            this.cfg = cfg;
            this.ambientTemp = ambientTemp;
            this.exposureTime = exposureTime;
        }

        double getT0() {
            return cfg.getTargetTemperature() != null ? cfg.getTargetTemperature() : ambientTemp;
        }

        double getTMax() {
            return exposureTime;
        }

        double getDt() {
            return 0.01 * exposureTime;
        }

        double getThickness() {
            // TODO: получить из cfg или параметра
            return 0.001; // 1 мм по умолчанию
        }

        Double getPowerInput() {
            // TODO: рассчитать из потока и энергии ионов
            return null;
        }

        Double getProjectedRange() {
            // TODO: получить из cfg или рассчитать
            return 10e-9; // 10 нм по умолчанию
        }

        ThermalServiceImpl.BoundaryCondition getBoundaryCondition() {
            // TODO: получить из cfg
            return ThermalServiceImpl.BoundaryCondition.ADIABATIC; // по умолчанию
        }

        double getH() {
            // TODO: получить из cfg
            return 0.0; // для адиабатического не важно
        }

        Integer getN() {
            // TODO: получить из cfg или null для авто
            return null;
        }
    }
}