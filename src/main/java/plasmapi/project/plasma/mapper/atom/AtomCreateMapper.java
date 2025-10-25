package plasmapi.project.plasma.mapper.atom;

import org.springframework.stereotype.Component;
import plasmapi.project.plasma.dto.logikDTO.atom.CreateAtomListDto;
import plasmapi.project.plasma.mapper.BaseMapper;
import plasmapi.project.plasma.model.atom.AtomList;

@Component
public class AtomCreateMapper implements BaseMapper<AtomList, CreateAtomListDto> {

    @Override
    public AtomList map(CreateAtomListDto dto) {
        AtomList atom = new AtomList();
        copy(dto, atom);
        return atom;
    }

    @Override
    public AtomList map(CreateAtomListDto dto, AtomList atom) {
        copy(dto, atom);
        return atom;
    }

    private void copy(CreateAtomListDto dto, AtomList atom) {
        atom.setAtomName(dto.atomName());
        atom.setFullName(dto.fullName());
        atom.setMass(dto.mass());
        atom.setA(dto.a());
        atom.setDebyeTemperature(dto.debyeTemperature());
        atom.setValence(dto.valence());
    }
}

