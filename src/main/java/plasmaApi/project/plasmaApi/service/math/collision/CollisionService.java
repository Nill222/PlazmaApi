package plasmaApi.project.plasmaApi.service.math.collision;

import plasmaApi.project.plasmaApi.dto.mathDto.collision.CollisionResult;

public interface CollisionService {
    CollisionResult simulateCollision(double E, double mIon, double mAtom, double angle);
}
