package plasmaApi.project.plasmaApi.service.math.diffusion;

import plasmaApi.project.plasmaApi.dto.mathDto.diffusion.DiffusionProfileDto;
import plasmaApi.project.plasmaApi.dto.mathDto.diffusion.DiffusionRequest;

public interface DiffusionService {
    DiffusionProfileDto calculateDiffusionProfile(DiffusionRequest dto);
}
