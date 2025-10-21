package plasmapi.project.plasma.service.logik.impl;

import org.springframework.stereotype.Service;
import plasmapi.project.plasma.controller.handler.exception.NotFoundException;
import plasmapi.project.plasma.model.atom.Atom;
import plasmapi.project.plasma.model.atom.AtomList;
import plasmapi.project.plasma.repository.AtomListRepository;
import plasmapi.project.plasma.repository.AtomRepository;
import plasmapi.project.plasma.service.logik.AbstractMotherService;
import plasmapi.project.plasma.service.logik.AtomService;

import java.util.List;
import java.util.Optional;

@Service
public class AtomServiceImpl extends AbstractMotherService<Atom, Integer> implements AtomService {
    private final AtomRepository atomRepository;
    private final AtomListRepository atomListRepository;

    public AtomServiceImpl(AtomRepository repository, AtomListRepository atomListRepository) {
        super(repository);
        this.atomRepository = repository;
        this.atomListRepository = atomListRepository;
    }

    @Override
    public List<Atom> getAtomsByConfig(Integer configId) {
        List<Atom> atoms = atomRepository.findByConfigId(configId);
        if(atoms.isEmpty()){
            throw new NotFoundException("Атомы для configId " + configId + "не найдены");
        }
        return atoms;
    }

    @Override
    public List<AtomList> getAvailableAtoms() {
        return atomListRepository.findAll();
    }

    @Override
    public Optional<AtomList> getAtomProperties(String symbol) {
        return atomListRepository.findByAtomName(symbol);
    }
}
