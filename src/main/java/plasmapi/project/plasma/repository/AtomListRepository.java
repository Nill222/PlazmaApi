package plasmapi.project.plasma.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import plasmapi.project.plasma.model.atom.AtomList;

import java.util.List;
import java.util.Optional;

public interface AtomListRepository extends JpaRepository<AtomList, Integer> {
    @Query("SELECT a FROM AtomList a WHERE LOWER(a.atomName) LIKE LOWER(CONCAT('%', :symbol, '%'))")
    List<AtomList> findByAtomSymbol(@Param("symbol") String symbol);
}
