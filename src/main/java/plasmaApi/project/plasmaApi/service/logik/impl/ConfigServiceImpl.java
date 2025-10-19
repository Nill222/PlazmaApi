package plasmaApi.project.plasmaApi.service.logik.impl;

import org.springframework.stereotype.Service;
import plasmaApi.project.plasmaApi.controller.handler.exception.NotFoundException;
import plasmaApi.project.plasmaApi.model.res.Config;
import plasmaApi.project.plasmaApi.repository.ConfigRepository;
import plasmaApi.project.plasmaApi.service.logik.AbstractMotherService;
import plasmaApi.project.plasmaApi.service.logik.ConfigService;

import java.util.List;

@Service
public class ConfigServiceImpl extends AbstractMotherService<Config, Integer> implements ConfigService {
    private final ConfigRepository configRepository;

    public ConfigServiceImpl(ConfigRepository repository) {
        super(repository);
        this.configRepository = repository;
    }

    @Override
    public List<Config> findByUser(Integer userId) {
        List<Config> configs = configRepository.findByUserId(userId);
        if (configs.isEmpty()) {
            throw new NotFoundException("Юзеры с такими Id" + userId + "не найдены");
        }
        return configs;
    }
}
