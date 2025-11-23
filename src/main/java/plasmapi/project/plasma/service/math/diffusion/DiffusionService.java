package plasmapi.project.plasma.service.math.diffusion;

import plasmapi.project.plasma.dto.mathDto.diffusion.DiffusionProfileDto;
import plasmapi.project.plasma.dto.mathDto.diffusion.DiffusionRequest;
import plasmapi.project.plasma.dto.mathDto.simulation.SimulationRequestDto;

public interface DiffusionService {

    DiffusionProfileDto calculateFromConfig(SimulationRequestDto dto, Integer configId, Integer atomListId, double exposureTime, double exposureRate);
}
