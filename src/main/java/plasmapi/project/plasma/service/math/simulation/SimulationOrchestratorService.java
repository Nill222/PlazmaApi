package plasmapi.project.plasma.service.math.simulation;

import org.springframework.transaction.annotation.Transactional;

public interface SimulationOrchestratorService {
    @Transactional
    SimulationResult runSimulation(SimulationRequest request);
}
