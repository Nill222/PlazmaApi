package plasmapi.project.plasma.service.logik;

import plasmapi.project.plasma.dto.logikDTO.user.UserCreateDto;
import plasmapi.project.plasma.model.security.User;

import java.util.Optional;

public interface UserService extends MotherService<User, Integer, UserCreateDto>{
    Optional<User> findByUsername(String username);
}
