package plasmapi.project.plasma.dto.logikDTO.ion;

import jakarta.validation.constraints.*;

public record CreateIonDTO(
        @NotBlank(message = "Название иона не может быть пустым")
        @Size(min = 2, max = 25, message = "Название должно содержать от 2 до 25 символов")
        @Pattern(
                regexp = "^[A-Z][a-z0-9A-Z]*$",
                message = "Название должно начинаться с заглавной буквы и содержать только буквы и цифры"
        )
        String name,

        @NotNull(message = "Масса иона обязательна")
        @Positive(message = "Масса иона должна быть положительным числом")
        @DecimalMin(value = "1e-30",
                message = "Масса слишком мала, укажи реальное значение в кг")
        @DecimalMax(value = "1e-23",
                message = "Масса слишком велика для иона (в кг)")
        Double mass,

        @NotNull(message = "Заряд иона обязателен")
        @Min(value = -3, message = "Минимальный заряд — -3")
        @Max(value = 3, message = "Максимальный заряд — 3")
        Integer charge
) {
}
