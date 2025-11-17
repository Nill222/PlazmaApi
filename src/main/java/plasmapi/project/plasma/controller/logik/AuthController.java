package plasmapi.project.plasma.controller.logik;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.*;
import plasmapi.project.plasma.dto.ApiResponse;
import plasmapi.project.plasma.dto.logikDTO.user.*;
import plasmapi.project.plasma.mapper.user.UserReadMapper;
import plasmapi.project.plasma.model.security.Role;
import plasmapi.project.plasma.model.security.User;
import plasmapi.project.plasma.service.logik.UserService;
import plasmapi.project.plasma.service.security.JwtService;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserService userService;
    private final UserReadMapper userMapper;

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<UserDTO>> signup(@Valid @RequestBody UserSignUp request) {

        UserCreateDto createDto = UserCreateDto.builder()
                .username(request.username())
                .email(request.email())
                .password(request.password())
                .role(Role.ROLE_USER)
                .build();

        User created = userService.create(createDto)
                .orElseThrow(() -> new RuntimeException("Не удалось создать пользователя"));

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(
                        userMapper.map(created),
                        "Пользователь успешно зарегистрирован",
                        HttpStatus.CREATED.value()
                ));
    }

    @PostMapping("/signin")
    public ResponseEntity<ApiResponse<String>> signin(@Valid @RequestBody UserSignIn request) {

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.username(),
                            request.password()
                    )
            );

            User user = (User) authentication.getPrincipal();
            String jwt = jwtService.generateToken(user);

            return ResponseEntity.ok(
                    new ApiResponse<>(
                            jwt,
                            "Успешная авторизация",
                            HttpStatus.OK.value()
                    )
            );

        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>(null, "Неверное имя пользователя или пароль", 401));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDTO>> me(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User user)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>(null, "Не авторизован", 401));
        }

        return ResponseEntity.ok(new ApiResponse<>(
                userMapper.map(user),
                "Авторизация подтверждена",
                200
        ));
    }
}
