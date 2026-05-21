package plasmapi.project.plasma.controller.math;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import plasmapi.project.plasma.dto.ApiResponse;
import plasmapi.project.plasma.dto.logikDTO.ResultDTO;
import plasmapi.project.plasma.dto.mathDto.simulation.SimulationResultDto;
import plasmapi.project.plasma.dto.mathDto.simulation.SimulationRunResponse;
import plasmapi.project.plasma.mapper.SimulationResultMapper;
import plasmapi.project.plasma.service.logik.ResultService;
import plasmapi.project.plasma.service.math.energy.IntermediateResultEnrichmentService;
import plasmapi.project.plasma.service.math.simulation.SimulationOrchestratorService;
import plasmapi.project.plasma.service.math.simulation.SimulationRequest;
import plasmapi.project.plasma.service.math.simulation.SimulationResult;

import java.util.Map;
import java.util.Optional;


@RestController
@RequestMapping("/api/simulation")
@RequiredArgsConstructor
public class SimulationController {

    private final SimulationOrchestratorService simulationService;
    private final ResultService resultService;
    private final SimulationResultMapper simulationResultMapper;
    private final IntermediateResultEnrichmentService intermediateEnrichment;

    /**
     * Запустить полную симуляцию (оркестратор).
     */
    @PostMapping("/run")
    public ResponseEntity<ApiResponse<SimulationRunResponse>> runSimulation(
            @Valid @RequestBody SimulationRequest request) {

        SimulationResult result = simulationService.runSimulation(request);
        SimulationRunResponse response = SimulationRunResponse.from(
                result,
                simulationResultMapper.toIntermediateDto(result.getIntermediate()),
                intermediateEnrichment
        );
        ApiResponse<SimulationRunResponse> resp = new ApiResponse<>(
                response,
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

    /**
     * Запуск симуляции и сохранение итоговых и промежуточных результатов в БД.
     */
    @PostMapping("/run-and-save")
    public ResponseEntity<ApiResponse<Map<String, Object>>> runAndSave(
            @Valid @RequestBody SimulationRequest request,
            @RequestParam Integer configId
    ) {
        SimulationResult simulation = simulationService.runSimulation(request);
        Optional<ResultDTO> saved = resultService.saveFromSimulation(simulation, configId);

        ApiResponse<Map<String, Object>> resp = new ApiResponse<>(
                Map.of(
                        "simulation", simulation,
                        "saved", saved.orElse(null)
                ),
                "Симуляция выполнена и сохранена",
                HttpStatus.OK.value()
        );
        return ResponseEntity.ok(resp);
    }
}
