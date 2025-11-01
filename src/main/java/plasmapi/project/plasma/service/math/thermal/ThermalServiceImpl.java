package plasmapi.project.plasma.service.math.thermal;

import org.springframework.stereotype.Service;
import plasmapi.project.plasma.dto.mathDto.thermal.ThermalDto;

import java.util.ArrayList;
import java.util.List;

@Service
public class ThermalServiceImpl implements ThermalService {

    /**
     * Моделирует охлаждение материала после нагрева плазмой.
     *
     *  T0 начальная температура (K)
     *  lambda коэффициент теплопередачи (1/с)
     *  tMax общее время (с)
     *  dt шаг времени (с)
     * @return список температур по времени
     */
    public List<Double> simulateCooling(ThermalDto thermalDto) {
        List<Double> temps = new ArrayList<>();
        double T = thermalDto.T0() ;
        for (double t = 0; t <= thermalDto.tMax(); t += thermalDto.dt()) {
            T = thermalDto.T0() * Math.exp(-thermalDto.lambda() * t);
            temps.add(T);
        }
        return temps;
    }
}
