package plasmaApi.project.plasmaApi.service.math.plazma;

import plasmaApi.project.plasmaApi.dto.mathDto.plasma.PlasmaParameters;

public interface PlasmaService {
    PlasmaParameters calculate(double voltage, double pressure, double temperature);
}
