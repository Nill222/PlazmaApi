package plasmapi.project.plasma.service.math.energy.impl;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.service.math.energy.FluenceFormulaInput;
import plasmapi.project.plasma.service.math.energy.FluenceIntegrationService;

import java.util.function.DoubleUnaryOperator;

/**
 * (4) Φ_i(u,v) = V_a · Σ_{n=1}^{N_s}
 * [cos^γ α_i / (1+(r_i/R)^2)^δ · F_d · f_p(P) · E_i · ε_i · Φ_ion] · Δt_n
 */
@Service
public class FluenceIntegrationServiceImpl implements FluenceIntegrationService {

    @Value("${energy-deposition.integration.min-steps:50}")
    private int minSteps = 50;

    @Value("${energy-deposition.integration.max-steps:5000}")
    private int maxSteps = 5000;

    @Value("${energy-deposition.fluence.angle-exponent:7}")
    private double angleExponent = 7.0;

    @Value("${energy-deposition.fluence.geometry-exponent:2.0}")
    private double geometryExponent = 2.0;

    @Value("${energy-deposition.fluence.pressure-scale-pa:10.0}")
    private double pressureScalePa = 10.0;

    @Value("${energy-deposition.fluence.reference-ion-energy-ev:100.0}")
    private double referenceIonEnergyEv = 100.0;

    @Value("${energy-deposition.fluence.reference-ion-flux:1.0e18}")
    private double referenceIonFlux = 1.0e18;

    @Override
    public double integrateDocumentFormula(FluenceFormulaInput input) {
        if (input.exposureTime() <= 0) {
            throw new IllegalArgumentException("Exposure time must be > 0");
        }

        double r = Math.max(input.radialDistanceM(), 0.0);
        double R = effectiveRadius(input);
        double geo = geometricFactor(r, R);

        double alpha = input.incidenceAngleRad();
        double cosAlpha = Math.max(Math.cos(alpha), 1e-6);
        double angularFactor = Math.pow(cosAlpha, angleExponent);

        double pressurePa = nz(input.plasmaConfig().getPressure());
        double fp = pressureFunction(pressurePa);

        double ei = energyFactor(input.ionEnergyEv());
        double eps = Math.max(input.implantationEfficiency(), 0.0);
        double fluxNorm = Math.max(input.ionFlux(), 0.0) / Math.max(referenceIonFlux, 1e-12);

        double va = Math.max(input.va(), 0.0);

        int steps = chooseSteps(input.exposureTime());
        double dt = input.exposureTime() / steps;
        double fluence = 0.0;

        DoubleUnaryOperator fd = input.dischargeModulationFd() != null
                ? input.dischargeModulationFd()
                : t -> 1.0;

        for (int n = 0; n < steps; n++) {
            double tMid = (n + 0.5) * dt;
            double dischargeFactor = Math.max(fd.applyAsDouble(tMid), 0.0);

            double term = va * angularFactor * geo * dischargeFactor * fp * ei * eps * fluxNorm * dt;
            if (Double.isFinite(term) && term > 0) {
                fluence += term;
            }
        }

        return Math.max(fluence, 0.0);
    }

    @Override
    @Deprecated
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

    private double geometricFactor(double r, double R) {
        double ratio = r / Math.max(R, 1e-9);
        return 1.0 / Math.pow(1.0 + ratio * ratio, geometryExponent);
    }

    private double pressureFunction(double pressurePa) {
        return 1.0 + pressurePa / Math.max(pressureScalePa, 1e-6);
    }

    private double energyFactor(double ionEnergyEv) {
        double eRef = Math.max(referenceIonEnergyEv, 1e-6);
        return Math.max(ionEnergyEv, 0.0) / eRef;
    }

    private double effectiveRadius(FluenceFormulaInput input) {
        var cfg = input.plasmaConfig();
        if (cfg == null) {
            return 0.1;
        }
        double w = nz(cfg.getChamberWidth());
        double d = nz(cfg.getChamberDepth());
        double span = Math.min(Math.max(w, 1e-3), Math.max(d, 1e-3));
        return Math.max(0.5 * span, 1e-3);
    }

    private int chooseSteps(double exposureTime) {
        int steps = (int) Math.ceil(exposureTime * 100.0);
        steps = Math.max(minSteps, steps);
        return Math.min(steps, maxSteps);
    }

    private static double nz(Double v) {
        return v != null && Double.isFinite(v) && v > 0 ? v : 0.0;
    }
}
