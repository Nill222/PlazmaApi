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
    //todo степень ионизации газовых ионов в вакуме в тлеющем разряде
    /**
     * Расчёт энергии и потока ионов.
     * Поддерживает:
     * - одиночный ион (fallback)
     * - IonComposition (сплав ионов)
     */
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
        // 1️⃣ ЭНЕРГИЯ ИОНОВ
        // =========================
        if (cfg.getIonEnergyOverride() != null) {
            ionEnergyEv = cfg.getIonEnergyOverride();
        } else {

            if (cfg.getVoltage() == null) {
                throw new IllegalArgumentException("Voltage must be set when ionEnergyOverride is not provided");
            }

            // 👉 СПЛАВ ИОНОВ
            if (ionComp != null && !ionComp.getComponents().isEmpty()) {

                double energySum = 0.0;

                for (var ic : ionComp.getComponents()) {

                    Ion i = ic.getIon();
                    double xi = ic.getFraction();

                    if (i.getCharge() == null) {
                        throw new IllegalArgumentException("Ion charge must be set");
                    }

                    energySum += xi * (cfg.getVoltage() * i.getCharge());

                }

                ionEnergyEv = energySum;

            } else {

                if (ion.getCharge() == null) {
                    throw new IllegalArgumentException("Ion charge must be set");
                }

                ionEnergyEv = cfg.getVoltage() * ion.getCharge();
            }
        }

        // =========================
        // 2️⃣ ПОТОК ИОНОВ
        // =========================
        if (ionFluxOverride != null) {
            ionFlux = ionFluxOverride;
        } else {

            if (cfg.getCurrent() == null ||
                    cfg.getChamberWidth() == null ||
                    cfg.getChamberDepth() == null) {
                throw new IllegalArgumentException(
                        "Current, chamberWidth and chamberDepth must be set when flux is not overridden"
                );
            }

            double area = cfg.getChamberWidth() * cfg.getChamberDepth();
            double currentDensity = cfg.getCurrent() / area;

            // 👉 СПЛАВ ИОНОВ
            if (ionComp != null && !ionComp.getComponents().isEmpty()) {

                double fluxSum = 0.0;

                for (var ic : ionComp.getComponents()) {

                    Ion i = ic.getIon();
                    double xi = ic.getFraction();

                    if (i.getCharge() == null) {
                        throw new IllegalArgumentException("Ion charge must be set");
                    }

                    double ionChargeCoulombs = i.getCharge() * PhysicalConstants.E_CHARGE;

                    fluxSum += xi * (currentDensity / ionChargeCoulombs);
                }

                ionFlux = fluxSum;

            } else {

                if (ion.getCharge() == null) {
                    throw new IllegalArgumentException("Ion charge must be set");
                }

                double ionChargeCoulombs = ion.getCharge() * PhysicalConstants.E_CHARGE;

                ionFlux = currentDensity / ionChargeCoulombs;
            }
        }

        return new PlasmaResult(ionEnergyEv, ionFlux);
    }
}
