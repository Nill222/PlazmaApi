package plasmapi.project.plasma.service.math.simulation;

import org.springframework.transaction.annotation.Transactional;
import plasmapi.project.plasma.dto.mathDto.simulation.SimulationRequest;

public interface SimulationOrchestratorService {
    @Transactional
    SimulationResult runSimulation(SimulationRequest request);
}
