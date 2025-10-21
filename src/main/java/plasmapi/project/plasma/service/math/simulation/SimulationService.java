package plasmapi.project.plasma.service.math.simulation;

import plasmapi.project.plasma.dto.mathDto.simulation.SimulationRequestDto;
import plasmapi.project.plasma.dto.mathDto.simulation.SimulationResultDto;

public interface SimulationService {
    SimulationResultDto runSimulation(SimulationRequestDto req);
}
