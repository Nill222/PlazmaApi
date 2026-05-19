package plasmapi.project.plasma.dto.mathDto.simulation;

import plasmapi.project.plasma.model.atom.AtomList;
import plasmapi.project.plasma.model.res.Ion;
import plasmapi.project.plasma.model.res.PlasmaConfiguration;
import plasmapi.project.plasma.service.math.PhysicsStats;
import plasmapi.project.plasma.service.math.diffusion.DiffusionProfile;
import plasmapi.project.plasma.service.math.plazma.PlasmaResult;
import plasmapi.project.plasma.service.math.simulation.SimulationResult;

/**
 * Ответ {@code POST /api/simulation/run} для фронтенда:
 * плоский {@link SimulationIntermediateResultDto} и {@link PhysicsStats} в {@code stats}.
 */
public record SimulationRunResponse(
        DiffusionProfile profile,
        AtomList atom,
        Ion ion,
        PlasmaConfiguration plasmaConfig,
        PhysicsStats stats,
        PlasmaResult plasmaResult,
        SimulationIntermediateResultDto intermediate
) {
    public static SimulationRunResponse from(SimulationResult result, SimulationIntermediateResultDto intermediate) {
        return new SimulationRunResponse(
                result.getProfile(),
                result.getAtom(),
                result.getIon(),
                result.getPlasmaConfig(),
                result.getStats(),
                result.getPlasmaResult(),
                intermediate
        );
    }
}
