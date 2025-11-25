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

        Double cohesiveEnergyEv1,
        Double cohesiveEnergyEv2,
        Double screeningLength,
        Double diffusionPrefactor1,
        Double diffusionPrefactor2
) {}
