package plasmapi.project.plasma.service.math.energy.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.model.atom.AtomList;
import plasmapi.project.plasma.model.res.PlasmaConfiguration;
import plasmapi.project.plasma.service.math.energy.*;

import java.util.function.DoubleUnaryOperator;

/**
 * Связанный контур расчёта по блок-схеме: (1)–(5) + SKIN (6)–(12).
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

    @Override
    public EnergyDepositionResult compute(
            PlasmaConfiguration cfg,
            AtomList targetMaterial,
            double ionFlux,
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

        double baseExposureRate = ionFlux * energyGain * plasmaCorrection;
        DoubleUnaryOperator rateAtTime = buildExposureRateAtTime(baseExposureRate, timeModulationAt);

        double fluence = fluenceIntegrationService.integrate(exposureTime, rateAtTime);

        double incidenceAngle = Math.toRadians(nz(cfg.getIonIncidenceAngle(), 0.0));
        double conductivity = estimateConductivity(targetMaterial);

        SkinEffectService.SkinEffectResult skin = skinEffectService.compute(
                eAccel,
                incidenceAngle,
                exposureTime,
                conductivity,
                relativePermeability,
                timeModulationAt
        );

        double referenceTemp = nz(cfg.getTargetTemperature(), localSurfaceTemperature);
        double tEff = skinEffectService.effectiveTemperature(
                localSurfaceTemperature,
                skin.temperatureDelta()
        );

        double thickness = modifiedLayerThicknessService.computeThickness(
                fluence,
                incidenceAngle,
                tEff,
                referenceTemp
        );

        return new EnergyDepositionResult(
                phiSurface,
                eAccel,
                energyGain,
                plasmaCorrection,
                baseExposureRate,
                fluence,
                thickness,
                skin.skinDepth(),
                skin.surfacePowerDensity(),
                skin.accumulatedEnergy(),
                skin.temperatureDelta(),
                tEff
        );
    }

    private DoubleUnaryOperator buildExposureRateAtTime(
            double baseRate,
            DoubleUnaryOperator timeModulationAt
    ) {
        if (timeModulationAt == null) {
            return t -> baseRate;
        }
        return t -> {
            double g = timeModulationAt.applyAsDouble(t);
            return baseRate * Math.max(g, 0.0);
        };
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
        // грубая оценка σ для металлов: σ ≈ ne·e·μ, ne ~ ρ·NA/M
        double ne = atom.getDsteny() * 6.022e23 / atom.getMolarMass();
        double muE = 5e-3; // м²/(В·с) — порядок подвижности в проводнике
        return Math.max(ne * 1.602e-19 * muE, defaultConductivity * 0.01);
    }

    private static double nz(Double v, double fallback) {
        return v != null ? v : fallback;
    }
}
