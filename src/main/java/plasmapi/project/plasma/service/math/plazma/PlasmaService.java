package plasmapi.project.plasma.service.math.plazma;

import plasmapi.project.plasma.dto.mathDto.plasma.PlasmaParameters;

public interface PlasmaService {
    PlasmaParameters calculate(double voltage, double pressure, double temperature);
}
