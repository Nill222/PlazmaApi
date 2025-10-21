package plasmapi.project.plasma.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import plasmapi.project.plasma.model.res.Config;

import java.util.List;

public interface ConfigRepository extends JpaRepository<Config, Integer> {
    List<Config> findByUserId(Integer userId);
}
