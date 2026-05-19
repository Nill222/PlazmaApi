package plasmapi.project.plasma.service.math.energy;

/**
 * Результат связанной модели энерговклада (формулы 1–5, 6–12).
 */
public record EnergyDepositionResult(
        double potentialAtSurface,       // φ на поверхности, В
        double acceleratingField,        // E_accel по (14), В/м
        double energyGainFactor,         // G по (2)
        double plasmaCorrectionFactor,   // M_p по (3)
        double exposureRate,             // локальная скорость воздействия, 1/(м²·с)
        double fluence,                  // интегральный флюенс Φ по (4), 1/м²
        double modifiedLayerThickness,   // толщина слоя h по (5), м
        double skinDepth,                // δ по (6), м
        double skinSurfacePower,         // P_skin по (9), Вт/м²
        double skinAccumulatedEnergy,    // W_skin по (10), Дж/м²
        double skinTemperatureDelta,     // ΔT_skin по (11), К
        double effectiveSurfaceTemperature // T_eff по (12), К
) {}
