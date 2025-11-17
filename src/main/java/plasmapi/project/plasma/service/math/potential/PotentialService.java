package plasmapi.project.plasma.service.math.potential;

import plasmapi.project.plasma.dto.mathDto.potential.PotentialDto;
import plasmapi.project.plasma.dto.mathDto.potential.PotentialParameters;

public interface PotentialService {
    PotentialParameters computePotential(PotentialDto p);
}
