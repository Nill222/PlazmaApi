package plasmapi.project.plasma.dto.logikDTO;

import java.time.LocalDateTime;

public record ConfigDTO(
        Integer id,
        String name,
        String description,
        LocalDateTime createdAt,
        UserDTO user
) {}


