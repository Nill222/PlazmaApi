package plasmapi.project.plasma.service.math.thermal.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.config.MathParallelProperties;
import plasmapi.project.plasma.model.res.PlasmaConfiguration;
import plasmapi.project.plasma.service.math.thermal.ThermalResult;
import plasmapi.project.plasma.service.math.thermal.ThermalService;

@Service
@RequiredArgsConstructor
public class ThermalServiceImpl implements ThermalService {

    private final MathParallelProperties mathParallelProperties;

    /**
     * Моделирует нагрев и охлаждение материала под действием ионного пучка.
     */
    @Override
    public ThermalResult simulate(
            PlasmaConfiguration plasmaConfig,
            double T0,
            double tMax,
            double dt,
            double thickness,
            Double powerInput,
            Double projectedRange,
            BoundaryCondition boundaryCondition,
            double ambientTemp,
            double h,
            Integer N,
            Double debyeTemperature,
            Double probeDepth,
            boolean thermalCyclingEnabled,
            Double cyclePeriod,
            Double dutyCycle
    ) {
        double rho = plasmaConfig.getDensity();
        double cp = plasmaConfig.getHeatCapacity();
        double kappa = plasmaConfig.getThermalConductivity();
        double alpha = kappa / (rho * cp);

        if (N == null) {
            double dxMin = (projectedRange != null) ? projectedRange / 10 : thickness / 100;
            N = (int) Math.ceil(thickness / dxMin) + 1;
            N = Math.max(10, Math.min(1000, N));
        }
        int n = N;
        double dx = thickness / (n - 1);

        double dtMax = dx * dx / (2 * alpha);
        if (thermalCyclingEnabled && cyclePeriod != null && cyclePeriod > 0) {
            dtMax = Math.min(dtMax, cyclePeriod / 25.0);
        }
        if (dt > dtMax) {
            dt = dtMax * 0.9;
            System.err.printf("Warning: time step too large, reduced to %g s for stability%n", dt);
        }
        int steps = (int) (tMax / dt);

        final int MAX_STEPS = 1_000_000;
        if (steps > MAX_STEPS) {
            System.err.printf(
                    "Warning: too many time steps (%d). Limiting to %d steps.%n",
                    steps, MAX_STEPS
            );
            steps = MAX_STEPS;
            dt = tMax / steps;
        }

        double[] t = new double[n];
        for (int i = 0; i < n; i++) {
            t[i] = T0;
        }

        double debyeLimit = (debyeTemperature != null && debyeTemperature > 0)
                ? debyeTemperature
                : Double.POSITIVE_INFINITY;
        double observationDepth = probeDepth != null ? probeDepth : thickness / 2.0;
        double observationDepthClamped = Math.max(0.0, Math.min(thickness, observationDepth));
        int observationIndex = (int) Math.round(observationDepthClamped / dx);
        observationIndex = Math.max(0, Math.min(n - 1, observationIndex));

        double[] debyeReachedAt = new double[n];
        for (int i = 0; i < n; i++) {
            debyeReachedAt[i] = Double.NaN;
            if (t[i] >= debyeLimit) {
                debyeReachedAt[i] = 0.0;
            }
        }

        double[] source = buildSource(n, dx, powerInput, projectedRange);

        double dxSq = dx * dx;
        double laplacianCoeff = dt * alpha / dxSq;
        double sourceCoeff = dt / (rho * cp);

        ThermalTimeLoop.State state = new ThermalTimeLoop.State(
                n,
                steps,
                dt,
                dx,
                T0,
                ambientTemp,
                h,
                kappa,
                debyeLimit,
                laplacianCoeff,
                sourceCoeff,
                source,
                debyeReachedAt,
                boundaryCondition,
                thermalCyclingEnabled,
                cyclePeriod,
                dutyCycle,
                t
        );

        ThermalTimeLoop.Result loop = ThermalTimeLoop.run(state, mathParallelProperties);

        double debyeReachTime = Double.NaN;
        double debyeFrontDepth = 0.0;
        for (int i = 0; i < n; i++) {
            if (!Double.isNaN(debyeReachedAt[i])) {
                double x = i * dx;
                if (x >= debyeFrontDepth) {
                    debyeFrontDepth = x;
                    debyeReachTime = debyeReachedAt[i];
                }
            }
        }
        double debyeFrontSpeed = (!Double.isNaN(debyeReachTime) && debyeReachTime > 0)
                ? debyeFrontDepth / debyeReachTime
                : 0.0;

        return new ThermalResult(
                loop.times(),
                loop.profiles(),
                T0,
                thickness,
                observationDepthClamped,
                loop.finalField()[observationIndex],
                debyeLimit,
                debyeReachTime,
                debyeFrontDepth,
                debyeFrontSpeed
        );
    }

    private static double[] buildSource(
            int n,
            double dx,
            Double powerInput,
            Double projectedRange
    ) {
        double[] source = new double[n];
        if (powerInput != null && powerInput > 0 && projectedRange != null && projectedRange > 0) {
            double norm = 1.0 / projectedRange;
            for (int i = 0; i < n; i++) {
                double x = i * dx;
                source[i] = powerInput * norm * Math.exp(-x / projectedRange);
            }
        }
        return source;
    }

    public enum BoundaryCondition {
        ADIABATIC,
        FIXED_TEMPERATURE,
        CONVECTIVE
    }
}
