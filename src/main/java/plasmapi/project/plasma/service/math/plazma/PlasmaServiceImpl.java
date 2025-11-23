package plasmapi.project.plasma.service.math.plazma;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.dto.mathDto.plasma.PlasmaResultDto;
import plasmapi.project.plasma.service.math.simulation.SimulationService;


@Service
@RequiredArgsConstructor
public class PlasmaServiceImpl implements PlasmaService {

    private final SimulationService simulationService;

//    private static final double KB = 1.380649e-23;
    private static final double E_CHARGE = 1.602176634e-19;
    private static final double ME = 9.10938356e-31;

    @Override
    public PlasmaResultDto calculate(Integer configId) {

        PlasmaResultDto dto = simulationService.getPlasmaParameters(configId);

        // Electron velocity
        double ve = Math.sqrt(2.0 * E_CHARGE * dto.voltage() / ME);

        // Current density (I / electrode area)
        double currentDensity = dto.currentDensity();

        // ionEnergy remains as in DTO
        double ionEnergy = dto.ionEnergy();

        return new PlasmaResultDto(
                dto.electronDensity(),
                ve,
                currentDensity,
                ionEnergy,
                dto.voltage(),
                dto.pressure(),
                dto.electronTemp()
        );
    }
}
