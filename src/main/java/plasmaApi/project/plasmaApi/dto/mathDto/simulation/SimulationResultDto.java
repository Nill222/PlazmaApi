package plasmaApi.project.plasmaApi.dto.mathDto.simulation;

import plasmaApi.project.plasmaApi.dto.mathDto.diffusion.DiffusionProfileDto;
import plasmaApi.project.plasmaApi.dto.mathDto.plasma.PlasmaParameters;

import java.util.List;

public record SimulationResultDto(
        String ionName,
        String atomName,
        double totalTransferredEnergy,
        double avgTransferredPerAtom,
        double estimatedTemperature,
        double diffusionCoefficient,
        PlasmaParameters plasmaParameters,
        List<Double> perAtomTransferredEnergies,
        DiffusionProfileDto diffusionProfile
) {}
