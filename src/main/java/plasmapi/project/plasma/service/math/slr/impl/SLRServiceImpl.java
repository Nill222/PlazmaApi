package plasmapi.project.plasma.service.math.slr.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.dto.mathDto.collision.CollisionResult;
import plasmapi.project.plasma.service.PhysicalConstants;
import plasmapi.project.plasma.service.math.slr.SLRService;

@Service
@RequiredArgsConstructor
public class SLRServiceImpl implements SLRService {

    @Value("${slr.k:5e-3}")       // масштаб перемешивания
    private double K_SLR;

    @Value("${slr.fluence0:1e20}") // характерный флюенс насыщения
    private double FLUENCE_0;

    private static final double MAX_FACTOR = 50.0;
    private static final double EV = PhysicalConstants.EV;

    @Override
    public double computeFactor(
            double fluence,
            double thetaRad,
            CollisionResult collision,
            double surfaceBindingEnergyEv
    ) {

        if (fluence < 0) {
            throw new IllegalArgumentException("Fluence must be non-negative");
        }

        double cosTheta = Math.cos(thetaRad);

        // =========================
        // 1. ENERGY
        // =========================
        double transferred = collision.transferredEnergy() * EV;

        double Ed = 25.0 * EV;

        // =========================
        // 2. DAMAGE (NRT model)
        // =========================
        double Nd = transferred / (2.0 * Ed); // defects per ion

        // =========================
        // 3. DAMAGE DENSITY
        // =========================
        double fluenceEff = fluence * cosTheta;

        double damageDensity = Nd * fluenceEff;

        // =========================
        // 4. MIXING LENGTH
        // =========================
        double lambda = 1e-9; // ~1 nm (типичный каскад)

        // =========================
        // 5. SLR FACTOR
        // =========================
        double mixing = K_SLR * damageDensity * lambda * lambda;

        // =========================
        // 6. SATURATION
        // =========================
        double saturation = 1.0 / (1.0 + fluenceEff / FLUENCE_0);

        double factor = 1.0 + mixing * saturation;

        if (Double.isNaN(factor) || factor < 1.0) {
            factor = 1.0;
        }

        return Math.min(factor, MAX_FACTOR);
    }
}