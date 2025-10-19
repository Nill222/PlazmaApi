package plasmaApi.project.plasmaApi.service.logik;

import plasmaApi.project.plasmaApi.model.security.User;

import java.util.Optional;

public interface UserService extends MotherService<User, Integer>{
    Optional<User> findByUsername(String username);
}
