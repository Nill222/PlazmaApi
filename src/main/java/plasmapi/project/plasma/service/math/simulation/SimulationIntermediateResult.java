package plasmapi.project.plasma.service.math.simulation;

import plasmapi.project.plasma.service.math.diffusion.DiffusionIntermediate;
import plasmapi.project.plasma.service.math.energy.EnergyDepositionResult;
import plasmapi.project.plasma.service.math.plazma.PlasmaResult;

/**
 * Промежуточные результаты всех этапов расчёта (плазма → энерговклад → тепло → диффузия).
 */
public record SimulationIntermediateResult(
        PlasmaResult plasma,
        EnergyDepositionResult energyDeposition,
        ThermalIntermediate thermal,
        DiffusionIntermediate diffusion
) {}
