package plasmapi.project.plasma.dto.mathDto.atom;

import plasmapi.project.plasma.model.atom.StructureType;

public record AtomListDto(
        Integer id,
        String atomName,
        String fullNme,
        Double mass,           // kg/atom
        Double A,
        Double DebyeTemperature,
        Integer valence,
        StructureType structure,
        Double morseDeEv,
        Double morseA,
        Double ljSigma,
        Double ljEpsilonEv,
        Double bornMayerA,
        Double cohesiveEnergyEv,
        Double bornMayerAParam,
        Double screeningLength,
        Double diffusionPrefactor,
        String notes
) {}
