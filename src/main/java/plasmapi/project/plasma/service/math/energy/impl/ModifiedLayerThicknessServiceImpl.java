package plasmapi.project.plasma.service.math.energy.impl;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.service.math.energy.LayerThicknessInput;
import plasmapi.project.plasma.service.math.energy.ModifiedLayerThicknessService;

/**
 * (5) h_i = κ_d · Φ_i · K_{прон,i} · [1 − β·sin²α + γ_T·T + Σ_m η_m·p_m]
 */
@Service
public class ModifiedLayerThicknessServiceImpl implements ModifiedLayerThicknessService {

    @Value("${energy-deposition.layer.dose-to-thickness:5.0e-12}")
    private double kappaD = 5.0e-12;

    @Value("${energy-deposition.layer.angular-beta:0.15}")
    private double angularBeta = 0.15;

    @Value("${energy-deposition.layer.temperature-gamma:2.0e-4}")
    private double temperatureGamma = 2.0e-4;

    @Value("${energy-deposition.layer.plasma-pressure-eta:1.0e-5}")
    private double etaPressure = 1.0e-5;

    @Value("${energy-deposition.layer.plasma-electron-temp-eta:0.15}")
    private double etaElectronTemp = 0.15;

    @Value("${energy-deposition.layer.plasma-current-eta:1.0e-3}")
    private double etaCurrent = 1.0e-3;

    @Value("${energy-deposition.layer.plasma-voltage-eta:1.0e-4}")
    private double etaVoltage = 1.0e-4;

    @Value("${energy-deposition.layer.bracket-min:0.05}")
    private double bracketMin = 0.05;

    @Override
    public double computeThickness(LayerThicknessInput input) {
        if (input.fluence() < 0) {
            throw new IllegalArgumentException("Fluence must be non-negative");
        }

        double sinAlpha = Math.sin(input.incidenceAngleRad());
        double angularTerm = 1.0 - angularBeta * sinAlpha * sinAlpha;

        double temperatureTerm = temperatureGamma * input.localSurfaceTemperatureK();

        double plasmaSum = etaPressure * input.pressurePa()
                + etaElectronTemp * input.electronTemperature()
                + etaCurrent * input.currentA()
                + etaVoltage * input.voltageV();

        double bracket = angularTerm + temperatureTerm + plasmaSum;
        bracket = Math.max(bracket, bracketMin);

        double kPron = Math.max(input.penetrationCoefficient(), 0.0);

        return kappaD * input.fluence() * kPron * bracket;
    }

    @Override
    @Deprecated
    public double computeThickness(
            double fluence,
            double incidenceAngleRad,
            double effectiveSurfaceTemperature,
            double referenceTemperature
    ) {
        return computeThickness(new LayerThicknessInput(
                fluence,
                1.0,
                incidenceAngleRad,
                effectiveSurfaceTemperature,
                0.0,
                0.0,
                0.0,
                0.0
        ));
    }
}
