package plasmaApi.project.plasmaApi.service.math.simulation;

import plasmaApi.project.plasmaApi.dto.mathDto.simulation.SimulationRequestDto;
import plasmaApi.project.plasmaApi.dto.mathDto.simulation.SimulationResultDto;

public interface SimulationService {
    SimulationResultDto runSimulation(SimulationRequestDto req);
}
