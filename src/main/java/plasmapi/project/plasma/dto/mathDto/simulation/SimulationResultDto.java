package plasmapi.project.plasma.dto.mathDto.simulation;

import plasmapi.project.plasma.dto.mathDto.diffusion.DiffusionProfileDto;
import plasmapi.project.plasma.dto.mathDto.plasma.PlasmaResultDto;

import java.util.List;

public record SimulationResultDto(
        String atomName,                       // имя материала/атома
        String s, double totalTransferredEnergy,         // общая переданная энергия (из Collision)
        double avgTransferredPerAtom,          // средняя энергия на атом
        double estimatedTemperature,           // итоговая температура (из Thermal)
        double diffusionCoefficient,           // D_effective из диффузии
        PlasmaResultDto plasmaParameters,      // параметры плазмы
        List<Double> perAtomTransferredEnergies, // энергии отдельных коллизий
        DiffusionProfileDto diffusionProfile,  // глубина + концентрация
        List<Double> coolingProfile            // ThermalResultDto.temperatures()
) {}
