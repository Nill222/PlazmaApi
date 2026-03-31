package plasmapi.project.plasma.service.math.diffusion;

import plasmapi.project.plasma.model.atom.AtomList;
import plasmapi.project.plasma.model.res.Ion;
import plasmapi.project.plasma.model.res.PlasmaConfiguration;

public interface DiffusionService {
    DiffusionProfile calculateProfile(
            AtomList atom,
            AlloyComposition alloy,
            Ion ion,
            PlasmaConfiguration plasmaConfig,
            double exposureTime,
            double ambientTemp
    );
}
