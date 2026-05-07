/**
 * PlasmaLab Charts Visualization Engine v5.0
 */


'use strict';

// Экспортное разрешение - 3200x2000 для максимального качества
const EXPORT_W_PX = 3200;
const EXPORT_H_PX = 2000;

// Размеры в Word документе (в пикселях)
const WORD_DISPLAY_W = 550;
const WORD_DISPLAY_H = 344; // Соотношение 8:5

const EXPORT_PLOT_RATIO = 0.75;
const EXPORT_COLORBAR_RATIO = 0.25;

// ==============================================================
// Chart Configurations - 85 CHARTS
// ==============================================================
const CHART_CONFIGS = {
    // Оригинальные 60 графиков (1-60)
    1: { xKey:'pressure', yKey:'electronDensity', zKey:'voltage', xLabel:'Давление (Па)', yLabel:'Плотность электронов (м⁻³)', zLabel:'Напряжение (В)', title:'Плотность электронов от давления', category:'plasma' },
    2: { xKey:'voltage', yKey:'electronVelocity', zKey:'currentDensity', xLabel:'Напряжение (В)', yLabel:'Скорость электронов (м/с)', zLabel:'Плотность тока (А/м²)', title:'Скорость электронов от напряжения', category:'plasma' },
    3: { xKey:'voltage', yKey:'currentDensity', zKey:'ionEnergy', xLabel:'Напряжение (В)', yLabel:'Плотность тока (А/м²)', zLabel:'Энергия ионов (Дж)', title:'Плотность тока от напряжения', category:'plasma' },
    4: { xKey:'voltage', yKey:'electronTemperature', zKey:'currentDensity', xLabel:'Напряжение (В)', yLabel:'Температура электронов (K)', zLabel:'Плотность тока (А/м²)', title:'Температура электронов', category:'thermal' },
    5: { xKey:'totalTransferredEnergy',yKey:'depths', zKey:'avgT', xLabel:'Общая переданная энергия (Дж)', yLabel:'Глубина слоя (м)', zLabel:'Средняя температура (K)', title:'Температура от энергии и глубины', category:'thermal' },
    6: { xKey:'voltage', yKey:'depths', zKey:'avgT', xLabel:'Напряжение (В)', yLabel:'Глубина слоя (м)', zLabel:'Средняя температура (K)', title:'Температура от напряжения и глубины', category:'thermal' },
    7: { xKey:'pressure', yKey:'depths', zKey:'avgT', xLabel:'Давление (Па)', yLabel:'Глубина слоя (м)', zLabel:'Средняя температура (K)', title:'Температура от давления и глубины', category:'thermal' },
    8: { xKey:'currentDensity', yKey:'depths', zKey:'avgT', xLabel:'Плотность тока (А/м²)', yLabel:'Глубина слоя (м)', zLabel:'Средняя температура (K)', title:'Температура от плотности тока и глубины', category:'thermal' },
    9: { xKey:'voltage', yKey:'currentDensity', zKey:'totalTransferredEnergy',xLabel:'Напряжение (В)', yLabel:'Плотность тока (А/м²)', zLabel:'Полная энергия (Дж)', title:'Полная энергия от напряжения и плотности тока', category:'energy' },
    10: { xKey:'voltage', yKey:'avgTransferredPerAtom', zKey:'concentration', xLabel:'Напряжение (В)', yLabel:'Средняя переданная энергия на атом (эВ)',zLabel:'Концентрация (м⁻³)', title:'Энергия на атом от напряжения и температуры', category:'energy' },
    11: { xKey:'voltage', yKey:'ionEnergy', zKey:'concentration', xLabel:'Напряжение (В)', yLabel:'Энергия иона (эВ)', zLabel:'Концентрация (м⁻³)', title:'Энергия иона от напряжения и концентрации', category:'energy' },
    12: { xKey:'diffusionCoefficient1', yKey:'totalTransferredEnergy', zKey:'avgT', xLabel:'D₁ (м²/с)', yLabel:'Полная переданная энергия (эВ)', zLabel:'Средняя температура (K)', title:'D₁ от температуры и энергии', category:'diffusion'},
    13: { xKey:'totalTransferredEnergy',yKey:'totalDamage', zKey:'avgT', xLabel:'Переданная энергия (эВ)', yLabel:'Суммарные повреждения (дефекты/м²)', zLabel:'Средняя температура (K)', title:'Энергия → Повреждения при разных температурах', category:'damage' },
    14: { xKey:'totalTransferredEnergy',yKey:'voltage', zKey:'avgT', xLabel:'Полная переданная энергия (эВ)', yLabel:'Напряжение (В)', zLabel:'Средняя температура (K)', title:'Энергия от температуры и напряжения', category:'energy' },
    15: { xKey:'pressure', yKey:'totalTransferredEnergy', zKey:'avgT', xLabel:'Давление (Па)', yLabel:'Полная переданная энергия (эВ)', zLabel:'Средняя температура (K)', title:'Энергия от давления и температуры', category:'energy' },
    16: { xKey:'diffusionCoefficient1', yKey:'voltage', zKey:'avgT', xLabel:'D₁ (м²/с)', yLabel:'Напряжение (В)', zLabel:'Средняя температура (K)', title:'D₁ от температуры и напряжения', category:'diffusion'},
    17: { xKey:'diffusionCoefficient2', yKey:'voltage', zKey:'avgT', xLabel:'D₂ (м²/с)', yLabel:'Напряжение (В)', zLabel:'Средняя температура (K)', title:'D₂ от температуры и напряжения', category:'diffusion'},
    18: { xKey:'diffusionCoefficient1', yKey:'diffusionCoefficient2', zKey:'avgT', xLabel:'D₁ (м²/с)', yLabel:'D₂ (м²/с)', zLabel:'Средняя температура (K)', title:'Сравнение D₁ и D₂ при разных температурах', category:'diffusion'},
    19: { xKey:'voltage', yKey:'diffusionCoefficient1', zKey:'avgT', xLabel:'Напряжение (В)', yLabel:'Термическая диффузия D (м²/с)', zLabel:'Средняя температура (K)', title:'Диффузия D₁ от напряжения и температуры', category:'diffusion'},
    20: { xKey:'diffusionCoefficient1', yKey:'diffusionCoefficient2', zKey:'avgT', xLabel:'D₁ (м²/с)', yLabel:'D₂ (м²/с)', zLabel:'Средняя температура (K)', title:'Сравнение D₁ и D₂ при разных температурах после SLR', category:'diffusion'},
    21: { xKey:'totalTransferredEnergy',yKey:'totalDamage', zKey:'avgT', xLabel:'Переданная энергия (эВ)', yLabel:'Суммарные повреждения (дефекты/м²)', zLabel:'Средняя температура (K)', title:'Повреждения от энергии и температуры', category:'damage' },
    22: { xKey:'totalTransferredEnergy',yKey:'totalMomentum', zKey:'totalDamage', xLabel:'Переданная энергия (эВ)', yLabel:'Суммарный импульс (кг·м/с)', zLabel:'Суммарные повреждения (дефекты/м²)', title:'Импульс от энергии и повреждений', category:'damage' },
    23: { xKey:'totalMomentum', yKey:'totalDisplacement', zKey:'totalDamage', xLabel:'Суммарный импульс (кг·м/с)', yLabel:'Суммарное смещение (м)', zLabel:'Суммарные повреждения (дефекты/м²)', title:'Смещение от импульса и повреждений', category:'damage' },
    24: { xKey:'totalDamage', yKey:'voltage', zKey:'avgT', xLabel:'Суммарные повреждения (дефекты/м²)',yLabel:'Напряжение (В)', zLabel:'Средняя температура (K)', title:'Повреждения от температуры и напряжения', category:'damage' },
    25: { xKey:'voltage', yKey:'currentDensity', zKey:'depths', xLabel:'Напряжение (В)', yLabel:'Плотность тока (А/м²)', zLabel:'Глубина проникновения (м)', title:'V · j → Глубина проникновения ионов', category:'plasma' },
    26: { xKey:'voltage', yKey:'currentDensity', zKey:'ionEnergy', xLabel:'Напряжение (В)', yLabel:'Плотность тока (А/м²)', zLabel:'Энергия ионов (Дж)', title:'V · j → Суммарная переданная энергия', category:'energy' },
    27: { xKey:'avgT', yKey:'pressure', zKey:'concentration', xLabel:'Средняя температура (K)', yLabel:'Давление (Па)', zLabel:'Концентрация (м⁻³)', title:'T · P → Концентрация', category:'plasma' },
    28: { xKey:'avgT', yKey:'voltage', zKey:'totalDamage', xLabel:'Средняя температура (K)', yLabel:'Напряжение (В)', zLabel:'Суммарные повреждения (дефекты/м²)', title:'T · V → Суммарные повреждения', category:'damage' },
    29: { xKey:'electronDensity', yKey:'electronTemperature', zKey:'pressure', xLabel:'Плотность электронов (м⁻³)', yLabel:'Температура электронов (K)', zLabel:'Давление (Па)', title:'Давление от параметров плазмы', category:'plasma' },
    30: { xKey:'ionEnergy', yKey:'electronTemperature', zKey:'electronDensity', xLabel:'Энергия иона (эВ)', yLabel:'Температура электронов (K)', zLabel:'Плотность электронов (м⁻³)', title:'Плотность электронов от энергетики', category:'plasma' },
    31: { xKey:'currentDensity', yKey:'electronDensity', zKey:'electronVelocity', xLabel:'Плотность тока (А/м²)', yLabel:'Плотность электронов (м⁻³)', zLabel:'Скорость электронов (м/с)', title:'Кинетика электронов от тока и концентрации', category:'plasma' },
    32: { xKey:'pressure', yKey:'electronTemperature', zKey:'currentDensity', xLabel:'Давление (Па)', yLabel:'Температура электронов (K)', zLabel:'Плотность тока (А/м²)', title:'Ток от термодинамических параметров плазмы', category:'plasma' },
    33: { xKey:'voltage', yKey:'pressure', zKey:'electronDensity', xLabel:'Напряжение (В)', yLabel:'Давление (Па)', zLabel:'Плотность электронов (м⁻³)', title:'Разрядные характеристики: V·P → n_e', category:'plasma' },
    34: { xKey:'ionEnergy', yKey:'avgTransferredPerAtom', zKey:'totalTransferredEnergy',xLabel:'Энергия иона (эВ)', yLabel:'Энергия на атом (эВ)', zLabel:'Полная переданная энергия (Дж)', title:'Баланс энергии: ион → атом → полная', category:'energy' },
    35: { xKey:'voltage', yKey:'electronVelocity', zKey:'totalTransferredEnergy',xLabel:'Напряжение (В)', yLabel:'Скорость электронов (м/с)', zLabel:'Полная переданная энергия (Дж)', title:'Энергопередача от скорости электронов', category:'energy' },
    36: { xKey:'currentDensity', yKey:'avgTransferredPerAtom', zKey:'concentration', xLabel:'Плотность тока (А/м²)', yLabel:'Энергия на атом (эВ)', zLabel:'Концентрация дефектов (м⁻³)', title:'Концентрация от энергопередачи', category:'energy' },
    37: { xKey:'totalMomentum', yKey:'ionEnergy', zKey:'totalTransferredEnergy',xLabel:'Суммарный импульс (кг·м/с)', yLabel:'Энергия иона (эВ)', zLabel:'Полная переданная энергия (Дж)', title:'Связь импульса и энергии в столкновениях', category:'energy' },
    38: { xKey:'totalTransferredEnergy',yKey:'depths', zKey:'concentration', xLabel:'Полная переданная энергия (Дж)', yLabel:'Глубина (м)', zLabel:'Концентрация (м⁻³)', title:'Профиль концентрации от энергии и глубины', category:'energy' },
    39: { xKey:'avgTransferredPerAtom', yKey:'pressure', zKey:'totalDamage', xLabel:'Энергия на атом (эВ)', yLabel:'Давление (Па)', zLabel:'Суммарные повреждения (дефекты/м²)', title:'Повреждения от энергии на атом и давления', category:'damage' },
    40: { xKey:'totalDamage', yKey:'totalDisplacement', zKey:'concentration', xLabel:'Суммарные повреждения (дефекты/м²)', yLabel:'Суммарное смещение (м)', zLabel:'Концентрация дефектов (м⁻³)', title:'Концентрация от повреждений и смещений', category:'damage' },
    41: { xKey:'totalMomentum', yKey:'totalDamage', zKey:'avgT', xLabel:'Суммарный импульс (кг·м/с)', yLabel:'Суммарные повреждения (дефекты/м²)', zLabel:'Средняя температура (K)', title:'Температурные эффекты от импульса и повреждений', category:'damage' },
    42: { xKey:'currentDensity', yKey:'totalDamage', zKey:'totalTransferredEnergy',xLabel:'Плотность тока (А/м²)', yLabel:'Суммарные повреждения (дефекты/м²)', zLabel:'Полная переданная энергия (Дж)', title:'Энергетический баланс при дефектообразовании', category:'damage' },
    43: { xKey:'ionEnergy', yKey:'totalDisplacement', zKey:'totalDamage', xLabel:'Энергия иона (эВ)', yLabel:'Суммарное смещение (м)', zLabel:'Суммарные повреждения (дефекты/м²)', title:'Каскады смещений от энергии иона', category:'damage' },
    44: { xKey:'voltage', yKey:'totalDisplacement', zKey:'depths', xLabel:'Напряжение (В)', yLabel:'Суммарное смещение (м)', zLabel:'Глубина проникновения (м)', title:'Глубина проникновения дефектов', category:'damage' },
    45: { xKey:'pressure', yKey:'totalDamage', zKey:'totalDisplacement', xLabel:'Давление (Па)', yLabel:'Суммарные повреждения (дефекты/м²)', zLabel:'Суммарное смещение (м)', title:'Влияние давления на смещения', category:'damage' },
    46: { xKey:'avgT', yKey:'totalDamage', zKey:'diffusionCoefficient1', xLabel:'Средняя температура (K)', yLabel:'Суммарные повреждения (дефекты/м²)', zLabel:'Коэффициент диффузии D₁ (м²/с)', title:'Термоактивированная диффузия в повреждённом материале',category:'diffusion'},
    47: { xKey:'avgT', yKey:'concentration', zKey:'diffusionCoefficient1', xLabel:'Средняя температура (K)', yLabel:'Концентрация (м⁻³)', zLabel:'Коэффициент диффузии D₁ (м²/с)', title:'Классическая зависимость D(T, C)', category:'diffusion'},
    48: { xKey:'totalTransferredEnergy',yKey:'diffusionCoefficient1', zKey:'concentration', xLabel:'Полная переданная энергия (Дж)', yLabel:'Коэффициент диффузии D₁ (м²/с)', zLabel:'Концентрация (м⁻³)', title:'Радиационно-ускоренная диффузия', category:'diffusion'},
    49: { xKey:'diffusionCoefficient1', yKey:'depths', zKey:'concentration', xLabel:'Коэффициент диффузии D₁ (м²/с)', yLabel:'Глубина (м)', zLabel:'Концентрация (м⁻³)', title:'Диффузионный профиль концентрации', category:'diffusion'},
    50: { xKey:'avgT', yKey:'diffusionCoefficient2', zKey:'totalDamage', xLabel:'Средняя температура (K)', yLabel:'Коэффициент диффузии D₂ (м²/с)', zLabel:'Суммарные повреждения (дефекты/м²)', title:'Вторая мода диффузии и дефекты', category:'diffusion'},
    51: { xKey:'pressure', yKey:'avgT', zKey:'diffusionCoefficient1', xLabel:'Давление (Па)', yLabel:'Средняя температура (K)', zLabel:'Коэффициент диффузии D₁ (м²/с)', title:'Термобарическая диффузия', category:'diffusion'},
    52: { xKey:'voltage', zKey:'totalTransferredEnergy', yKey:'diffusionCoefficient2', xLabel:'Напряжение (В)', zLabel:'Полная переданная энергия (Дж)', yLabel:'Коэффициент диффузии D₂ (м²/с)', title:'Энергетическая стимуляция второй моды диффузии', category:'diffusion'},
    53: { xKey:'ionEnergy', yKey:'pressure', zKey:'depths', xLabel:'Энергия иона (эВ)', yLabel:'Давление (Па)', zLabel:'Глубина проникновения (м)', title:'Пробег ионов от энергии и давления', category:'plasma' },
    54: { xKey:'electronTemperature', yKey:'ionEnergy', zKey:'totalTransferredEnergy',xLabel:'Температура электронов (K)', yLabel:'Энергия иона (эВ)', zLabel:'Полная переданная энергия (Дж)', title:'Энергообмен электрон-ион-атом', category:'energy' },
    55: { xKey:'currentDensity', yKey:'totalTransferredEnergy', zKey:'avgT', xLabel:'Плотность тока (А/м²)', yLabel:'Полная переданная энергия (Дж)', zLabel:'Средняя температура (K)', title:'Нагрев от плотности тока и энергопередачи', category:'thermal' },
    56: { xKey:'voltage', yKey:'depths', zKey:'concentration', xLabel:'Напряжение (В)', yLabel:'Глубина (м)', zLabel:'Концентрация (м⁻³)', title:'Профиль концентрации от напряжения и глубины', category:'energy' },
    57: { xKey:'electronVelocity', yKey:'ionEnergy', zKey:'currentDensity', xLabel:'Скорость электронов (м/с)', yLabel:'Энергия иона (эВ)', zLabel:'Плотность тока (А/м²)', title:'Транспортные свойства плазмы', category:'plasma' },
    58: { xKey:'totalMomentum', yKey:'avgT', zKey:'totalDisplacement', xLabel:'Суммарный импульс (кг·м/с)', yLabel:'Средняя температура (K)', zLabel:'Суммарное смещение (м)', title:'Термоактивированные смещения', category:'damage' },
    59: { xKey:'diffusionCoefficient1', yKey:'totalTransferredEnergy', zKey:'depths', xLabel:'Коэффициент диффузии D₁ (м²/с)', yLabel:'Полная переданная энергия (Дж)', zLabel:'Глубина проникновения (м)', title:'Глубина диффузии от энергии', category:'diffusion'},
    60: { xKey:'concentration', yKey:'avgT', zKey:'totalDamage', xLabel:'Концентрация (м⁻³)', yLabel:'Средняя температура (K)', zLabel:'Суммарные повреждения (дефекты/м²)', title:'Отжиг дефектов', category:'damage' },

    // НОВЫЕ 25 ГРАФИКОВ (61-85)

    // Флюенс и накопление дозы (5 графиков: 61-65)
    61: { xKey:'ionFlux', yKey:'fluence', zKey:'currentDensity', xLabel:'Поток ионов (м⁻²·с⁻¹)', yLabel:'Флюенс (м⁻²)', zLabel:'Плотность тока (А/м²)', title:'Накопление флюенса по потоку и плотности тока', category:'fluence' },
    62: { xKey:'fluence', yKey:'totalDamage', zKey:'avgT', xLabel:'Флюенс (м⁻²)', yLabel:'Суммарные повреждения (дефекты/м²)', zLabel:'Средняя температура (K)', title:'Повреждения от интегрального флюенса', category:'fluence' },
    63: { xKey:'fluence', yKey:'concentration', zKey:'depths', xLabel:'Флюенс (м⁻²)', yLabel:'Концентрация (м⁻³)', zLabel:'Глубина (м)', title:'Профиль концентрации от флюенса', category:'fluence' },
    64: { xKey:'fluence', yKey:'fluenceEff', zKey:'resonanceXi', xLabel:'Флюенс (м⁻²)', yLabel:'Эффективный флюенс (м⁻²)', zLabel:'Резонансный параметр ξ', title:'Эффективный флюенс: реальный vs усиленный', category:'fluence' },
    65: { xKey:'voltage', yKey:'fluence', zKey:'ionFlux', xLabel:'Напряжение (В)', yLabel:'Флюенс (м⁻²)', zLabel:'Поток ионов (м⁻²·с⁻¹)', title:'Накопление дозы от режима разряда', category:'fluence' },

    // Резонансные эффекты (66-70)
    66: { xKey:'ionEnergy', yKey:'resonanceXi', zKey:'concentration', xLabel:'Энергия иона (эВ)', yLabel:'Резонансный параметр ξ', zLabel:'Концентрация (м⁻³)', title:'Резонансное усиление от энергии иона', category:'resonance' },
    67: { xKey:'resonanceXi', yKey:'dRes', zKey:'diffusionCoefficient1', xLabel:'Резонансный параметр ξ', yLabel:'Резонансный вклад в D (м²/с)', zLabel:'D₁ (м²/с)', title:'Резонансный вклад в диффузию', category:'resonance' },
    68: { xKey:'voltage', yKey:'resonanceXi', zKey:'pressure', xLabel:'Напряжение (В)', yLabel:'Резонансный параметр ξ', zLabel:'Давление (Па)', title:'Резонанс от параметров плазмы', category:'resonance' },
    69: { xKey:'resonanceXi', yKey:'fluenceEff', zKey:'totalDamage', xLabel:'Резонансный параметр ξ', yLabel:'Эффективный флюенс (м⁻²)', zLabel:'Суммарные повреждения (дефекты/м²)', title:'Усиление флюенса и повреждения', category:'resonance' },
    70: { xKey:'avgT', yKey:'resonanceXi', zKey:'dRes', xLabel:'Средняя температура (K)', yLabel:'Резонансный параметр ξ', zLabel:'Резонансный вклад в D (м²/с)', title:'Температурная зависимость резонансной диффузии', category:'resonance' },

// SLR (перемешивание поверхности) (71-75)
    71: { xKey:'fluence', yKey:'dSlr', zKey:'totalDamage', xLabel:'Флюенс (м⁻²)', yLabel:'Вклад SLR в D (м²/с)', zLabel:'Суммарные повреждения (дефекты/м²)', title:'SLR-диффузия от флюенса и повреждений', category:'slr' },
    72: { xKey:'dSlr', yKey:'diffusionCoefficient1', zKey:'avgT', xLabel:'Вклад SLR в D (м²/с)', yLabel:'D₁ (м²/с)', zLabel:'Средняя температура (K)', title:'Вклад SLR в термическую диффузию', category:'slr' },
    73: { xKey:'voltage', yKey:'dSlr', zKey:'currentDensity', xLabel:'Напряжение (В)', yLabel:'Вклад SLR в D (м²/с)', zLabel:'Плотность тока (А/м²)', title:'SLR от режима обработки', category:'slr' },
    74: { xKey:'totalDamage', yKey:'dSlr', zKey:'fluenceEff', xLabel:'Суммарные повреждения (дефекты/м²)', yLabel:'Вклад SLR в D (м²/с)', zLabel:'Эффективный флюенс (м⁻²)', title:'Баллистическое перемешивание', category:'slr' },
    75: { xKey:'pressure', yKey:'dSlr', zKey:'ionFlux', xLabel:'Давление (Па)', yLabel:'Вклад SLR в D (м²/с)', zLabel:'Поток ионов (м⁻²·с⁻¹)', title:'SLR от параметров потока', category:'slr' },

// Радиационно-ускоренная диффузия (76-80)
    76: {
        xKey:'dSlr',
        yKey:'dRes',
        zKey:'diffusionCoefficient1',
        xLabel:'Вклад SLR в D (м²/с)',
        yLabel:'Резонансный вклад в D (м²/с)',
        zLabel:'D₁ (м²/с)',
        title:'Сравнение механизмов радиационной диффузии',
        category:'rad_diffusion'
    },
    77: {
        xKey:'dSlr_plus_dRes',           // вычисляемое поле
        yKey:'diffusionCoefficient1',
        zKey:'avgT',
        xLabel:'Вклад SLR в D + Резонансный вклад в D (м²/с)',
        yLabel:'D₁ (м²/с)',
        zLabel:'Средняя температура (K)',
        title:'Полная радиационная диффузия',
        category:'rad_diffusion'
    },
    78: {
        xKey:'diffusionCoefficient1',
        yKey:'diffusionCoefficient2',
        zKey:'fluenceEff',
        xLabel:'D₁ (м²/с)',
        yLabel:'D₂ (м²/с)',
        zLabel:'Эффективный флюенс (м⁻²)',
        title:'Сравнение коэффициентов диффузии от флюенса',
        category:'rad_diffusion'
    },
    79: {
        xKey:'ionEnergy',
        yKey:'dSlr_plus_dRes',           // вычисляемое поле
        zKey:'totalDamage',
        xLabel:'Энергия иона (эВ)',
        yLabel:'Вклад SLR в D + Резонансный вклад в D (м²/с)',
        zLabel:'Суммарные повреждения (дефекты/м²)',
        title:'Энергетическая стимуляция диффузии',
        category:'rad_diffusion'
    },
    80: {
        xKey:'depths',
        yKey:'diffusionCoefficient1',
        zKey:'dRes',                     // или 'dRes' — на ваш выбор
        xLabel:'Глубина (м)',
        yLabel:'D₁ (м²/с)',
        zLabel:'Резонансный вклад в D (м²/с)',
        title:'Профиль радиационной диффузии',
        category:'rad_diffusion'
    },

// Потоковые характеристики (81-85)
    81: { xKey:'ionFlux', yKey:'concentration', zKey:'depths', xLabel:'Поток ионов (м⁻²·с⁻¹)', yLabel:'Концентрация (м⁻³)', zLabel:'Глубина (м)', title:'Концентрация от ионного потока и глубины', category:'flux' },
    82: { xKey:'ionFlux', yKey:'totalDamage', zKey:'avgT', xLabel:'Поток ионов (м⁻²·с⁻¹)', yLabel:'Суммарные повреждения (дефекты/м²)', zLabel:'Средняя температура (K)', title:'Скорость дефектообразования', category:'flux' },
    83: { xKey:'currentDensity', yKey:'ionFlux', zKey:'voltage', xLabel:'Плотность тока (А/м²)', yLabel:'Поток ионов (м⁻²·с⁻¹)', zLabel:'Напряжение (В)', title:'Связь электрического тока и ионного потока', category:'flux' },
    84: { xKey:'ionFlux', yKey:'totalTransferredEnergy', zKey:'ionEnergy', xLabel:'Поток ионов (м⁻²·с⁻¹)', yLabel:'Полная переданная энергия (Дж)', zLabel:'Энергия иона (эВ)', title:'Мощность энергопередачи', category:'flux' },
    85: { xKey:'ionFlux', yKey:'fluenceEffRatio', zKey:'resonanceXi', xLabel:'Поток ионов (м⁻²·с⁻¹)', yLabel:'Φ_eff / Φ', zLabel:'Резонансный параметр ξ', title:'Коэффициент усиления потока', category:'flux' }
};

const Trends = {
    average: arr => arr.reduce((a, b) => a + b, 0) / (arr.length || 1)
};

class TrendPredictor {
    static getTrend(values) {
        const v = values.filter(x => isFinite(x) && !isNaN(x));
        if (v.length < 2) return 'up';

        const third = Math.max(1, Math.ceil(v.length / 3));
        const avgFirst = Trends.average(v.slice(0, third));
        const avgLast  = Trends.average(v.slice(-third));

        const diff = avgLast - avgFirst;

        // Любое изменение считается трендом
        if (Math.abs(diff) < 1e-15) {
            // Если разница меньше машинной точности, считаем ростом
            return 'up';
        }

        return diff > 0 ? 'up' : 'down';
    }
}

// ==============================================================
// Chart Renderer – 3D surface
// ==============================================================
class ChartRenderer {
    static createMeshGrid(xV, yV, zV) {
        const idx = [];
        for (let i = 0; i < xV.length; i++)
            if (isFinite(xV[i]) && isFinite(yV[i]) && isFinite(zV[i]))
                idx.push(i);

        if (idx.length < 3)
            return { xGrid: [[0,1],[0,1]], yGrid: [[0,0],[1,1]], zGrid: [[0,0],[0,0]] };

        const vx = idx.map(i => xV[i]), vy = idx.map(i => yV[i]), vz = idx.map(i => zV[i]);
        const xMin = Math.min(...vx), xMax = Math.max(...vx);
        const yMin = Math.min(...vy), yMax = Math.max(...vy);
        const gs = Math.min(Math.max(Math.floor(Math.sqrt(idx.length)), 15), 30);
        const xs = (xMax - xMin) / (gs - 1) || 1, ys = (yMax - yMin) / (gs - 1) || 1;
        const xGrid = [], yGrid = [], zGrid = [];

        for (let i = 0; i < gs; i++) {
            const xR = [], yR = [], zR = [];
            for (let j = 0; j < gs; j++) {
                const x = xMin + j * xs, y = yMin + i * ys;
                xR.push(x); yR.push(y);
                zR.push(this._idw(x, y, vx, vy, vz));
            }
            xGrid.push(xR); yGrid.push(yR); zGrid.push(zR);
        }
        return { xGrid, yGrid, zGrid };
    }

    static _idw(x, y, xV, yV, zV) {
        const xMin = Math.min(...xV), xMax = Math.max(...xV);
        const yMin = Math.min(...yV), yMax = Math.max(...yV);
        const xR = xMax - xMin || 1, yR = yMax - yMin || 1;
        const xn = (x - xMin) / xR, yn = (y - yMin) / yR;

        const dists = xV.map((xi, i) => {
            const dx = xn - (xi - xMin) / xR;
            const dy = yn - (yV[i] - yMin) / yR;
            return { d: Math.sqrt(dx * dx + dy * dy), z: zV[i] };
        });

        const exact = dists.find(p => p.d < 1e-10);
        if (exact) return exact.z;

        dists.sort((a, b) => a.d - b.d);
        const k = Math.min(Math.max(5, Math.floor(xV.length / 10)), 20);
        const near = dists.slice(0, k);
        let ws = 0, wz = 0;

        near.forEach(p => {
            const w = 1 / Math.pow(p.d + 1e-10, 2);
            wz += p.z * w;
            ws += w;
        });

        const r = ws > 0 ? wz / ws : near[0].z;
        return isFinite(r) ? r : near[0].z;
    }

    static getColorScale(cat) {
        return {
            plasma:'Viridis', energy:'Hot', thermal:'RdYlBu',
            diffusion:'Portland', damage:'Reds',
            fluence:'Electric', resonance:'Cividis', slr:'Magma',
            rad_diffusion:'YlOrRd', flux:'Jet'
        }[cat] || 'Viridis';
    }

    static getStats(values) {
        const f = values.filter(v => isFinite(v) && !isNaN(v));
        if (!f.length) return { min:0, max:0, avg:0 };
        const min = Math.min(...f), max = Math.max(...f);
        return { min, max, avg: Trends.average(f) };
    }

    static create3DChart(containerEl, data, config, opts = {}) {
        const { xGrid, yGrid, zGrid } = this.createMeshGrid(data.xValues, data.yValues, data.zValues);

        const xTrend = TrendPredictor.getTrend(data.xValues);
        const yTrend = TrendPredictor.getTrend(data.yValues);
        const zTrend = TrendPredictor.getTrend(data.zValues);

        const xTitle = `${config.xLabel} ${xTrend === 'up' ? '→' : xTrend === 'down' ? '←' : ''}`;
        const yTitle = `${config.yLabel} ${yTrend === 'up' ? '→' : yTrend === 'down' ? '←' : ''}`;
        const zTitle = `${config.zLabel} ${zTrend === 'up' ? '↑' : zTrend === 'down' ? '↓' : ''}`;

        const surfaceTrace = {
            type: 'surface',
            x: xGrid, y: yGrid, z: zGrid,
            colorscale: this.getColorScale(config.category),
            colorbar: {
                title: { text: config.zLabel, side: 'right', font: { size: 11 } },
                thickness: 15, len: 0.75,
                x: 1.02, xanchor: 'left', xpad: 0,
                outlinewidth: 0, tickfont: { size: 9 }
            },
            contours: { z: { show: true, usecolormap: true, highlightcolor: '#42f462', project: { z: true } } },
            hovertemplate: `${config.xLabel}: %{x:.3g}<br>${config.yLabel}: %{y:.3g}<br>${config.zLabel}: %{z:.3g}<extra></extra>`,
            showscale: true
        };

        const sceneBg = opts.transparent ? 'rgba(220,220,220,0.4)' : 'rgb(240,240,240)';
        const layout = {
            scene: {
                xaxis: { title: { text: xTitle, font: { size: 12 } }, backgroundcolor: sceneBg, gridcolor: 'white', showbackground: true, tickfont: { size: 9 } },
                yaxis: { title: { text: yTitle, font: { size: 12 } }, backgroundcolor: sceneBg, gridcolor: 'white', showbackground: true, tickfont: { size: 9 } },
                zaxis: { title: { text: zTitle, font: { size: 12 } }, backgroundcolor: sceneBg, gridcolor: 'white', showbackground: true, tickfont: { size: 9 } },
                camera: { eye: { x: 1.6, y: 1.6, z: 1.2 } }
            },
            margin: { l: 10, r: 10, t: 30, b: 10 },
            paper_bgcolor: opts.transparent ? 'rgba(0,0,0,0)' : '#ffffff',
            plot_bgcolor:  opts.transparent ? 'rgba(0,0,0,0)' : '#ffffff',
            font: { family: 'Inter, sans-serif', size: 11, color: '#374151' },
            autosize: true
        };

        Plotly.newPlot(containerEl, [surfaceTrace], layout, {
            responsive: true, displayModeBar: true, displaylogo: false,
            modeBarButtonsToRemove: ['pan3d', 'select3d', 'lasso3d']
        });
    }

    static buildExportLayout(config, data, cameraPosition = null) {
        const xTrend = TrendPredictor.getTrend(data.xValues);
        const yTrend = TrendPredictor.getTrend(data.yValues);
        const zTrend = TrendPredictor.getTrend(data.zValues);

        const arrow = { up: '▲', down: '▼' };

        const xTitle = `${config.xLabel} ${arrow[xTrend]}`;
        const yTitle = `${config.yLabel} ${arrow[yTrend]}`;
        const zTitle = `${config.zLabel} ${arrow[zTrend]}`;

        return {
            width: EXPORT_W_PX,
            height: EXPORT_H_PX,
            scene: {
                domain: { x: [0.00, 0.85], y: [0.00, 1.00] },
                aspectmode: 'manual',
                aspectratio: { x: 1.20, y: 1.00, z: 0.75 },
                camera: cameraPosition || { eye: { x: 1.45, y: 1.50, z: 1.05 } },
                xaxis: {
                    title: { text: xTitle, font: { size: 32, color: '#0f172a', family: 'Arial, sans-serif', weight: 600 } },
                    tickfont: { size: 20, color: '#1e293b', family: 'Arial, sans-serif' },
                    backgroundcolor: 'rgb(248,250,252)',
                    gridcolor: '#cbd5e1',
                    gridwidth: 2,
                    zerolinecolor: '#94a3b8',
                    zerolinewidth: 2,
                    showbackground: true,
                    nticks: 8
                },
                yaxis: {
                    title: { text: yTitle, font: { size: 32, color: '#0f172a', family: 'Arial, sans-serif', weight: 600 } },
                    tickfont: { size: 20, color: '#1e293b', family: 'Arial, sans-serif' },
                    backgroundcolor: 'rgb(248,250,252)',
                    gridcolor: '#cbd5e1',
                    gridwidth: 2,
                    zerolinecolor: '#94a3b8',
                    zerolinewidth: 2,
                    showbackground: true,
                    nticks: 8
                },
                zaxis: {
                    title: { text: zTitle, font: { size: 32, color: '#0f172a', family: 'Arial, sans-serif', weight: 600 } },
                    tickfont: { size: 20, color: '#1e293b', family: 'Arial, sans-serif' },
                    backgroundcolor: 'rgb(248,250,252)',
                    gridcolor: '#cbd5e1',
                    gridwidth: 2,
                    zerolinecolor: '#94a3b8',
                    zerolinewidth: 2,
                    showbackground: true,
                    nticks: 8
                },
                bgcolor: '#ffffff'
            },
            margin: { l: 0, r: 0, t: 0, b: 0 },
            paper_bgcolor: '#ffffff',
            plot_bgcolor: '#ffffff',
            font: { family: 'Arial, sans-serif', size: 28, color: '#0f172a' },
            showlegend: false,
            autosize: false
        };
    }

    static buildExportTrace(xGrid, yGrid, zGrid, config) {
        return {
            type: 'surface',
            x: xGrid,
            y: yGrid,
            z: zGrid,
            colorscale: this.getColorScale(config.category),
            showscale: false,
            contours: {
                z: {
                    show: true,
                    usecolormap: true,
                    highlightcolor: '#0ea5e9',
                    highlightwidth: 4,
                    project: { z: true },
                    width: 2
                }
            },
            opacity: 1,
            hoverinfo: 'skip',
            lighting: {
                ambient: 0.6,
                diffuse: 0.7,
                specular: 0.3,
                roughness: 0.5,
                fresnel: 0.2
            },
            lightposition: {
                x: 10000,
                y: 10000,
                z: 10000
            }
        };
    }

    static async renderToDataUrl(data, config) {
        return this.renderToDataUrlWithCamera(data, config, null);
    }

    static async renderToDataUrlWithCamera(data, config, cameraPosition = null) {
        const { xGrid, yGrid, zGrid } = this.createMeshGrid(data.xValues, data.yValues, data.zValues);

        const container = document.createElement('div');
        container.style.cssText = `
            position: fixed;
            left: -30000px;
            top: 0;
            width: ${EXPORT_W_PX}px;
            height: ${EXPORT_H_PX}px;
            background: #ffffff;
            pointer-events: none;
            overflow: hidden;
            z-index: -1000;
        `;
        document.body.appendChild(container);

        try {
            const trace = this.buildExportTrace(xGrid, yGrid, zGrid, config);
            const layout = this.buildExportLayout(config, data, cameraPosition);

            const plotConfig = {
                responsive: false,
                displayModeBar: false,
                displaylogo: false,
                staticPlot: true,
                toImageButtonOptions: {
                    format: 'png',
                    width: EXPORT_W_PX,
                    height: EXPORT_H_PX,
                    scale: 1
                }
            };

            await Plotly.newPlot(container, [trace], layout, plotConfig);

            // Даём время WebGL отрендерить всё качественно
            await new Promise(resolve => setTimeout(resolve, 2000));

            const rawDataUrl = await Plotly.toImage(container, {
                format: 'png',
                width: EXPORT_W_PX,
                height: EXPORT_H_PX,
                scale: 1
            });

            const finalDataUrl = await composeChartWithColorbar(rawDataUrl, config, data);
            return finalDataUrl;
        } finally {
            try {
                Plotly.purge(container);
            } catch (_) {}
            container.remove();
        }
    }
}

// ==============================================================
// Data Loader
// ==============================================================
class DataLoader {
    static async loadResults() {
        const response = await window.PlasmaAuth.apiRequest('/results/config', null, true);
        if (!response.ok) throw new Error('Failed to load results');
        return response.data?.data || [];
    }

    /**
     * Extract values for a given key, supporting composite computed keys:
     *   dSlr_plus_dRes           → item.dSlr + item.dRes
     *   dSlr_plus_dRes_div_d1    → (item.dSlr + item.dRes) / item.diffusionCoefficient1
     *   fluenceEffRatio          → item.fluenceEff / item.fluence
     *   fluenceEff_div_fluence   → item.fluenceEff / item.fluence (alias)
     */
    static extractValues(data, key) {
        if (key === 'dSlr_plus_dRes') {
            return data.map(item => (item['d_Slr'] || 0) + (item['d_Res'] || 0));
        }
        if (key === 'dSlr_plus_dRes_div_d1') {
            return data.map(item => {
                const sum = (item['d_Slr'] || 0) + (item['d_Res'] || 0);
                const d1  = item['diffusionCoefficient1'] || 1;
                return sum / (d1 || 1);
            });
        }
        if (key === 'fluenceEffRatio' || key === 'fluenceEff_div_fluence') {
            return data.map(item => {
                const fl = item['fluence'] || 1;
                return (item['fluenceEff'] || 0) / (fl || 1);
            });
        }

        return data.map(item => {
            if (key.includes('.')) {
                let v = item;
                for (const p of key.split('.')) { v = v?.[p]; if (v === undefined) break; }
                return v || 0;
            }
            return item[key] || 0;
        });
    }

    static prepareChartData(data, config) {
        return {
            xValues: this.extractValues(data, config.xKey),
            yValues: this.extractValues(data, config.yKey),
            zValues: this.extractValues(data, config.zKey)
        };
    }
}

// ==============================================================
// UI Manager
// ==============================================================
class UIManager {
    static chartObserver = null;
    static loadedCharts = new Set();

    static showLoading() {
        document.getElementById('loadingState').style.display = 'flex';
        document.getElementById('noDataState').style.display = 'none';
        document.getElementById('chartsGrid').style.display = 'none';
    }

    static showNoData() {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('noDataState').style.display = 'flex';
        document.getElementById('chartsGrid').style.display = 'none';
    }

    static showCharts() {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('noDataState').style.display = 'none';
        document.getElementById('chartsGrid').style.display = 'grid';
        document.getElementById('exportActions').style.display = 'flex';
        document.getElementById('filterControls').style.display = 'block';
    }

    static renderCharts(data) {
        const grid = document.getElementById('chartsGrid');
        grid.innerHTML = '';

        const cats = {};
        Object.entries(CHART_CONFIGS).forEach(([id, cfg]) => {
            (cats[cfg.category] = cats[cfg.category] || []).push({ id, config: cfg });
        });

        Object.entries(cats).forEach(([cat, charts]) =>
            grid.appendChild(this.createCategorySection(cat, charts, data))
        );

        this.showCharts();
        this.initLazyLoading(data);
    }

    static initLazyLoading(data) {
        this.chartObserver = new IntersectionObserver(entries => {
            entries.forEach(e => {
                const id = e.target.dataset.chartId;
                if (e.isIntersecting) {
                    if (!this.loadedCharts.has(id)) this.loadChart(id, data);
                } else {
                    this.unloadChart(id);
                }
            });
        }, { rootMargin: '200px', threshold: 0.01 });

        document.querySelectorAll('.chart-container[data-chart-id]')
            .forEach(c => this.chartObserver.observe(c));
    }

    static loadChart(chartId, data) {
        const cid = `chart-${chartId}`;
        const el = document.getElementById(cid);
        if (!el || el.dataset.loaded === 'true') return;

        if (this.loadedCharts.size >= 12) {
            const oldest = this.loadedCharts.values().next().value;
            this.unloadChart(oldest);
        }

        const config    = CHART_CONFIGS[chartId];
        const chartData = DataLoader.prepareChartData(data, config);

        try {
            ChartRenderer.create3DChart(cid, chartData, config);
            el.dataset.loaded = 'true';
            this.loadedCharts.add(chartId);
            this.updateCounter();
            this._updateTrendBadges(chartId, chartData, config);

            // Add loaded class to parent card for camera icon animation
            const card = el.closest('.chart-card');
            if (card) {
                setTimeout(() => {
                    card.classList.add('chart-loaded');
                }, 300);
            }
        } catch (err) {
            console.error(`[Charts] Failed #${chartId}:`, err);
        }
    }

    static unloadChart(chartId) {
        const el = document.getElementById(`chart-${chartId}`);
        if (!el || el.dataset.loaded !== 'true') return;
        try { Plotly.purge(`chart-${chartId}`); } catch {}
        el.dataset.loaded = 'false';
        this.loadedCharts.delete(chartId);
    }

    static updateCounter() {
        const wrap = document.getElementById('chartsCounter');
        if (wrap) {
            wrap.style.display = 'flex';
            document.getElementById('loadedCount').textContent = this.loadedCharts.size;
            document.getElementById('totalCount').textContent = Object.keys(CHART_CONFIGS).length;
        }
    }

    static _updateTrendBadges(chartId, chartData, config) {
        const legend = document.getElementById(`legend-${chartId}`);
        if (!legend) return;
        const trendEl = legend.querySelector('.legend-trends');
        if (!trendEl) return;

        const axes = [
            { label: config.xLabel, values: chartData.xValues, axis: 'X' },
            { label: config.yLabel, values: chartData.yValues, axis: 'Y' },
            { label: config.zLabel, values: chartData.zValues, axis: 'Z' }
        ];

        trendEl.innerHTML = '';
        axes.forEach(ax => {
            const t    = TrendPredictor.getTrend(ax.values);
            const span = document.createElement('span');
            span.className = `trend-item ${t}`;
            if (t === 'up')   { span.innerHTML = `<i class="fas fa-arrow-up"></i> ${ax.axis}: рост`;  span.title = `Рост: ${ax.label}`; }
            else if (t === 'down') { span.innerHTML = `<i class="fas fa-arrow-down"></i> ${ax.axis}: спад`; span.title = `Спад: ${ax.label}`; }
            else              { span.innerHTML = `<i class="fas fa-minus"></i> ${ax.axis}: стаб.`;    span.title = `Без изменений: ${ax.label}`; }
            trendEl.appendChild(span);
        });
    }

    static createCategorySection(category, charts, data) {
        const sec = document.createElement('div');
        sec.className = 'category-section';
        sec.dataset.category = category;

        const info = {
            plasma:        { title:'Параметры плазмы',                      description:'Электронные характеристики и плазменные процессы',         icon:'fa-atom'            },
            energy:        { title:'Энергетические характеристики',          description:'Перенос и распределение энергии',                          icon:'fa-fire'            },
            thermal:       { title:'Температурные профили',                  description:'Распределение температуры по глубине',                     icon:'fa-thermometer-half'},
            diffusion:     { title:'Диффузионные процессы',                  description:'Коэффициенты диффузии, радиационные механизмы и профили',   icon:'fa-chart-line'      },
            damage:        { title:'Радиационное повреждение',               description:'Дефекты, импульс и смещение атомов',                       icon:'fa-radiation-alt'   },
            fluence:       { title:'Флюенс и накопление дозы',               description:'Интегральный поток ионов, эффективный флюенс и временная кинетика', icon:'fa-clock'    },
            resonance:     { title:'Резонансные эффекты',                    description:'Резонансное усиление диффузии и взаимодействие с плазмой',  icon:'fa-wave-square' },
            slr:           { title:'SLR – перемешивание поверхности',        description:'Баллистическое перемешивание и SLR-диффузия',              icon:'fa-sync-alt'          },
            rad_diffusion: { title:'Радиационно-ускоренная диффузия',        description:'Сравнение SLR и резонансных механизмов диффузии',          icon:'fa-bezier-curve'    },
            flux:          { title:'Потоковые характеристики',               description:'Ионный поток и скорость дефектообразования',               icon:'fa-wind'            }
        }[category] || { title: category, description: '', icon: 'fa-chart-area' };

        sec.innerHTML = `
            <div class="category-header">
                <div class="category-icon ${category}"><i class="fas ${info.icon}"></i></div>
                <div><h2>${info.title}</h2><p>${info.description}</p></div>
            </div>`;

        charts.forEach(({ id, config }) =>
            sec.appendChild(this.createChartCard(id, config, data))
        );
        return sec;
    }

    static createChartCard(id, config, data) {
        const card = document.createElement('div');
        card.className = 'chart-card';
        const cid = `chart-${id}`;
        const chartData = DataLoader.prepareChartData(data, config);
        const stats = ChartRenderer.getStats(chartData.zValues);

        const swatchMap = {
            Viridis:  'linear-gradient(90deg,#440154,#31688e,#35b779,#fde725)',
            Hot:      'linear-gradient(90deg,#000,#f00,#ff0,#fff)',
            RdYlBu:   'linear-gradient(90deg,#313695,#74add1,#ffffbf,#d73027)',
            Portland: 'linear-gradient(90deg,#0c3383,#ea6a47,#f9d057)',
            Reds:     'linear-gradient(90deg,#fff5f0,#fc8a6a,#a50f15)',
            Electric: 'linear-gradient(90deg,#000,#9400d3,#00bfff,#fff)',
            Cividis:  'linear-gradient(90deg,#00224e,#5a6c8a,#b8b974,#fde738)',
            Magma:    'linear-gradient(90deg,#000004,#3b0f70,#f05b12,#fcfdbf)',
            YlOrRd:   'linear-gradient(90deg,#ffffcc,#fd8d3c,#bd0026)',
            Jet:      'linear-gradient(90deg,#00007f,#0000ff,#00ffff,#ffff00,#ff0000,#7f0000)'
        };
        const swatch = swatchMap[ChartRenderer.getColorScale(config.category)] || swatchMap.Viridis;

        card.innerHTML = `
            <div class="chart-header">
                <div class="chart-title">
                    <div class="chart-number">${id}</div>
                    <h3>${config.title}</h3>
                </div>
                <div class="chart-actions">
                    <button class="chart-btn" onclick="downloadChart(${id})" title="Скачать PNG">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="chart-btn" onclick="fullscreenChart(${id})" title="На весь экран">
                        <i class="fas fa-expand"></i>
                    </button>
                </div>
            </div>

            <div class="chart-body">
                <div class="chart-container" id="${cid}" data-chart-id="${id}" data-loaded="false">
                    <div class="chart-placeholder">
                        <i class="fas fa-chart-area"></i>
                        <span>График загрузится при прокрутке…</span>
                    </div>
                </div>
            </div>

            <div class="chart-legend" id="legend-${id}">
                <div class="chart-legend-item">
                    <div class="chart-legend-swatch" style="background:${swatch}"></div>
                    <span><strong>Z</strong> ${config.zLabel}</span>
                </div>
                <div class="chart-legend-item">
                    <span class="axis-badge axis-x">X</span>
                    <span>${config.xLabel}</span>
                </div>
                <div class="chart-legend-item">
                    <span class="axis-badge axis-y">Y</span>
                    <span>${config.yLabel}</span>
                </div>
                <div class="legend-trends"></div>
            </div>

            <div class="word-export-bar">
                <button class="btn-word" onclick="downloadChartForWord(${id})" title="Экспорт в Word с сохранением текущего ракурса 3D графика">
                    <i class="fas fa-file-word"></i> Экспорт в Word (.docx)
                </button>
                <button class="btn-png-word" onclick="downloadChartPng(${id})" title="Скачать PNG в высоком разрешении (3200×2000) с текущим углом обзора">
                    <i class="fas fa-image"></i> Скачать PNG (HD)
                </button>
                <span class="export-hint" title="Покрутите график мышью, затем нажмите экспорт - сохранится именно этот угол!">
                    <i class="fas fa-video"></i> Сохраняет текущий угол обзора
                </span>
            </div>

            <div class="chart-info">
                <div class="chart-info-item">
                    <i class="fas fa-arrow-down"></i>
                    <span class="chart-info-label">Мин:</span>
                    <span class="chart-info-value">${stats.min.toExponential(2)}</span>
                </div>
                <div class="chart-info-item">
                    <i class="fas fa-arrow-up"></i>
                    <span class="chart-info-label">Макс:</span>
                    <span class="chart-info-value">${stats.max.toExponential(2)}</span>
                </div>
                <div class="chart-info-item">
                    <i class="fas fa-equals"></i>
                    <span class="chart-info-label">Средн:</span>
                    <span class="chart-info-value">${stats.avg.toExponential(2)}</span>
                </div>
                <div class="chart-info-item">
                    <i class="fas fa-database"></i>
                    <span class="chart-info-label">Точек:</span>
                    <span class="chart-info-value">${chartData.xValues.length}</span>
                </div>
            </div>`;

        return card;
    }
}

// ==============================================================
// Helpers
// ==============================================================
function dataUrlToUint8Array(dataUrl) {
    const base64 = dataUrl.split(',')[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

function dataUrlToImage(dataUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = dataUrl;
    });
}

function hexToRgb01(hex) {
    const h = hex.replace('#', '');
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}

function lerp(a, b, t) { return a + (b - a) * t; }

function interpolateColorStops(stops, t) {
    t = Math.max(0, Math.min(1, t));
    let left = stops[0], right = stops[stops.length - 1];
    for (let i = 0; i < stops.length - 1; i++) {
        if (t >= stops[i][0] && t <= stops[i + 1][0]) { left = stops[i]; right = stops[i + 1]; break; }
    }
    const span = right[0] - left[0] || 1, k = (t - left[0]) / span;
    const c1 = hexToRgb01(left[1]), c2 = hexToRgb01(right[1]);
    return { r: Math.round(lerp(c1.r, c2.r, k)), g: Math.round(lerp(c1.g, c2.g, k)), b: Math.round(lerp(c1.b, c2.b, k)) };
}

function getColorStopsByCategory(category) {
    const scaleName = ChartRenderer.getColorScale(category);
    const scales = {
        Viridis:  [[0,'#440154'],[.25,'#31688e'],[.5,'#35b779'],[.75,'#94d840'],[1,'#fde725']],
        Hot:      [[0,'#000000'],[.33,'#ff0000'],[.66,'#ffff00'],[1,'#ffffff']],
        RdYlBu:   [[0,'#313695'],[.25,'#74add1'],[.5,'#ffffbf'],[.75,'#f46d43'],[1,'#a50026']],
        Portland: [[0,'#0c3383'],[.33,'#4393c3'],[.66,'#ea6a47'],[1,'#f9d057']],
        Reds:     [[0,'#fff5f0'],[.33,'#fc8a6a'],[.66,'#ef3b2c'],[1,'#67000d']],
        Electric: [[0,'#000000'],[.25,'#1e00a8'],[.5,'#8800dd'],[.75,'#00bfff'],[1,'#ffffff']],
        Cividis:  [[0,'#00224e'],[.33,'#2c5f8a'],[.66,'#8b9e74'],[1,'#fde738']],
        Magma:    [[0,'#000004'],[.25,'#3b0f70'],[.5,'#8c2980'],[.75,'#f05b12'],[1,'#fcfdbf']],
        YlOrRd:   [[0,'#ffffcc'],[.33,'#fd8d3c'],[.66,'#e31a1c'],[1,'#bd0026']],
        Jet:      [[0,'#00007f'],[.20,'#0000ff'],[.40,'#00ffff'],[.60,'#ffff00'],[.80,'#ff0000'],[1,'#7f0000']]
    };
    return scales[scaleName] || scales.Viridis;
}

function formatExportTick(value) {
    if (!isFinite(value)) return '0';

    const abs = Math.abs(value);

    if (abs === 0) return '0';

    // Для чисел от 0.01 до 10000 - обычная нотация
    if (abs >= 0.01 && abs < 10000) {
        if (abs >= 100) {
            return Math.round(value).toString();
        } else if (abs >= 1) {
            return Number(value).toFixed(2);
        } else {
            return Number(value).toFixed(3);
        }
    }

    // Для очень больших и очень маленьких - научная нотация
    const exp = Number(value).toExponential(2);

    // Упрощаем отображение
    const parts = exp.split('e');
    const mantissa = parseFloat(parts[0]).toFixed(1);
    const exponent = parts[1];

    return `${mantissa}e${exponent}`;
}

async function cropPlotlyImage(dataUrl) {
    const img = await dataUrlToImage(dataUrl);
    const srcW = img.naturalWidth || img.width, srcH = img.naturalHeight || img.height;
    const canvas = document.createElement('canvas');
    canvas.width = srcW; canvas.height = srcH;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, srcW, srcH); ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, srcW, srcH), data = imageData.data;
    let minX = srcW, minY = srcH, maxX = 0, maxY = 0, found = false;
    const white = 248, step = 2;
    for (let y = 0; y < srcH; y += step) {
        for (let x = 0; x < srcW; x += step) {
            const i = (y * srcW + x) * 4, r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
            const transparent = a < 10, almostWhite = r > white && g > white && b > white;
            if (!transparent && !almostWhite) {
                found = true;
                if (x < minX) minX = x; if (y < minY) minY = y; if (x > maxX) maxX = x; if (y > maxY) maxY = y;
            }
        }
    }
    if (!found) return img;
    const padX = Math.round(srcW * 0.025), padY = Math.round(srcH * 0.035);
    minX = Math.max(0, minX - padX); minY = Math.max(0, minY - padY);
    maxX = Math.min(srcW - 1, maxX + padX); maxY = Math.min(srcH - 1, maxY + padY);
    const cropW = maxX - minX + 1, cropH = maxY - minY + 1;
    const out = document.createElement('canvas');
    out.width = cropW; out.height = cropH;
    const outCtx = out.getContext('2d');
    outCtx.fillStyle = '#ffffff'; outCtx.fillRect(0, 0, cropW, cropH);
    outCtx.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
    return await dataUrlToImage(out.toDataURL('image/png'));
}

function drawManualColorbar(ctx, x, y, w, h, config, chartData) {
    const stats = ChartRenderer.getStats(chartData.zValues);
    const stops = getColorStopsByCategory(config.category);

    // Colorbar размеры - компактнее и ближе к графику
    const barW = Math.round(w * 0.25);
    const barH = Math.round(h * 0.80);
    const barX = x + Math.round(w * 0.12);
    const barY = y + Math.round(h * 0.10);

    // Градиент с улучшенной интерполяцией
    const grad = ctx.createLinearGradient(0, barY + barH, 0, barY);
    stops.forEach(([t, color]) => grad.addColorStop(t, color));

    // Рисуем colorbar с тенью
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = grad;
    ctx.fillRect(barX, barY, barW, barH);

    // Рамка colorbar
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.strokeRect(barX, barY, barW, barH);

    // Метки значений
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 26px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const ticks = 6;
    for (let i = 0; i <= ticks; i++) {
        const t = i / ticks;
        const yy = barY + barH - t * barH;
        const value = stats.min + t * (stats.max - stats.min);

        // Линия тика
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(barX + barW, yy);
        ctx.lineTo(barX + barW + 15, yy);
        ctx.stroke();

        // Текст значения
        ctx.fillStyle = '#0f172a';
        ctx.fillText(formatExportTick(value), barX + barW + 25, yy);
    }

    // Вертикальная подпись оси Z
    ctx.save();
    ctx.translate(x + Math.round(w * 0.65), y + Math.round(h * 0.50));
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 36px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const label = config.zLabel.length > 40 ? config.zLabel.slice(0, 37) + '...' : config.zLabel;
    ctx.fillText(label, 0, 0);
    ctx.restore();
}

async function composeChartWithColorbar(plotDataUrl, config, chartData) {
    const croppedPlot = await cropPlotlyImage(plotDataUrl);

    // Создаём canvas с белым фоном
    const out = document.createElement('canvas');
    out.width = EXPORT_W_PX;
    out.height = EXPORT_H_PX;
    const ctx = out.getContext('2d', { alpha: false });

    // Белый фон
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, out.width, out.height);

    // Размеры областей
    const plotW = Math.round(out.width * 0.75); // 75% для графика
    const colorW = out.width - plotW; // 25% для colorbar

    // Отступы
    const paddingLeft = Math.round(out.width * 0.02);
    const paddingTop = Math.round(out.height * 0.02);
    const paddingBottom = Math.round(out.height * 0.02);
    const paddingRight = Math.round(out.width * 0.01);

    // Целевая область для графика
    const targetPlotX = paddingLeft;
    const targetPlotY = paddingTop;
    const targetPlotW = plotW - paddingLeft - paddingRight;
    const targetPlotH = out.height - paddingTop - paddingBottom;

    // Сохраняем пропорции графика
    const sourceAspect = croppedPlot.width / croppedPlot.height;
    const targetAspect = targetPlotW / targetPlotH;

    let drawW, drawH;
    if (sourceAspect > targetAspect) {
        drawW = targetPlotW;
        drawH = Math.round(drawW / sourceAspect);
    } else {
        drawH = targetPlotH;
        drawW = Math.round(drawH * sourceAspect);
    }

    // Центрируем график
    const drawX = targetPlotX + Math.round((targetPlotW - drawW) / 2);
    const drawY = targetPlotY + Math.round((targetPlotH - drawH) / 2);

    // Рисуем график с сглаживанием
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(croppedPlot, drawX, drawY, drawW, drawH);

    // Рисуем colorbar справа
    drawManualColorbar(ctx, plotW, 0, colorW, out.height, config, chartData);

    return out.toDataURL('image/png', 1.0);
}

function notify(msg, type = 'info') {
    if (window.PlasmaAnimations?.ToastNotifications)
        window.PlasmaAnimations.ToastNotifications.show(msg, type, 3500);
    else console.info(`[Charts][${type}] ${msg}`);
}

function createProgressOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'export-progress-overlay';
    overlay.innerHTML = `
        <div class="export-progress-modal">
            <div class="progress-icon">
                <i class="fas fa-file-word"></i>
            </div>
            <h3 class="progress-title">Экспорт в Word</h3>
            <p class="progress-description">Генерация графиков в высоком качестве...</p>
            <div class="progress-bar-container">
                <div class="progress-bar" id="exportProgressBar"></div>
            </div>
            <div class="progress-stats">
                <span id="exportProgressText">0 / 0</span>
                <span id="exportProgressPercent">0%</span>
            </div>
        </div>
    `;
    return overlay;
}

function updateProgress(current, total) {
    const progressBar = document.getElementById('exportProgressBar');
    const progressText = document.getElementById('exportProgressText');
    const progressPercent = document.getElementById('exportProgressPercent');

    if (progressBar && progressText && progressPercent) {
        const percent = Math.round((current / total) * 100);
        progressBar.style.width = `${percent}%`;
        progressText.textContent = `${current} / ${total}`;
        progressPercent.textContent = `${percent}%`;
    }
}

function removeProgressOverlay() {
    const overlay = document.querySelector('.export-progress-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 300);
    }
}

async function ensureChartLoaded(chartId) {
    const el = document.getElementById(`chart-${chartId}`), config = CHART_CONFIGS[chartId];
    if (!el || el.dataset.loaded === 'true') return;
    try {
        const chartData = DataLoader.prepareChartData(ChartsState.data, config);
        ChartRenderer.create3DChart(`chart-${chartId}`, chartData, config);
        el.dataset.loaded = 'true';
        UIManager.loadedCharts.add(String(chartId));
        UIManager.updateCounter();
        UIManager._updateTrendBadges(chartId, chartData, config);
        await new Promise(r => setTimeout(r, 700));
    } catch (e) { notify('Ошибка загрузки графика: ' + e.message, 'error'); }
}

// ==============================================================
// Global Window Functions
// ==============================================================
window.downloadChart = function(chartId) {
    const el = document.getElementById(`chart-${chartId}`), config = CHART_CONFIGS[chartId];
    if (el.dataset.loaded !== 'true') {
        notify('График ещё не загружен — прокрутите до него.', 'warning');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    Plotly.downloadImage(`chart-${chartId}`, {
        format: 'png', width: 1920, height: 1080,
        filename: `plasma-chart-${chartId}-${config.title.replace(/\s+/g, '-')}`
    })
        .then(() => notify('PNG сохранён!', 'success'))
        .catch(() => notify('Ошибка сохранения PNG', 'error'));
};

window.downloadChartPng = async function(chartId) {
    const config = CHART_CONFIGS[chartId];
    notify('Генерирую HD PNG с текущим углом обзора…', 'info');
    try {
        const chartData = DataLoader.prepareChartData(ChartsState.data, config);

        // Get current camera position from the live chart
        const chartEl = document.getElementById(`chart-${chartId}`);
        let cameraPosition = null;

        if (chartEl && chartEl.dataset.loaded === 'true') {
            try {
                const plotlyDiv = chartEl.querySelector('.js-plotly-plot');
                if (plotlyDiv && plotlyDiv.layout && plotlyDiv.layout.scene && plotlyDiv.layout.scene.camera) {
                    cameraPosition = JSON.parse(JSON.stringify(plotlyDiv.layout.scene.camera));
                    console.log('Captured camera position:', cameraPosition);
                }
            } catch (e) {
                console.log('Could not capture camera position, using default');
            }
        }

        const dataUrl = await ChartRenderer.renderToDataUrlWithCamera(chartData, config, cameraPosition);
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `PlasmaLab_${chartId}_${config.title.replace(/\s+/g, '_').substring(0, 40)}.png`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        notify('HD PNG сохранён с вашим углом обзора!', 'success');
    } catch (e) { notify('Ошибка: ' + e.message, 'error'); }
};

window.downloadChartForWord = async function(chartId) {
    const lib = window.docx;
    if (!lib) { notify('Библиотека docx не загружена', 'error'); return; }

    const config = CHART_CONFIGS[chartId];
    const { Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell,
        HeadingLevel, AlignmentType, WidthType, BorderStyle, ShadingType } = lib;

    notify('Рендеринг графика с вашим углом обзора…', 'info');

    const chartData = DataLoader.prepareChartData(ChartsState.data, config);
    let imgData;
    try {
        // Get current camera position from the live chart
        const chartEl = document.getElementById(`chart-${chartId}`);
        let cameraPosition = null;

        if (chartEl && chartEl.dataset.loaded === 'true') {
            try {
                const plotlyDiv = chartEl.querySelector('.js-plotly-plot');
                if (plotlyDiv && plotlyDiv.layout && plotlyDiv.layout.scene && plotlyDiv.layout.scene.camera) {
                    cameraPosition = JSON.parse(JSON.stringify(plotlyDiv.layout.scene.camera));
                    console.log('Exporting with camera:', cameraPosition);
                }
            } catch (e) {
                console.log('Using default camera for export');
            }
        }

        const dataUrl = await ChartRenderer.renderToDataUrlWithCamera(chartData, config, cameraPosition);
        imgData = dataUrlToUint8Array(dataUrl);
    } catch (e) { notify('Ошибка снимка: ' + e.message, 'error'); return; }

    const catLabels={
        plasma:'Параметры плазмы', energy:'Энергетические характеристики',
        thermal:'Температурные профили', diffusion:'Диффузионные процессы',
        damage:'Радиационное повреждение', fluence:'Флюенс и накопление дозы',
        resonance:'Резонансные эффекты', slr:'SLR – перемешивание поверхности',
        rad_diffusion:'Радиационно-ускоренная диффузия', flux:'Потоковые характеристики'
    };

    const trends = [
        { axis: 'X', label: config.xLabel, t: TrendPredictor.getTrend(chartData.xValues) },
        { axis: 'Y', label: config.yLabel, t: TrendPredictor.getTrend(chartData.yValues) },
        { axis: 'Z', label: config.zLabel, t: TrendPredictor.getTrend(chartData.zValues) }
    ];

    const legendRows = [
        ['Ось X', config.xLabel],
        ['Ось Y', config.yLabel],
        ['Ось Z (цвет)', config.zLabel],
        ...trends.filter(tr => tr.t !== 'flat').map(tr => [
            `Тренд ${tr.axis}`,
            `${tr.t === 'up' ? '▲ Возрастает' : '▼ Убывает'}: ${tr.label}`
        ])
    ];

    const noBorder = { style: BorderStyle.NIL, size: 0, color: 'FFFFFF' };
    const cellBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

    const tableRows = legendRows.map(([key, val], i) =>
        new TableRow({
            children: [
                new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    borders: cellBorders,
                    shading: { type: ShadingType.SOLID, color: i % 2 === 0 ? 'EFF6FF' : 'DBEAFE' },
                    children: [new Paragraph({ children: [new TextRun({ text: key, bold: true, size: 20, color: '1e40af' })], spacing: { before: 60, after: 60 } })]
                }),
                new TableCell({
                    width: { size: 75, type: WidthType.PERCENTAGE },
                    borders: cellBorders,
                    shading: { type: ShadingType.SOLID, color: i % 2 === 0 ? 'F8FAFC' : 'F1F5F9' },
                    children: [new Paragraph({ children: [new TextRun({ text: val, size: 20, color: '374151' })], spacing: { before: 60, after: 60 } })]
                })
            ]
        })
    );

    const statsValues = ChartRenderer.getStats(chartData.zValues);
    const statsRows = [
        ['Минимум Z', statsValues.min.toExponential(3)],
        ['Максимум Z', statsValues.max.toExponential(3)],
        ['Среднее Z', statsValues.avg.toExponential(3)],
        ['Точек данных', String(chartData.xValues.length)]
    ].map(([key, val]) =>
        new TableRow({
            children: [
                new TableCell({
                    width: { size: 40, type: WidthType.PERCENTAGE },
                    borders: cellBorders,
                    shading: { type: ShadingType.SOLID, color: 'F0FDF4' },
                    children: [new Paragraph({ children: [new TextRun({ text: key, bold: true, size: 18, color: '166534' })], spacing: { before: 40, after: 40 } })]
                }),
                new TableCell({
                    width: { size: 60, type: WidthType.PERCENTAGE },
                    borders: cellBorders,
                    shading: { type: ShadingType.SOLID, color: 'FAFFFE' },
                    children: [new Paragraph({ children: [new TextRun({ text: val, size: 18, color: '374151', font: 'Courier New' })], spacing: { before: 40, after: 40 } })]
                })
            ]
        })
    );

    const children = [
        new Paragraph({
            children: [new TextRun({ text: catLabels[config.category] || '', size: 28, bold: true, color: '64748b', allCaps: true })],
            spacing: { before: 0, after: 80 }
        }),
        new Paragraph({
            text: `График ${chartId}: ${config.title}`,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 0, after: 200 }
        }),
        new Paragraph({
            children: [new ImageRun({
                type: 'png',
                data: imgData,
                transformation: {
                    width: WORD_DISPLAY_W,
                    height: WORD_DISPLAY_H
                }
            })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            indent: { left: 0, right: 0 }
        }),
        new Paragraph({ children: [new TextRun({ text: 'Легенда и параметры осей', bold: true, size: 22, color: '1e293b' })], spacing: { before: 160, after: 120 } }),
        new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } }),
        new Paragraph({ children: [new TextRun({ text: 'Статистика данных', bold: true, size: 22, color: '1e293b' })], spacing: { before: 240, after: 120 } }),
        new Table({ rows: statsRows, width: { size: 60, type: WidthType.PERCENTAGE } }),
        new Paragraph({
            children: [new TextRun({ text: `PlasmaLab · Экспортировано: ${new Date().toLocaleString('ru-RU')}`, size: 16, color: '94a3b8', italics: true })],
            spacing: { before: 300, after: 0 },
            alignment: AlignmentType.RIGHT
        })
    ];

    try {
        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        margin: {
                            top: 1440, // 1 inch = 1440 twips
                            right: 1440,
                            bottom: 1440,
                            left: 1440
                        }
                    }
                },
                children
            }]
        });
        const blob = await Packer.toBlob(doc);
        const name = `PlasmaLab_Chart_${chartId}_${config.title.replace(/\s+/g, '_').substring(0, 40)}.docx`;
        saveAs(blob, name);
        notify(`"${name}" сохранён!`, 'success');
    } catch (e) { notify('Ошибка создания docx: ' + e.message, 'error'); }
};

window.fullscreenChart = function(chartId) {
    const el = document.getElementById(`chart-${chartId}`);
    if (el.dataset.loaded !== 'true') {
        notify('График ещё не загружен.', 'warning');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    if (!document.fullscreenElement) el.requestFullscreen().catch(() => {});
    else document.exitFullscreen();
};

window.exportAllToWord = async function() {
    notify('Подготовка всех графиков…', 'info');
    try { await exportChartsToWord(Object.keys(CHART_CONFIGS)); }
    catch (e) { notify('Ошибка: ' + e.message, 'error'); }
};

window.exportVisibleToWord = async function() {
    const ids = Array.from(UIManager.loadedCharts);
    if (!ids.length) { notify('Нет загруженных графиков.', 'warning'); return; }
    notify(`Экспорт ${ids.length} графиков…`, 'info');
    try { await exportChartsToWord(ids); }
    catch (e) { notify('Ошибка: ' + e.message, 'error'); }
};

async function exportChartsToWord(chartIds) {
    const lib = window.docx;
    if (!lib) throw new Error('docx не загружен');
    const { Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell,
        HeadingLevel, AlignmentType, WidthType, BorderStyle, ShadingType } = lib;

    if (UIManager.chartObserver) UIManager.chartObserver.disconnect();

    // Create progress overlay
    const progressOverlay = createProgressOverlay();
    document.body.appendChild(progressOverlay);

    const catInfo={
        plasma:        {title:'Параметры плазмы',                   description:'Электронные характеристики и плазменные процессы'},
        energy:        {title:'Энергетические характеристики',      description:'Перенос и распределение энергии'},
        thermal:       {title:'Температурные профили',              description:'Распределение температуры по глубине'},
        diffusion:     {title:'Диффузионные процессы',              description:'Коэффициенты диффузии, радиационные механизмы и профили'},
        damage:        {title:'Радиационное повреждение',           description:'Дефекты, импульс и смещение атомов'},
        fluence:       {title:'Флюенс и накопление дозы',           description:'Интегральный поток ионов, эффективный флюенс и кинетика'},
        resonance:     {title:'Резонансные эффекты',                description:'Резонансное усиление диффузии и взаимодействие с плазмой'},
        slr:           {title:'SLR – перемешивание поверхности',    description:'Баллистическое перемешивание и SLR-диффузия'},
        rad_diffusion: {title:'Радиационно-ускоренная диффузия',    description:'Сравнение SLR и резонансных механизмов диффузии'},
        flux:          {title:'Потоковые характеристики',           description:'Ионный поток и скорость дефектообразования'}
    };

    const noBorder = { style: BorderStyle.NIL, size: 0, color: 'FFFFFF' };
    const cellBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

    const allChildren = [
        new Paragraph({
            children: [new TextRun({ text: 'PlasmaLab — Анализ результатов симуляции', size: 52, bold: true, color: '1e40af' })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 160 }
        }),
        new Paragraph({
            children: [new TextRun({ text: `Дата: ${new Date().toLocaleDateString('ru-RU')} · Графиков: ${chartIds.length}`, size: 22, color: '64748b' })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 }
        })
    ];

    for (let i = 0; i < chartIds.length; i++) {
        const chartId = chartIds[i], config = CHART_CONFIGS[chartId], cat = catInfo[config.category];
        updateProgress(i, chartIds.length);

        const prevId = chartIds[i - 1];
        if (!prevId || CHART_CONFIGS[prevId]?.category !== config.category) {
            allChildren.push(
                new Paragraph({ text: cat.title, heading: HeadingLevel.HEADING_1, spacing: { before: 600, after: 160 } }),
                new Paragraph({ children: [new TextRun({ text: cat.description, size: 20, color: '64748b', italics: true })], spacing: { after: 300 } })
            );
        }

        allChildren.push(new Paragraph({ text: `${chartId}. ${config.title}`, heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 200 } }));

        try {
            const chartData = DataLoader.prepareChartData(ChartsState.data, config);

            // Try to get camera position from loaded chart
            let cameraPosition = null;
            const chartEl = document.getElementById(`chart-${chartId}`);
            if (chartEl && chartEl.dataset.loaded === 'true') {
                try {
                    const plotlyDiv = chartEl.querySelector('.js-plotly-plot');
                    if (plotlyDiv && plotlyDiv.layout && plotlyDiv.layout.scene && plotlyDiv.layout.scene.camera) {
                        cameraPosition = JSON.parse(JSON.stringify(plotlyDiv.layout.scene.camera));
                    }
                } catch (e) {}
            }

            const dataUrl   = await ChartRenderer.renderToDataUrlWithCamera(chartData, config, cameraPosition);
            const imgData   = dataUrlToUint8Array(dataUrl);

            allChildren.push(new Paragraph({
                children: [new ImageRun({
                    type: 'png',
                    data: imgData,
                    transformation: {
                        width: WORD_DISPLAY_W,
                        height: WORD_DISPLAY_H
                    }
                })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
                indent: { left: 0, right: 0 }
            }));

            const legendRows = [['Ось X', config.xLabel],['Ось Y', config.yLabel],['Ось Z (цвет)', config.zLabel]];
            const trends = [
                { axis: 'X', label: config.xLabel, t: TrendPredictor.getTrend(chartData.xValues) },
                { axis: 'Y', label: config.yLabel, t: TrendPredictor.getTrend(chartData.yValues) },
                { axis: 'Z', label: config.zLabel, t: TrendPredictor.getTrend(chartData.zValues) }
            ].filter(tr => tr.t !== 'flat');

            trends.forEach(tr => legendRows.push([`Тренд ${tr.axis}`,`${tr.t === 'up' ? '▲ Возрастает' : '▼ Убывает'}: ${tr.label}`]));

            const tRows = legendRows.map(([key, val], ri) =>
                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 28, type: WidthType.PERCENTAGE },
                            borders: cellBorders,
                            shading: { type: ShadingType.SOLID, color: ri % 2 === 0 ? 'EFF6FF' : 'DBEAFE' },
                            children: [new Paragraph({ children: [new TextRun({ text: key, bold: true, size: 18, color: '1e40af' })], spacing: { before: 50, after: 50 } })]
                        }),
                        new TableCell({
                            width: { size: 72, type: WidthType.PERCENTAGE },
                            borders: cellBorders,
                            shading: { type: ShadingType.SOLID, color: ri % 2 === 0 ? 'F8FAFC' : 'F1F5F9' },
                            children: [new Paragraph({ children: [new TextRun({ text: val, size: 18, color: '374151' })], spacing: { before: 50, after: 50 } })]
                        })
                    ]
                })
            );

            allChildren.push(new Table({ rows: tRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
            allChildren.push(new Paragraph({ spacing: { after: 400 } }));

        } catch (e) {
            allChildren.push(new Paragraph({ children: [new TextRun({ text: `Ошибка графика ${chartId}: ${e.message}`, color: 'ef4444' })], spacing: { after: 200 } }));
        }
    }

    allChildren.push(new Paragraph({
        children: [new TextRun({ text: `PlasmaLab · Экспортировано: ${new Date().toLocaleString('ru-RU')}`, size: 16, color: '94a3b8', italics: true })],
        alignment: AlignmentType.RIGHT,
        spacing: { before: 400 }
    }));

    UIManager.initLazyLoading(ChartsState.data);

    updateProgress(chartIds.length, chartIds.length);

    const doc = new Document({
        sections: [{
            properties: {
                page: {
                    margin: {
                        top: 1440, // 1 inch
                        right: 1440,
                        bottom: 1440,
                        left: 1440
                    }
                }
            },
            children: allChildren
        }]
    });
    const blob = await Packer.toBlob(doc);
    const name = `PlasmaLab_Charts_${new Date().toISOString().split('T')[0]}.docx`;
    saveAs(blob, name);

    removeProgressOverlay();
    notify(`"${name}" сохранён!`, 'success');
}

const ChartsState = {
    data: [],
    loading: true,
    error: null,
    selectedCategory: 'all',
    currentFilter: 'all'
};

// ==============================================================
// Category Export Functions
// ==============================================================
window.setExportCategory = function(category) {
    ChartsState.selectedCategory = category;

    // Update active tab
    document.querySelectorAll('.export-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`.export-tab[data-category="${category}"]`)?.classList.add('active');

    // Sync with filter
    if (category !== 'all') {
        filterCharts(category);
    }
};

window.exportCategoryToWord = async function() {
    const category = ChartsState.selectedCategory;

    let chartIds;
    if (category === 'all') {
        chartIds = Object.keys(CHART_CONFIGS);
        notify('Подготовка всех 85 графиков…', 'info');
    } else {
        chartIds = Object.keys(CHART_CONFIGS).filter(id => CHART_CONFIGS[id].category === category);
        const catNames={plasma:'Плазма',energy:'Энергия',thermal:'Температура',diffusion:'Диффузия',damage:'Повреждения',fluence:'Флюенс',resonance:'Резонанс',slr:'SLR',rad_diffusion:'Рад. диффузия',flux:'Поток'};
        notify(`Подготовка графиков категории "${catNames[category]}" (${chartIds.length} шт.)…`, 'info');
    }

    try {
        await exportChartsToWord(chartIds);
    } catch (e) {
        notify('Ошибка: ' + e.message, 'error');
    }
};

function updateCategoryCounts() {
    const counts={all:0,plasma:0,energy:0,thermal:0,diffusion:0,damage:0,fluence:0,resonance:0,slr:0,rad_diffusion:0,flux:0};
    Object.values(CHART_CONFIGS).forEach(cfg => { counts.all++; if(counts[cfg.category]!==undefined) counts[cfg.category]++; });

    Object.entries(counts).forEach(([category, count]) => {
        // Export counts
        const countEl = document.getElementById(`count-${category}`);
        if (countEl) {
            countEl.textContent = count;
        }

        // Filter counts
        const filterCountEl = document.getElementById(`filter-count-${category}`);
        if (filterCountEl) {
            filterCountEl.textContent = count;
        }
    });
}

// ==============================================================
// Filter Functions
// ==============================================================
window.filterCharts = function(category) {
    ChartsState.currentFilter = category;
    ChartsState.selectedCategory = category;

    // Update filter tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`.filter-tab[data-filter="${category}"]`)?.classList.add('active');

    // Update export tabs
    document.querySelectorAll('.export-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`.export-tab[data-category="${category}"]`)?.classList.add('active');

    // Show/hide category sections
    const sections = document.querySelectorAll('.category-section');
    sections.forEach(section => {
        const sectionCategory = section.dataset.category;
        if (category === 'all' || sectionCategory === category) {
            section.style.display = 'contents';
            // Animate charts in section
            const cards = section.querySelectorAll('.chart-card');
            cards.forEach((card, index) => {
                card.style.animation = `fadeInUp 0.4s ease-out ${index * 0.05}s both`;
            });
        } else {
            section.style.display = 'none';
        }
    });

    // Update counter
    const visibleSections = Array.from(sections).filter(s => s.style.display !== 'none');
    const totalCharts = visibleSections.reduce((sum, section) => {
        return sum + section.querySelectorAll('.chart-card').length;
    }, 0);

    const catNames={all:'Все графики',plasma:'Плазма',energy:'Энергия',thermal:'Температура',diffusion:'Диффузия',damage:'Повреждения',fluence:'Флюенс',resonance:'Резонанс',slr:'SLR',rad_diffusion:'Рад. диффузия',flux:'Поток'};

    // Update subtitle
    const subtitle = document.getElementById('filterSubtitle');
    if (subtitle) {
        subtitle.textContent = `${catNames[category]} (${totalCharts} шт.)`;
    }

    notify(`${catNames[category]}: ${totalCharts} графиков`, 'info');
};

window.resetFilter = function() {
    filterCharts('all');
};

document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Charts] v5.0 init (85 charts)…');
    if (!window.PlasmaAuth?.requireAuth()) return;
    if (!await window.PlasmaAuth.verifyAuth()) return;

    try {
        UIManager.showLoading();
        const data = await DataLoader.loadResults();
        if (!data?.length) { UIManager.showNoData(); return; }
        ChartsState.data = data;
        ChartsState.loading = false;
        UIManager.renderCharts(data);
        updateCategoryCounts();
        console.log('[Charts] Ready. Charts:', Object.keys(CHART_CONFIGS).length);
    } catch (e) {
        console.error('[Charts] Init error:', e);
        UIManager.showNoData();
        notify('Ошибка загрузки: ' + e.message, 'error');
    }
});

console.log('[Charts] Engine v5.0 loaded (85 3D charts).');
