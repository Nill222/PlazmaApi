package plasmapi.project.plasma.dto.logikDTO.result;

import plasmapi.project.plasma.dto.logikDTO.atom.AtomListDTO;
import plasmapi.project.plasma.dto.logikDTO.composition.ResultAtomComponentDTO;
import plasmapi.project.plasma.dto.logikDTO.composition.ResultIonComponentDTO;
import plasmapi.project.plasma.dto.logikDTO.config.ConfigDTO;
import plasmapi.project.plasma.dto.logikDTO.ion.IonDTO;
import plasmapi.project.plasma.dto.mathDto.simulation.SimulationIntermediateResultDto;

import java.time.LocalDateTime;
import java.util.List;

public record ResultDTO(
        Integer id,
        ConfigDTO config,
        IonDTO ion,
        AtomListDTO atom,
        List<ResultAtomComponentDTO> atomComposition,
        List<ResultIonComponentDTO> ionComposition,
        double totalTransferredEnergy,
        double avgTransferredPerAtom,
        double avgT,
        double minT,
        double maxT,
        double diffusionCoefficient1,
        double diffusionCoefficient2,
        double voltage,
        double electronTemperature,
        double ionEnergy,
        double pressure,
        double electronDensity,
        double electronVelocity,
        double currentDensity,
        double depths,
        double concentration,
        double dThermal,
        double totalMomentum,
        double totalDamage,
        double totalDisplacement,
        double fluence,
        double fluenceEff,
        double ionFlux,
        double resonanceXi,
        double dSlr,
        double dRes,
        SimulationIntermediateResultDto intermediate,
        LocalDateTime createdAt
) {}



