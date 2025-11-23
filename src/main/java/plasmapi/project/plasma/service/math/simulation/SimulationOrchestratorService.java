package plasmapi.project.plasma.service.math.simulation;

import org.springframework.transaction.annotation.Transactional;
import plasmapi.project.plasma.dto.mathDto.simulation.SimulationRequestDto;
import plasmapi.project.plasma.dto.mathDto.simulation.SimulationResultDto;

public interface SimulationOrchestratorService {
    @Transactional
    SimulationResultDto runSimulation(SimulationRequestDto req);
}
