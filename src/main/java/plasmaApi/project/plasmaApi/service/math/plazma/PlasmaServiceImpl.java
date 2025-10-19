package plasmaApi.project.plasmaApi.service.math.plazma;

import org.springframework.stereotype.Service;
import plasmaApi.project.plasmaApi.dto.mathDto.plasma.PlasmaParameters;

@Service
public class PlasmaServiceImpl implements PlasmaService {

    /**
     * Расчёт параметров плазмы тлеющего разряда.
     *
     *  voltage напряжение (В)
     * pressure давление (Па)
     * temperature температура электронов (K)
     *  объект PlasmaParameters с основными параметрами
     */
    public PlasmaParameters calculate(double voltage, double pressure, double temperature) {
        double e = 1.602e-19;
        double me = 9.11e-31;

        double n_e = pressure / (1.38e-23 * temperature); // плотность электронов
        double v_e = Math.sqrt(2 * e * voltage / me);     // средняя скорость электронов
        double current = e * n_e * v_e * 1e-4;            // плотность тока (приближённо)

        return new PlasmaParameters(n_e, v_e, current, voltage, pressure, temperature);
    }
}

