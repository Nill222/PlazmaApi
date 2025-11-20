package plasmapi.project.plasma.dto.mathDto.thermal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Positive;
import plasmapi.project.plasma.dto.mathDto.potential.PotentialParameters;
import plasmapi.project.plasma.model.atom.AtomList;
import plasmapi.project.plasma.model.atom.StructureType;

public record ThermalDto(
        // --- Основные параметры времени/температуры ---
        Double T0,               // начальная температура, K
        Double tMax,             // максимальное время симуляции, s
        Double dt,               // шаг времени, s

        // --- Параметры материала ---
        Double density,          // кг/м3
        Double thickness,        // m
        Double area,             // m^2
        Double lambda0,          // базовая теплопроводность при Tref, W/(m K)
        Double debyeTemperature, // температура Дебая, K
        Double molarMass,        // молярная масса, kg/mol
        StructureType structure, // структура кристалла
        PotentialParameters potential, // параметры потенциала (жёсткость и энергия)
        AtomList atom,           // атомные параметры для извлечения массы/θD

        // --- Источники энергии ---
        Double ionEnergy,        // суммарная энергия ионов, J
        Double exposureTime,     // время подачи энергии, s
        Double powerInput,       // мощность внешнего источника, W
        Double energyDensityPerSec, // энергоплотность, J/s·m3
        Double envTemp           // температура окружающей среды, K
) {}
