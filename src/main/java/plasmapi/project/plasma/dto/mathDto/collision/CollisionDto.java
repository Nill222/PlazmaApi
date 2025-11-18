package plasmapi.project.plasma.dto.mathDto.collision;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Positive;
import plasmapi.project.plasma.model.atom.StructureType;

public record CollisionDto(
        @Positive(message = "Энергия столкновения должна быть положительной")
        @DecimalMax(value = "1e6", message = "Энергия слишком велика, проверьте входные данные")
        double E,

        @Positive(message = "Масса иона должна быть положительной")
        @DecimalMax(value = "1e-20", message = "Масса иона слишком велика для модели")
        double mIon,

        @Positive(message = "Масса атома должна быть положительной")
        @DecimalMax(value = "1e-20", message = "Масса атома слишком велика для модели")
        double mAtom,

        @DecimalMin(value = "0.0", inclusive = true, message = "Угол должен быть не меньше 0°")
        @DecimalMax(value = "180.0", inclusive = true, message = "Угол должен быть не больше 180°")
        double angle,

        StructureType structure

) {
}
