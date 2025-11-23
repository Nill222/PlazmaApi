package plasmapi.project.plasma.dto.mathDto.simulation;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record SimulationRequestDto(

        @NotNull @Positive
        Integer ionId,

        @NotNull @Positive
        Integer configId,

        double voltage,
        double current,
        double pressure,
        double electronTemperature,
        double chamberWidth,
        double chamberDepth,
        double exposureTime
) {}
