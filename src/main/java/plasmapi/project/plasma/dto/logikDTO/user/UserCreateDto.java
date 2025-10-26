package plasmapi.project.plasma.dto.logikDTO.user;

import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.validation.constraints.*;
import plasmapi.project.plasma.model.security.Role;

public record UserCreateDto(
        @NotBlank(message = "Имя пользователя не может быть пустым")
        @Size(min = 2, max = 15, message = "Имя пользователя должно содержать от 2 до 15 символов")
        @Pattern(regexp = "^[A-Z][a-zA-Z0-9]*$", message = "Имя должно начинаться с заглавной буквы и содержать только буквы и цифры")
        String username,

        @NotBlank(message = "Email не может быть пустым")
        @Email(message = "Некорректный формат email")
        String email,

        @NotNull(message = "Роль пользователя обязательна")
        @Enumerated(EnumType.STRING)
        Role role
) {

}
