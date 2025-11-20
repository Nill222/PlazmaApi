package plasmapi.project.plasma.dto.mathDto.collision;

public record CollisionResult(
        double transferredEnergy,
        double momentum,
        double damageEnergy,
        double displacement,
        String detectPotentialName,
        double r,
        double re,
        double k
) {}
