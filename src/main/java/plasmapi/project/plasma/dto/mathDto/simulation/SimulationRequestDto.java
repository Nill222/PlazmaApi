package plasmapi.project.plasma.dto.mathDto.simulation;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record SimulationRequestDto(

        @NotNull @Positive
        Integer ionId,

        @NotNull @Positive
        Integer configId,      // ID конфигурации плазмы из БД

        @NotNull @Positive
        Integer atomListId,    // ID атома (ранее было ionId, теперь правильно)

        @NotNull @Positive
        Double exposureTime    // время воздействия плазмы
) {}
