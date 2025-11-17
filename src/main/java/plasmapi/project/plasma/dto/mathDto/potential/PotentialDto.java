package plasmapi.project.plasma.dto.mathDto.potential;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import plasmapi.project.plasma.service.math.potential.PotentialType;

public record PotentialDto(

        @NotNull(message = "Тип потенциала обязателен")
        PotentialType type,

        @NotNull(message = "Расстояние r обязательно")
        @Positive(message = "r должно быть положительным")
        Double r,

        // MORSE
        Double De,
        Double a,
        Double re,

        // Lennard-Jones
        Double sigma,
        Double epsilon
) {}


