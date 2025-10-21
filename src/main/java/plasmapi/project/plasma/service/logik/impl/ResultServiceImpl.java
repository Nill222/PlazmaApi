package plasmapi.project.plasma.service.logik.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.controller.handler.exception.NotFoundException;
import plasmapi.project.plasma.model.res.Result;
import plasmapi.project.plasma.repository.ResultRepository;
import plasmapi.project.plasma.service.logik.ResultService;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ResultServiceImpl implements ResultService {

    private final ResultRepository resultRepository;

    @Override
    public List<Result> findByConfig(Integer configId) {
        List<Result> results = resultRepository.findByConfigId(configId);
        if (results.isEmpty()) {
            throw new NotFoundException("конфиг с таким Id " + configId + "не найден");
        }
        return results;
    }
}
