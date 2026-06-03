package plasmapi.project.plasma.service.math.energy.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.service.math.energy.SkinEffectService;
import plasmapi.project.plasma.service.math.parallel.MathParallelSupport;

import java.util.function.DoubleUnaryOperator;

/**
 * SKIN-effect: (6)–(13).
 */
@Service
@RequiredArgsConstructor
public class SkinEffectServiceImpl implements SkinEffectService {

    private static final double MU0 = 4.0 * Math.PI * 1e-7;

    private final MathParallelSupport mathParallelSupport;

    @Value("${energy-deposition.skin.enabled:true}")
    private boolean enabled;

    @Value("${energy-deposition.skin.angular-frequency:2.0e6}")
    private double angularFrequency;

    @Value("${energy-deposition.skin.ac-field-fraction:0.12}")
    private double acFieldFraction;

    @Value("${energy-deposition.skin.surface-heat-capacity:4.0e6}")
    private double surfaceHeatCapacity;

    @Override
    public SkinEffectResult compute(
            double acceleratingField,
            double incidenceAngleRad,
            double exposureTime,
            double conductivity,
            double relativePermeability,
            DoubleUnaryOperator timeModulationAt
    ) {
        if (!enabled || exposureTime <= 0 || conductivity <= 0) {
            return new SkinEffectResult(0.0, 0.0, 0.0, 0.0);
        }

        double mu = MU0 * Math.max(relativePermeability, 1e-12);
        double omega = Math.max(angularFrequency, 1e-6);

        // (6) δ = √(2 / (ω μ σ))
        double skinDepth = Math.sqrt(2.0 / (omega * mu * conductivity));

        // (13)–(14): проекция на касательную плоскость, E_0 = k_ac · |E_tan| · |g(t)|
        // При нормальном падении (θ≈0) используем минимальный sin(θ), иначе SKIN-вклад обнуляется.
        double sinTheta = Math.max(Math.abs(Math.sin(incidenceAngleRad)), 0.05);
        double tangentialField = acceleratingField * sinTheta;
        double surfaceFieldAmplitude = acFieldFraction * tangentialField;

        // (8) усреднённая объёмная плотность на поверхности: <p>(0) = σ/2 · |E_0|²
        double jouleAtSurface = 0.5 * conductivity * surfaceFieldAmplitude * surfaceFieldAmplitude;

        // (9) P_skin = ∫_0^∞ <p>(z) dz = σ · |E_0|² · δ / 4
        double surfacePower = conductivity * surfaceFieldAmplitude * surfaceFieldAmplitude * skinDepth / 4.0;

        // (10) W_skin = ∫_0^T P_skin(t) dt — учёт g(t)
        double accumulatedEnergy = integrateSkinEnergy(surfacePower, exposureTime, timeModulationAt, jouleAtSurface, skinDepth);

        // (11) ΔT_skin = W_skin / C_s
        double cSurf = Math.max(surfaceHeatCapacity, 1e-6);
        double temperatureDelta = accumulatedEnergy / cSurf;

        return new SkinEffectResult(
                skinDepth,
                surfacePower,
                accumulatedEnergy,
                temperatureDelta
        );
    }

    @Override
    public double effectiveTemperature(double localTemperature, double skinTemperatureDelta) {
        // (12) T_eff = T_local + ΔT_skin
        return localTemperature + skinTemperatureDelta;
    }

    private double integrateSkinEnergy(
            double baseSurfacePower,
            double exposureTime,
            DoubleUnaryOperator timeModulationAt,
            double jouleAtSurface,
            double skinDepth
    ) {
        int steps = Math.min(5000, Math.max(50, (int) Math.ceil(exposureTime * 100.0)));
        double dt = exposureTime / steps;
        final double basePower = baseSurfacePower;
        final double dtF = dt;
        final DoubleUnaryOperator modulation = timeModulationAt;

        double energy = mathParallelSupport.parallelSum(steps, n -> {
            double t = (n + 0.5) * dtF;
            double g = modulation != null ? modulation.applyAsDouble(t) : 1.0;
            g = Math.abs(g);
            return basePower * g * g * dtF;
        });

        if (energy <= 0 && jouleAtSurface > 0) {
            energy = jouleAtSurface * skinDepth * 0.5 * exposureTime;
        }

        return Math.max(energy, 0.0);
    }
}
