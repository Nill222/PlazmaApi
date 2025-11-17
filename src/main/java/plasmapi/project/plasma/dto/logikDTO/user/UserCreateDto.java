package plasmapi.project.plasma.dto.logikDTO.user;

import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.validation.constraints.*;
import lombok.Builder;
import plasmapi.project.plasma.model.security.Role;

@Builder
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
        Role role,

        @NotBlank
        @Size(min = 8, max = 64)
        @Pattern(
                regexp = "^(?=.*[0-9])(?=.*[a-zA-Z]).{8,64}$",
                message = "Пароль должен содержать минимум одну цифру и одну букву"
        )
        String password
) {

}
