package plasmapi.project.plasma.dto.mathDto.thermal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Positive;
import plasmapi.project.plasma.model.atom.StructureType;

public record ThermalDto(
        @Positive(message = "Начальная температура T0 должна быть положительной")
        @DecimalMax(value = "1e5", message = "Начальная температура слишком велика")
        double T0,

        @Positive(message = "Коэффициент теплопередачи lambda должен быть положительным")
        @DecimalMax(value = "100", message = "Коэффициент теплопередачи слишком велик")
        double lambda,

        @Positive(message = "Максимальное время tMax должно быть положительным")
        @DecimalMax(value = "1e6", message = "Максимальное время слишком велико")
        double tMax,

        @Positive(message = "Шаг времени dt должен быть положительным")
        @DecimalMin(value = "1e-6", message = "Шаг времени слишком мал")
        double dt,
        StructureType structure

) {
}
