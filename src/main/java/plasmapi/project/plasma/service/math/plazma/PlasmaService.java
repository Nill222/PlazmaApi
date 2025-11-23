package plasmapi.project.plasma.service.math.plazma;

import plasmapi.project.plasma.dto.mathDto.plasma.PlasmaDto;
import plasmapi.project.plasma.dto.mathDto.plasma.PlasmaParameters;
import plasmapi.project.plasma.dto.mathDto.plasma.PlasmaRequestDto;
import plasmapi.project.plasma.dto.mathDto.plasma.PlasmaResultDto;

public interface PlasmaService {
    PlasmaResultDto calculate(Integer configId);
}
