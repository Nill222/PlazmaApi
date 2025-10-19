package plasmaApi.project.plasmaApi.service.logik;

import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@RequiredArgsConstructor
@Transactional(readOnly = true)
public abstract class AbstractMotherService<T, F> implements MotherService<T, F> {

    protected final JpaRepository<T, F> repository;

    @Override
    public List<T> findAll() {
        return repository.findAll();
    }

    @Override
    public Optional<T> findById(F id) {
        return repository.findById(id);
    }

    @Transactional
    @Override
    public boolean delete(F id) {
        return repository.findById(id)
                .map(entity -> {
                    repository.delete(entity);
                    repository.flush();
                    return true;
                })
                .orElse(false);
    }

    @Transactional
    @Override
    public Optional<T> create(T entity) {
        return Optional.of(repository.saveAndFlush(entity));
    }
}
