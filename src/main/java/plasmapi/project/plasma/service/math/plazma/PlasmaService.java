package plasmapi.project.plasma.service.math.plazma;

import plasmapi.project.plasma.dto.mathDto.plasma.PlasmaDto;
import plasmapi.project.plasma.dto.mathDto.plasma.PlasmaParameters;

public interface PlasmaService {
    PlasmaParameters calculate(PlasmaDto plasmaDto);
}
