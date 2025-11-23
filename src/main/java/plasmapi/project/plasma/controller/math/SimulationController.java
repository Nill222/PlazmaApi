package plasmapi.project.plasma.controller.math;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import plasmapi.project.plasma.dto.ApiResponse;
import plasmapi.project.plasma.dto.mathDto.simulation.SimulationRequestDto;
import plasmapi.project.plasma.dto.mathDto.simulation.SimulationResultDto;
import plasmapi.project.plasma.service.math.simulation.SimulationOrchestratorService;


@RestController
@RequestMapping("/api/simulation")
@RequiredArgsConstructor
public class SimulationController {

    private final SimulationOrchestratorService simulationService;

    /**
     * Запустить полную симуляцию (оркестратор).
     * Тело запроса — SimulationRequestDto.
     */
    @PostMapping("/run")
    public ResponseEntity<ApiResponse<SimulationResultDto>> runSimulation(
            @Valid @RequestBody SimulationRequestDto request) {

        SimulationResultDto result = simulationService.runSimulation(request);
        ApiResponse<SimulationResultDto> resp = new ApiResponse<>(
                result,
                "Симуляция выполнена",
                HttpStatus.OK.value()
        );
        return ResponseEntity.ok(resp);
    }
}
