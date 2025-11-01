package plasmapi.project.plasma.service.math.thermal;

import plasmapi.project.plasma.dto.mathDto.thermal.ThermalDto;

import java.util.List;

public interface ThermalService {
    List<Double> simulateCooling(ThermalDto thermalDto);
}
