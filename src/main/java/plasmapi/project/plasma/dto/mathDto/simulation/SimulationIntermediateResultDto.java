package plasmapi.project.plasma.dto.mathDto.simulation;

/**
 * DTO промежуточных расчётов для API и сохранения в БД.
 */
public record SimulationIntermediateResultDto(
        // --- плазма ---
        double ionEnergyEv,
        double ionFlux,
        // --- энерговклад (1)–(5), SKIN (6)–(12) ---
        double potentialAtSurface,
        double acceleratingField,
        double energyGainFactor,
        double plasmaCorrectionFactor,
        double exposureRate,
        double integratedFluence,
        double modifiedLayerThickness,
        double skinDepth,
        double skinSurfacePower,
        double skinAccumulatedEnergy,
        double skinTemperatureDelta,
        double effectiveSurfaceTemperature,
        // --- тепло ---
        double finalProbeTemperature,
        double debyeFrontSpeed,
        double debyeFrontDepth,
        double thermalMinTemperature,
        double thermalMaxTemperature,
        double thermalAvgTemperature,
        // --- диффузия / транспорт ---
        double dRadiation,
        double dCollision,
        double slrFactor,
        double damageRate,
        double projectedRange,
        double straggleSigma,
        double latticeStiffness,
        double equilibriumDistance
) {}
