package plasmapi.project.plasma.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import plasmapi.project.plasma.model.security.User;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    Optional<User> findByEmail(String email);
}
