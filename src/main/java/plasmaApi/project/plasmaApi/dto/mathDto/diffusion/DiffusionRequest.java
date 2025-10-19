package plasmaApi.project.plasmaApi.dto.mathDto.diffusion;

public record DiffusionRequest(double D,
                               double c0,
                               double tMax,
                               double depth
) {
}
