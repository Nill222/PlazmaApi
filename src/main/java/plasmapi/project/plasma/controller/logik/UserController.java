package plasmapi.project.plasma.controller.logik;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import plasmapi.project.plasma.controller.handler.exception.NotFoundException;
import plasmapi.project.plasma.dto.ApiResponse;
import plasmapi.project.plasma.dto.logikDTO.UserDTO;
import plasmapi.project.plasma.mapper.Mapper;
import plasmapi.project.plasma.model.security.User;
import plasmapi.project.plasma.service.logik.UserService;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final Mapper userMapper;

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserDTO>>> getAllUsers() {
        List<UserDTO> dtos = userService.findAll().stream()
                .map(userMapper::toDTO)
                .toList();
        return ResponseEntity.ok(new ApiResponse<>(dtos, "Все пользователи получены", HttpStatus.OK.value()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDTO>> getUserById(@PathVariable Integer id) {
        User user = userService.findById(id)
                .orElseThrow(() -> new RuntimeException("Пользователь с id " + id + " не найден"));
        return ResponseEntity.ok(new ApiResponse<>(userMapper.toDTO(user), "Пользователь найден", HttpStatus.OK.value()));
    }

    @GetMapping("/username/{username}")
    public ResponseEntity<ApiResponse<UserDTO>> getUserByUsername(@PathVariable String username) {
        User user = userService.findByUsername(username).orElseThrow(() -> new NotFoundException("пользователь с таким именем: " + username + "не найден"));
        return ResponseEntity.ok(new ApiResponse<>(userMapper.toDTO(user), "Пользователь найден", HttpStatus.OK.value()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UserDTO>> createUser(@RequestBody User user) {
        User created = userService.create(user)
                .orElseThrow(() -> new RuntimeException("Не удалось создать пользователя"));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(userMapper.toDTO(created), "Пользователь создан", HttpStatus.CREATED.value()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Integer id) {
        boolean deleted = userService.delete(id);
        if (deleted) return ResponseEntity.ok(new ApiResponse<>(null, "Пользователь удален", HttpStatus.OK.value()));
        throw new RuntimeException("Пользователь с id " + id + " не найден");
    }
}
