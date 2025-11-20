package plasmapi.project.plasma.controller.math;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import plasmapi.project.plasma.dto.ApiResponse;
import plasmapi.project.plasma.dto.mathDto.potential.PotentialDto;
import plasmapi.project.plasma.dto.mathDto.potential.PotentialParameters;
import plasmapi.project.plasma.service.math.potential.PotentialService;

@RestController
@RequestMapping("/api/potential")
@RequiredArgsConstructor
public class PotentialController {

//    private final PotentialService potentialService;
//
//    @PostMapping("/generate")
//    public ResponseEntity<ApiResponse<PotentialParameters>> generate(@Valid @RequestBody PotentialDto potentialDto) {
//        PotentialParameters params = potentialService.computePotentialForAtomByDistance(potentialDto);
//        ApiResponse<PotentialParameters> resp = new ApiResponse<>(
//                params,
//                "Параметры потенциалов рассчитаны",
//                HttpStatus.OK.value()
//        );
//        return ResponseEntity.ok(resp);
//    }
}
