package plasmapi.project.plasma.service.math.collision;

import plasmapi.project.plasma.dto.mathDto.collision.CollisionResult;

public interface CollisionService {
    CollisionResult simulateCollision(double E, double mIon, double mAtom, double angle);
}
