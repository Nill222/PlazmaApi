package plasmapi.project.plasma.dto.logikDTO.config;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ConfigCreateDto(
        @NotNull(message = "ID пользователя")
        Integer userId,

        @NotBlank(message = "Имя конфигурации не может быть пустым")
        @Size(min = 3, max = 100, message = "Имя конфигурации должно содержать от 3 до 100 символов")
        String name,

        @Size(max = 1000, message = "Описание не может превышать 1000 символов")
        String description

) {
}
