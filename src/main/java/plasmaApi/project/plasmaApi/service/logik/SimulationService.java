package plasmaApi.project.plasmaApi.service.logik;

import plasmaApi.project.plasmaApi.model.res.Result;

public interface SimulationService {
    Result simulateImpact(Integer configId, Integer ionId, double accelerationVoltage);


}
