package plasmapi.project.plasma.mapper.result;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import plasmapi.project.plasma.controller.handler.exception.NotFoundException;
import plasmapi.project.plasma.dto.logikDTO.result.ResultDTO;
import plasmapi.project.plasma.dto.logikDTO.atom.AtomListDTO;
import plasmapi.project.plasma.dto.logikDTO.composition.AtomCompositionItemDTO;
import plasmapi.project.plasma.dto.logikDTO.composition.IonCompositionItemDTO;
import plasmapi.project.plasma.dto.logikDTO.composition.ResultAtomComponentDTO;
import plasmapi.project.plasma.dto.logikDTO.composition.ResultIonComponentDTO;
import plasmapi.project.plasma.dto.logikDTO.config.ConfigDTO;
import plasmapi.project.plasma.dto.logikDTO.ion.IonDTO;
import plasmapi.project.plasma.dto.logikDTO.user.UserDTO;
import plasmapi.project.plasma.dto.mathDto.simulation.SimulationIntermediateResultDto;
import plasmapi.project.plasma.dto.mathDto.simulation.SimulationResultDto;
import plasmapi.project.plasma.dto.mathDto.diffusion.DiffusionProfileDto;
import plasmapi.project.plasma.dto.mathDto.plasma.PlasmaResultDto;
import plasmapi.project.plasma.model.atom.AtomList;
import plasmapi.project.plasma.model.res.PlasmaConfiguration;
import plasmapi.project.plasma.model.res.Result;
import plasmapi.project.plasma.model.res.ResultAtomComponent;
import plasmapi.project.plasma.model.res.ResultIonComponent;
import plasmapi.project.plasma.model.security.User;
import plasmapi.project.plasma.service.logik.AtomService;
import plasmapi.project.plasma.service.logik.ConfigService;
import plasmapi.project.plasma.service.logik.IonService;
import plasmapi.project.plasma.service.math.PhysicsMath;
import plasmapi.project.plasma.service.math.PhysicsStats;
import plasmapi.project.plasma.service.math.diffusion.DiffusionIntermediate;
import plasmapi.project.plasma.service.math.energy.IntermediateResultEnrichmentService;

import java.util.List;

@Component
@RequiredArgsConstructor
public class ResultMapper{

    private final ConfigService configService;
    private final IonService ionService;
    private final AtomService atomListService;
    private final IntermediateResultEnrichmentService intermediateEnrichment;

    /**
     * Маппинг DTO → Entity
     */
    public Result toEntity(SimulationResultDto dto) {

        Result r = new Result();

        // связи
        r.setConfig(configService.findById(dto.configId())
                .orElseThrow(() -> new NotFoundException("Конфиг с таким id не найден")));
        r.setIon(ionService.findById(dto.ionId())
                .orElseThrow(() -> new NotFoundException("ион с таким id не найден")));
        r.setAtom(atomListService.findById(dto.atomId())
                .orElseThrow(() -> new NotFoundException("атом с таким id не найден")));

        applyAtomComposition(r, dto.atomComposition(), dto.atomId());
        applyIonComposition(r, dto.ionComposition(), dto.ionId());

        // физические параметры
        r.setTotalTransferredEnergy(dto.totalTransferredEnergy());
        r.setAvgTransferredPerAtom(dto.avgTransferredPerAtom());
        r.setAvgT(dto.avgT());
        r.setMinT(dto.minT());
        r.setMaxT(dto.maxT());
        r.setDiffusionCoefficient1(dto.diffusionCoefficient1());
        r.setDiffusionCoefficient2(dto.diffusionCoefficient2());
        r.setVoltage(dto.plasmaParameters().voltage());
        r.setElectronTemperature(dto.plasmaParameters().electronTemp());
        r.setIonEnergy(dto.plasmaParameters().ionEnergy());
        r.setPressure(dto.plasmaParameters().pressure());
        r.setElectronDensity(dto.plasmaParameters().electronDensity());
        r.setElectronVelocity(dto.plasmaParameters().electronVelocity());
        r.setCurrentDensity(dto.plasmaParameters().currentDensity());
        r.setDepths(dto.diffusionProfile().depth());
        r.setConcentration(dto.diffusionProfile().D_effective());
        r.setDThermal(dto.diffusionProfile().D_thermal());
        r.setTotalMomentum(dto.totalMomentum());
        r.setTotalDamage(dto.totalDamage());
        r.setTotalDisplacement(dto.totalDisplacement());
        r.setFluence(dto.fluence());
        r.setFluenceEff(dto.fluenceEff());
        r.setIonFlux(dto.ionFlux());
        r.setResonanceXi(dto.resonanceXi());
        r.setDSlr(dto.dSlr());
        r.setDRes(dto.dRes());
        r.setIonIncidenceAngle(dto.angle());
        r.setElectrodeDistance(dto.electrodeDistance());

        AtomList atom = r.getAtom();
        PlasmaConfiguration plasmaCfg = r.getConfig() != null ? r.getConfig().getConfig() : null;
        if (plasmaCfg == null) {
            plasmaCfg = plasmaConfigFromDto(dto, atom);
        }
        double exposureTime = plasmaCfg.getExposureTime() != null
                ? plasmaCfg.getExposureTime()
                : 60.0;
        double ambient = dto.avgT() > 0 ? dto.avgT() : 300.0;

        PhysicsStats statsForEnrich = buildPhysicsStatsForSave(dto, atom, plasmaCfg, exposureTime);

        SimulationIntermediateResultDto intermediate = dto.intermediate();
        intermediate = intermediateEnrichment.enrichForSave(
                intermediate,
                intermediate,
                statsForEnrich,
                atom,
                plasmaCfg,
                exposureTime,
                ambient
        );
        if (intermediate != null) {
            applyIntermediate(r, intermediate);
        }

        // createdAt установится через @PrePersist
        return r;
    }

    private void applyIntermediate(Result r, SimulationIntermediateResultDto i) {
        r.setPotentialAtSurface(i.potentialAtSurface());
        r.setAcceleratingField(i.acceleratingField());
        r.setEnergyGainFactor(i.energyGainFactor());
        r.setPlasmaCorrectionFactor(i.plasmaCorrectionFactor());
        r.setExposureRate(i.exposureRate());
        r.setModifiedLayerThickness(i.modifiedLayerThickness());
        r.setSkinDepth(i.skinDepth());
        r.setSkinSurfacePower(i.skinSurfacePower());
        r.setSkinAccumulatedEnergy(i.skinAccumulatedEnergy());
        r.setSkinTemperatureDelta(i.skinTemperatureDelta());
        r.setEffectiveSurfaceTemperature(i.effectiveSurfaceTemperature());
        r.setFinalProbeTemperature(i.finalProbeTemperature());
        r.setDebyeFrontSpeed(i.debyeFrontSpeed());
        r.setDebyeFrontDepth(i.debyeFrontDepth());
        r.setDRadiation(i.dRadiation());
        r.setDCollision(i.dCollision());
        r.setSlrFactor(i.slrFactor());
        r.setDamageRate(i.damageRate());
        r.setProjectedRange(i.projectedRange());
        r.setStraggleSigma(i.straggleSigma());
        r.setLatticeStiffness(i.latticeStiffness());
        r.setEquilibriumDistance(i.equilibriumDistance());
    }

    private SimulationIntermediateResultDto readIntermediate(Result r) {
        return intermediateEnrichment.enrichFromResult(r);
    }

    private PlasmaConfiguration plasmaConfigFromDto(SimulationResultDto dto, AtomList atom) {
        PlasmaConfiguration cfg = new PlasmaConfiguration();
        if (dto.plasmaParameters() != null) {
            cfg.setVoltage(dto.plasmaParameters().voltage());
            cfg.setPressure(dto.plasmaParameters().pressure());
            cfg.setElectronTemperature(dto.plasmaParameters().electronTemp());
            cfg.setIonEnergyOverride(dto.plasmaParameters().ionEnergy());
        }
        if (atom != null) {
            cfg.setDensity(atom.getDsteny());
            cfg.setHeatCapacity(atom.getHeatCapacity());
            cfg.setThermalConductivity(atom.getThermalConductivity());
        }
        cfg.setExposureTime(60.0);
        cfg.setChamberWidth(0.2);
        cfg.setChamberDepth(0.2);
        cfg.setIonIncidenceAngle(dto.angle());
        if (dto.electrodeDistance() > 0) {
            cfg.setElectrodeDistance(dto.electrodeDistance());
        }
        return cfg;
    }

    public ResultDTO toDTO(Result r) {
        List<ResultAtomComponentDTO> atomComposition = mapAtomComponents(r);
        List<ResultIonComponentDTO> ionComposition = mapIonComponents(r);

        AtomList primaryAtom = resolvePrimaryAtom(r);
        var primaryIon = resolvePrimaryIon(r);

        return new ResultDTO(
                r.getId(),
                new ConfigDTO(r.getConfig().getId(),
                        r.getConfig().getName(),
                        r.getConfig().getDescription(),
                        r.getConfig().getCreatedAt(),
                        mapUser(r.getConfig().getUser())),
                primaryIon != null
                        ? new IonDTO(primaryIon.getId(), primaryIon.getName(), primaryIon.getMass(), primaryIon.getCharge())
                        : null,
                primaryAtom != null ? toAtomListDTO(primaryAtom) : null,
                atomComposition,
                ionComposition,

                PhysicsMath.sanitizeEnergy(nz(r.getTotalTransferredEnergy())),
                PhysicsMath.finiteOrZero(nz(r.getAvgTransferredPerAtom())),
                PhysicsMath.finiteOrZero(nz(r.getAvgT())),
                PhysicsMath.finiteOrZero(nz(r.getMinT())),
                PhysicsMath.finiteOrZero(nz(r.getMaxT())),
                PhysicsMath.finiteOrZero(nz(r.getDiffusionCoefficient1())),
                PhysicsMath.finiteOrZero(nz(r.getDiffusionCoefficient2())),
                PhysicsMath.finiteOrZero(nz(r.getVoltage())),
                PhysicsMath.finiteOrZero(nz(r.getElectronTemperature())),
                PhysicsMath.finiteOrZero(nz(r.getIonEnergy())),
                PhysicsMath.finiteOrZero(nz(r.getPressure())),
                PhysicsMath.sanitizeElectronDensity(nz(r.getElectronDensity())),
                PhysicsMath.finiteOrZero(nz(r.getElectronVelocity())),
                PhysicsMath.finiteOrZero(nz(r.getCurrentDensity())),
                PhysicsMath.sanitizeDepth(nz(r.getDepths())),
                PhysicsMath.finiteOrZero(nz(r.getConcentration())),
                PhysicsMath.finiteOrZero(nz(r.getDThermal())),
                PhysicsMath.sanitizeMomentum(nz(r.getTotalMomentum())),
                PhysicsMath.sanitizeDamage(nz(r.getTotalDamage())),
                PhysicsMath.sanitizeDisplacement(nz(r.getTotalDisplacement())),
                PhysicsMath.sanitizeFluence(nz(r.getFluence())),
                PhysicsMath.sanitizeFluence(nz(r.getFluenceEff())),
                PhysicsMath.sanitizeIonFlux(nz(r.getIonFlux())),
                PhysicsMath.finiteOrDefault(nz(r.getResonanceXi()), 1.0),
                PhysicsMath.finiteOrZero(nz(r.getDSlr())),
                PhysicsMath.finiteOrZero(nz(r.getDRes())),
                PhysicsMath.finiteOrZero(nz(r.getIonIncidenceAngle())),
                PhysicsMath.finiteOrZero(nz(r.getElectrodeDistance())),
                sanitizeIntermediate(readIntermediate(r)),
                r.getCreatedAt()
        );
    }

    private PhysicsStats buildPhysicsStatsForSave(
            SimulationResultDto dto,
            AtomList atom,
            PlasmaConfiguration cfg,
            double exposureTime
    ) {
        PlasmaResultDto p = dto.plasmaParameters();
        double ed = p != null ? p.electronDensity() : 1e10;
        double ev = p != null ? p.electronVelocity() : 1e5;
        double cd = p != null ? p.currentDensity() : 1e-3;
        SimulationIntermediateResultDto im = dto.intermediate();
        double gain = (im != null && im.energyGainFactor() > 0) ? im.energyGainFactor() : 1.0;
        double mp = (im != null && im.plasmaCorrectionFactor() > 0) ? im.plasmaCorrectionFactor() : 1.0;
        double expoRate = (im != null && im.exposureRate() > 0)
                ? im.exposureRate()
                : (dto.fluence() > 0 && exposureTime > 0 ? dto.fluence() / exposureTime : 1.0);
        double modH = (im != null && im.modifiedLayerThickness() > 0) ? im.modifiedLayerThickness() : 1e-9;
        double skinD = (im != null && im.skinDepth() > 0) ? im.skinDepth() : 1e-6;
        double pSkin = (im != null && im.skinSurfacePower() > 0) ? im.skinSurfacePower() : 1.0;
        double wSkin = (im != null && im.skinAccumulatedEnergy() > 0) ? im.skinAccumulatedEnergy() : 1.0;
        double dT = (im != null && im.skinTemperatureDelta() > 0) ? im.skinTemperatureDelta() : 1.0;
        double tEff = (im != null && im.effectiveSurfaceTemperature() > 0)
                ? im.effectiveSurfaceTemperature()
                : Math.max(dto.avgT(), 300.0) + 1.0;
        DiffusionIntermediate transport = diffusionTransportFromSaveDto(dto, atom);
        double surfaceBinding = cfg != null && cfg.getSurfaceBindingEnergy() != null && cfg.getSurfaceBindingEnergy() > 0
                ? cfg.getSurfaceBindingEnergy()
                : 3.0;
        return new PhysicsStats(
                ed,
                ev,
                cd,
                surfaceBinding,
                dto.totalTransferredEnergy(),
                dto.avgTransferredPerAtom(),
                dto.totalDamage(),
                dto.totalMomentum(),
                dto.totalDisplacement(),
                im != null && im.finalProbeTemperature() > 0 ? im.finalProbeTemperature() : dto.avgT(),
                im != null && im.debyeFrontSpeed() > 0 ? im.debyeFrontSpeed() : 0.0,
                im != null && im.debyeFrontDepth() > 0 ? im.debyeFrontDepth() : 0.0,
                dto.fluence(),
                dto.fluenceEff(),
                Math.max(dto.ionFlux(), 1e-20),
                gain,
                mp,
                expoRate,
                modH,
                skinD,
                pSkin,
                wSkin,
                dT,
                tEff,
                dto.resonanceXi(),
                dto.dSlr(),
                dto.dRes(),
                0.0,
                0.0,
                0.0,
                transport,
                null,
                null,
                null
        );
    }

    private DiffusionIntermediate diffusionTransportFromSaveDto(SimulationResultDto dto, AtomList atom) {
        DiffusionProfileDto prof = dto.diffusionProfile();
        if (prof == null || atom == null) {
            double re = (atom != null && atom.getA() != null) ? atom.getA() * 1e-10 : 1e-10;
            return new DiffusionIntermediate(1e-40, 1e-40, 1.0, 1e-40, 1e-10, 1e-10, 1e9, re);
        }
        double dTh = Math.max(prof.D_thermal(), 1e-40);
        double dEf = Math.max(prof.D_effective(), dTh);
        double dRad = Math.max(dEf - dTh, 1e-40);
        double rp = Math.max(prof.depth(), 1e-10);
        double sigma = Math.max(0.3 * rp, 1e-10);
        double flu = Math.max(dto.fluence(), 1e-20);
        double nd = dto.totalDamage() / flu;
        double dmg = Math.max(nd * Math.max(dto.ionFlux(), 1e-20), 1e-40);
        double slr = 1.0;
        if (dto.dSlr() > 0 && dTh > 0) {
            slr = 1.0 + dto.dSlr() / dTh;
        }
        double re = atom.getA() != null ? atom.getA() * 1e-10 : 1e-10;
        return new DiffusionIntermediate(dRad, dTh, slr, dmg, rp, sigma, 1e9, re);
    }

    private void applyAtomComposition(
            Result r,
            List<AtomCompositionItemDTO> items,
            Integer fallbackAtomId
    ) {
        List<AtomCompositionItemDTO> resolved = resolveCompositionItems(items, fallbackAtomId);
        for (AtomCompositionItemDTO item : resolved) {
            ResultAtomComponent component = new ResultAtomComponent();
            component.setResult(r);
            component.setAtom(atomListService.findById(item.atomId())
                    .orElseThrow(() -> new NotFoundException("атом с таким id не найден: " + item.atomId())));
            component.setFraction(item.fraction());
            r.getAtomComponents().add(component);
        }
    }

    private void applyIonComposition(
            Result r,
            List<IonCompositionItemDTO> items,
            Integer fallbackIonId
    ) {
        List<IonCompositionItemDTO> resolved = resolveIonCompositionItems(items, fallbackIonId);
        for (IonCompositionItemDTO item : resolved) {
            ResultIonComponent component = new ResultIonComponent();
            component.setResult(r);
            component.setIon(ionService.findById(item.ionId())
                    .orElseThrow(() -> new NotFoundException("ион с таким id не найден: " + item.ionId())));
            component.setFraction(item.fraction());
            r.getIonComponents().add(component);
        }
    }

    private List<AtomCompositionItemDTO> resolveCompositionItems(
            List<AtomCompositionItemDTO> items,
            Integer fallbackAtomId
    ) {
        if (items != null && !items.isEmpty()) {
            return items;
        }
        if (fallbackAtomId != null) {
            return List.of(new AtomCompositionItemDTO(fallbackAtomId, 1.0));
        }
        return List.of();
    }

    private List<IonCompositionItemDTO> resolveIonCompositionItems(
            List<IonCompositionItemDTO> items,
            Integer fallbackIonId
    ) {
        if (items != null && !items.isEmpty()) {
            return items;
        }
        if (fallbackIonId != null) {
            return List.of(new IonCompositionItemDTO(fallbackIonId, 1.0));
        }
        return List.of();
    }

    private List<ResultAtomComponentDTO> mapAtomComponents(Result r) {
        if (r.getAtomComponents() != null && !r.getAtomComponents().isEmpty()) {
            return r.getAtomComponents().stream()
                    .map(c -> new ResultAtomComponentDTO(toAtomListDTO(c.getAtom()), c.getFraction()))
                    .toList();
        }
        if (r.getAtom() != null) {
            return List.of(new ResultAtomComponentDTO(toAtomListDTO(r.getAtom()), 1.0));
        }
        return List.of();
    }

    private List<ResultIonComponentDTO> mapIonComponents(Result r) {
        if (r.getIonComponents() != null && !r.getIonComponents().isEmpty()) {
            return r.getIonComponents().stream()
                    .map(c -> new ResultIonComponentDTO(
                            new IonDTO(c.getIon().getId(), c.getIon().getName(), c.getIon().getMass(), c.getIon().getCharge()),
                            c.getFraction()
                    ))
                    .toList();
        }
        if (r.getIon() != null) {
            return List.of(new ResultIonComponentDTO(
                    new IonDTO(r.getIon().getId(), r.getIon().getName(), r.getIon().getMass(), r.getIon().getCharge()),
                    1.0
            ));
        }
        return List.of();
    }

    private AtomList resolvePrimaryAtom(Result r) {
        if (r.getAtomComponents() != null && !r.getAtomComponents().isEmpty()) {
            return r.getAtomComponents().get(0).getAtom();
        }
        return r.getAtom();
    }

    private plasmapi.project.plasma.model.res.Ion resolvePrimaryIon(Result r) {
        if (r.getIonComponents() != null && !r.getIonComponents().isEmpty()) {
            return r.getIonComponents().get(0).getIon();
        }
        return r.getIon();
    }

    private AtomListDTO toAtomListDTO(AtomList atom) {
        return new AtomListDTO(
                atom.getId(),
                atom.getAtomName(),
                atom.getFullName(),
                atom.getMass(),
                atom.getA(),
                atom.getDebyeTemperature(),
                atom.getValence(),
                atom.getStructure()
        );
    }

    private UserDTO mapUser(User user) {
        if (user == null) return null;
        return new UserDTO(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole()
        );
    }

    private static double nz(Double v) {
        return v != null ? v : 0.0;
    }

    private SimulationIntermediateResultDto sanitizeIntermediate(SimulationIntermediateResultDto dto) {
        if (dto == null) {
            return null;
        }
        return new SimulationIntermediateResultDto(
                PhysicsMath.finiteOrZero(dto.ionEnergyEv()),
                PhysicsMath.sanitizeIonFlux(dto.ionFlux()),
                PhysicsMath.finiteOrZero(dto.potentialAtSurface()),
                PhysicsMath.finiteOrZero(dto.acceleratingField()),
                PhysicsMath.finiteOrZero(dto.energyGainFactor()),
                PhysicsMath.finiteOrZero(dto.plasmaCorrectionFactor()),
                PhysicsMath.sanitizeExposureRate(dto.exposureRate()),
                PhysicsMath.sanitizeFluence(dto.integratedFluence()),
                PhysicsMath.finiteOrZero(dto.modifiedLayerThickness()),
                PhysicsMath.finiteOrZero(dto.skinDepth()),
                PhysicsMath.finiteOrZero(dto.skinSurfacePower()),
                PhysicsMath.finiteOrZero(dto.skinAccumulatedEnergy()),
                PhysicsMath.finiteOrZero(dto.skinTemperatureDelta()),
                PhysicsMath.finiteOrZero(dto.effectiveSurfaceTemperature()),
                PhysicsMath.finiteOrZero(dto.finalProbeTemperature()),
                PhysicsMath.finiteOrZero(dto.debyeFrontSpeed()),
                PhysicsMath.finiteOrZero(dto.debyeFrontDepth()),
                PhysicsMath.finiteOrZero(dto.thermalMinTemperature()),
                PhysicsMath.finiteOrZero(dto.thermalMaxTemperature()),
                PhysicsMath.finiteOrZero(dto.thermalAvgTemperature()),
                PhysicsMath.finiteOrZero(dto.dRadiation()),
                PhysicsMath.finiteOrZero(dto.dCollision()),
                PhysicsMath.finiteOrZero(dto.slrFactor()),
                PhysicsMath.finiteOrZero(dto.damageRate()),
                PhysicsMath.finiteOrZero(dto.projectedRange()),
                PhysicsMath.sanitizeStraggle(dto.straggleSigma()),
                PhysicsMath.finiteOrZero(dto.latticeStiffness()),
                PhysicsMath.finiteOrZero(dto.equilibriumDistance())
        );
    }

}

