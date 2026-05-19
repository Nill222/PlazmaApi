package plasmapi.project.plasma.service.math.energy;

/**
 * SKIN-канал энерговклада (6)–(13).
 */
public interface SkinEffectService {

    record SkinEffectResult(
            double skinDepth,
            double surfacePowerDensity,
            double accumulatedEnergy,
            double temperatureDelta
    ) {}

    /**
     * Расчёт SKIN-вклада для одной точки поверхности.
     *
     * @param acceleratingField     E_accel, В/м (14)
     * @param incidenceAngleRad     угол падения иона
     * @param exposureTime          длительность воздействия, с
     * @param conductivity          σ, См/м
     * @param relativePermeability  μ_r
     * @param timeModulationAt      нормированная g(t) во времени (|g|≤1)
     */
    SkinEffectResult compute(
            double acceleratingField,
            double incidenceAngleRad,
            double exposureTime,
            double conductivity,
            double relativePermeability,
            java.util.function.DoubleUnaryOperator timeModulationAt
    );

    /**
     * T_eff = T_local + ΔT_skin (12).
     */
    double effectiveTemperature(double localTemperature, double skinTemperatureDelta);
}
