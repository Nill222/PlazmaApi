package plasmapi.project.plasma.service.math.plazma;

import plasmapi.project.plasma.model.res.Ion;
import plasmapi.project.plasma.model.res.PlasmaConfiguration;
import plasmapi.project.plasma.service.math.ion.IonComposition;

public interface PlasmaService {
    PlasmaResult calculate(PlasmaConfiguration cfg, Ion ion, IonComposition ionComp, Double ionFluxOverride);
}
