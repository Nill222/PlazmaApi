package plasmapi.project.plasma.service.security;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.controller.handler.exception.NotFoundException;
import plasmapi.project.plasma.dto.logikDTO.user.UserCreateDto;
import plasmapi.project.plasma.dto.logikDTO.user.UserSignIn;
import plasmapi.project.plasma.dto.logikDTO.user.JwtAuthenticationResponse;
import plasmapi.project.plasma.model.security.User;
import plasmapi.project.plasma.service.logik.UserService;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UserService userService;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public JwtAuthenticationResponse signUp(UserCreateDto request) {

        // Проверка username
        userService.findByUsername(request.username())
                .ifPresent(u -> { throw new IllegalArgumentException("Username already in use"); });

        // Проверка email
        try {
            Optional<User> existing = userService.findByEmail(request.email());
            if (existing.isPresent()) {
                throw new IllegalArgumentException("Email already in use");
            }
        } catch (NotFoundException ignored) {
            // email свободен — идём дальше
        }

        // Важно: тут НЕ ХЭШИРУЕМ пароль — маппер сделает это сам!
        User saved = userService.create(request)
                .orElseThrow(() -> new IllegalStateException("Failed to create user"));

        String token = jwtService.generateToken(saved);

        return new JwtAuthenticationResponse(token);
    }

    public JwtAuthenticationResponse signIn(UserSignIn request) {

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.username(),
                        request.password()
                )
        );

        User user = userService.findByUsername(request.username())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String jwt = jwtService.generateToken(user);

        return new JwtAuthenticationResponse(jwt);
    }
}

