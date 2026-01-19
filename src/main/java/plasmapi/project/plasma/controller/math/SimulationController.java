package plasmapi.project.plasma.controller.math;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import plasmapi.project.plasma.dto.ApiResponse;
import plasmapi.project.plasma.dto.logikDTO.ResultDTO;
import plasmapi.project.plasma.dto.mathDto.simulation.SimulationRequestDto;
import plasmapi.project.plasma.dto.mathDto.simulation.SimulationResultDto;
import plasmapi.project.plasma.service.logik.ResultService;
import plasmapi.project.plasma.service.math.simulation.SimulationOrchestratorService;

import java.util.Optional;


@RestController
@RequestMapping("/api/simulation")
@RequiredArgsConstructor
public class SimulationController {

    private final SimulationOrchestratorService simulationService;
    private final ResultService resultService;

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

    @PostMapping("/create")
    public ResponseEntity<ApiResponse<Optional<ResultDTO>>> createSimulation(@Valid @RequestBody SimulationResultDto request) {
        Optional<ResultDTO> result = resultService.create(request);
        ApiResponse<Optional<ResultDTO>> resp = new ApiResponse<>(
                result,
                "Симуляция выполнена",
                HttpStatus.OK.value()
        );
        return ResponseEntity.ok(resp);
    }
}
