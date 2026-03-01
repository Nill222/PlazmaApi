package plasmapi.project.plasma.service.math.thermal;

import java.util.List;

public record ThermalResult(List<Double> times, List<double[]> temperatureProfiles, double T0, double thickness) {
}
