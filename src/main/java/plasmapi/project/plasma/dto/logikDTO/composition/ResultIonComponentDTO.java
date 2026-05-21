package plasmapi.project.plasma.dto.logikDTO.composition;

import plasmapi.project.plasma.dto.logikDTO.ion.IonDTO;

public record ResultIonComponentDTO(
        IonDTO ion,
        double fraction
) {}
