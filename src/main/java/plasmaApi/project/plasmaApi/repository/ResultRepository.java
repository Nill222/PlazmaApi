package plasmaApi.project.plasmaApi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import plasmaApi.project.plasmaApi.model.res.Result;

import java.util.List;

public interface ResultRepository extends JpaRepository<Result, Integer> {
    List<Result> findByConfigId(Integer configId);
}
