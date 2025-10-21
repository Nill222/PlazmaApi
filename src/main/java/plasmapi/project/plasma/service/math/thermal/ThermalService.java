package plasmapi.project.plasma.service.math.thermal;

import java.util.List;

public interface ThermalService {
    List<Double> simulateCooling(double T0, double lambda, double tMax, double dt);
}
