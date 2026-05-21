package plasmapi.project.plasma.dto.logikDTO.composition;

import plasmapi.project.plasma.dto.logikDTO.atom.AtomListDTO;

public record ResultAtomComponentDTO(
        AtomListDTO atom,
        double fraction
) {}
