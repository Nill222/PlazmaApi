package plasmapi.project.plasma.service.math.energy.impl;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.service.math.energy.FluenceIntegrationService;

import java.util.function.DoubleUnaryOperator;

/**
 * (4) Φ ≈ Σ_n v(t_n) Δt_n с адаптивным шагом по времени обработки.
 */
@Service
public class FluenceIntegrationServiceImpl implements FluenceIntegrationService {

    @Value("${energy-deposition.integration.min-steps:50}")
    private int minSteps;

    @Value("${energy-deposition.integration.max-steps:5000}")
    private int maxSteps;

    @Override
    public double integrate(double exposureTime, DoubleUnaryOperator exposureRateAtTime) {
        if (exposureTime <= 0) {
            throw new IllegalArgumentException("Exposure time must be > 0");
        }

        int steps = chooseSteps(exposureTime);
        double dt = exposureTime / steps;
        double fluence = 0.0;

        for (int n = 0; n < steps; n++) {
            double tMid = (n + 0.5) * dt;
            double v = exposureRateAtTime.applyAsDouble(tMid);
            if (Double.isNaN(v) || v < 0) {
                v = 0.0;
            }
            fluence += v * dt;
        }

        return Math.max(fluence, 0.0);
    }

    private int chooseSteps(double exposureTime) {
        int steps = (int) Math.ceil(exposureTime * 100.0);
        steps = Math.max(minSteps, steps);
        return Math.min(steps, maxSteps);
    }
}
