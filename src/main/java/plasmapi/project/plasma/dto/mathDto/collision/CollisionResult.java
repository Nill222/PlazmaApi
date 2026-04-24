package plasmapi.project.plasma.dto.mathDto.collision;

import lombok.Builder;

@Builder
public record CollisionResult(
        double transferredEnergy,
        double damageEnergy,
        double nuclearStopping,
        double electronicStopping,
        double thetaCM,
        double defectCount,
        double impactParameter
) {}