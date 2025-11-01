package plasmapi.project.plasma.dto.logikDTO.config;

import plasmapi.project.plasma.dto.logikDTO.user.UserDTO;

import java.time.LocalDateTime;

public record ConfigDTO(
        Integer id,
        String name,
        String description,
        LocalDateTime createdAt,
        UserDTO user
) {}


