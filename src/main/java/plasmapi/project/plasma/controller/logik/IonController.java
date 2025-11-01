package plasmapi.project.plasma.controller.logik;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import plasmapi.project.plasma.dto.ApiResponse;
import plasmapi.project.plasma.dto.logikDTO.ion.CreateIonDTO;
import plasmapi.project.plasma.dto.logikDTO.ion.IonDTO;
import plasmapi.project.plasma.mapper.ion.IonReadMapper;
import plasmapi.project.plasma.model.res.Ion;
import plasmapi.project.plasma.service.logik.IonService;

import java.util.List;

@RestController
@RequestMapping("/ions")
@RequiredArgsConstructor
public class IonController {

    private final IonService ionService;
    private final IonReadMapper ionMapper;

    @GetMapping
    public ResponseEntity<ApiResponse<List<IonDTO>>> getAllIons() {
        List<IonDTO> dtos = ionService.findAll().stream()
                .map(ionMapper::map)
                .toList();
        return ResponseEntity.ok(new ApiResponse<>(dtos, "Все ионы получены", HttpStatus.OK.value()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<IonDTO>> getIonById(@PathVariable Integer id) {
        Ion ion = ionService.findById(id)
                .orElseThrow(() -> new RuntimeException("Ион с id " + id + " не найден"));
        return ResponseEntity.ok(new ApiResponse<>(ionMapper.map(ion), "Ион найден", HttpStatus.OK.value()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<IonDTO>> createIon(@Valid @RequestBody CreateIonDTO ion) {
        Ion created = ionService.create(ion)
                .orElseThrow(() -> new RuntimeException("Не удалось создать ион"));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(ionMapper.map(created), "Ион создан", HttpStatus.CREATED.value()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteIon(@PathVariable Integer id) {
        boolean deleted = ionService.delete(id);
        if (deleted) return ResponseEntity.ok(new ApiResponse<>(null, "Ион удален", HttpStatus.OK.value()));
        throw new RuntimeException("Ион с id " + id + " не найден");
    }
}
