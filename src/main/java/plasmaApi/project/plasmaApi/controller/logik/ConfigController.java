package plasmaApi.project.plasmaApi.controller.logik;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import plasmaApi.project.plasmaApi.dto.ApiResponse;
import plasmaApi.project.plasmaApi.dto.logikDTO.ConfigDTO;
import plasmaApi.project.plasmaApi.mapper.Mapper;
import plasmaApi.project.plasmaApi.model.res.Config;
import plasmaApi.project.plasmaApi.service.logik.ConfigService;

import java.util.List;

@RestController
@RequestMapping("/configs")
@RequiredArgsConstructor
public class ConfigController {

    private final ConfigService configService;
    private final Mapper configMapper;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ConfigDTO>>> getAllConfigs() {
        List<ConfigDTO> dtos = configService.findAll().stream()
                .map(configMapper::toDTO)
                .toList();
        return ResponseEntity.ok(new ApiResponse<>(dtos, "Все конфиги получены", HttpStatus.OK.value()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ConfigDTO>> getConfigById(@PathVariable Integer id) {
        Config config = configService.findById(id)
                .orElseThrow(() -> new RuntimeException("Конфиг с id " + id + " не найден"));
        return ResponseEntity.ok(new ApiResponse<>(configMapper.toDTO(config), "Конфиг найден", HttpStatus.OK.value()));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<ConfigDTO>>> getConfigsByUser(@PathVariable Integer userId) {
        List<ConfigDTO> dtos = configService.findByUser(userId).stream()
                .map(configMapper::toDTO)
                .toList();
        return ResponseEntity.ok(new ApiResponse<>(dtos, "Конфиги пользователя получены", HttpStatus.OK.value()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ConfigDTO>> createConfig(@RequestBody Config config) {
        Config created = configService.create(config)
                .orElseThrow(() -> new RuntimeException("Не удалось создать конфиг"));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(configMapper.toDTO(created), "Конфиг создан", HttpStatus.CREATED.value()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteConfig(@PathVariable Integer id) {
        boolean deleted = configService.delete(id);
        if (deleted) return ResponseEntity.ok(new ApiResponse<>(null, "Конфиг удален", HttpStatus.OK.value()));
        throw new RuntimeException("Конфиг с id " + id + " не найден");
    }
}

