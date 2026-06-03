package plasmapi.project.plasma.service.math.energy;

import java.util.function.DoubleUnaryOperator;

/**
 * Расчёт флюенса по формуле (4) из методики.
 */
public interface FluenceIntegrationService {

    /**
     * (4) Φ_i = V_a · Σ_n [cos^γ α / (1+(r_i/R)^2)^δ · F_d · f_p(P) · E_i · ε_i · Φ_ion] Δt_n
     */
    double integrateDocumentFormula(FluenceFormulaInput input);

    /**
     * @deprecated используйте {@link #integrateDocumentFormula(FluenceFormulaInput)}
     */
    @Deprecated
    double integrate(double exposureTime, DoubleUnaryOperator exposureRateAtTime);

    @Deprecated
    default double integrateConstant(double exposureTime, double exposureRate) {
        return integrate(exposureTime, t -> exposureRate);
    }
}
