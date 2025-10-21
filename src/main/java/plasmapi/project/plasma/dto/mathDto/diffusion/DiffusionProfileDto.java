package plasmapi.project.plasma.dto.mathDto.diffusion;

import java.util.List;

public record DiffusionProfileDto(
        List<Double> depths,
        List<Double> concentration
) {
}
