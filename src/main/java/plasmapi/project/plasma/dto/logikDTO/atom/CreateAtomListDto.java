package plasmapi.project.plasma.dto.logikDTO.atom;

import jakarta.validation.constraints.*;

public record CreateAtomListDto(

        @NotBlank(message = "Название атома не может быть пустым")
        @Size(min = 1, max = 5, message = "Название атома должно содержать от 1 до 5 символов")
        @Pattern(regexp = "^[A-Z][a-z]?$", message = "Название атома должно начинаться с заглавной буквы и содержать не более 2 букв")
        String atomName,

        @NotBlank(message = "Полное название атома не может быть пустым")
        @Size(min = 2, max = 50, message = "Полное название атома должно содержать от 2 до 50 символов")
        String fullName,

        @NotNull(message = "Масса атома обязательна")
        @Positive(message = "Масса атома должна быть положительной")
        @DecimalMin(value = "1e-27", message = "Масса слишком мала для реального атома (кг)")
        @DecimalMax(value = "1e-25", message = "Масса слишком велика для атома (кг)")
        Double mass,

        @NotNull(message = "Параметр решетки обязателен")
        @Positive(message = "Параметр решетки должен быть положительным числом")
        Double a,

        @NotNull(message = "Температура Дебая обязательна")
        @Positive(message = "Температура Дебая должна быть положительной")
        @DecimalMax(value = "1000", message = "Слишком высокая температура Дебая")
        Double debyeTemperature,

        @NotNull(message = "Валентность обязательна")
        @Min(value = 0, message = "Валентность не может быть отрицательной")
        @Max(value = 8, message = "Валентность не может быть больше 8")
        Integer valence

) {}
