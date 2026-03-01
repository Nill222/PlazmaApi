package plasmapi.project.plasma.service.math.plazma;

import plasmapi.project.plasma.dto.mathDto.plasma.PlasmaDto;
import plasmapi.project.plasma.dto.mathDto.plasma.PlasmaParameters;
import plasmapi.project.plasma.dto.mathDto.plasma.PlasmaRequestDto;
import plasmapi.project.plasma.dto.mathDto.plasma.PlasmaResultDto;
import plasmapi.project.plasma.dto.mathDto.simulation.SimulationRequestDto;
import plasmapi.project.plasma.model.res.Ion;
import plasmapi.project.plasma.model.res.PlasmaConfiguration;

public interface PlasmaService {
    PlasmaResult calculate(PlasmaConfiguration cfg, Ion ion, Double ionFluxOverride);
}
