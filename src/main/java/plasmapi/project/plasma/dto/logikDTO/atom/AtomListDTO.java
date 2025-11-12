package plasmapi.project.plasma.dto.logikDTO.atom;

public record AtomListDTO(
        Integer id,
        String atomName,
        String fullName,
        Double mass,
        Double a,
        Double debyeTemperature,
        Integer valence,
        String structure
) {}

