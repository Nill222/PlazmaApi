package plasmaApi.project.plasmaApi.controller.math;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import plasmaApi.project.plasmaApi.dto.ApiResponse;
import plasmaApi.project.plasmaApi.dto.mathDto.simulation.SimulationRequestDto;
import plasmaApi.project.plasmaApi.dto.mathDto.simulation.SimulationResultDto;
import plasmaApi.project.plasmaApi.service.math.simulation.SimulationService;


@RestController
@RequestMapping("/api/simulation")
@RequiredArgsConstructor
public class SimulationController {

    private final SimulationService simulationService;

    /**
     * Запустить полную симуляцию (оркестратор).
     * Тело запроса — SimulationRequestDto.
     */
    @PostMapping("/run")
    public ResponseEntity<ApiResponse<SimulationResultDto>> runSimulation(
            @RequestBody SimulationRequestDto request) {

        SimulationResultDto result = simulationService.runSimulation(request);
        ApiResponse<SimulationResultDto> resp = new ApiResponse<>(
                result,
                "Симуляция выполнена",
                HttpStatus.OK.value()
        );
        return ResponseEntity.ok(resp);
    }
}
