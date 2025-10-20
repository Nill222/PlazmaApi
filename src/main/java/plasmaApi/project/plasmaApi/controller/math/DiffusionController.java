package plasmaApi.project.plasmaApi.controller.math;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import plasmaApi.project.plasmaApi.dto.ApiResponse;
import plasmaApi.project.plasmaApi.dto.mathDto.diffusion.DiffusionProfileDto;
import plasmaApi.project.plasmaApi.dto.mathDto.diffusion.DiffusionRequest;
import plasmaApi.project.plasmaApi.service.math.diffusion.DiffusionService;


@RestController
@RequestMapping("/api/diffusion")
@RequiredArgsConstructor
public class DiffusionController {

    private final DiffusionService diffusionService;

    /**
     * Рассчитать профиль диффузии (уравнение Фика)
     */
    @PostMapping("/calculate")
    public ResponseEntity<ApiResponse<DiffusionProfileDto>> calculate(@RequestBody DiffusionRequest dto) {
        DiffusionProfileDto profile = diffusionService.calculateDiffusionProfile(dto);
        ApiResponse<DiffusionProfileDto> resp = new ApiResponse<>(
                profile,
                "Профиль диффузии рассчитан",
                HttpStatus.OK.value()
        );
        return ResponseEntity.ok(resp);
    }
}
