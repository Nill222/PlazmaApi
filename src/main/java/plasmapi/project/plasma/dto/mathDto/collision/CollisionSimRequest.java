package plasmapi.project.plasma.dto.mathDto.collision;

public record CollisionSimRequest(
        double energy,
        double ionMass,
        double atomMass,
        double angle
) {}