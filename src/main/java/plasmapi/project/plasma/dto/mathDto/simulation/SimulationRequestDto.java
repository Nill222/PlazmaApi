        package plasmapi.project.plasma.dto.mathDto.simulation;

        import jakarta.validation.Valid;
        import jakarta.validation.constraints.*;
        import plasmapi.project.plasma.dto.mathDto.lattice.LatticeGenerationRequest;
        import plasmapi.project.plasma.dto.mathDto.potential.PotentialDto;
        import plasmapi.project.plasma.model.atom.StructureType;

        public record SimulationRequestDto(

                // --- Основные сущности ---
                @NotNull @Positive
                Integer configId,

                @NotNull @Positive
                Integer ionId,

                @NotNull @Positive
                Integer atomListId,

                // --- Генерация решётки ---
                boolean generateLattice,
                @Valid LatticeGenerationRequest latticeRequest,

                // --- Структура решётки ---
                @NotNull
                StructureType latticeStructure,

                // --- Плазма ---
                @NotNull @Positive
                Double plasmaVoltage,

                @NotNull @Positive
                Double pressure,

                @NotNull @Positive
                Double electronTemp,

                // --- Потенциалы ---
                @Valid
                PotentialDto potential,

                // --- Столкновения ---
                @NotNull
                @DecimalMin("0.0") @DecimalMax("180.0")
                Double impactAngle,

                // --- Диффузия ---
                @NotNull @Positive
                Double diffusionPrefactor,   // D0

                @NotNull @Positive
                Double activationEnergy,     // Q

                @NotNull @PositiveOrZero
                Double surfaceConcentration,

                @NotNull @Positive
                Double depth,

                // --- Время ---
                @NotNull @Positive
                Double timeStep,

                @NotNull @Positive
                Double totalTime,

                // --- Материальные свойства ---
                @NotNull @Positive
                Double thermalConductivity
        ) {}

