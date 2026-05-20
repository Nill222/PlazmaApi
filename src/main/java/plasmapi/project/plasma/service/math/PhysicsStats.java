package plasmapi.project.plasma.service.math;

import plasmapi.project.plasma.service.math.diffusion.DiffusionIntermediate;

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
    double fluence,                // Интегральный поток ионов (1/м²)
    double fluenceEff,             // Эффективный флюенс с учётом усиления
    double ionFlux,                // Поток ионов (1/(м²·с))
    double energyGainFactor,       // G — энергетическое усиление (2)
    double plasmaCorrectionFactor, // M_p — плазменный множитель (3)
    double exposureRate,           // скорость воздействия v(t) (4)
    double modifiedLayerThickness, // h — толщина модифицированного слоя (5), м
    double skinDepth,              // δ — глубина скин-слоя (6), м
    double skinSurfacePower,       // P_skin (9), Вт/м²
    double skinAccumulatedEnergy,  // W_skin (10), Дж/м²
    double skinTemperatureDelta,   // ΔT_skin (11), К
    double effectiveSurfaceTemperature, // T_eff (12), К
    double resonanceXi,            // Резонансный коэффициент усиления
    double dSlr,                   // Вклад SLR в D (м²/с)
    double dRes,                   // Резонансный вклад в D (м²/с)
    DiffusionIntermediate diffusionTransport, // снимок диффузии/транспорта (не нулевой при полном расчёте)
    List<Double> thermalTimes,     // Шкала времени для температурного поля (с)
    List<Double> thermalDepths,    // Шкала глубины для температурного поля (м)
    List<List<Double>> thermalTemperatureMap // T(depth, time) для 3D-графика
) {}