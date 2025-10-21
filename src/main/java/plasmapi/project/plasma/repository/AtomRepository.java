package plasmapi.project.plasma.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import plasmapi.project.plasma.model.atom.Atom;

import java.util.List;

public interface AtomRepository extends JpaRepository<Atom, Integer> {
    List<Atom> findByConfigId(Integer configId);
}
