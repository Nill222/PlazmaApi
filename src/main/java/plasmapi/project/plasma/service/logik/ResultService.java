package plasmapi.project.plasma.service.logik;

import plasmapi.project.plasma.dto.logikDTO.ResultDTO;
import plasmapi.project.plasma.dto.mathDto.simulation.SimulationResultDto;

import java.util.List;
import java.util.Optional;

public interface ResultService {
    Optional<ResultDTO> create(SimulationResultDto dto);
    List<ResultDTO> findAll();
}
