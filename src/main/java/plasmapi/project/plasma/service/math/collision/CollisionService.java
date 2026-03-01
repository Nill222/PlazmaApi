package plasmapi.project.plasma.service.math.collision;

import plasmapi.project.plasma.dto.mathDto.collision.CollisionDto;
import plasmapi.project.plasma.dto.mathDto.collision.CollisionResult;
import plasmapi.project.plasma.model.atom.AtomList;
import plasmapi.project.plasma.model.res.Ion;

public interface CollisionService {
    CollisionResult simulate(Ion ion, AtomList atom, double ionEnergyEv,
                             double impactParameter, double surfaceBindingEnergy);
}
