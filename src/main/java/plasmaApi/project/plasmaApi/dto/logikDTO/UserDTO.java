package plasmaApi.project.plasmaApi.dto.logikDTO;

import plasmaApi.project.plasmaApi.model.security.Role;

public record UserDTO(
        Integer id,
        String username,
        String email,
        Role role
) {}

