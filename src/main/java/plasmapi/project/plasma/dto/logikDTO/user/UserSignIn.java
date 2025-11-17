package plasmapi.project.plasma.dto.logikDTO.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserSignIn(

        @Size(min = 5, max = 50, message = "Имя пользователя должно содержать от 5 до 50 символов")
        @NotBlank(message = "Имя пользователя не может быть пустыми")
        String username,

        @Size(min = 8, max = 255, message = "Длина пароля должна быть от 8 до 255 символов")
        @NotBlank(message = "Пароль не может быть пустыми")
        String password
) {
}
