package plasmaApi.project.plasmaApi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import plasmaApi.project.plasmaApi.model.atom.AtomList;

import java.util.Optional;

public interface AtomListRepository extends JpaRepository<AtomList, Integer> {
    Optional<AtomList> findByAtomName(String atomName);
}
