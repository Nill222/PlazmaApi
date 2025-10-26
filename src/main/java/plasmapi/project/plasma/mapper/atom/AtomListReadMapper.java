package plasmapi.project.plasma.mapper.atom;

import org.springframework.stereotype.Component;
import plasmapi.project.plasma.dto.logikDTO.atom.AtomListDTO;
import plasmapi.project.plasma.mapper.BaseMapper;
import plasmapi.project.plasma.model.atom.AtomList;

@Component
public class AtomListReadMapper implements BaseMapper<AtomListDTO, AtomList> {

    @Override
    public AtomListDTO map(AtomList atom) {
        return new AtomListDTO(
                atom.getId(),
                atom.getAtomName(),
                atom.getFullName(),
                atom.getMass(),
                atom.getA(),
                atom.getDebyeTemperature(),
                atom.getValence()
        );
    }
}
