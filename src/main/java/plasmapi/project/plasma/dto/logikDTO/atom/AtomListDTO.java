package plasmapi.project.plasma.dto.logikDTO.atom;

import plasmapi.project.plasma.model.atom.StructureType;

public record AtomListDTO(
        Integer id,
        String atomName,
        String fullName,
        Double mass,
        Double a,
        Double debyeTemperature,
        Integer valence,
        StructureType structure
) {}

