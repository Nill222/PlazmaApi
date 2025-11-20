package plasmapi.project.plasma.service.math.collision;

import plasmapi.project.plasma.dto.mathDto.collision.CollisionDto;
import plasmapi.project.plasma.dto.mathDto.collision.CollisionResult;

public interface CollisionService {

    CollisionResult simulate(CollisionDto dto);
}
