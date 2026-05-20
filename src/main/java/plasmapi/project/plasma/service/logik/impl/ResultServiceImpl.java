package plasmapi.project.plasma.service.logik.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import plasmapi.project.plasma.dto.logikDTO.ResultDTO;
import plasmapi.project.plasma.dto.mathDto.simulation.SimulationResultDto;
import plasmapi.project.plasma.mapper.ResultMapper;
import plasmapi.project.plasma.mapper.SimulationResultMapper;
import plasmapi.project.plasma.model.res.Result;
import plasmapi.project.plasma.repository.ResultRepository;
import plasmapi.project.plasma.service.logik.ResultService;
import plasmapi.project.plasma.service.math.simulation.SimulationResult;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ResultServiceImpl implements ResultService  {

    private final ResultRepository resultRepository;
    private final ResultMapper resultMapper;
    private final SimulationResultMapper simulationResultMapper;




    @Override
    @Transactional
    public Optional<ResultDTO> create(SimulationResultDto dto) {
        Result entity = resultMapper.toEntity(dto);
        entity = resultRepository.save(entity);
        return Optional.of(resultMapper.toDTO(entity));
    }

    @Override
    @Transactional
    public Optional<ResultDTO> saveFromSimulation(
            SimulationResult simulationResult,
            Integer configId,
            Integer atomId,
            Integer ionId
    ) {
        SimulationResultDto dto = simulationResultMapper.toDto(simulationResult, atomId, configId, ionId);
        return create(dto);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ResultDTO> findAll() {
        return resultRepository.findAll()
                .stream()
                .map(resultMapper::toDTO)
                .toList();
    }
}
