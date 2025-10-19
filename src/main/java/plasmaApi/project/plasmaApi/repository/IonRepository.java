package plasmaApi.project.plasmaApi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import plasmaApi.project.plasmaApi.model.res.Ion;

import java.util.Optional;


public interface IonRepository extends JpaRepository<Ion, Integer> {
    Optional<Ion> findByName(String name);
}
