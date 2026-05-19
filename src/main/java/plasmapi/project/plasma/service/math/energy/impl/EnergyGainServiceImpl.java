package plasmapi.project.plasma.service.math.energy.impl;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.service.math.energy.EnergyGainService;

/**
 * (2) G = V_dis · (L_ref / L)^n — энергетическое усиление с учётом геометрии пролёта.
 */
@Service
public class EnergyGainServiceImpl implements EnergyGainService {

    @Value("${energy-deposition.energy-gain-exponent:1.0}")
    private double energyGainExponent;

    @Value("${energy-deposition.reference-path-length-m:0.1}")
    private double referencePathLength;

    @Override
    public double computeGain(double pathLengthFromAnode, double cathodeFallVoltage) {
        double l = Math.max(pathLengthFromAnode, 1e-9);
        double lRef = Math.max(referencePathLength, 1e-9);
        double geometricFactor = Math.pow(lRef / l, energyGainExponent);
        return Math.max(cathodeFallVoltage, 0.0) * geometricFactor;
    }
}
