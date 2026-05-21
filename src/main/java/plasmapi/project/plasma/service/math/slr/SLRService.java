package plasmapi.project.plasma.service.math.slr;

import plasmapi.project.plasma.dto.mathDto.collision.CollisionResult;

public interface SLRService {
    double computeFactor(
            double fluence,
            double thetaRad,
            CollisionResult collision,
            double surfaceBindingEnergyEv
    );
}
