package plasmaApi.project.plasmaApi.controller.math;


import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import plasmaApi.project.plasmaApi.dto.ApiResponse;
import plasmaApi.project.plasmaApi.model.res.Result;
import plasmaApi.project.plasmaApi.repository.ResultRepository;


import java.util.List;

@RestController
@RequestMapping("/api/results")
@RequiredArgsConstructor
public class ResultController {

    private final ResultRepository resultRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Result>>> findAll() {
        List<Result> all = resultRepository.findAll();
        return ResponseEntity.ok(new ApiResponse<>(all, "Результаты симуляций", HttpStatus.OK.value()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Result>> findById(@PathVariable Integer id) {
        Result r = resultRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Result with id " + id + " not found"));
        return ResponseEntity.ok(new ApiResponse<>(r, "Результат найден", HttpStatus.OK.value()));
    }
}
