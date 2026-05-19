package plasmapi.project.plasma.service.math.energy;

import java.util.function.DoubleUnaryOperator;

/**
 * Дискретное интегрирование флюенса по времени (4).
 */
public interface FluenceIntegrationService {

    /**
     * Φ = Σ_n v(t_n) Δt_n при переменной скорости воздействия.
     */
    double integrate(double exposureTime, DoubleUnaryOperator exposureRateAtTime);

    /**
     * Φ = v · t при постоянной скорости.
     */
    default double integrateConstant(double exposureTime, double exposureRate) {
        return integrate(exposureTime, t -> exposureRate);
    }
}
