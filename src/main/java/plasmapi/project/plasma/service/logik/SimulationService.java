package plasmapi.project.plasma.service.logik;

import plasmapi.project.plasma.model.res.Result;

public interface SimulationService {
    Result simulateImpact(Integer configId, Integer ionId, double accelerationVoltage);


}
