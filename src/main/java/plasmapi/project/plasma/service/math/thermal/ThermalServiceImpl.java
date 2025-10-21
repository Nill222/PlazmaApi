package plasmapi.project.plasma.service.math.thermal;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ThermalServiceImpl implements ThermalService {

    /**
     * Моделирует охлаждение материала после нагрева плазмой.
     *
     * @param T0 начальная температура (K)
     * @param lambda коэффициент теплопередачи (1/с)
     * @param tMax общее время (с)
     * @param dt шаг времени (с)
     * @return список температур по времени
     */
    public List<Double> simulateCooling(double T0, double lambda, double tMax, double dt) {
        List<Double> temps = new ArrayList<>();
        double T = T0;
        for (double t = 0; t <= tMax; t += dt) {
            T = T0 * Math.exp(-lambda * t);
            temps.add(T);
        }
        return temps;
    }
}
