package plasmapi.project.plasma.service.logik.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.controller.handler.exception.NotFoundException;
import plasmapi.project.plasma.dto.logikDTO.ResultDTO;
import plasmapi.project.plasma.mapper.ResultReadMapper;
import plasmapi.project.plasma.model.res.Result;
import plasmapi.project.plasma.repository.ResultRepository;
import plasmapi.project.plasma.service.logik.ResultService;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResultServiceImpl implements ResultService {

    private final ResultRepository resultRepository;
    private final ResultReadMapper resultReadMapper;

    @Override
    public List<ResultDTO> findByConfig(Integer configId) {
        List<Result> results = resultRepository.findByConfigId(configId);
        if (results.isEmpty()) {
            throw new NotFoundException("конфиг с таким Id " + configId + "не найден");
        }
        return results.stream()
                .map(resultReadMapper::map)
                .collect(Collectors.toList());
    }
}
