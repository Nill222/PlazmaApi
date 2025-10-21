package plasmapi.project.plasma.service.logik.impl;

import org.springframework.stereotype.Service;
import plasmapi.project.plasma.controller.handler.exception.NotFoundException;
import plasmapi.project.plasma.model.res.Config;
import plasmapi.project.plasma.repository.ConfigRepository;
import plasmapi.project.plasma.service.logik.AbstractMotherService;
import plasmapi.project.plasma.service.logik.ConfigService;

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
