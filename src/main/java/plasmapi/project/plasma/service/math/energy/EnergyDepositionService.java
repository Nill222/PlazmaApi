package plasmapi.project.plasma.service.math.energy;

import plasmapi.project.plasma.model.atom.AtomList;
import plasmapi.project.plasma.model.res.Ion;
import plasmapi.project.plasma.model.res.PlasmaConfiguration;

import java.util.function.DoubleUnaryOperator;

/**
 * Оркестратор базового контура (1)–(5) и ветки SKIN-effect (6)–(12).
 */
public interface EnergyDepositionService {

    EnergyDepositionResult compute(
            PlasmaConfiguration cfg,
            AtomList targetMaterial,
            Ion ion,
            double ionFlux,
            double ionEnergyEv,
            double exposureTime,
            double localSurfaceTemperature,
            DoubleUnaryOperator timeModulationAt
    );
}
