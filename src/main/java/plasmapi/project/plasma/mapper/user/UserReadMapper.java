package plasmapi.project.plasma.mapper.user;

import org.springframework.stereotype.Component;
import plasmapi.project.plasma.dto.logikDTO.user.UserDTO;
import plasmapi.project.plasma.model.security.User;
import plasmapi.project.plasma.mapper.BaseMapper;

@Component
public class UserReadMapper implements BaseMapper<UserDTO, User> {

    @Override
    public UserDTO map(User user) {
        return new UserDTO(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole()
        );
    }
}

