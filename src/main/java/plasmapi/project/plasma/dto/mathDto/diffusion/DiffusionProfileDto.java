package plasmapi.project.plasma.dto.mathDto.diffusion;

import java.util.List;

public record DiffusionProfileDto(
        double D1,
        double D2,
        double Q1,
        double Q2,
        double D_thermal,
        double D_effective,
        double depth
) {}

