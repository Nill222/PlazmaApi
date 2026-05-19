package plasmapi.project.plasma.service.math.energy.impl;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.model.res.PlasmaConfiguration;
import plasmapi.project.plasma.service.math.energy.PlasmaCorrectionService;

/**
 * (3) M_p = 1 + Σ α_i θ_i + Σ β_ij θ_i θ_j.
 * θ = [давление (Па), T_e (эВ), ток (А), напряжение (В)].
 */
@Service
public class PlasmaCorrectionServiceImpl implements PlasmaCorrectionService {

    @Value("${energy-deposition.plasma.linear-pressure:1.0e-5}")
    private double alphaPressure;

    @Value("${energy-deposition.plasma.linear-electron-temp:0.15}")
    private double alphaElectronTemp;

    @Value("${energy-deposition.plasma.linear-current:1.0e-3}")
    private double alphaCurrent;

    @Value("${energy-deposition.plasma.linear-voltage:1.0e-4}")
    private double alphaVoltage;

    @Value("${energy-deposition.plasma.pair-pressure-temp:2.0e-6}")
    private double betaPressureTemp;

    @Value("${energy-deposition.plasma.pair-current-voltage:5.0e-7}")
    private double betaCurrentVoltage;

    @Value("${energy-deposition.plasma.min-factor:0.1}")
    private double minFactor;

    @Value("${energy-deposition.plasma.max-factor:10.0}")
    private double maxFactor;

    @Override
    public double computeFactor(PlasmaConfiguration cfg) {
        double p = nz(cfg.getPressure());
        double te = nz(cfg.getElectronTemperature());
        double i = nz(cfg.getCurrent());
        double u = nz(cfg.getVoltage());

        double linear = alphaPressure * p
                + alphaElectronTemp * te
                + alphaCurrent * i
                + alphaVoltage * u;

        double quadratic = betaPressureTemp * p * te
                + betaCurrentVoltage * i * u;

        double factor = 1.0 + linear + quadratic;
        if (Double.isNaN(factor) || factor < minFactor) {
            factor = minFactor;
        }
        return Math.min(factor, maxFactor);
    }

    private static double nz(Double v) {
        return v != null ? v : 0.0;
    }
}
