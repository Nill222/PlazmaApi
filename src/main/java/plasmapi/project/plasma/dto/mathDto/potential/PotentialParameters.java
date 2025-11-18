package plasmapi.project.plasma.dto.mathDto.potential;

import plasmapi.project.plasma.service.math.potential.PotentialType;

public record PotentialParameters(
        PotentialType type,
        double r,
        Double De,
        Double a,
        Double re,
        Double sigma,
        double stiffness
) {}

