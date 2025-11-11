package plasmapi.project.plasma.service.logik.impl;

import org.springframework.stereotype.Service;
import plasmapi.project.plasma.controller.handler.exception.NotFoundException;
import plasmapi.project.plasma.dto.logikDTO.atom.AtomDTO;
import plasmapi.project.plasma.dto.logikDTO.atom.AtomListDTO;
import plasmapi.project.plasma.dto.logikDTO.atom.CreateAtomListDto;
import plasmapi.project.plasma.mapper.atom.AtomCreateMapper;
import plasmapi.project.plasma.mapper.atom.AtomListReadMapper;
import plasmapi.project.plasma.mapper.atom.AtomReadMapper;
import plasmapi.project.plasma.model.atom.Atom;
import plasmapi.project.plasma.model.atom.AtomList;
import plasmapi.project.plasma.repository.AtomListRepository;
import plasmapi.project.plasma.repository.AtomRepository;
import plasmapi.project.plasma.service.logik.AbstractMotherService;
import plasmapi.project.plasma.service.logik.AtomService;

import java.util.List;
import java.util.Optional;

@Service
public class AtomServiceImpl extends AbstractMotherService<AtomList, Integer, CreateAtomListDto> implements AtomService {
    private final AtomRepository atomRepository;
    private final AtomListRepository atomListRepository;
    private final AtomListReadMapper atomReadMapper;
    private final AtomReadMapper atomMapper;

    public AtomServiceImpl(AtomRepository repository, AtomListRepository atomListRepository, AtomCreateMapper atomCreateMapper, AtomListReadMapper atomReadMapper, AtomReadMapper atomMapper) {
        super(atomListRepository, atomCreateMapper);
        this.atomRepository = repository;
        this.atomListRepository = atomListRepository;
        this.atomReadMapper = atomReadMapper;
        this.atomMapper = atomMapper;
    }

    @Override
    public List<AtomDTO> getAtomsByConfig(Integer configId) {
        List<Atom> atoms = atomRepository.findByConfigId(configId);
        if(atoms.isEmpty()){
            throw new NotFoundException("Атомы для configId " + configId + "не найдены");
        }
        return atoms.stream()
                .map(atomMapper::map)
                .toList();
    }

    @Override
    public List<AtomListDTO> getAvailableAtoms() {
        return atomListRepository.findAll().stream()
                .map(atomReadMapper::map)
                .toList();
    }

    @Override
    public List<AtomListDTO> getAtomProperties(String symbol) {
        List<AtomList> atom = atomListRepository.findByAtomSymbol("%" + symbol + "%");
        if(atom.isEmpty()){
            throw new NotFoundException("Атомы, содержащие символ '" + symbol + "', не найдены");
        }
        return atom.stream()
                .map(atomReadMapper::map)
                .toList();
    }
}
