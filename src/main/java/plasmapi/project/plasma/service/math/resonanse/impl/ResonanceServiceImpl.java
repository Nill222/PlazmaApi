package plasmapi.project.plasma.service.math.resonanse.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.model.atom.AtomList;
import plasmapi.project.plasma.service.math.resonanse.ResonanceService;

@Service
@RequiredArgsConstructor
public class ResonanceServiceImpl implements ResonanceService {

    private static final double MAX_XI = 100.0;

    /**
     * Вычисляет резонансный множитель для диффузии.
     * Модель: лоренцевский пик на резонансной энергии.
     * Если в AtomList отсутствуют необходимые параметры, возвращает 1.0 (нет усиления).
     *
     * @param atom атом мишени (содержит параметры резонанса)
     * @param ionEnergyEv энергия иона в эВ
     * @return резонансный фактор xi (>=1), ограниченный MAX_XI, или 1.0 если данных нет
     */
    @Override
    public double computeXi(AtomList atom, double ionEnergyEv) {
        Double E_res = atom.getResonanceEnergy();
        Double Gamma = atom.getResonanceWidth();
        Double A = atom.getResonanceAmplitude();

        if (E_res == null || Gamma == null || A == null) {
            return 1.0;
        }

        // Знаменатель лоренциана
        double denominator = Math.pow(ionEnergyEv - E_res, 2) + Math.pow(Gamma / 2.0, 2);
        double xi = 1 + A * (Gamma*Gamma / 4) / denominator;
        return Math.min(xi, MAX_XI);
    }
}