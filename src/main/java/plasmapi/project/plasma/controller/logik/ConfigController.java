package plasmapi.project.plasma.controller.logik;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import plasmapi.project.plasma.dto.ApiResponse;
import plasmapi.project.plasma.dto.logikDTO.config.ConfigCreateDto;
import plasmapi.project.plasma.dto.logikDTO.config.ConfigDTO;
import plasmapi.project.plasma.mapper.config.ConfigReadMapper;
import plasmapi.project.plasma.model.res.Config;
import plasmapi.project.plasma.service.logik.ConfigService;

import java.util.List;

@RestController
@RequestMapping("/configs")
@RequiredArgsConstructor
public class ConfigController {

    private final ConfigService configService;
    private final ConfigReadMapper configMapper;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ConfigDTO>>> getAllConfigs() {
        List<ConfigDTO> dtos = configService.findAll().stream()
                .map(configMapper::map)
                .toList();
        return ResponseEntity.ok(new ApiResponse<>(dtos, "Все конфиги получены", HttpStatus.OK.value()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ConfigDTO>> getConfigById(@PathVariable Integer id) {
        Config config = configService.findById(id)
                .orElseThrow(() -> new RuntimeException("Конфиг с id " + id + " не найден"));
        return ResponseEntity.ok(new ApiResponse<>(configMapper.map(config), "Конфиг найден", HttpStatus.OK.value()));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<ConfigDTO>>> getConfigsByUser(@PathVariable Integer userId) {
        List<ConfigDTO> dtos = configService.findByUser(userId);
        return ResponseEntity.ok(new ApiResponse<>(dtos, "Конфиги пользователя получены", HttpStatus.OK.value()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ConfigDTO>> createConfig(@Valid @RequestBody ConfigCreateDto config) {
        Config created = configService.create(config)
                .orElseThrow(() -> new RuntimeException("Не удалось создать конфиг"));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(configMapper.map(created), "Конфиг создан", HttpStatus.CREATED.value()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteConfig(@PathVariable Integer id) {
        boolean deleted = configService.delete(id);
        if (deleted) return ResponseEntity.ok(new ApiResponse<>(null, "Конфиг удален", HttpStatus.OK.value()));
        throw new RuntimeException("Конфиг с id " + id + " не найден");
    }
}
