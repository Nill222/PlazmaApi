package plasmaApi.project.plasmaApi.controller.logik;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import plasmaApi.project.plasmaApi.dto.ApiResponse;
import plasmaApi.project.plasmaApi.dto.logikDTO.ResultDTO;
import plasmaApi.project.plasmaApi.mapper.Mapper;
import plasmaApi.project.plasmaApi.service.logik.ResultService;

import java.util.List;

@RestController
@RequestMapping("/results")
@RequiredArgsConstructor
public class ResultController {

    private final ResultService resultService;
    private final Mapper resultMapper;

    @GetMapping("/config/{configId}")
    public ResponseEntity<ApiResponse<List<ResultDTO>>> getResultsByConfig(@PathVariable Integer configId) {
        List<ResultDTO> dtos = resultService.findByConfig(configId).stream()
                .map(resultMapper::toDTO)
                .toList();
        return ResponseEntity.ok(new ApiResponse<>(dtos, "Результаты для конфига получены", HttpStatus.OK.value()));
    }
}
