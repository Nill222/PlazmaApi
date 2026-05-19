package plasmapi.project.plasma.service.math.simulation;

/**
 * Промежуточные величины теплового этапа.
 */
public record ThermalIntermediate(
        double finalProbeTemperature,
        double debyeFrontSpeed,
        double debyeFrontDepth,
        double minTemperature,
        double maxTemperature,
        double avgTemperature
) {}
