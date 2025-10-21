package plasmapi.project.plasma.service.logik.impl;

import org.springframework.stereotype.Service;
import plasmapi.project.plasma.model.res.Ion;
import plasmapi.project.plasma.repository.IonRepository;
import plasmapi.project.plasma.service.logik.AbstractMotherService;
import plasmapi.project.plasma.service.logik.IonService;

@Service
public class IonServiceImpl extends AbstractMotherService<Ion, Integer> implements IonService {

    public IonServiceImpl(IonRepository repository) {
        super(repository);
    }
}
