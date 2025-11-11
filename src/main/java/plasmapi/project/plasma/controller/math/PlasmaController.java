package plasmapi.project.plasma.controller.math;


import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import plasmapi.project.plasma.dto.ApiResponse;
import plasmapi.project.plasma.dto.mathDto.plasma.PlasmaDto;
import plasmapi.project.plasma.dto.mathDto.plasma.PlasmaParameters;
import plasmapi.project.plasma.service.math.plazma.PlasmaService;


@RestController
@RequestMapping("/api/plasma")
@RequiredArgsConstructor
public class PlasmaController {

    private final PlasmaService plasmaService;

    /**
     * Рассчитать параметры плазмы (плотность электронов, скорость и т.д.)
     */
    @PostMapping("/calculate")
    public ResponseEntity<ApiResponse<PlasmaParameters>> calculate(
            @Valid @RequestBody PlasmaDto plasmaDto) {

        PlasmaParameters params = plasmaService.calculate(plasmaDto);
        ApiResponse<PlasmaParameters> resp = new ApiResponse<>(
                params,
                "Параметры плазмы рассчитаны",
                HttpStatus.OK.value()
        );
        return ResponseEntity.ok(resp);
    }
}
