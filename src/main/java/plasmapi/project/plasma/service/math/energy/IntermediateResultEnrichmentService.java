package plasmapi.project.plasma.service.math.energy;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import plasmapi.project.plasma.dto.mathDto.simulation.SimulationIntermediateResultDto;
import plasmapi.project.plasma.model.atom.AtomList;
import plasmapi.project.plasma.model.res.PlasmaConfiguration;
import plasmapi.project.plasma.model.res.Result;
import plasmapi.project.plasma.service.math.PhysicsMath;
import plasmapi.project.plasma.service.math.PhysicsStats;
import plasmapi.project.plasma.service.math.diffusion.DiffusionIntermediate;
/**
 * Дополняет промежуточные параметры расчётом или оценкой из данных БД (атом, конфиг, результат).
 */
@Service
@RequiredArgsConstructor
public class IntermediateResultEnrichmentService {

    private static final double MIN_OBLIQUITY_SIN = 0.05;
    private static final double EV = 1.602176634e-19;

    private final EnergyDepositionService energyDepositionService;

    public SimulationIntermediateResultDto enrich(
            SimulationIntermediateResultDto base,
            PhysicsStats stats,
            AtomList atom,
            PlasmaConfiguration cfg,
            double exposureTime,
            double ambientTemp
    ) {
        if (base == null) {
            if (cfg != null && atom != null && exposureTime > 0) {
                double ionFlux = pickPositive(0, stats != null ? stats.ionFlux() : 0);
                if (ionFlux > 0) {
                    return applyThermalAndMaterialFallbacks(
                            computeEnergyIntermediate(cfg, atom, ionFlux, exposureTime, ambientTemp, null, stats),
                            stats, atom, cfg, exposureTime, ambientTemp
                    );
                }
            }
            return null;
        }

        SimulationIntermediateResultDto computed = base;
        if (needsEnergyDeposition(base) && cfg != null && atom != null && exposureTime > 0) {
            double ionFlux = pickPositive(
                    base.ionFlux(),
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
            return null;
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
        SimulationIntermediateResultDto merged = merge(fromClient, fromSimulation);
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
                stats.magneticFieldMagnitude(),
                stats.lorentzGyroradius(),
                stats.lorentzMeanDeflectionDeg(),
                stats.diffusionTransport(),
                stats.thermalTimes(),
                stats.thermalDepths(),
                stats.thermalTemperatureMap()
        );
    }

    /**
     * Берёт значение из base, иначе из снимка диффузии в stats, иначе осмысленный минимум (не «фиктивный ноль»).
     */
    private static double pickTransport(
            SimulationIntermediateResultDto base,
            PhysicsStats stats,
            java.util.function.ToDoubleFunction<SimulationIntermediateResultDto> baseField,
            java.util.function.ToDoubleFunction<DiffusionIntermediate> diffField,
            double fallback
    ) {
        if (base != null) {
            double v = baseField.applyAsDouble(base);
            if (v > 0 && !Double.isNaN(v)) {
                return v;
            }
        }
        if (stats != null && stats.diffusionTransport() != null) {
            double v = diffField.applyAsDouble(stats.diffusionTransport());
            if (v > 0 && !Double.isNaN(v)) {
                return v;
            }
        }
        return fallback;
    }

    private static double pickSlr(SimulationIntermediateResultDto base, PhysicsStats stats) {
        if (base != null && base.slrFactor() > 0 && !Double.isNaN(base.slrFactor())) {
            return base.slrFactor();
        }
        if (stats != null && stats.diffusionTransport() != null) {
            double v = stats.diffusionTransport().slrFactor();
            if (v > 0 && !Double.isNaN(v)) {
                return v;
            }
        }
        return 1.0;
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

        double ionEnergyResolved = base != null && base.ionEnergyEv() > 0
                ? base.ionEnergyEv()
                : Math.max(
                        nz(cfg.getIonEnergyOverride(), 0.0),
                        Math.max(nz(cfg.getVoltage(), 0.0) * 1e-6, 1e-6)
                );

        return new SimulationIntermediateResultDto(
                ionEnergyResolved,
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
                pickTransport(base, stats, SimulationIntermediateResultDto::dRadiation, DiffusionIntermediate::dRadiation, 1e-40),
                pickTransport(base, stats, SimulationIntermediateResultDto::dCollision, DiffusionIntermediate::dCollision, 1e-40),
                pickSlr(base, stats),
                pickTransport(base, stats, SimulationIntermediateResultDto::damageRate, DiffusionIntermediate::damageRate, 1e-40),
                pickTransport(base, stats, SimulationIntermediateResultDto::projectedRange, DiffusionIntermediate::projectedRange, 1e-10),
                pickTransport(base, stats, SimulationIntermediateResultDto::straggleSigma, DiffusionIntermediate::straggleSigma, 1e-10),
                pickTransport(base, stats, SimulationIntermediateResultDto::latticeStiffness, DiffusionIntermediate::latticeStiffness, 1e9),
                pickTransport(base, stats, SimulationIntermediateResultDto::equilibriumDistance, DiffusionIntermediate::equilibriumDistance, 1e-10)
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
        if (dto == null) {
            return null;
        }
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
            double alpha = 1e-7;
            if (cfg.getDensity() != null && cfg.getHeatCapacity() != null
                    && cfg.getThermalConductivity() != null && cfg.getDensity() > 0 && cfg.getHeatCapacity() > 0) {
                alpha = cfg.getThermalConductivity() / (cfg.getDensity() * cfg.getHeatCapacity());
            }
            double depth = Math.sqrt(Math.max(alpha * exposureTime, 1e-12));
            double speed = depth / Math.max(exposureTime, 1e-6);
            return new double[]{speed, depth};
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
        copy.setSurfaceBindingEnergy(cfg.getSurfaceBindingEnergy());

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
            cfg.setSurfaceBindingEnergy(stored.getSurfaceBindingEnergy());
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
        PlasmaConfiguration cfg = resolvePlasmaConfiguration(r);
        double teEv = nz(r.getElectronTemperature(), nz(cfg.getElectronTemperature(), 5.0));
        if (teEv <= 0) {
            teEv = 5.0;
        }
        double electronVelocity = nz(r.getElectronVelocity(), electronThermalVelocityMps(teEv));
        double surfaceBinding = cfg.getSurfaceBindingEnergy() != null && cfg.getSurfaceBindingEnergy() > 0
                ? cfg.getSurfaceBindingEnergy()
                : 3.0;
        return new PhysicsStats(
                nz(r.getElectronDensity()),
                electronVelocity,
                nz(r.getCurrentDensity()),
                surfaceBinding,
                nz(r.getTotalTransferredEnergy()), nz(r.getAvgTransferredPerAtom()),
                nz(r.getTotalDamage()), nz(r.getTotalMomentum()), nz(r.getTotalDisplacement()),
                val(r.getFinalProbeTemperature()), val(r.getDebyeFrontSpeed()), val(r.getDebyeFrontDepth()),
                nz(r.getFluence()), nz(r.getFluenceEff()), nz(r.getIonFlux()),
                val(r.getEnergyGainFactor()), val(r.getPlasmaCorrectionFactor()), val(r.getExposureRate()),
                val(r.getModifiedLayerThickness()), val(r.getSkinDepth()),
                val(r.getSkinSurfacePower()), val(r.getSkinAccumulatedEnergy()),
                val(r.getSkinTemperatureDelta()), val(r.getEffectiveSurfaceTemperature()),
                nz(r.getResonanceXi()), nz(r.getDSlr()), nz(r.getDRes()),
                0.0, 0.0, 0.0,
                diffusionTransportFromPersistedResult(r),
                null, null, null
        );
    }

    /** Как в {@code DiffusionServiceImpl}: тепловая скорость электронов по T_e (эВ). */
    private static double electronThermalVelocityMps(double teEv) {
        double me = 9.109e-31;
        return Math.sqrt(8.0 * EV * teEv / (Math.PI * me));
    }

    private DiffusionIntermediate diffusionTransportFromPersistedResult(Result r) {
        DiffusionIntermediate fromDb = new DiffusionIntermediate(
                val(r.getDRadiation()),
                val(r.getDCollision()),
                val(r.getSlrFactor()),
                val(r.getDamageRate()),
                val(r.getProjectedRange()),
                val(r.getStraggleSigma()),
                val(r.getLatticeStiffness()),
                val(r.getEquilibriumDistance())
        );
        if (hasMeaningfulTransport(fromDb)) {
            return new DiffusionIntermediate(
                    Math.max(fromDb.dRadiation(), 1e-40),
                    Math.max(fromDb.dCollision(), 1e-40),
                    fromDb.slrFactor() > 0 ? fromDb.slrFactor() : 1.0,
                    Math.max(fromDb.damageRate(), 1e-40),
                    Math.max(fromDb.projectedRange(), 1e-10),
                    Math.max(fromDb.straggleSigma(), 1e-10),
                    Math.max(fromDb.latticeStiffness(), 1e3),
                    Math.max(fromDb.equilibriumDistance(), 1e-10)
            );
        }
        return estimateTransportFromPersistedResult(r);
    }

    private static boolean hasMeaningfulTransport(DiffusionIntermediate d) {
        return d.projectedRange() > 1e-11 && d.dCollision() > 1e-41;
    }

    private DiffusionIntermediate estimateTransportFromPersistedResult(Result r) {
        if (r.getAtom() == null || r.getIon() == null) {
            return new DiffusionIntermediate(1e-40, 1e-40, 1.0, 1e-40, 1e-10, 1e-10, 1e9, 1e-10);
        }
        double Eev = Math.max(nz(r.getIonEnergy(), 1.0), 1e-6);
        double Rp = estimateProjectedRange(r.getIon(), r.getAtom(), Eev);
        double sigma = Math.max(0.3 * Rp, 1e-10);
        double dThermal = Math.max(nz(r.getDThermal(), 0.0), 1e-40);
        double dEff = Math.max(nz(r.getConcentration(), dThermal), dThermal + 1e-40);
        double dRad = Math.max(dEff - dThermal, 1e-40);
        double dCol = Math.max(dThermal, 1e-40);
        double flu = Math.max(nz(r.getFluence(), 0.0), 1e-20);
        double ionFlux = Math.max(nz(r.getIonFlux(), 0.0), 1e-20);
        double nd = nz(r.getTotalDamage(), 0.0) / flu;
        double dmgRate = Math.max(nd * ionFlux, 1e-40);
        double slr = nz(r.getSlrFactor(), 0.0);
        if (slr <= 0 && r.getDSlr() != null && dCol > 0) {
            slr = 1.0 + r.getDSlr() / dCol;
        }
        if (slr <= 0) {
            slr = 1.0;
        }
        double stiff = Math.max(nz(r.getLatticeStiffness(), 0.0), 1e3);
        double re = nz(r.getEquilibriumDistance(), 0.0);
        if (re <= 0 && r.getAtom().getA() != null) {
            re = r.getAtom().getA() * 1e-10;
        }
        re = Math.max(re, 1e-10);
        return new DiffusionIntermediate(dRad, dCol, slr, dmgRate, Rp, sigma, stiff, re);
    }

    private static double estimateProjectedRange(plasmapi.project.plasma.model.res.Ion ion, AtomList atom, double E_ev) {
        int Z1 = Math.max(1, ion.getCharge() != null ? ion.getCharge() : 1);
        int Z2 = Math.max(1, atom.getValence() != null ? atom.getValence() : 1);
        double M1 = Math.max(ion.getMass() != null ? ion.getMass() : 1e-27, 1e-30);
        double M2 = Math.max(atom.getMass() != null ? atom.getMass() : 1e-27, 1e-30);
        double eps = 0.03255 * M2 / (Z1 * Z2 * (M1 + M2)) * E_ev;
        double g = Math.log(1 + 1.138 * eps)
                / (eps + 0.01321 * Math.pow(eps, 0.21226) + 0.19593 * Math.sqrt(eps));
        double a = 0.8853 * 0.529e-10 / (Math.pow(Z1, 0.23) + Math.pow(Z2, 0.23));
        double Rp = (M1 / (M1 + M2)) * a * g * E_ev;
        return Math.max(Rp, 1e-10);
    }

    private SimulationIntermediateResultDto merge(
            SimulationIntermediateResultDto client,
            SimulationIntermediateResultDto simulation
    ) {
        if (client == null && simulation == null) {
            return null;
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

    private static double val(Double v) {
        return PhysicsMath.finiteOrZero(v != null ? v : 0.0);
    }

    private static double nz(Double v) {
        return PhysicsMath.finiteOrZero(v != null ? v : 0.0);
    }

    private static double nz(Double v, double fallback) {
        double raw = v != null ? v : fallback;
        return PhysicsMath.finiteOrDefault(raw, fallback);
    }

    private static double pick(double primary, double fallback) {
        if (Double.isFinite(primary) && primary > 0) {
            return primary;
        }
        return PhysicsMath.finiteOrZero(fallback);
    }

    private static double pickPositive(double primary, double fallback) {
        if (Double.isFinite(primary) && primary > 0) {
            return primary;
        }
        if (Double.isFinite(fallback) && fallback > 0) {
            return fallback;
        }
        return 0.0;
    }
}
