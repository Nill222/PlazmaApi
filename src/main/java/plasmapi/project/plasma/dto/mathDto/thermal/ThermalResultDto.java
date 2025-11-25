package plasmapi.project.plasma.dto.mathDto.thermal;

import java.util.List;

public record ThermalResultDto(
        List<Double> temperatures,
        double min,
        double avg,
        double max

) {}
