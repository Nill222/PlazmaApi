package plasmapi.project.plasma.dto.mathDto.potential;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import plasmapi.project.plasma.model.atom.StructureType;
import plasmapi.project.plasma.service.math.potential.PotentialType;

public record PotentialDto(

        @NotNull PotentialType type,

        // расстояние
        @NotNull @Positive Double r,

        // Morse
        @PositiveOrZero Double De,
        @PositiveOrZero Double a,
        @PositiveOrZero Double re,

        // LJ
        @PositiveOrZero Double sigma,
        @PositiveOrZero Double epsilon,

        StructureType structure
) {}



