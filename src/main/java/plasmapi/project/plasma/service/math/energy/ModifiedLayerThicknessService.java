package plasmapi.project.plasma.service.math.energy;

/**
 * Толщина модифицированного слоя (5).
 */
public interface ModifiedLayerThicknessService {

    /**
     * h = C_dose · Φ · η · f_angle(θ) · f_temp(T_eff).
     */
    double computeThickness(
            double fluence,
            double incidenceAngleRad,
            double effectiveSurfaceTemperature,
            double referenceTemperature
    );
}
