package plasmapi.project.plasma.service.math.slr;

import plasmapi.project.plasma.dto.mathDto.collision.CollisionResult;
import plasmapi.project.plasma.model.atom.AtomList;
import plasmapi.project.plasma.model.res.Ion;

public interface SLRService {
    double computeFactor(
            double fluence,
            double thetaRad,
            CollisionResult collision,
            double surfaceBindingEnergyEv
    );
}
