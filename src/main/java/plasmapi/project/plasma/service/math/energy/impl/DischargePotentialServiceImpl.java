package plasmapi.project.plasma.service.math.energy.impl;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.service.math.energy.DischargePotentialService;

/**
 * Кусочно-линейный профиль потенциала тлеющего разряда (1):
 * <ul>
 *   <li>анодная оболочка — линейный спад V_a;</li>
 *   <li>плазменный столб — слабый градиент (квазипостоянный потенциал);</li>
 *   <li>катодная оболочка — основной спад V_c (источник ускорения ионов).</li>
 * </ul>
 */
@Service
public class DischargePotentialServiceImpl implements DischargePotentialService {

    @Value("${energy-deposition.anode-drop-fraction:0.02}")
    private double anodeDropFraction;

    @Value("${energy-deposition.cathode-fall-fraction:0.85}")
    private double cathodeFallFraction;

    @Value("${energy-deposition.anode-sheath-fraction:0.05}")
    private double anodeSheathFraction;

    @Value("${energy-deposition.cathode-sheath-fraction:0.12}")
    private double cathodeSheathFraction;

    @Override
    public double potentialAt(double x, double gapLength, double totalVoltage) {
        validateGap(gapLength, totalVoltage);
        x = clamp(x, 0.0, gapLength);

        double lambdaA = anodeSheathFraction * gapLength;
        double lambdaC = cathodeSheathFraction * gapLength;
        double plasmaEnd = gapLength - lambdaC;

        double vAnode = anodeDropFraction * totalVoltage;
        double vCathode = cathodeFallFraction * totalVoltage;
        double plasmaPotential = totalVoltage - vAnode - vCathode;

        if (x <= lambdaA) {
            return totalVoltage - vAnode * (x / Math.max(lambdaA, 1e-12));
        }
        if (x <= plasmaEnd) {
            return plasmaPotential;
        }
        double xi = (x - plasmaEnd) / Math.max(lambdaC, 1e-12);
        return plasmaPotential * (1.0 - xi);
    }

    @Override
    public double fieldAt(double x, double gapLength, double totalVoltage) {
        validateGap(gapLength, totalVoltage);
        x = clamp(x, 0.0, gapLength);

        double lambdaA = anodeSheathFraction * gapLength;
        double lambdaC = cathodeSheathFraction * gapLength;
        double plasmaEnd = gapLength - lambdaC;

        double vAnode = anodeDropFraction * totalVoltage;
        double vCathode = cathodeFallFraction * totalVoltage;

        if (x <= lambdaA) {
            return vAnode / Math.max(lambdaA, 1e-12);
        }
        if (x <= plasmaEnd) {
            return 0.0;
        }
        return vCathode / Math.max(lambdaC, 1e-12);
    }

    @Override
    public double acceleratingField(double pathLength, double gapLength, double totalVoltage) {
        validateGap(gapLength, totalVoltage);

        double lambdaC = cathodeSheathFraction * gapLength;
        double vCathode = cathodeFallFraction * totalVoltage;
        double sheathField = vCathode / Math.max(lambdaC, 1e-12);

        // (14): средняя напряжённость вдоль траектории с учётом доли пути в катодной оболочке
        double sheathPath = Math.min(pathLength, lambdaC);
        double plasmaPath = Math.max(pathLength - sheathPath, 0.0);
        double effectiveLength = Math.max(pathLength, 1e-12);

        return (sheathField * sheathPath) / effectiveLength
                + (0.1 * sheathField * plasmaPath) / effectiveLength;
    }

    @Override
    public double cathodeFallVoltage(double totalVoltage) {
        return cathodeFallFraction * Math.max(totalVoltage, 0.0);
    }

    private void validateGap(double gapLength, double totalVoltage) {
        if (gapLength <= 0) {
            throw new IllegalArgumentException("Electrode gap length must be > 0");
        }
        if (totalVoltage < 0) {
            throw new IllegalArgumentException("Voltage must be non-negative");
        }
    }

    private static double clamp(double v, double min, double max) {
        return Math.max(min, Math.min(max, v));
    }
}
