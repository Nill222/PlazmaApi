package plasmapi.project.plasma.service.math.thermal;

import plasmapi.project.plasma.dto.mathDto.thermal.ThermalDto;
import plasmapi.project.plasma.dto.mathDto.thermal.ThermalResultDto;


public interface ThermalService {
    ThermalResultDto simulateCooling(ThermalDto thermalDto);
}
