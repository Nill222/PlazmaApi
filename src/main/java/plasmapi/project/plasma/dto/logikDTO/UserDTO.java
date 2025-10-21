package plasmapi.project.plasma.dto.logikDTO;

import plasmapi.project.plasma.model.security.Role;

public record UserDTO(
        Integer id,
        String username,
        String email,
        Role role
) {}

