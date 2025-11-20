        package plasmapi.project.plasma.dto.mathDto.simulation;

        import jakarta.validation.Valid;
        import jakarta.validation.constraints.*;
        import plasmapi.project.plasma.dto.mathDto.lattice.LatticeGenerationRequest;
        import plasmapi.project.plasma.dto.mathDto.potential.PotentialDto;
        import plasmapi.project.plasma.model.atom.StructureType;

        public record SimulationRequestDto(

                // ========= 1) Основные ID =========
                @NotNull @Positive
                Integer configId,

                @NotNull @Positive
                Integer ionId,

                @NotNull @Positive
                Integer atomListId,


                // ========= 2) Генерация решётки =========
                boolean generateLattice,
                @Valid LatticeGenerationRequest latticeRequest,


                // ========= 3) Структура решётки =========
                @NotNull
                StructureType latticeStructure,


                // ========= 4) Плазма (вводимые параметры) =========
                // Остальные параметры плазмы берутся из PlasmaConfiguration
                @NotNull @Positive
                Double plasmaVoltage,       // U

                @NotNull @Positive
                Double pressure,            // p

                @NotNull @Positive
                Double electronTemp,        // T_e


                // ========= 5) Потенциал (ручной выбор / override) =========
                @Valid
                PotentialDto potential,


                // ========= 6) Столкновения =========
                @NotNull
                @DecimalMin("0.0") @DecimalMax("180.0")
                Double impactAngle,


                // ========= 7) Диффузия =========
                @NotNull @Positive
                Double diffusionPrefactor,   // D0

                @NotNull @Positive
                Double activationEnergy,     // Q (J/mol)

                @NotNull @PositiveOrZero
                Double surfaceConcentration, // C0

                @NotNull @Positive
                Double depth,                // глубина моделирования


                // ========= 8) Время =========
                @NotNull @Positive
                Double timeStep,             // dt

                @NotNull @Positive
                Double totalTime,            // t_max


                // ========= 9) Материальные свойства поверхности =========
                // (остальное берётся из AtomList)
                @NotNull @Positive
                Double thermalConductivity   // λ₀ — базовое значение
        ) {}

