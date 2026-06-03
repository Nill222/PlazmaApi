package plasmapi.project.plasma.service.math.energy;

import plasmapi.project.plasma.model.res.PlasmaConfiguration;

import java.util.function.DoubleUnaryOperator;

/**
 * Входные данные для формулы (4) — обобщённый флюенс Φ_i(u,v).
 */
public record FluenceFormulaInput(
        PlasmaConfiguration plasmaConfig,
        double va,
        double ionEnergyEv,
        double ionFlux,
        double incidenceAngleRad,
        double radialDistanceM,
        double exposureTime,
        DoubleUnaryOperator dischargeModulationFd,
        double implantationEfficiency
) {}
