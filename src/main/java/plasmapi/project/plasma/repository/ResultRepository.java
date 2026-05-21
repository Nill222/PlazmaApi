package plasmapi.project.plasma.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.lang.NonNull;
import plasmapi.project.plasma.model.res.Result;

import java.util.List;

public interface ResultRepository extends JpaRepository<Result, Integer> {

    @Override
    @EntityGraph(attributePaths = {
            "config",
            "config.user",
            "atom",
            "ion"
    })
    @NonNull
    List<Result> findAll();

    @EntityGraph(attributePaths = {
            "config",
            "config.user",
            "atom",
            "ion"
    })
    List<Result> findByConfigId(Integer configId);
}
