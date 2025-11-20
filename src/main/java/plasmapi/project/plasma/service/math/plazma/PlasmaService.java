package plasmapi.project.plasma.service.math.plazma;

import plasmapi.project.plasma.dto.mathDto.plasma.PlasmaDto;
import plasmapi.project.plasma.dto.mathDto.plasma.PlasmaParameters;
import plasmapi.project.plasma.dto.mathDto.plasma.PlasmaRequestDto;

public interface PlasmaService {
    PlasmaParameters calculate(PlasmaRequestDto dto);
}
