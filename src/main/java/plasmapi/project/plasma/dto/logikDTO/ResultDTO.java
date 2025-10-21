package plasmapi.project.plasma.dto.logikDTO;

import java.time.LocalDateTime;

public record ResultDTO(
        Integer id,
        IonDTO ion,
        Double energy,
        Double potential,
        Double temperature,
        LocalDateTime createdAt
) {}


