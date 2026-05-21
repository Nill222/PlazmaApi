package plasmapi.project.plasma.service.logik.impl;

import org.springframework.stereotype.Service;
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

@Service
public class AtomServiceImpl extends AbstractMotherService<AtomList, Integer, CreateAtomListDto> implements AtomService {
    private final AtomRepository atomRepository;
    private final AtomListRepository atomListRepository;
    private final AtomListReadMapper atomReadMapper;
    private final AtomReadMapper atomMapper;

    public AtomServiceImpl(
            AtomRepository atomRepository,
            AtomListRepository atomListRepository,
            AtomCreateMapper atomCreateMapper,
            AtomListReadMapper atomReadMapper,
            AtomReadMapper atomMapper
    ) {
        super(atomListRepository, atomCreateMapper);
        this.atomRepository = atomRepository;
        this.atomListRepository = atomListRepository;
        this.atomReadMapper = atomReadMapper;
        this.atomMapper = atomMapper;
    }

    @Override
    public List<AtomDTO> getAtomsByConfig(Integer configId) {
        return atomRepository.findByConfigId(configId).stream()
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
        return atomListRepository.findByAtomSymbol(symbol).stream()
                .map(atomReadMapper::map)
                .toList();
    }
}
