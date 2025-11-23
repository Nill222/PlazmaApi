package plasmapi.project.plasma.dto.mathDto.slr;

public record SLRResultDto(
        double globalSLR,
        double[][] localSLR
) {}
