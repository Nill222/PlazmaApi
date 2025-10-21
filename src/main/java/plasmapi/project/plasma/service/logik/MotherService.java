package plasmapi.project.plasma.service.logik;


import java.util.List;
import java.util.Optional;

public interface MotherService<T, F> {
    List<T> findAll();

    Optional<T> findById(F id);

    boolean delete(F id);

    Optional<T> create(T t);

}
