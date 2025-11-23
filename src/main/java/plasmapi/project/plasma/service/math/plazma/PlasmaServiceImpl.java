package plasmapi.project.plasma.service.math.plazma;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.dto.mathDto.plasma.PlasmaResultDto;
import plasmapi.project.plasma.dto.mathDto.simulation.SimulationRequestDto;


@Service
@RequiredArgsConstructor
public class PlasmaServiceImpl implements PlasmaService {

    private static final double E_CHARGE = 1.602176634e-19;
    private static final double ME = 9.10938356e-31;

    @Override
    public PlasmaResultDto calculate(SimulationRequestDto request) {
        if (request == null) throw new IllegalArgumentException("SimulationRequestDto required");

        // Параметры плазмы берём из запроса
        double voltage = request.voltage();
        double current = request.current();
        double pressure = request.pressure();
        double electronTemp = request.electronTemperature();

        // Electron density (идеальный газ)
        double electronDensity = pressure / (1.380649e-23 * electronTemp);

        // Electron velocity
        double electronVelocity = Math.sqrt(2.0 * E_CHARGE * voltage / ME);

        // Current density
        double currentDensity = current / (request.chamberWidth() * request.chamberDepth());

        // Эффективная энергия ионов
        double ionEnergyEffective = voltage * current * request.exposureTime();

        return new PlasmaResultDto(
                electronDensity,
                electronVelocity,
                currentDensity,
                ionEnergyEffective,
                voltage,
                pressure,
                electronTemp
        );
    }
}
