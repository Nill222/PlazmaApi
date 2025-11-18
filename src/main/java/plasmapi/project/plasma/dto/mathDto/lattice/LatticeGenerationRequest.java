package plasmapi.project.plasma.dto.mathDto.lattice;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import plasmapi.project.plasma.model.atom.StructureType;

public record LatticeGenerationRequest(
        @NotNull @Positive Integer configId,
        @NotNull @Positive Integer atomListId,
        @NotNull @Positive Integer count,

        @NotNull StructureType structure
) {}
