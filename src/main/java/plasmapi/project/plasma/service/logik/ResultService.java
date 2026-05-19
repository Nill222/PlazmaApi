package plasmapi.project.plasma.service.logik;

import plasmapi.project.plasma.dto.logikDTO.ResultDTO;
import plasmapi.project.plasma.dto.mathDto.simulation.SimulationResultDto;
import plasmapi.project.plasma.service.math.simulation.SimulationResult;

import java.util.List;
import java.util.Optional;

public interface ResultService {
    Optional<ResultDTO> create(SimulationResultDto dto);

    Optional<ResultDTO> saveFromSimulation(
            SimulationResult simulationResult,
            Integer configId,
            Integer atomId,
            Integer ionId
    );

    List<ResultDTO> findAll();
}
