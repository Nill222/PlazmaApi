package plasmapi.project.plasma.service.logik.impl;

import org.springframework.stereotype.Service;
import plasmapi.project.plasma.controller.handler.exception.NotFoundException;
import plasmapi.project.plasma.dto.logikDTO.config.ConfigCreateDto;
import plasmapi.project.plasma.dto.logikDTO.config.ConfigDTO;
import plasmapi.project.plasma.mapper.config.ConfigCreateMapper;
import plasmapi.project.plasma.mapper.config.ConfigReadMapper;
import plasmapi.project.plasma.model.res.Config;
import plasmapi.project.plasma.repository.ConfigRepository;
import plasmapi.project.plasma.service.logik.AbstractMotherService;
import plasmapi.project.plasma.service.logik.ConfigService;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ConfigServiceImpl extends AbstractMotherService<Config, Integer, ConfigCreateDto> implements ConfigService {
    private final ConfigRepository configRepository;
    private final ConfigReadMapper configReadMapper;

    public ConfigServiceImpl(ConfigRepository repository, ConfigCreateMapper mapper, ConfigReadMapper configReadMapper) {
        super(repository, mapper);
        this.configRepository = repository;
        this.configReadMapper = configReadMapper;
    }

    @Override
    public List<ConfigDTO> findByUser(Integer userId) {
        List<Config> configs = configRepository.findByUserId(userId);
        if (configs.isEmpty()) {
            throw new NotFoundException("Юзеры с такими Id" + userId + "не найдены");
        }
        return configs.stream()
                .map(configReadMapper::map)
                .collect(Collectors.toList());
    }
}
