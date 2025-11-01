package plasmapi.project.plasma.dto.mathDto.plasma;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Positive;

public record PlasmaDto(
        @Positive(message = "Напряжение должно быть положительным")
        @DecimalMax(value = "1e6", message = "Напряжение слишком велико")
        double voltage,

        @Positive(message = "Давление должно быть положительным")
        @DecimalMax(value = "1e5", message = "Давление слишком велико")
        double pressure,

        @Positive(message = "Температура должна быть положительной")
        @DecimalMax(value = "1e5", message = "Температура слишком высока")
        double temperature

) {
}
