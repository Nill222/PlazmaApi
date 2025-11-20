package plasmapi.project.plasma.dto.mathDto.resonance;

public record ResonanceInputDto(
        Double omegaExt, // Гц
        Double omega0,   // Гц (если null, оценим по Debye)
        Double xiEmp,    // эмпирич. усиление
        Double psi      // затухание (ширина)
) {
}
