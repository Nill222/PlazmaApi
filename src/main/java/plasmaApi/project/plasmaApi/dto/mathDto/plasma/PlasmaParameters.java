package plasmaApi.project.plasmaApi.dto.mathDto.plasma;

public record PlasmaParameters(
        double electronDensity,
        double electronVelocity,
        double currentDensity,
        double voltage,
        double pressure,
        double temperature
) {}
