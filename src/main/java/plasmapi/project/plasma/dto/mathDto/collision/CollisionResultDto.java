package plasmapi.project.plasma.dto.mathDto.collision;

public record CollisionResultDto(
        double transferredEnergy,
        double momentum,
        double damageEnergy,
        double displacement,
        String potentialName,
        double r,
        double re,
        double stiffness
) {}
