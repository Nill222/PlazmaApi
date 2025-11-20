package plasmapi.project.plasma.service.math.potential;

import plasmapi.project.plasma.dto.mathDto.potential.PotentialDto;
import plasmapi.project.plasma.dto.mathDto.potential.PotentialParameters;
import plasmapi.project.plasma.model.atom.AtomList;

public interface PotentialService {
    PotentialParameters computePotentialForAtomByDistance(double r, AtomList atom);
}
