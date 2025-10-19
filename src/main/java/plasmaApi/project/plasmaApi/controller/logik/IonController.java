package plasmaApi.project.plasmaApi.controller.logik;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import plasmaApi.project.plasmaApi.dto.ApiResponse;
import plasmaApi.project.plasmaApi.dto.logikDTO.IonDTO;
import plasmaApi.project.plasmaApi.mapper.Mapper;
import plasmaApi.project.plasmaApi.model.res.Ion;
import plasmaApi.project.plasmaApi.service.logik.IonService;

import java.util.List;

@RestController
@RequestMapping("/ions")
@RequiredArgsConstructor
public class IonController {

    private final IonService ionService;
    private final Mapper ionMapper;

    @GetMapping
    public ResponseEntity<ApiResponse<List<IonDTO>>> getAllIons() {
        List<IonDTO> dtos = ionService.findAll().stream()
                .map(ionMapper::toDTO)
                .toList();
        return ResponseEntity.ok(new ApiResponse<>(dtos, "Все ионы получены", HttpStatus.OK.value()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<IonDTO>> getIonById(@PathVariable Integer id) {
        Ion ion = ionService.findById(id)
                .orElseThrow(() -> new RuntimeException("Ион с id " + id + " не найден"));
        return ResponseEntity.ok(new ApiResponse<>(ionMapper.toDTO(ion), "Ион найден", HttpStatus.OK.value()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<IonDTO>> createIon(@RequestBody Ion ion) {
        Ion created = ionService.create(ion)
                .orElseThrow(() -> new RuntimeException("Не удалось создать ион"));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(ionMapper.toDTO(created), "Ион создан", HttpStatus.CREATED.value()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteIon(@PathVariable Integer id) {
        boolean deleted = ionService.delete(id);
        if (deleted) return ResponseEntity.ok(new ApiResponse<>(null, "Ион удален", HttpStatus.OK.value()));
        throw new RuntimeException("Ион с id " + id + " не найден");
    }
}


