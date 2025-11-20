package plasmapi.project.plasma.dto.mathDto.collision;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import plasmapi.project.plasma.dto.mathDto.potential.PotentialParameters;
import plasmapi.project.plasma.model.atom.StructureType;

public record CollisionDtoPast(
        @Positive(message = "Энергия столкновения должна быть положительной")
        @DecimalMax(value = "1e6", message = "Энергия слишком велика, проверьте входные данные")
        Double E,  // энергия иона при столкновении (Дж)

        @Positive(message = "Масса иона должна быть положительной")
        @DecimalMax(value = "1e-20", message = "Масса иона слишком велика для модели")
        Double mIon,  // масса иона (кг)

        @Positive(message = "Масса атома должна быть положительной")
        @DecimalMax(value = "1e-20", message = "Масса атома слишком велика для модели")
        Double mAtom, // масса атома (кг)

        @DecimalMin(value = "0.0", message = "Угол должен быть не меньше 0°")
        @DecimalMax(value = "180.0", message = "Угол должен быть не больше 180°")
        Double angle, // угол падения (°)

        @Valid
        PotentialParameters potential, // параметры потенциала (stiffness, r0, De, alpha)

        @NotNull
        StructureType structure, // тип решётки (FCC, BCC, ...)

        @Positive(message = "Заряд иона должен быть положительным")
        Double ionCharge, // заряд иона в Кулонах

        @Positive(message = "Энергия связи поверхности должна быть положительной")
        Double surfaceBindingEnergy, // энергия связи поверхности (E_bind)

        @Positive(message = "Резонансный множитель должен быть положительным")
        Double xi // ξ — резонансный усилитель (из ResonanceService)

) {
}
