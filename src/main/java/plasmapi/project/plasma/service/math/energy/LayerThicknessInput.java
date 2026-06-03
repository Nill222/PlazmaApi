package plasmapi.project.plasma.service.math.energy;

/**
 * Входные данные для формулы (5) — толщина модифицированного слоя h_i(u,v).
 */
public record LayerThicknessInput(
        double fluence,
        double penetrationCoefficient,
        double incidenceAngleRad,
        double localSurfaceTemperatureK,
        double pressurePa,
        double electronTemperature,
        double currentA,
        double voltageV
) {}
