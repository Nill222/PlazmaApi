package plasmapi.project.plasma.dto.mathDto.plasma;

public record PlasmaResultDto(
        double electronDensity,
        double electronVelocity,
        double currentDensity,
        double ionEnergy,
        double voltage,
        double pressure,
        double electronTemp
) {}
