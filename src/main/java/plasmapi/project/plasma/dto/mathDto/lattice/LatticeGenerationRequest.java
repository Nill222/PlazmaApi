package plasmapi.project.plasma.dto.mathDto.lattice;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record LatticeGenerationRequest(

        @NotNull(message = "ID конфигурации обязателен")
        @Positive(message = "ID конфигурации должен быть положительным")
        Integer configId,

        @NotNull(message = "ID атома обязателен")
        @Positive(message = "ID атома должен быть положительным")
        Integer atomListId,

        @Positive(message = "Количество атомов должно быть положительным")
        @Max(value = 1000000, message = "Количество атомов слишком велико")
        int count,

        @Positive(message = "Размерность решетки должна быть положительной")
        @Max(value = 3, message = "Поддерживаются только размерности до 3 (1D, 2D, 3D)")
        int dimension

) {}
