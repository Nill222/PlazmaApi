package plasmapi.project.plasma.service.math.energy;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.dto.mathDto.simulation.SimulationIntermediateResultDto;
import plasmapi.project.plasma.model.atom.AtomList;
import plasmapi.project.plasma.model.res.PlasmaConfiguration;
import plasmapi.project.plasma.model.res.Result;
import plasmapi.project.plasma.service.math.PhysicsStats;
/**
 * Дополняет промежуточные параметры расчётом или оценкой из данных БД (атом, конфиг, результат).
 */
@Service
@RequiredArgsConstructor
public class IntermediateResultEnrichmentService {

    private static final double MIN_OBLIQUITY_SIN = 0.05;

    private final EnergyDepositionService energyDepositionService;

    public SimulationIntermediateResultDto enrich(
            SimulationIntermediateResultDto base,
            PhysicsStats stats,
            AtomList atom,
            PlasmaConfiguration cfg,
            double exposureTime,
            double ambientTemp
    ) {
        SimulationIntermediateResultDto computed = base;
        if (needsEnergyDeposition(base) && cfg != null && atom != null && exposureTime > 0) {
            double ionFlux = pickPositive(
                    base != null ? base.ionFlux() : 0,
                    stats != null ? stats.ionFlux() : 0
            );
            if (ionFlux > 0) {
                computed = computeEnergyIntermediate(cfg, atom, ionFlux, exposureTime, ambientTemp, base, stats);
            }
        }

        return applyThermalAndMaterialFallbacks(computed, stats, atom, cfg, exposureTime, ambientTemp);
    }

    public SimulationIntermediateResultDto enrichFromResult(Result r) {
        if (r == null || r.getAtom() == null) {
            return emptyIntermediate();
        }

        PlasmaConfiguration cfg = resolvePlasmaConfiguration(r);
        double exposureTime = nz(cfg.getExposureTime(), 60.0);
        double ambient = nz(r.getMinT(), nz(cfg.getTargetTemperature(), 300.0));

        SimulationIntermediateResultDto base = fromResultEntity(r);
        PhysicsStats stats = physicsStatsFromResult(r);

        return enrich(base, stats, r.getAtom(), cfg, exposureTime, ambient);
    }

    public SimulationIntermediateResultDto enrichForSave(
            SimulationIntermediateResultDto fromClient,
            SimulationIntermediateResultDto fromSimulation,
            PhysicsStats stats,
            AtomList atom,
            PlasmaConfiguration cfg,
            double exposureTime,
            double ambientTemp
    ) {
        SimulationIntermediateResultDto merged = merge(fromClient, fromSimulation, stats);
        return enrich(merged, stats, atom, cfg, exposureTime, ambientTemp);
    }

    public PhysicsStats mergeStats(PhysicsStats stats, SimulationIntermediateResultDto intermediate) {
        if (stats == null || intermediate == null) {
            return stats;
        }
        return new PhysicsStats(
                stats.electronDensity(),
                stats.electronVelocity(),
                stats.currentDensity(),
                stats.surfaceBindingEnergy(),
                stats.totalTransferredEnergy(),
                stats.avgTransferredPerAtom(),
                stats.totalDamage(),
                stats.totalMomentum(),
                stats.totalDisplacement(),
                pick(intermediate.finalProbeTemperature(), stats.finalProbeTemperature()),
                pick(intermediate.debyeFrontSpeed(), stats.debyeFrontSpeed()),
                pick(intermediate.debyeFrontDepth(), stats.debyeFrontDepth()),
                stats.fluence(),
                stats.fluenceEff(),
                pick(intermediate.ionFlux(), stats.ionFlux()),
                pick(intermediate.energyGainFactor(), stats.energyGainFactor()),
                pick(intermediate.plasmaCorrectionFactor(), stats.plasmaCorrectionFactor()),
                pick(intermediate.exposureRate(), stats.exposureRate()),
                pick(intermediate.modifiedLayerThickness(), stats.modifiedLayerThickness()),
                pick(intermediate.skinDepth(), stats.skinDepth()),
                pick(intermediate.skinSurfacePower(), stats.skinSurfacePower()),
                pick(intermediate.skinAccumulatedEnergy(), stats.skinAccumulatedEnergy()),
                pick(intermediate.skinTemperatureDelta(), stats.skinTemperatureDelta()),
                pick(intermediate.effectiveSurfaceTemperature(), stats.effectiveSurfaceTemperature()),
                stats.resonanceXi(),
                stats.dSlr(),
                stats.dRes(),
                stats.thermalTimes(),
                stats.thermalDepths(),
                stats.thermalTemperatureMap()
        );
    }

    private SimulationIntermediateResultDto computeEnergyIntermediate(
            PlasmaConfiguration cfg,
            AtomList atom,
            double ionFlux,
            double exposureTime,
            double ambientTemp,
            SimulationIntermediateResultDto base,
            PhysicsStats stats
    ) {
        PlasmaConfiguration cfgForSkin = copyWithMinimumObliquity(cfg);
        EnergyDepositionResult e = energyDepositionService.compute(
                cfgForSkin,
                atom,
                ionFlux,
                exposureTime,
                ambientTemp,
                t -> 1.0
        );

        double ionEnergy = base != null && base.ionEnergyEv() > 0
                ? base.ionEnergyEv()
                : (stats != null && stats.ionFlux() > 0 ? nz(cfg.getIonEnergyOverride(), nz(cfg.getVoltage(), 0.0)) : 0.0);

        return new SimulationIntermediateResultDto(
                ionEnergy > 0 ? ionEnergy : (base != null ? base.ionEnergyEv() : 0),
                ionFlux,
                pick(e.potentialAtSurface(), base != null ? base.potentialAtSurface() : 0),
                pick(e.acceleratingField(), base != null ? base.acceleratingField() : 0),
                pick(e.energyGainFactor(), base != null ? base.energyGainFactor() : 0),
                pick(e.plasmaCorrectionFactor(), base != null ? base.plasmaCorrectionFactor() : 0),
                pick(e.exposureRate(), base != null ? base.exposureRate() : 0),
                pick(e.fluence(), base != null ? base.integratedFluence() : (stats != null ? stats.fluence() : 0)),
                pick(e.modifiedLayerThickness(), base != null ? base.modifiedLayerThickness() : 0),
                pick(e.skinDepth(), base != null ? base.skinDepth() : 0),
                pick(e.skinSurfacePower(), base != null ? base.skinSurfacePower() : 0),
                pick(e.skinAccumulatedEnergy(), base != null ? base.skinAccumulatedEnergy() : 0),
                pick(e.skinTemperatureDelta(), base != null ? base.skinTemperatureDelta() : 0),
                pick(e.effectiveSurfaceTemperature(), base != null ? base.effectiveSurfaceTemperature() : ambientTemp),
                base != null ? base.finalProbeTemperature() : (stats != null ? stats.finalProbeTemperature() : ambientTemp),
                base != null ? base.debyeFrontSpeed() : (stats != null ? stats.debyeFrontSpeed() : 0),
                base != null ? base.debyeFrontDepth() : (stats != null ? stats.debyeFrontDepth() : 0),
                base != null ? base.thermalMinTemperature() : (stats != null ? stats.finalProbeTemperature() : ambientTemp),
                base != null ? base.thermalMaxTemperature() : (stats != null ? stats.finalProbeTemperature() : ambientTemp),
                base != null ? base.thermalAvgTemperature() : (stats != null ? stats.finalProbeTemperature() : ambientTemp),
                base != null ? base.dRadiation() : 0,
                base != null ? base.dCollision() : 0,
                base != null ? base.slrFactor() : (stats != null ? stats.dSlr() : 0),
                base != null ? base.damageRate() : 0,
                base != null ? base.projectedRange() : 0,
                base != null ? base.straggleSigma() : 0,
                base != null ? base.latticeStiffness() : 0,
                base != null ? base.equilibriumDistance() : 0
        );
    }

    private SimulationIntermediateResultDto applyThermalAndMaterialFallbacks(
            SimulationIntermediateResultDto dto,
            PhysicsStats stats,
            AtomList atom,
            PlasmaConfiguration cfg,
            double exposureTime,
            double ambientTemp
    ) {
        double skinDepth = pick(dto.skinDepth(), estimateSkinDepthFromAtom(atom));
        double deltaT = dto.skinTemperatureDelta();
        if (deltaT <= 0 && dto.skinAccumulatedEnergy() > 0) {
            deltaT = dto.skinAccumulatedEnergy() / 4.0e6;
        }
        double tEff = dto.effectiveSurfaceTemperature();
        if (tEff <= ambientTemp) {
            tEff = ambientTemp + Math.max(deltaT, 0);
        }

        double debyeSpeed = dto.debyeFrontSpeed();
        double debyeDepth = dto.debyeFrontDepth();
        if (debyeSpeed <= 0 && atom != null && cfg != null && exposureTime > 0) {
            double[] estimate = estimateDebyeFront(atom, cfg, exposureTime, dto.finalProbeTemperature(), ambientTemp);
            debyeSpeed = estimate[0];
            debyeDepth = Math.max(debyeDepth, estimate[1]);
        }

        double exposureRate = dto.exposureRate();
        if (exposureRate <= 0 && dto.integratedFluence() > 0 && exposureTime > 0) {
            exposureRate = dto.integratedFluence() / exposureTime;
        }

        double layerThickness = dto.modifiedLayerThickness();
        if (layerThickness <= 0 && dto.integratedFluence() > 0) {
            layerThickness = 5.0e-12 * dto.integratedFluence() * 0.35;
        }

        double mp = dto.plasmaCorrectionFactor();
        if (mp <= 0) {
            mp = 1.0;
        }

        return new SimulationIntermediateResultDto(
                dto.ionEnergyEv(),
                pickPositive(dto.ionFlux(), stats != null ? stats.ionFlux() : 0),
                dto.potentialAtSurface(),
                dto.acceleratingField(),
                dto.energyGainFactor(),
                mp,
                exposureRate,
                pick(dto.integratedFluence(), stats != null ? stats.fluence() : 0),
                layerThickness,
                skinDepth,
                dto.skinSurfacePower(),
                dto.skinAccumulatedEnergy(),
                deltaT,
                tEff,
                pick(dto.finalProbeTemperature(), stats != null ? stats.finalProbeTemperature() : ambientTemp),
                debyeSpeed,
                debyeDepth,
                dto.thermalMinTemperature(),
                dto.thermalMaxTemperature(),
                dto.thermalAvgTemperature(),
                dto.dRadiation(),
                dto.dCollision(),
                dto.slrFactor(),
                dto.damageRate(),
                dto.projectedRange(),
                dto.straggleSigma(),
                dto.latticeStiffness(),
                dto.equilibriumDistance()
        );
    }

    private double estimateSkinDepthFromAtom(AtomList atom) {
        if (atom == null) {
            return 0;
        }
        double sigma = 1.0e7;
        if (atom.getDsteny() != null && atom.getMolarMass() != null && atom.getMolarMass() > 0) {
            double ne = atom.getDsteny() * 6.022e23 / atom.getMolarMass();
            sigma = Math.max(ne * 1.602e-19 * 5e-3, 1.0e5);
        }
        if (atom.getThermalConductivity() != null && atom.getThermalConductivity() > 0) {
            sigma = Math.max(sigma, atom.getThermalConductivity() * 1.0e5);
        }
        double mu = 4.0 * Math.PI * 1e-7;
        double omega = 2.0e6;
        return Math.sqrt(2.0 / (omega * mu * sigma));
    }

    private double[] estimateDebyeFront(
            AtomList atom,
            PlasmaConfiguration cfg,
            double exposureTime,
            double finalProbeTemp,
            double ambientTemp
    ) {
        Double td = atom.getDebyeTemperature();
        if (td == null || td <= 0 || cfg.getDensity() == null || cfg.getHeatCapacity() == null
                || cfg.getThermalConductivity() == null) {
            return new double[]{0, 0};
        }

        double alpha = cfg.getThermalConductivity() / (cfg.getDensity() * cfg.getHeatCapacity());
        double depth = Math.sqrt(Math.max(alpha * exposureTime, 0));
        if (finalProbeTemp >= td * 0.95) {
            return new double[]{depth / exposureTime, depth};
        }
        double heatingFactor = Math.max((finalProbeTemp - ambientTemp) / Math.max(td - ambientTemp, 1.0), 0.01);
        depth *= Math.sqrt(heatingFactor);
        return new double[]{depth / exposureTime, depth};
    }

    private PlasmaConfiguration copyWithMinimumObliquity(PlasmaConfiguration cfg) {
        PlasmaConfiguration copy = new PlasmaConfiguration();
        copy.setVoltage(cfg.getVoltage());
        copy.setCurrent(cfg.getCurrent());
        copy.setPressure(cfg.getPressure());
        copy.setElectronTemperature(cfg.getElectronTemperature());
        copy.setExposureTime(cfg.getExposureTime());
        copy.setChamberWidth(cfg.getChamberWidth());
        copy.setChamberDepth(cfg.getChamberDepth());
        copy.setElectrodeDistance(cfg.getElectrodeDistance());
        copy.setTargetTemperature(cfg.getTargetTemperature());
        copy.setDensity(cfg.getDensity());
        copy.setHeatCapacity(cfg.getHeatCapacity());
        copy.setThermalConductivity(cfg.getThermalConductivity());
        copy.setIonEnergyOverride(cfg.getIonEnergyOverride());

        double angleDeg = nz(cfg.getIonIncidenceAngle(), 0.0);
        double sin = Math.abs(Math.sin(Math.toRadians(angleDeg)));
        if (sin < MIN_OBLIQUITY_SIN) {
            copy.setIonIncidenceAngle(Math.toDegrees(Math.asin(MIN_OBLIQUITY_SIN)));
        } else {
            copy.setIonIncidenceAngle(angleDeg);
        }
        return copy;
    }

    private PlasmaConfiguration resolvePlasmaConfiguration(Result r) {
        PlasmaConfiguration cfg = new PlasmaConfiguration();
        if (r.getConfig() != null && r.getConfig().getConfig() != null) {
            PlasmaConfiguration stored = r.getConfig().getConfig();
            cfg.setVoltage(stored.getVoltage());
            cfg.setCurrent(stored.getCurrent());
            cfg.setPressure(stored.getPressure());
            cfg.setElectronTemperature(stored.getElectronTemperature());
            cfg.setExposureTime(stored.getExposureTime());
            cfg.setChamberWidth(stored.getChamberWidth());
            cfg.setChamberDepth(stored.getChamberDepth());
            cfg.setElectrodeDistance(stored.getElectrodeDistance());
            cfg.setIonIncidenceAngle(stored.getIonIncidenceAngle());
            cfg.setTargetTemperature(stored.getTargetTemperature());
            cfg.setDensity(stored.getDensity());
            cfg.setHeatCapacity(stored.getHeatCapacity());
            cfg.setThermalConductivity(stored.getThermalConductivity());
        }

        if (cfg.getVoltage() == null) cfg.setVoltage(r.getVoltage());
        if (cfg.getPressure() == null) cfg.setPressure(r.getPressure());
        if (cfg.getElectronTemperature() == null) cfg.setElectronTemperature(r.getElectronTemperature());
        if (cfg.getIonEnergyOverride() == null) cfg.setIonEnergyOverride(r.getIonEnergy());

        AtomList atom = r.getAtom();
        if (atom != null) {
            if (cfg.getDensity() == null) cfg.setDensity(atom.getDsteny());
            if (cfg.getHeatCapacity() == null) cfg.setHeatCapacity(atom.getHeatCapacity());
            if (cfg.getThermalConductivity() == null) cfg.setThermalConductivity(atom.getThermalConductivity());
        }

        if (cfg.getExposureTime() == null || cfg.getExposureTime() <= 0) {
            cfg.setExposureTime(60.0);
        }
        if (cfg.getTargetTemperature() == null) {
            cfg.setTargetTemperature(r.getAvgT());
        }
        if (cfg.getChamberWidth() == null) cfg.setChamberWidth(0.2);
        if (cfg.getChamberDepth() == null) cfg.setChamberDepth(0.2);

        if (cfg.getCurrent() == null && r.getCurrentDensity() != null
                && cfg.getChamberWidth() != null && cfg.getChamberDepth() != null) {
            cfg.setCurrent(r.getCurrentDensity() * cfg.getChamberWidth() * cfg.getChamberDepth());
        }

        return cfg;
    }

    private SimulationIntermediateResultDto fromResultEntity(Result r) {
        return new SimulationIntermediateResultDto(
                nz(r.getIonEnergy()),
                nz(r.getIonFlux()),
                val(r.getPotentialAtSurface()),
                val(r.getAcceleratingField()),
                val(r.getEnergyGainFactor()),
                val(r.getPlasmaCorrectionFactor()),
                val(r.getExposureRate()),
                nz(r.getFluence()),
                val(r.getModifiedLayerThickness()),
                val(r.getSkinDepth()),
                val(r.getSkinSurfacePower()),
                val(r.getSkinAccumulatedEnergy()),
                val(r.getSkinTemperatureDelta()),
                val(r.getEffectiveSurfaceTemperature()),
                val(r.getFinalProbeTemperature()),
                val(r.getDebyeFrontSpeed()),
                val(r.getDebyeFrontDepth()),
                nz(r.getMinT()),
                nz(r.getMaxT()),
                nz(r.getAvgT()),
                val(r.getDRadiation()),
                val(r.getDCollision()),
                val(r.getSlrFactor()),
                val(r.getDamageRate()),
                val(r.getProjectedRange()),
                val(r.getStraggleSigma()),
                val(r.getLatticeStiffness()),
                val(r.getEquilibriumDistance())
        );
    }

    private PhysicsStats physicsStatsFromResult(Result r) {
        return new PhysicsStats(
                nz(r.getElectronDensity()), 0, nz(r.getCurrentDensity()), 0,
                nz(r.getTotalTransferredEnergy()), nz(r.getAvgTransferredPerAtom()),
                nz(r.getTotalDamage()), nz(r.getTotalMomentum()), nz(r.getTotalDisplacement()),
                val(r.getFinalProbeTemperature()), val(r.getDebyeFrontSpeed()), val(r.getDebyeFrontDepth()),
                nz(r.getFluence()), nz(r.getFluenceEff()), nz(r.getIonFlux()),
                val(r.getEnergyGainFactor()), val(r.getPlasmaCorrectionFactor()), val(r.getExposureRate()),
                val(r.getModifiedLayerThickness()), val(r.getSkinDepth()),
                val(r.getSkinSurfacePower()), val(r.getSkinAccumulatedEnergy()),
                val(r.getSkinTemperatureDelta()), val(r.getEffectiveSurfaceTemperature()),
                nz(r.getResonanceXi()), nz(r.getDSlr()), nz(r.getDRes()),
                null, null, null
        );
    }

    private SimulationIntermediateResultDto merge(
            SimulationIntermediateResultDto client,
            SimulationIntermediateResultDto simulation,
            PhysicsStats stats
    ) {
        if (client == null && simulation == null) {
            return emptyIntermediate();
        }
        if (client == null) return simulation;
        if (simulation == null) return client;

        return new SimulationIntermediateResultDto(
                pick(client.ionEnergyEv(), simulation.ionEnergyEv()),
                pickPositive(client.ionFlux(), simulation.ionFlux()),
                pick(client.potentialAtSurface(), simulation.potentialAtSurface()),
                pick(client.acceleratingField(), simulation.acceleratingField()),
                pick(client.energyGainFactor(), simulation.energyGainFactor()),
                pick(client.plasmaCorrectionFactor(), simulation.plasmaCorrectionFactor()),
                pick(client.exposureRate(), simulation.exposureRate()),
                pick(client.integratedFluence(), simulation.integratedFluence()),
                pick(client.modifiedLayerThickness(), simulation.modifiedLayerThickness()),
                pick(client.skinDepth(), simulation.skinDepth()),
                pick(client.skinSurfacePower(), simulation.skinSurfacePower()),
                pick(client.skinAccumulatedEnergy(), simulation.skinAccumulatedEnergy()),
                pick(client.skinTemperatureDelta(), simulation.skinTemperatureDelta()),
                pick(client.effectiveSurfaceTemperature(), simulation.effectiveSurfaceTemperature()),
                pick(client.finalProbeTemperature(), simulation.finalProbeTemperature()),
                pick(client.debyeFrontSpeed(), simulation.debyeFrontSpeed()),
                pick(client.debyeFrontDepth(), simulation.debyeFrontDepth()),
                pick(client.thermalMinTemperature(), simulation.thermalMinTemperature()),
                pick(client.thermalMaxTemperature(), simulation.thermalMaxTemperature()),
                pick(client.thermalAvgTemperature(), simulation.thermalAvgTemperature()),
                pick(client.dRadiation(), simulation.dRadiation()),
                pick(client.dCollision(), simulation.dCollision()),
                pick(client.slrFactor(), simulation.slrFactor()),
                pick(client.damageRate(), simulation.damageRate()),
                pick(client.projectedRange(), simulation.projectedRange()),
                pick(client.straggleSigma(), simulation.straggleSigma()),
                pick(client.latticeStiffness(), simulation.latticeStiffness()),
                pick(client.equilibriumDistance(), simulation.equilibriumDistance())
        );
    }

    private boolean needsEnergyDeposition(SimulationIntermediateResultDto dto) {
        if (dto == null) return true;
        return dto.plasmaCorrectionFactor() <= 0
                || dto.skinDepth() <= 0
                || dto.exposureRate() <= 0
                || dto.modifiedLayerThickness() <= 0;
    }

    private static SimulationIntermediateResultDto emptyIntermediate() {
        return new SimulationIntermediateResultDto(
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0
        );
    }

    private static double val(Double v) {
        return v != null ? v : 0.0;
    }

    private static double nz(Double v) {
        return v != null ? v : 0.0;
    }

    private static double nz(Double v, double fallback) {
        return v != null ? v : fallback;
    }

    private static double pick(double primary, double fallback) {
        return primary > 0 ? primary : fallback;
    }

    private static double pickPositive(double primary, double fallback) {
        if (primary > 0) return primary;
        return fallback > 0 ? fallback : 0;
    }
}
