package plasmapi.project.plasma.service.math.diffusion;

import plasmapi.project.plasma.dto.mathDto.diffusion.DiffusionProfileDto;
import plasmapi.project.plasma.dto.mathDto.diffusion.DiffusionRequest;

public interface DiffusionService {
    DiffusionProfileDto calculateDiffusionProfile(DiffusionRequest dto);
}
