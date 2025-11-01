package plasmapi.project.plasma.dto.logikDTO.atom;

import plasmapi.project.plasma.dto.logikDTO.config.ConfigDTO;

public record AtomDTO(
        Integer id,
        ConfigDTO config,
        AtomListDTO atomList,
        Double x,
        Double y,
        Double vx,
        Double vy
) {}


