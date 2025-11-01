package plasmapi.project.plasma.dto.mathDto.simulation;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import plasmapi.project.plasma.dto.mathDto.lattice.LatticeGenerationRequest;

public record SimulationRequestDto(
        @NotNull(message = "ID конфигурации обязателен")
        @Positive(message = "ID конфигурации должен быть положительным")
        Integer configId,

        @NotNull(message = "ID иона обязателен")
        @Positive(message = "ID иона должен быть положительным")
        Integer ionId,

        @NotNull(message = "ID атома обязателен")
        @Positive(message = "ID атома должен быть положительным")
        Integer atomListId,

        boolean generateLattice,

        @Valid // валидация вложенного DTO
        LatticeGenerationRequest latticeRequest,

        @Positive(message = "Напряжение плазмы должно быть положительным")
        @DecimalMax(value = "1e6", message = "Напряжение слишком велико")
        double plasmaVoltage,

        @Positive(message = "Давление должно быть положительным")
        @DecimalMax(value = "1e5", message = "Давление слишком велико")
        double pressure,

        @Positive(message = "Электронная температура должна быть положительной")
        @DecimalMax(value = "1e5", message = "Электронная температура слишком высока")
        double electronTemp,

        @Positive(message = "Шаг времени должен быть положительным")
        @DecimalMin(value = "1e-6", message = "Шаг времени слишком мал")
        double timeStep,

        @Positive(message = "Общее время должно быть положительным")
        @DecimalMax(value = "1e6", message = "Общее время слишком велико")
        double totalTime,

        @DecimalMin(value = "0.0", inclusive = true, message = "Угол столкновения не может быть меньше 0°")
        @DecimalMax(value = "180.0", inclusive = true, message = "Угол столкновения не может быть больше 180°")
        double impactAngle,

        @Positive(message = "Коэффициент диффузии (D0) должен быть положительным")
        @DecimalMax(value = "1e-2", message = "Коэффициент диффузии слишком велик")
        double diffusionPrefactor,

        @Positive(message = "Энергия активации (Q) должна быть положительной")
        @DecimalMax(value = "1e6", message = "Энергия активации слишком велика")
        double activationEnergy,

        @PositiveOrZero(message = "Поверхностная концентрация не может быть отрицательной")
        @DecimalMax(value = "1e3", message = "Поверхностная концентрация слишком велика")
        double surfaceConcentration,

        @Positive(message = "Глубина должна быть положительной")
        @DecimalMax(value = "1e3", message = "Глубина слишком велика")
        double depth,

        @Positive(message = "Теплопроводность должна быть положительной")
        @DecimalMax(value = "1e3", message = "Теплопроводность слишком велика")
        double thermalConductivity
) {}
