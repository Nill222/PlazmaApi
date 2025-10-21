package plasmapi.project.plasma.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import plasmapi.project.plasma.model.res.Result;

import java.util.List;

public interface ResultRepository extends JpaRepository<Result, Integer> {
    List<Result> findByConfigId(Integer configId);
}
