package plasmapi.project.plasma.mapper.config;

import org.springframework.stereotype.Component;
import plasmapi.project.plasma.dto.logikDTO.user.UserDTO;
import plasmapi.project.plasma.dto.logikDTO.config.ConfigDTO;
import plasmapi.project.plasma.mapper.BaseMapper;
import plasmapi.project.plasma.model.res.Config;
import plasmapi.project.plasma.model.security.User;

@Component
public class ConfigReadMapper implements BaseMapper<ConfigDTO, Config> {

    @Override
    public ConfigDTO map(Config config) {
        return new ConfigDTO(
                config.getId(),
                config.getName(),
                config.getDescription(),
                config.getCreatedAt(),
                mapUser(config.getUser())
        );
    }

    private UserDTO mapUser(User user) {
        if (user == null) return null;
        return new UserDTO(
                user.getId(),
                user.getUsername(),
                user.getPasswordHash(),
                user.getRole()
        );
    }
}
