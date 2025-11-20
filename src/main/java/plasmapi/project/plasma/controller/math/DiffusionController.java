package plasmapi.project.plasma.controller.math;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import plasmapi.project.plasma.dto.ApiResponse;
import plasmapi.project.plasma.dto.mathDto.diffusion.DiffusionProfileDto;
import plasmapi.project.plasma.dto.mathDto.diffusion.DiffusionRequest;
import plasmapi.project.plasma.service.math.diffusion.DiffusionService;


@RestController
@RequestMapping("/api/diffusion")
@RequiredArgsConstructor
public class DiffusionController {

//    private final DiffusionService diffusionService;
//
//    /**
//     * Рассчитать профиль диффузии (уравнение Фика)
//     */
//    @PostMapping("/calculate")
//    public ResponseEntity<ApiResponse<DiffusionProfileDto>> calculate(@Valid @RequestBody DiffusionRequest dto) {
//        DiffusionProfileDto profile = diffusionService.calculateDiffusionProfile(dto);
//        ApiResponse<DiffusionProfileDto> resp = new ApiResponse<>(
//                profile,
//                "Профиль диффузии рассчитан",
//                HttpStatus.OK.value()
//        );
//        return ResponseEntity.ok(resp);
//    }
}
