package plasmapi.project.plasma.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import plasmapi.project.plasma.model.atom.AtomList;

import java.util.Optional;

public interface AtomListRepository extends JpaRepository<AtomList, Integer> {
    Optional<AtomList> findByAtomName(String atomName);
}
