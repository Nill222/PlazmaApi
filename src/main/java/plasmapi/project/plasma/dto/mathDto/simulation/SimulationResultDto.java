package plasmapi.project.plasma.dto.mathDto.simulation;

import plasmapi.project.plasma.dto.mathDto.diffusion.DiffusionProfileDto;
import plasmapi.project.plasma.dto.mathDto.plasma.PlasmaParameters;

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
        DiffusionProfileDto diffusionProfile,
        List<Double> coolingProfile
) {}
