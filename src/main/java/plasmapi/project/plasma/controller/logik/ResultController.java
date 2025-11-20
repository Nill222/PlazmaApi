package plasmapi.project.plasma.controller.logik;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import plasmapi.project.plasma.dto.ApiResponse;
import plasmapi.project.plasma.dto.logikDTO.ResultDTO;
import plasmapi.project.plasma.service.logik.ResultService;

import java.util.List;

@RestController
@RequestMapping("/results")
@RequiredArgsConstructor
public class ResultController {

//    private final ResultService resultService;
//
//    @GetMapping("/config/{configId}")
//    public ResponseEntity<ApiResponse<List<ResultDTO>>> getResultsByConfig(@PathVariable Integer configId) {
//        List<ResultDTO> dtos = resultService.findByConfig(configId);
//        return ResponseEntity.ok(new ApiResponse<>(dtos, "Результаты для конфига получены", HttpStatus.OK.value()));
//    }
}
