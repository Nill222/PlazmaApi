package plasmapi.project.plasma.mapper.config;

import org.springframework.stereotype.Component;
import plasmapi.project.plasma.dto.logikDTO.config.ConfigCreateDto;
import plasmapi.project.plasma.mapper.BaseMapper;
import plasmapi.project.plasma.model.res.Config;
import plasmapi.project.plasma.model.security.User;
import plasmapi.project.plasma.repository.UserRepository;

@Component
public class ConfigCreateMapper implements BaseMapper<Config, ConfigCreateDto> {

    private final UserRepository userRepository;

    public ConfigCreateMapper(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public Config map(ConfigCreateDto dto) {
        Config config = new Config();
        copy(dto, config);
        return config;
    }

    @Override
    public Config map(ConfigCreateDto dto, Config config) {
        copy(dto, config);
        return config;
    }

    private void copy(ConfigCreateDto dto, Config config) {
        config.setName(dto.name());
        config.setDescription(dto.description());

        if (dto.userId() != null) {
            User user = userRepository.getReferenceById(dto.userId());
            config.setUser(user);
        }
    }
}
