package plasmaApi.project.plasmaApi.controller.math;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import plasmaApi.project.plasmaApi.dto.ApiResponse;
import plasmaApi.project.plasmaApi.dto.mathDto.lattice.AtomDto;
import plasmaApi.project.plasmaApi.dto.mathDto.lattice.LatticeGenerationRequest;
import plasmaApi.project.plasmaApi.service.math.Lattice.LatticeService;


import java.util.List;

@RestController
@RequestMapping("/api/lattice")
@RequiredArgsConstructor
public class LatticeController {

    private final LatticeService latticeService;

    /**
     * Сгенерировать решётку атомов и сохранить в конфигурацию.
     * Возвращает список созданных AtomDto.
     */
    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<List<AtomDto>>> generate(@RequestBody LatticeGenerationRequest request) {
        List<AtomDto> atoms = latticeService.generateLattice(request);
        ApiResponse<List<AtomDto>> resp = new ApiResponse<>(
                atoms,
                "Решётка сгенерирована",
                HttpStatus.CREATED.value()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(resp);
    }
}
