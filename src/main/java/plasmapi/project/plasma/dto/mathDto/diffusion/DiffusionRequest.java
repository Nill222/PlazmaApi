package plasmapi.project.plasma.dto.mathDto.diffusion;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

public record DiffusionRequest(

        @Positive(message = "Коэффициент диффузии D должен быть положительным")
        @DecimalMax(value = "1e-2", message = "Коэффициент диффузии слишком велик для модели")
        double D,

        @PositiveOrZero(message = "Начальная концентрация c0 не может быть отрицательной")
        @DecimalMax(value = "1e3", message = "Начальная концентрация слишком велика")
        double c0,

        @Positive(message = "Максимальное время tMax должно быть положительным")
        @DecimalMax(value = "1e6", message = "Максимальное время слишком велико")
        double tMax,

        @Positive(message = "Глубина диффузии должна быть положительной")
        @DecimalMax(value = "1e3", message = "Глубина слишком велика для модели")
        double depth,

        double dx,

        double dt

) {}