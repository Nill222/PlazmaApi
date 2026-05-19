package plasmapi.project.plasma.service.math.diffusion;

/**
 * Промежуточные величины этапа диффузии / транспорта ионов.
 */
public record DiffusionIntermediate(
        double dRadiation,
        double dCollision,
        double slrFactor,
        double damageRate,
        double projectedRange,
        double straggleSigma,
        double latticeStiffness,
        double equilibriumDistance
) {}
