package plasmaApi.project.plasmaApi.service.logik.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import plasmaApi.project.plasmaApi.controller.handler.exception.NotFoundException;
import plasmaApi.project.plasmaApi.model.res.Result;
import plasmaApi.project.plasmaApi.repository.ResultRepository;
import plasmaApi.project.plasmaApi.service.logik.ResultService;

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
