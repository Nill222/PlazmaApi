package plasmapi.project.plasma.controller.logik;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import plasmapi.project.plasma.dto.ApiResponse;
import plasmapi.project.plasma.model.res.Result;
import plasmapi.project.plasma.service.logik.ResultService;

import java.util.List;

@RestController
@RequestMapping("/results")
@RequiredArgsConstructor
public class ResultController {

    private final ResultService resultService;

    @GetMapping("/config")
    public ResponseEntity<ApiResponse<List<Result>>> getAll() {
        List<Result> dtos = resultService.findAll();
        return ResponseEntity.ok(new ApiResponse<>(dtos, "Результаты для конфига получены", HttpStatus.OK.value()));
    }
}
