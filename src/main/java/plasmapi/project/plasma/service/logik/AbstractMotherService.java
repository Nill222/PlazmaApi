package plasmapi.project.plasma.service.logik;

import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;
import plasmapi.project.plasma.mapper.BaseMapper;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

@RequiredArgsConstructor
@Transactional(readOnly = true)
public abstract class AbstractMotherService<T, F, D> implements MotherService<T, F, D> {

    protected final JpaRepository<T, F> repository;
    protected final BaseMapper<T, D> mapper;

    @Override
    public List<T> findAll() {
        return repository.findAll();
    }

    @Override
    public Optional<T> findById(F id) {
        return repository.findById(Objects.requireNonNull(id));
    }

    @Transactional
    @Override
    public boolean delete(F id) {
        return repository.findById(Objects.requireNonNull(id))
                .map(entity -> {
                    repository.delete(Objects.requireNonNull(entity));
                    repository.flush();
                    return true;
                })
                .orElse(false);
    }

    @Transactional
    @Override
    public Optional<T> create(D dto) {
        T entity = Objects.requireNonNull(mapper.map(dto));
        return Optional.of(repository.saveAndFlush(entity));
    }
}
