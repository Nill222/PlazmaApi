package plasmapi.project.plasma.service.math.simulation;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import plasmapi.project.plasma.model.atom.AtomList;
import plasmapi.project.plasma.model.res.Ion;
import plasmapi.project.plasma.model.res.PlasmaConfiguration;
import plasmapi.project.plasma.service.math.diffusion.DiffusionProfile;

/**
 * Результат симуляции, возвращаемый клиенту.
 * Содержит рассчитанный диффузионный профиль и исходные данные для контекста.
 */
@Getter
@Setter
@AllArgsConstructor
public class SimulationResult {
    private final DiffusionProfile profile;
    private final AtomList atom;
    private final Ion ion;
    private final PlasmaConfiguration plasmaConfig;
}