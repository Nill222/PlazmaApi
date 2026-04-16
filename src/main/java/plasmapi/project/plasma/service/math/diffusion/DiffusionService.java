package plasmapi.project.plasma.service.math.diffusion;

import plasmapi.project.plasma.model.atom.AtomList;
import plasmapi.project.plasma.model.res.Ion;
import plasmapi.project.plasma.model.res.PlasmaConfiguration;
import plasmapi.project.plasma.service.math.ion.IonComposition;

public interface DiffusionService {
    DiffusionProfile calculateProfile(
            AtomList atom,
            AlloyComposition alloy,
            Ion ion,
            IonComposition ionComp,
            PlasmaConfiguration plasmaConfig,
            double exposureTime,
            double ambientTemp
    );
}
