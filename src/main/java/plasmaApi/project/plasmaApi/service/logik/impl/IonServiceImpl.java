package plasmaApi.project.plasmaApi.service.logik.impl;

import org.springframework.stereotype.Service;
import plasmaApi.project.plasmaApi.model.res.Ion;
import plasmaApi.project.plasmaApi.repository.IonRepository;
import plasmaApi.project.plasmaApi.service.logik.AbstractMotherService;
import plasmaApi.project.plasmaApi.service.logik.IonService;

@Service
public class IonServiceImpl extends AbstractMotherService<Ion, Integer> implements IonService {

    public IonServiceImpl(IonRepository repository) {
        super(repository);
    }
}
