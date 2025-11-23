package plasmapi.project.plasma.mapper.atom;

import org.springframework.stereotype.Component;
import plasmapi.project.plasma.dto.mathDto.lattice.AtomDto;
import plasmapi.project.plasma.model.atom.Atom;

@Component
public class AtomMapper {
    public AtomDto toDo(Atom atom) {
        return new AtomDto(
                atom.getId(),
                atom.getX(),
                atom.getY(),
                atom.getAtomList().getId(),
                atom.getZ(),
                atom.getVx(),
                atom.getAtomList().getA(),
                atom.getAtomList().getStructure()
        );
    }
}
