package plasmapi.project.plasma.service.math.energy.impl;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.service.math.energy.ModifiedLayerThicknessService;

/**
 * (5) h = C_dose · Φ · η · cos^γ(θ) · (1 + k_T · (T_eff - T_ref)).
 */
@Service
public class ModifiedLayerThicknessServiceImpl implements ModifiedLayerThicknessService {

    @Value("${energy-deposition.layer.dose-to-thickness:5.0e-12}")
    private double doseToThickness;

    @Value("${energy-deposition.layer.implantation-efficiency:0.35}")
    private double implantationEfficiency;

    @Value("${energy-deposition.layer.angle-exponent:1.0}")
    private double angleExponent;

    @Value("${energy-deposition.layer.temperature-sensitivity:2.0e-4}")
    private double temperatureSensitivity;

    @Override
    public double computeThickness(
            double fluence,
            double incidenceAngleRad,
            double effectiveSurfaceTemperature,
            double referenceTemperature
    ) {
        if (fluence < 0) {
            throw new IllegalArgumentException("Fluence must be non-negative");
        }

        double cosTheta = Math.max(Math.cos(incidenceAngleRad), 1e-6);
        double angleFactor = Math.pow(cosTheta, angleExponent);
        double tempFactor = 1.0 + temperatureSensitivity * (effectiveSurfaceTemperature - referenceTemperature);
        tempFactor = Math.max(tempFactor, 0.0);

        return doseToThickness * fluence * implantationEfficiency * angleFactor * tempFactor;
    }
}
