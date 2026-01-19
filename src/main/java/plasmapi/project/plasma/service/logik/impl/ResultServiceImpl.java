package plasmapi.project.plasma.service.logik.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import plasmapi.project.plasma.dto.logikDTO.ResultDTO;
import plasmapi.project.plasma.dto.mathDto.simulation.SimulationResultDto;
import plasmapi.project.plasma.mapper.ResultMapper;
import plasmapi.project.plasma.model.res.Result;
import plasmapi.project.plasma.repository.ResultRepository;
import plasmapi.project.plasma.service.logik.ResultService;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ResultServiceImpl implements ResultService  {

    private final ResultRepository resultRepository;
    private final ResultMapper resultMapper;




    @Override
    @Transactional
    public Optional<ResultDTO> create(SimulationResultDto dto) {
        Result entity = resultMapper.toEntity(dto);
        entity = resultRepository.save(entity);
        return Optional.of(resultMapper.toDTO(entity));
    }

    @Override
    public List<ResultDTO> findAll() {
        return resultRepository.findAll()
                .stream()
                .map(resultMapper::toDTO)
                .toList();
    }
}
