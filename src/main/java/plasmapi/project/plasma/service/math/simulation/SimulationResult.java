package plasmapi.project.plasma.service.math.simulation;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import plasmapi.project.plasma.model.atom.AtomList;
import plasmapi.project.plasma.model.res.Ion;
import plasmapi.project.plasma.model.res.PlasmaConfiguration;
import plasmapi.project.plasma.service.math.PhysicsStats;
import plasmapi.project.plasma.service.math.diffusion.DiffusionProfile;
import plasmapi.project.plasma.service.math.plazma.PlasmaResult;

/**
 * Результат симуляции, возвращаемый клиенту.
 * Содержит рассчитанный диффузионный профиль, промежуточные этапы и исходные данные.
 */
@Getter
@Setter
@AllArgsConstructor
public class SimulationResult {
    private final DiffusionProfile profile;
    private final AtomList atom;
    private final Ion ion;
    private final PlasmaConfiguration plasmaConfig;
    private final PhysicsStats stats;
    private final PlasmaResult plasmaResult;
    private final SimulationIntermediateResult intermediate;
}