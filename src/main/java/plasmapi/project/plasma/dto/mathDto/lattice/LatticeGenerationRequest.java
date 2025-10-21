package plasmapi.project.plasma.dto.mathDto.lattice;

public record LatticeGenerationRequest(
        Integer configId,
        Integer atomListId,
        int count,
        int dimension) {
}
