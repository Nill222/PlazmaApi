package plasmaApi.project.plasmaApi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import plasmaApi.project.plasmaApi.model.atom.Atom;

import java.util.List;

public interface AtomRepository extends JpaRepository<Atom, Integer> {
    List<Atom> findByConfigId(Integer configId);
}
