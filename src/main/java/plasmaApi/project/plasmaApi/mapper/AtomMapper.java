package plasmaApi.project.plasmaApi.mapper;

import org.springframework.stereotype.Component;
import plasmaApi.project.plasmaApi.dto.mathDto.lattice.AtomDto;
import plasmaApi.project.plasmaApi.model.atom.Atom;

@Component
public class AtomMapper {
    public AtomDto toDo(Atom atom) {
        return new AtomDto(
                atom.getId(),
                atom.getX(),
                atom.getY(),
                atom.getAtomList().getId()
        );
    }
}
