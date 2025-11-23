package plasmapi.project.plasma.dto.mathDto.potential;

public record PotentialParametersDto(
        double value,
        double stiffness,
        double re,
        double sigma,
        double epsilon
) {}
