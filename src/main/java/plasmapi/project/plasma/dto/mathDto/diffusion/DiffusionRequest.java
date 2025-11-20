package plasmapi.project.plasma.dto.mathDto.diffusion;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import plasmapi.project.plasma.dto.mathDto.potential.PotentialParameters;
import plasmapi.project.plasma.model.atom.StructureType;

import java.util.List;

public record DiffusionRequest(

        // --- Геометрия и шаги ---
        double depth,        // глубина слоя, m
        Double dx,           // шаг по глубине, m (optional, default 1e-9)
        Double dt,           // шаг по времени, s (optional, default 0.1)
        Double tMax,         // максимальное время, s (optional, default 1.0)

        // --- Диффузионные параметры ---
        double D,            // базовый коэффициент диффузии, m^2/s
        double c0,           // начальная концентрация на поверхности

        // --- Материал и потенциал ---
        StructureType structure,        // структура кристалла (BCC, FCC, HCP)
        PotentialParameters potential, // параметры потенциала (stiffness, energy)

        // --- Усиленная диффузия от повреждений ---
        Double damageEnergy, // суммарная энергия повреждений, J
        Double damageRate,   // скорость подачи энергии повреждений, J/s

        // --- Активационная энергия для температурной зависимости ---
        Double activationEnergy,      // J/mol
        Double temperature,           // K (скалярная температура)
        List<Double> temperatureProfile // профиль температуры по времени (если есть)
) {}