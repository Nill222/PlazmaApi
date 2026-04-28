package plasmapi.project.plasma.service.math;

import java.util.List;

public record PhysicsStats(
    double electronDensity,       // Плотность электронов (м⁻³)
    double electronVelocity,      // Скорость электронов (м/с)
    double currentDensity,       // Плотность тока (А/м²)
    double surfaceBindingEnergy,  // Энергия связи (эВ)
    double totalTransferredEnergy,// Суммарная энергия (эВ)
    double avgTransferredPerAtom, // Средняя энергия на атом (эВ)
    double totalDamage,           // Суммарные дефекты (вакансии/м²)
    double totalMomentum,         // Переданный импульс (кг·м/с)
    double totalDisplacement,      // Смещение атомов (м)
    double finalProbeTemperature,  // Температура в контрольной точке (K)
    double debyeFrontSpeed,        // Скорость фронта до температуры Дебая (м/с)
    double debyeFrontDepth,        // Глубина фронта Дебая (м)
    List<Double> thermalTimes,     // Шкала времени для температурного поля (с)
    List<Double> thermalDepths,    // Шкала глубины для температурного поля (м)
    List<List<Double>> thermalTemperatureMap // T(depth, time) для 3D-графика
) {}