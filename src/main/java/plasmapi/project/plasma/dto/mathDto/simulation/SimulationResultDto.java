package plasmapi.project.plasma.dto.mathDto.simulation;

import plasmapi.project.plasma.dto.mathDto.diffusion.DiffusionProfileDto;
import plasmapi.project.plasma.dto.mathDto.plasma.PlasmaResultDto;

import java.util.List;

public record SimulationResultDto(
        Integer atomId,
        Integer configId,
        Integer ionId,
        String atomName,                       // имя материала/атома
        String s,
        double totalTransferredEnergy,         // общая переданная энергия (из Collision)
        double avgTransferredPerAtom,          // средняя энергия на атом
        double avgT,    // средняя температура
        double minT,    // минимальная температура
        double maxT,    // максимальная температура
        double diffusionCoefficient1,
        double diffusionCoefficient2,
        PlasmaResultDto plasmaParameters,      // параметры плазмы
        List<Double> perAtomTransferredEnergies, // энергии отдельных коллизий
        DiffusionProfileDto diffusionProfile,  // глубина + концентрация
        List<Double> coolingProfile,            // ThermalResultDto.temperatures()
        double totalMomentum,
        double totalDamage,
        double totalDisplacement,
        Double current
) {}
