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
        double structFactor = dto.structure() != null ? LatticePhysics.thermalConductivityFactor(dto.structure()) : 1.0;
        double potentialFactor = 1.0;
        if (dto.potential() != null) {
            potentialFactor = 1.0 + Math.log1p(dto.potential().stiffness()) * 0.01; // мягкое влияние
        }

        double lambda = dto.lambda() * structFactor * potentialFactor;

        List<Double> temps = new ArrayList<>();
        for (double t = 0.0; t <= dto.tMax(); t += dto.dt()) {
            temps.add(dto.T0() * Math.exp(-lambda * t));
        }
        return temps;
    }
}
