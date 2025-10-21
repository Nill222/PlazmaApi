package plasmapi.project.plasma.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import plasmapi.project.plasma.model.res.Ion;

import java.util.Optional;


public interface IonRepository extends JpaRepository<Ion, Integer> {
    Optional<Ion> findByName(String name);
}
