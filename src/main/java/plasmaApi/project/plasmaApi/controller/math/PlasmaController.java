package plasmaApi.project.plasmaApi.controller.math;


import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import plasmaApi.project.plasmaApi.dto.ApiResponse;
import plasmaApi.project.plasmaApi.dto.mathDto.plasma.PlasmaParameters;
import plasmaApi.project.plasmaApi.service.math.plazma.PlasmaService;


@RestController
@RequestMapping("/api/plasma")
@RequiredArgsConstructor
public class PlasmaController {

    private final PlasmaService plasmaService;

    /**
     * Рассчитать параметры плазмы (плотность электронов, скорость и т.д.)
     */
    @GetMapping("/calculate")
    public ResponseEntity<ApiResponse<PlasmaParameters>> calculate(
            @RequestParam double voltage,
            @RequestParam double pressure,
            @RequestParam double temperature) {

        PlasmaParameters params = plasmaService.calculate(voltage, pressure, temperature);
        ApiResponse<PlasmaParameters> resp = new ApiResponse<>(
                params,
                "Параметры плазмы рассчитаны",
                HttpStatus.OK.value()
        );
        return ResponseEntity.ok(resp);
    }
}
