package plasmapi.project.plasma.dto.logikDTO;

import plasmapi.project.plasma.dto.logikDTO.config.ConfigDTO;
import plasmapi.project.plasma.dto.logikDTO.ion.IonDTO;

import java.time.LocalDateTime;

public record ResultDTO(
        Integer id,
        ConfigDTO config,
        IonDTO ion,
        Double energy,
        Double potential,
        Double temperature,
        LocalDateTime createdAt
) {}


