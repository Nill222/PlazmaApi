package plasmapi.project.plasma.controller.math;



import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import plasmapi.project.plasma.dto.ApiResponse;
import plasmapi.project.plasma.dto.mathDto.collision.CollisionResult;
import plasmapi.project.plasma.dto.mathDto.collision.CollisionSimRequest;
import plasmapi.project.plasma.service.math.collision.CollisionService;


@RestController
@RequestMapping("/api/collision")
@RequiredArgsConstructor
public class CollisionController {

    private final CollisionService collisionService;

    /**
     * Смоделировать одно столкновение.
     * Принимает параметры через query-параметры.
     */
    @GetMapping("/simulate")
    public ResponseEntity<ApiResponse<CollisionResult>> simulate(
            @RequestParam double energy,
            @RequestParam double ionMass,
            @RequestParam double atomMass,
            @RequestParam(defaultValue = "0.0") double angle) {

        CollisionResult result = collisionService.simulateCollision(energy, ionMass, atomMass, angle);
        ApiResponse<CollisionResult> resp = new ApiResponse<>(
                result,
                "Результат столкновения рассчитан",
                HttpStatus.OK.value()
        );
        return ResponseEntity.ok(resp);
    }

    /**
     * Альтернативный эндпоинт с телом запроса.
     */
    @PostMapping("/simulate")
    public ResponseEntity<ApiResponse<CollisionResult>> simulatePost(@RequestBody CollisionSimRequest req) {
        CollisionResult result = collisionService.simulateCollision(
                req.energy(), req.ionMass(), req.atomMass(), req.angle()
        );
        return ResponseEntity.ok(new ApiResponse<>(result, "Результат столкновения рассчитан", HttpStatus.OK.value()));
    }
}
