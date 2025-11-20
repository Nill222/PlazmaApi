package plasmapi.project.plasma.controller.math;



import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import plasmapi.project.plasma.dto.ApiResponse;
import plasmapi.project.plasma.dto.mathDto.collision.CollisionDto;
import plasmapi.project.plasma.dto.mathDto.collision.CollisionResult;
import plasmapi.project.plasma.service.math.collision.CollisionService;


@RestController
@RequestMapping("/api/collision")
@RequiredArgsConstructor
public class CollisionController {

//    private final CollisionService collisionService;
//
//    /**
//     * Смоделировать одно столкновение.
//     * Принимает параметры через query-параметры.
//     */
//    @PostMapping("/simulate")
//    public ResponseEntity<ApiResponse<CollisionResult>> simulate(@Valid @RequestBody CollisionDto collisionDto) {
//
//        CollisionResult result = collisionService.simulateCollision(collisionDto);
//        ApiResponse<CollisionResult> resp = new ApiResponse<>(
//                result,
//                "Результат столкновения рассчитан",
//                HttpStatus.OK.value()
//        );
//        return ResponseEntity.ok(resp);
//    }
}
