package plasmapi.project.plasma.service.math.energy;

/**
 * Толщина модифицированного (упрочнённого) слоя по формуле (5).
 */
public interface ModifiedLayerThicknessService {

    /**
     * (5) h_i = κ_d · Φ_i · K_{прон,i} · [1 − β·sin²α + γ_T·T + Σ_m η_m·p_m]
     */
    double computeThickness(LayerThicknessInput input);

    /**
     * @deprecated используйте {@link #computeThickness(LayerThicknessInput)}
     */
    @Deprecated
    double computeThickness(
            double fluence,
            double incidenceAngleRad,
            double effectiveSurfaceTemperature,
            double referenceTemperature
    );
}
