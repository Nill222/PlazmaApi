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
import plasmapi.project.plasma.model.res.Result;
import plasmapi.project.plasma.model.security.User;
import plasmapi.project.plasma.service.logik.AtomService;
import plasmapi.project.plasma.service.logik.ConfigService;
import plasmapi.project.plasma.service.logik.IonService;

@Component
@RequiredArgsConstructor
public class ResultMapper{

    private final ConfigService configService;
    private final IonService ionService;
    private final AtomService atomListService;

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

        if (dto.intermediate() != null) {
            applyIntermediate(r, dto.intermediate());
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
        return new SimulationIntermediateResultDto(
                r.getIonEnergy() != null ? r.getIonEnergy() : 0.0,
                r.getIonFlux() != null ? r.getIonFlux() : 0.0,
                nz(r.getPotentialAtSurface()),
                nz(r.getAcceleratingField()),
                nz(r.getEnergyGainFactor()),
                nz(r.getPlasmaCorrectionFactor()),
                nz(r.getExposureRate()),
                nz(r.getFluence()),
                nz(r.getModifiedLayerThickness()),
                nz(r.getSkinDepth()),
                nz(r.getSkinSurfacePower()),
                nz(r.getSkinAccumulatedEnergy()),
                nz(r.getSkinTemperatureDelta()),
                nz(r.getEffectiveSurfaceTemperature()),
                nz(r.getFinalProbeTemperature()),
                nz(r.getDebyeFrontSpeed()),
                nz(r.getDebyeFrontDepth()),
                nz(r.getAvgT()),
                nz(r.getMinT()),
                nz(r.getMaxT()),
                nz(r.getDRadiation()),
                nz(r.getDCollision()),
                nz(r.getSlrFactor()),
                nz(r.getDamageRate()),
                nz(r.getProjectedRange()),
                nz(r.getStraggleSigma()),
                nz(r.getLatticeStiffness()),
                nz(r.getEquilibriumDistance())
        );
    }

    private static double nz(Double v) {
        return v != null ? v : 0.0;
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

