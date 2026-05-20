package plasmapi.project.plasma.mapper;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import plasmapi.project.plasma.controller.handler.exception.NotFoundException;
import plasmapi.project.plasma.dto.logikDTO.ResultDTO;
import plasmapi.project.plasma.dto.logikDTO.atom.AtomListDTO;
import plasmapi.project.plasma.dto.logikDTO.config.ConfigDTO;
import plasmapi.project.plasma.dto.logikDTO.ion.IonDTO;
import plasmapi.project.plasma.dto.logikDTO.user.UserDTO;
import plasmapi.project.plasma.dto.mathDto.simulation.SimulationIntermediateResultDto;
import plasmapi.project.plasma.dto.mathDto.simulation.SimulationResultDto;
import plasmapi.project.plasma.model.atom.AtomList;
import plasmapi.project.plasma.model.res.PlasmaConfiguration;
import plasmapi.project.plasma.model.res.Result;
import plasmapi.project.plasma.model.security.User;
import plasmapi.project.plasma.service.logik.AtomService;
import plasmapi.project.plasma.service.logik.ConfigService;
import plasmapi.project.plasma.service.logik.IonService;
import plasmapi.project.plasma.service.math.energy.IntermediateResultEnrichmentService;

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

        AtomList atom = r.getAtom();
        PlasmaConfiguration plasmaCfg = r.getConfig() != null ? r.getConfig().getConfig() : null;
        if (plasmaCfg == null) {
            plasmaCfg = plasmaConfigFromDto(dto, atom);
        }
        double exposureTime = plasmaCfg != null && plasmaCfg.getExposureTime() != null
                ? plasmaCfg.getExposureTime()
                : 60.0;
        double ambient = dto.avgT() > 0 ? dto.avgT() : 300.0;

        SimulationIntermediateResultDto intermediate = dto.intermediate();
        intermediate = intermediateEnrichment.enrichForSave(
                intermediate,
                intermediate,
                null,
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
        return cfg;
    }

    public ResultDTO toDTO(Result r) {
        return new ResultDTO(
                r.getId(),
                new ConfigDTO(r.getConfig().getId(),
                        r.getConfig().getName(),
                        r.getConfig().getDescription(),
                        r.getConfig().getCreatedAt(),
                        mapUser(r.getConfig().getUser())),
                new IonDTO(r.getIon().getId(),
                        r.getIon().getName(),
                        r.getIon().getMass(),
                        r.getIon().getCharge()),
                new AtomListDTO(
                        r.getAtom().getId(),
                        r.getAtom().getAtomName(),
                        r.getAtom().getFullName(),
                        r.getAtom().getMass(),
                        r.getAtom().getA(),
                        r.getAtom().getDebyeTemperature(),
                        r.getAtom().getValence(),
                        r.getAtom().getStructure()
                ),

                r.getTotalTransferredEnergy(),
                r.getAvgTransferredPerAtom(),
                r.getAvgT(),
                r.getMinT(),
                r.getMaxT(),
                r.getDiffusionCoefficient1(),
                r.getDiffusionCoefficient2(),
                r.getVoltage(),
                r.getElectronTemperature(),
                r.getIonEnergy(),
                r.getPressure(),
                r.getElectronDensity(),
                r.getElectronVelocity(),
                r.getCurrentDensity(),
                r.getDepths(),
                r.getConcentration(),
                r.getDThermal(),
                r.getTotalMomentum(),
                r.getTotalDamage(),
                r.getTotalDisplacement(),
                r.getFluence(),
                r.getFluenceEff(),
                r.getIonFlux(),
                r.getResonanceXi(),
                r.getDSlr(),
                r.getDRes(),
                readIntermediate(r),
                r.getCreatedAt()
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

}

