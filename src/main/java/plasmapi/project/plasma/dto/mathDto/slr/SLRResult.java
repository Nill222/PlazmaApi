package plasmapi.project.plasma.dto.mathDto.slr;

public record SLRResult(
        double globalSLR,
        double[][] localMap // локальная SLR по сетке (NxM)
) {
}
