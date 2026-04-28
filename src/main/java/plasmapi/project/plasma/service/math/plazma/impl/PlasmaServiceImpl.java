package plasmapi.project.plasma.service.math.plazma.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.model.res.Ion;
import plasmapi.project.plasma.model.res.PlasmaConfiguration;
import plasmapi.project.plasma.service.PhysicalConstants;
import plasmapi.project.plasma.service.math.plazma.PlasmaResult;
import plasmapi.project.plasma.service.math.plazma.PlasmaService;
import plasmapi.project.plasma.service.math.ion.IonComposition;

@Service
@RequiredArgsConstructor
public class PlasmaServiceImpl implements PlasmaService {

    private static final double DEFAULT_GAS_TEMP = 300.0; // K
    private static final double EFFECTIVE_DIAMETER = 3e-10; // м (эффективный диаметр газа)
    private static final double MIN_LAMBDA = 1e-9;

    @Override
    public PlasmaResult calculate(
            PlasmaConfiguration cfg,
            Ion ion,
            IonComposition ionComp,
            Double ionFluxOverride
    ) {

        double ionEnergyEv;
        double ionFlux;

        // =========================
        // 1️⃣ ЭНЕРГИЯ (идеальная)
        // =========================
        if (cfg.getIonEnergyOverride() != null) {
            ionEnergyEv = cfg.getIonEnergyOverride();
        } else {

            if (cfg.getVoltage() == null) {
                throw new IllegalArgumentException("Voltage must be set");
            }

            if (ionComp != null && !ionComp.getComponents().isEmpty()) {

                double sum = 0.0;

                for (var ic : ionComp.getComponents()) {
                    Ion i = ic.getIon();
                    double xi = ic.getFraction();

                    if (i.getCharge() == null)
                        throw new IllegalArgumentException("Ion charge must be set");

                    sum += xi * cfg.getVoltage() * i.getCharge();
                }

                ionEnergyEv = sum;

            } else {

                if (ion.getCharge() == null)
                    throw new IllegalArgumentException("Ion charge must be set");

                ionEnergyEv = cfg.getVoltage() * ion.getCharge();
            }
        }

        // =========================
        // 2️⃣ ПОТОК (идеальный)
        // =========================
        if (ionFluxOverride != null) {
            ionFlux = ionFluxOverride;
        } else {

            if (cfg.getCurrent() == null ||
                    cfg.getChamberWidth() == null ||
                    cfg.getChamberDepth() == null) {
                throw new IllegalArgumentException("Current and chamber size must be set");
            }

            double area = cfg.getChamberWidth() * cfg.getChamberDepth();
            double currentDensity = cfg.getCurrent() / area;

            if (ionComp != null && !ionComp.getComponents().isEmpty()) {

                double sum = 0.0;

                for (var ic : ionComp.getComponents()) {
                    Ion i = ic.getIon();
                    double xi = ic.getFraction();

                    double q = i.getCharge() * PhysicalConstants.E_CHARGE;
                    sum += xi * (currentDensity / q);
                }

                ionFlux = sum;

            } else {

                double q = ion.getCharge() * PhysicalConstants.E_CHARGE;
                ionFlux = currentDensity / q;
            }
        }


        if (cfg.getPressure() != null && cfg.getPressure() > 0) {

            double P = cfg.getPressure();
            double T = DEFAULT_GAS_TEMP;

            // используем уже существующее поле
            double L = cfg.getElectrodeDistance() != null
                    ? cfg.getElectrodeDistance()
                    : 0.01; // 1 см

            double k = PhysicalConstants.KB;

            double lambda = k * T /
                    (Math.sqrt(2) * Math.PI * EFFECTIVE_DIAMETER * EFFECTIVE_DIAMETER * P);

            lambda = Math.max(lambda, MIN_LAMBDA);

            double attenuation = Math.exp(-L / lambda);

            // 🔻 энергия и поток уменьшаются
            ionEnergyEv *= attenuation;
            ionFlux *= attenuation;
        }

        // =========================
        // 4️⃣ ЗАЩИТА
        // =========================
        if (Double.isNaN(ionEnergyEv) || ionEnergyEv < 1e-3)
            ionEnergyEv = 1e-3;

        if (Double.isNaN(ionFlux) || ionFlux < 1e5)
            ionFlux = 1e5;

        return new PlasmaResult(ionEnergyEv, ionFlux);
    }
}