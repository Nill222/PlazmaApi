package plasmapi.project.plasma.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import plasmapi.project.plasma.model.res.PlasmaConfiguration;

import java.util.Optional;

public interface PlasmaConfigurationRepository extends JpaRepository<PlasmaConfiguration, Integer> {
     @Query("SELECT p FROM PlasmaConfiguration p WHERE p.config.id = :id")
     Optional<PlasmaConfiguration> findByConfigId(@Param("id") Integer id);

}
