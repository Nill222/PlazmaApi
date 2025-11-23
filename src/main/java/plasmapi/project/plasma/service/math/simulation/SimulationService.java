package plasmapi.project.plasma.service.math.simulation;

import plasmapi.project.plasma.dto.mathDto.atom.AtomListDto;
import plasmapi.project.plasma.dto.mathDto.collision.CollisionDto;
import plasmapi.project.plasma.dto.mathDto.plasma.PlasmaResultDto;
import plasmapi.project.plasma.dto.mathDto.simulation.SimulationRequestDto;
import plasmapi.project.plasma.dto.mathDto.simulation.SimulationResultDto;
import plasmapi.project.plasma.dto.mathDto.thermal.ThermalDto;

public interface SimulationService {

    PlasmaResultDto getPlasmaParametersFromRequest(SimulationRequestDto request);

    AtomListDto getAtomList(Integer atomListId);

    ThermalDto getThermalInput(SimulationRequestDto dto, Integer configId, Integer atomListId, double exposureTime);

    CollisionDto getCollisionInput(Integer atomListId, double distance, double ionEnergy, double angle);
}
