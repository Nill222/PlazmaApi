package plasmaApi.project.plasmaApi.dto.mathDto.lattice;

public record LatticeGenerationRequest(
        Integer configId,
        Integer atomListId,
        int count,
        int dimension) {
}
