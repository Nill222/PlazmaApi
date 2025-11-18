package plasmapi.project.plasma.service.math.thermal;

import org.springframework.stereotype.Service;
import plasmapi.project.plasma.dto.mathDto.thermal.ThermalDto;
import plasmapi.project.plasma.service.math.lattice.LatticePhysics;

import java.util.ArrayList;
import java.util.List;

@Service
public class ThermalServiceImpl implements ThermalService {

    /**
     * Моделирует охлаждение материала после нагрева плазмой.
     *  T0 начальная температура (K)
     *  lambda коэффициент теплопередачи (1/с)
     *  tMax общее время (с)
     *  dt шаг времени (с)
     * @return список температур по времени
     */
    @Override
    public List<Double> simulateCooling(ThermalDto dto) {
        double lambda = dto.lambda() * LatticePhysics.thermalConductivityFactor(dto.structure());
        List<Double> temps = new ArrayList<>();
        for (double t = 0.0; t <= dto.tMax(); t += dto.dt()) {
            temps.add(dto.T0() * Math.exp(-lambda * t));
        }
        return temps;
    }
}
