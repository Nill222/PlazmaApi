package plasmapi.project.plasma.mapper.user;

import org.springframework.stereotype.Component;
import plasmapi.project.plasma.dto.logikDTO.user.UserCreateDto;
import plasmapi.project.plasma.model.security.User;
import plasmapi.project.plasma.mapper.BaseMapper;

@Component
public class UserCreateMapper implements BaseMapper<User, UserCreateDto> {

    @Override
    public User map(UserCreateDto dto) {
        User user = new User();
        copy(dto, user);
        return user;
    }

    @Override
    public User map(UserCreateDto dto, User user) {
        copy(dto, user);
        return user;
    }

    private void copy(UserCreateDto dto, User user) {
        user.setUsername(dto.username());
        user.setEmail(dto.email());
        user.setRole(dto.role());
    }
}

