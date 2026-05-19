package plasmapi.project.plasma.service.math.energy;

import plasmapi.project.plasma.model.res.PlasmaConfiguration;

/**
 * Плазменный поправочный множитель (3).
 */
public interface PlasmaCorrectionService {

    /**
     * M_p(θ) = 1 + Σ α_i θ_i + Σ β_ij θ_i θ_j.
     */
    double computeFactor(PlasmaConfiguration cfg);
}
