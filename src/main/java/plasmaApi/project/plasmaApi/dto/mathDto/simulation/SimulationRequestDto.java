package plasmaApi.project.plasmaApi.dto.mathDto.simulation;

import plasmaApi.project.plasmaApi.dto.mathDto.lattice.LatticeGenerationRequest;

public record SimulationRequestDto(
        Integer configId,
        Integer ionId,
        Integer atomListId,
        boolean generateLattice,
        LatticeGenerationRequest latticeRequest, // твой DTO
        double plasmaVoltage,
        double pressure,
        double electronTemp,
        double timeStep,
        double totalTime,
        double impactAngle,
        double diffusionPrefactor, // D0
        double activationEnergy,   // Q (J)
        double surfaceConcentration,
        double depth
) {}
