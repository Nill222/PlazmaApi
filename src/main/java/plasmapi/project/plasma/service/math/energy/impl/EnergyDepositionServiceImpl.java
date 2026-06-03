package plasmapi.project.plasma.service.math.energy.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.model.atom.AtomList;
import plasmapi.project.plasma.model.res.Ion;
import plasmapi.project.plasma.model.res.PlasmaConfiguration;
import plasmapi.project.plasma.service.math.PhysicsMath;
import plasmapi.project.plasma.service.math.energy.*;

import java.util.function.DoubleUnaryOperator;

/**
 * Связанный контур расчёта: (1)–(5) по методике + SKIN (6)–(12).
 */
@Service
@RequiredArgsConstructor
public class EnergyDepositionServiceImpl implements EnergyDepositionService {

    private final DischargePotentialService dischargePotentialService;
    private final EnergyGainService energyGainService;
    private final PlasmaCorrectionService plasmaCorrectionService;
    private final FluenceIntegrationService fluenceIntegrationService;
    private final ModifiedLayerThicknessService modifiedLayerThicknessService;
    private final SkinEffectService skinEffectService;

    @Value("${energy-deposition.default-gap-length-m:0.1}")
    private double defaultGapLength;

    @Value("${energy-deposition.default-path-length-m:0.1}")
    private double defaultPathLength;

    @Value("${energy-deposition.skin.default-conductivity:1.0e7}")
    private double defaultConductivity;

    @Value("${energy-deposition.skin.relative-permeability:1.0}")
    private double relativePermeability;

    @Value("${energy-deposition.layer.implantation-efficiency:0.35}")
    private double implantationEfficiency;

    @Value("${energy-deposition.layer.reference-penetration-gain:100.0}")
    private double referencePenetrationGain;

    @Override
    public EnergyDepositionResult compute(
            PlasmaConfiguration cfg,
            AtomList targetMaterial,
            Ion ion,
            double ionFlux,
            double ionEnergyEv,
            double exposureTime,
            double localSurfaceTemperature,
            DoubleUnaryOperator timeModulationAt
    ) {
        double voltage = nz(cfg.getVoltage(), 0.0);
        double gapLength = resolveGapLength(cfg);
        double pathLength = resolvePathLength(cfg);

        double vDis = dischargePotentialService.cathodeFallVoltage(voltage);
        double phiSurface = dischargePotentialService.potentialAt(pathLength, gapLength, voltage);
        double eAccel = dischargePotentialService.acceleratingField(pathLength, gapLength, voltage);

        double energyGain = energyGainService.computeGain(pathLength, vDis);
        double plasmaCorrection = plasmaCorrectionService.computeFactor(cfg);
        double kPron = penetrationCoefficient(energyGain);

        double incidenceAngle = Math.toRadians(nz(cfg.getIonIncidenceAngle(), 0.0));

        FluenceFormulaInput fluenceInput = new FluenceFormulaInput(
                cfg,
                vDis,
                ionEnergyEv,
                ionFlux,
                incidenceAngle,
                0.0,
                exposureTime,
                timeModulationAt,
                implantationEfficiency
        );
        double fluence = fluenceIntegrationService.integrateDocumentFormula(fluenceInput);

        double conductivity = estimateConductivity(targetMaterial);
        SkinEffectService.SkinEffectResult skin = skinEffectService.compute(
                eAccel,
                incidenceAngle,
                exposureTime,
                conductivity,
                relativePermeability,
                timeModulationAt
        );

        double tEff = skinEffectService.effectiveTemperature(
                localSurfaceTemperature,
                skin.temperatureDelta()
        );

        LayerThicknessInput layerInput = new LayerThicknessInput(
                fluence,
                kPron,
                incidenceAngle,
                tEff,
                nz(cfg.getPressure()),
                nz(cfg.getElectronTemperature()),
                nz(cfg.getCurrent()),
                voltage
        );
        double thickness = modifiedLayerThicknessService.computeThickness(layerInput);

        double exposureRate = exposureTime > 0 ? fluence / exposureTime : 0.0;

        return new EnergyDepositionResult(
                PhysicsMath.finiteOrZero(phiSurface),
                PhysicsMath.finiteOrZero(eAccel),
                PhysicsMath.finiteOrZero(energyGain),
                PhysicsMath.finiteOrZero(plasmaCorrection),
                PhysicsMath.sanitizeExposureRate(exposureRate),
                PhysicsMath.sanitizeFluence(fluence),
                PhysicsMath.sanitizeLayerThickness(thickness),
                skin.skinDepth(),
                skin.surfacePowerDensity(),
                skin.accumulatedEnergy(),
                skin.temperatureDelta(),
                tEff
        );
    }

    private double penetrationCoefficient(double energyGain) {
        double ref = Math.max(referencePenetrationGain, 1e-6);
        return implantationEfficiency * Math.max(energyGain, 0.0) / ref;
    }

    private double resolveGapLength(PlasmaConfiguration cfg) {
        if (cfg.getElectrodeDistance() != null && cfg.getElectrodeDistance() > 0) {
            return cfg.getElectrodeDistance();
        }
        if (cfg.getChamberDepth() != null && cfg.getChamberDepth() > 0) {
            return cfg.getChamberDepth();
        }
        return defaultGapLength;
    }

    private double resolvePathLength(PlasmaConfiguration cfg) {
        if (cfg.getElectrodeDistance() != null && cfg.getElectrodeDistance() > 0) {
            return cfg.getElectrodeDistance();
        }
        return defaultPathLength;
    }

    private double estimateConductivity(AtomList atom) {
        if (atom == null || atom.getDsteny() == null || atom.getMolarMass() == null) {
            return defaultConductivity;
        }
        double ne = atom.getDsteny() * 6.022e23 / atom.getMolarMass();
        double muE = 5e-3;
        return Math.max(ne * 1.602e-19 * muE, defaultConductivity * 0.01);
    }

    private static double nz(Double v) {
        return v != null && Double.isFinite(v) ? v : 0.0;
    }

    private static double nz(Double v, double fallback) {
        return v != null ? v : fallback;
    }
}
