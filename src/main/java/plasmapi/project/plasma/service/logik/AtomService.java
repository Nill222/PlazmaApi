package plasmapi.project.plasma.service.logik;

import plasmapi.project.plasma.dto.logikDTO.atom.AtomDTO;
import plasmapi.project.plasma.dto.logikDTO.atom.AtomListDTO;
import plasmapi.project.plasma.dto.logikDTO.atom.CreateAtomListDto;
import plasmapi.project.plasma.model.atom.Atom;
import plasmapi.project.plasma.model.atom.AtomList;

import java.util.List;
import java.util.Optional;

public interface AtomService extends MotherService<AtomList, Integer, CreateAtomListDto>{
    List<AtomDTO> getAtomsByConfig(Integer configId);

    List<AtomListDTO> getAvailableAtoms();

    List<AtomListDTO> getAtomProperties(String symbol);
}
