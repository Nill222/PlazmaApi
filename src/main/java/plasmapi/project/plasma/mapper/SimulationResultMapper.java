package plasmapi.project.plasma.mapper;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import plasmapi.project.plasma.dto.mathDto.diffusion.DiffusionProfileDto;
import plasmapi.project.plasma.dto.mathDto.plasma.PlasmaResultDto;
import plasmapi.project.plasma.dto.mathDto.simulation.SimulationIntermediateResultDto;
import plasmapi.project.plasma.dto.mathDto.simulation.SimulationResultDto;
import plasmapi.project.plasma.service.math.PhysicsStats;
import plasmapi.project.plasma.service.math.diffusion.DiffusionIntermediate;
import plasmapi.project.plasma.service.math.diffusion.DiffusionProfile;
import plasmapi.project.plasma.service.math.energy.EnergyDepositionResult;
import plasmapi.project.plasma.service.math.energy.IntermediateResultEnrichmentService;
import plasmapi.project.plasma.service.math.simulation.SimulationIntermediateResult;
import plasmapi.project.plasma.service.math.simulation.SimulationResult;
import plasmapi.project.plasma.service.math.simulation.ThermalIntermediate;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class SimulationResultMapper {

    private final IntermediateResultEnrichmentService intermediateEnrichment;

    public SimulationResultDto toDto(
            SimulationResult result,
            Integer atomId,
            Integer configId,
            Integer ionId
    ) {
        PhysicsStats stats = result.getStats();
        DiffusionProfile profile = result.getProfile();
        SimulationIntermediateResult intermediate = result.getIntermediate();

        PlasmaResultDto plasmaDto = new PlasmaResultDto(
                stats.electronDensity(),
                stats.electronVelocity(),
                stats.currentDensity(),
                result.getPlasmaResult().ionEnergyEv(),
                result.getPlasmaConfig().getVoltage() != null ? result.getPlasmaConfig().getVoltage() : 0.0,
                result.getPlasmaConfig().getPressure() != null ? result.getPlasmaConfig().getPressure() : 0.0,
                result.getPlasmaConfig().getElectronTemperature() != null
                        ? result.getPlasmaConfig().getElectronTemperature() : 0.0,
                result.getPlasmaResult().ionFlux()
        );

        DiffusionProfileDto profileDto = new DiffusionProfileDto(
                profile.getD1(),
                profile.getD2(),
                profile.getQ1_ev(),
                profile.getQ2_ev(),
                profile.getD_thermal(),
                profile.getD_effective(),
                profile.getMeanDepth()
        );

        ThermalIntermediate thermal = intermediate.thermal();
        List<Double> coolingProfile = extractCoolingProfile(stats);

        return new SimulationResultDto(
                atomId,
                configId,
                ionId,
                result.getAtom().getAtomName(),
                result.getAtom().getStructure() != null ? result.getAtom().getStructure().name() : "",
                stats.totalTransferredEnergy(),
                stats.avgTransferredPerAtom(),
                thermal.avgTemperature(),
                thermal.minTemperature(),
                thermal.maxTemperature(),
                profile.getD1(),
                profile.getD2(),
                plasmaDto,
                List.of(),
                profileDto,
                coolingProfile,
                stats.totalMomentum(),
                stats.totalDamage(),
                stats.totalDisplacement(),
                stats.fluence(),
                stats.fluenceEff(),
                stats.ionFlux(),
                stats.resonanceXi(),
                stats.dSlr(),
                stats.dRes(),
                enrichIntermediate(result, intermediate)
        );
    }

    private SimulationIntermediateResultDto enrichIntermediate(
            SimulationResult result,
            SimulationIntermediateResult intermediate
    ) {
        SimulationIntermediateResultDto dto = toIntermediateDto(intermediate);
        double exposureTime = result.getPlasmaConfig().getExposureTime() != null
                ? result.getPlasmaConfig().getExposureTime()
                : 60.0;
        double ambient = result.getPlasmaConfig().getTargetTemperature() != null
                ? result.getPlasmaConfig().getTargetTemperature()
                : 300.0;
        return intermediateEnrichment.enrich(
                dto,
                result.getStats(),
                result.getAtom(),
                result.getPlasmaConfig(),
                exposureTime,
                ambient
        );
    }

    public SimulationIntermediateResultDto toIntermediateDto(SimulationIntermediateResult intermediate) {
        EnergyDepositionResult e = intermediate.energyDeposition();
        DiffusionIntermediate d = intermediate.diffusion();
        ThermalIntermediate t = intermediate.thermal();

        return new SimulationIntermediateResultDto(
                intermediate.plasma().ionEnergyEv(),
                intermediate.plasma().ionFlux(),
                e.potentialAtSurface(),
                e.acceleratingField(),
                e.energyGainFactor(),
                e.plasmaCorrectionFactor(),
                e.exposureRate(),
                e.fluence(),
                e.modifiedLayerThickness(),
                e.skinDepth(),
                e.skinSurfacePower(),
                e.skinAccumulatedEnergy(),
                e.skinTemperatureDelta(),
                e.effectiveSurfaceTemperature(),
                t.finalProbeTemperature(),
                t.debyeFrontSpeed(),
                t.debyeFrontDepth(),
                t.minTemperature(),
                t.maxTemperature(),
                t.avgTemperature(),
                d.dRadiation(),
                d.dCollision(),
                d.slrFactor(),
                d.damageRate(),
                d.projectedRange(),
                d.straggleSigma(),
                d.latticeStiffness(),
                d.equilibriumDistance()
        );
    }

    private List<Double> extractCoolingProfile(PhysicsStats stats) {
        List<List<Double>> map = stats.thermalTemperatureMap();
        if (map == null || map.isEmpty()) {
            return List.of(stats.finalProbeTemperature());
        }
        int last = map.size() - 1;
        return new ArrayList<>(map.get(last));
    }
}
