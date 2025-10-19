package plasmaApi.project.plasmaApi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import plasmaApi.project.plasmaApi.model.res.Config;

import java.util.List;

public interface ConfigRepository extends JpaRepository<Config, Integer> {
    List<Config> findByUserId(Integer userId);
}
