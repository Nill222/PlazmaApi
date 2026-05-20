/**
 * @global
 * @type {Object}
 */
const Plotly = window.Plotly;

/**
 * @global
 * @type {Function}
 */
const saveAs = window.saveAs;

'use strict';

// ─────────────────────────────────────────────────────────────
// PROFESSIONAL EXPORT SETTINGS
// ─────────────────────────────────────────────────────────────
const EXPORT_CONFIG = {
    dimensions: {
        svg: { width: 2400, height: 1500 },
        png: { width: 3200, height: 2000, scale: 2 },
        word: { width: 650, height: 400 }
    },
    fonts: {
        family: "'Inter', 'Segoe UI', 'Roboto', 'Arial', sans-serif",
        sizes: {
            tick: 24,
            axisTitle: 40,
            colorbar: 22,
            cbTitle: 26,
            standoff: 120
        }
    },
    layout: {
        margin: { l: 160, r: 300, t: 100, b: 160 },
        sceneDomain: { x: [0.0, 0.72], y: [0.0, 1.0] },
        colorbar: { thickness: 60, x: 0.94, xpad: 15 }
    },
    word: {
        margins: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        styles: {
            heading1: { size: 32, bold: true, color: '1e40af', spacing: { before: 600, after: 200 } },
            heading2: { size: 24, bold: true, color: '1e293b', spacing: { before: 400, after: 150 } },
            normal: { size: 20, color: '374151', spacing: { before: 0, after: 100 } },
            caption: { size: 18, color: '64748b', italics: true }
        }
    },
    pressurePresets: [
        { label: '0,1 – 5 Па', min: 0.1, max: 5 },
        { label: '5 – 15 Па', min: 5, max: 15 },
        { label: '15 – 100 Па', min: 15, max: 100 }
    ]
};

// Список ключей, которые являются давлением
const PRESSURE_KEYS = ['pressure'];
//1: { xKey:'pressure', yKey:'electronDensity', zKey:'voltage', xLabel:'Давление (Па)', yLabel:'Плотность электронов (м⁻³)', zLabel:'Напряжение (В)', title:'Плотность электронов от давления', category:'plasma' },

// ─────────────────────────────────────────────────────────────
// КОНФИГУРАЦИИ ГРАФИКОВ (85 шт.)
// ─────────────────────────────────────────────────────────────
const CHART_CONFIGS = {
    1: { xKey:'pressure', yKey:'electronDensity', zKey:'voltage', xLabel:'p', yLabel:'ρ', zLabel:'U', title:'', category:'plasma' },
    2: { xKey:'voltage', yKey:'electronVelocity', zKey:'currentDensity', xLabel:'Напряжение (В)', yLabel:'Скорость электронов (м/с)', zLabel:'Плотность тока (А/м²)', title:'Скорость электронов от напряжения', category:'plasma' },
    3: { xKey:'voltage', yKey:'currentDensity', zKey:'ionEnergy', xLabel:'Напряжение (В)', yLabel:'Плотность тока (А/м²)', zLabel:'Энергия ионов (Дж)', title:'Плотность тока от напряжения', category:'plasma' },
    4: { xKey:'voltage', yKey:'electronTemperature', zKey:'currentDensity', xLabel:'Напряжение (В)', yLabel:'Температура электронов (°K)', zLabel:'Плотность тока (А/м²)', title:'Температура электронов', category:'thermal' },
    5: { xKey:'totalTransferredEnergy',yKey:'depths', zKey:'avgT', xLabel:'Общая переданная энергия (Дж)', yLabel:'Глубина слоя (м)', zLabel:'Средняя температура (°K)', title:'Температура от энергии и глубины', category:'thermal' },
    6: { xKey:'voltage', yKey:'depths', zKey:'avgT', xLabel:'Напряжение (В)', yLabel:'Глубина слоя (м)', zLabel:'Средняя температура (°K)', title:'Температура от напряжения и глубины', category:'thermal' },
    7: { xKey:'pressure', yKey:'depths', zKey:'avgT', xLabel:'Давление (Па)', yLabel:'Глубина слоя (м)', zLabel:'Средняя температура (°K)', title:'Температура от давления и глубины', category:'thermal' },
    8: { xKey:'currentDensity', yKey:'depths', zKey:'avgT', xLabel:'Плотность тока (А/м²)', yLabel:'Глубина слоя (м)', zLabel:'Средняя температура (°K)', title:'Температура от плотности тока и глубины', category:'thermal' },
    9: { xKey:'voltage', yKey:'currentDensity', zKey:'totalTransferredEnergy', xLabel:'Напряжение (В)', yLabel:'Плотность тока (А/м²)', zLabel:'Полная энергия (Дж)', title:'Полная энергия от напряжения и плотности тока', category:'energy' },
    10: { xKey:'voltage', yKey:'avgTransferredPerAtom', zKey:'concentration', xLabel:'Напряжение (В)', yLabel:'Средняя переданная энергия на атом (эВ)', zLabel:'Концентрация (м⁻³)', title:'Энергия на атом от напряжения и температуры', category:'energy' },
    11: { xKey:'voltage', yKey:'ionEnergy', zKey:'concentration', xLabel:'Напряжение (В)', yLabel:'Энергия иона (эВ)', zLabel:'Концентрация (м⁻³)', title:'Энергия иона от напряжения и концентрации', category:'energy' },
    12: { xKey:'diffusionCoefficient1', yKey:'totalTransferredEnergy', zKey:'avgT', xLabel:'D₁ (м²/с)', yLabel:'Полная переданная энергия (эВ)', zLabel:'Средняя температура (°K)', title:'D₁ от температуры и энергии', category:'diffusion' },
    13: { xKey:'totalTransferredEnergy', yKey:'totalDamage', zKey:'avgT', xLabel:'Переданная энергия (эВ)', yLabel:'Суммарные повреждения (дефекты/м²)', zLabel:'Средняя температура (°K)', title:'Энергия → Повреждения при разных температурах', category:'damage' },
    14: { xKey:'totalTransferredEnergy', yKey:'voltage', zKey:'avgT', xLabel:'Полная переданная энергия (эВ)', yLabel:'Напряжение (В)', zLabel:'Средняя температура (°K)', title:'Энергия от температуры и напряжения', category:'energy' },
    15: { xKey:'pressure', yKey:'totalTransferredEnergy', zKey:'avgT', xLabel:'Давление (Па)', yLabel:'Полная переданная энергия (эВ)', zLabel:'Средняя температура (°K)', title:'Энергия от давления и температуры', category:'energy' },
    16: { xKey:'diffusionCoefficient1', yKey:'voltage', zKey:'avgT', xLabel:'D₁ (м²/с)', yLabel:'Напряжение (В)', zLabel:'Средняя температура (°K)', title:'D₁ от температуры и напряжения', category:'diffusion' },
    17: { xKey:'diffusionCoefficient2', yKey:'voltage', zKey:'avgT', xLabel:'D₂ (м²/с)', yLabel:'Напряжение (В)', zLabel:'Средняя температура (°K)', title:'D₂ от температуры и напряжения', category:'diffusion' },
    18: { xKey:'diffusionCoefficient1', yKey:'diffusionCoefficient2', zKey:'avgT', xLabel:'D₁ (м²/с)', yLabel:'D₂ (м²/с)', zLabel:'Средняя температура (°K)', title:'Сравнение D₁ и D₂ при разных температурах', category:'diffusion' },
    19: { xKey:'voltage', yKey:'diffusionCoefficient1', zKey:'avgT', xLabel:'Напряжение (В)', yLabel:'Термическая диффузия D (м²/с)', zLabel:'Средняя температура (°K)', title:'Диффузия D₁ от напряжения и температуры', category:'diffusion' },
    20: { xKey:'diffusionCoefficient1', yKey:'diffusionCoefficient2', zKey:'avgT', xLabel:'D₁ (м²/с)', yLabel:'D₂ (м²/с)', zLabel:'Средняя температура (°K)', title:'Сравнение D₁ и D₂ при разных температурах после SLR', category:'diffusion' },
    21: { xKey:'totalTransferredEnergy', yKey:'totalDamage', zKey:'avgT', xLabel:'Переданная энергия (эВ)', yLabel:'Суммарные повреждения (дефекты/м²)', zLabel:'Средняя температура (°K)', title:'Повреждения от энергии и температуры', category:'damage' },
    22: { xKey:'totalTransferredEnergy', yKey:'totalMomentum', zKey:'totalDamage', xLabel:'Переданная энергия (эВ)', yLabel:'Суммарный импульс (кг·м/с)', zLabel:'Суммарные повреждения (дефекты/м²)', title:'Импульс от энергии и повреждений', category:'damage' },
    23: { xKey:'totalMomentum', yKey:'totalDisplacement', zKey:'totalDamage', xLabel:'Суммарный импульс (кг·м/с)', yLabel:'Суммарное смещение (м)', zLabel:'Суммарные повреждения (дефекты/м²)', title:'Смещение от импульса и повреждений', category:'damage' },
    24: { xKey:'totalDamage', yKey:'voltage', zKey:'avgT', xLabel:'Суммарные повреждения (дефекты/м²)', yLabel:'Напряжение (В)', zLabel:'Средняя температура (°K)', title:'Повреждения от температуры и напряжения', category:'damage' },
    25: { xKey:'voltage', yKey:'currentDensity', zKey:'depths', xLabel:'Напряжение (В)', yLabel:'Плотность тока (А/м²)', zLabel:'Глубина проникновения (м)', title:'V · j → Глубина проникновения ионов', category:'plasma' },
    26: { xKey:'voltage', yKey:'currentDensity', zKey:'ionEnergy', xLabel:'Напряжение (В)', yLabel:'Плотность тока (А/м²)', zLabel:'Энергия ионов (Дж)', title:'V · j → Суммарная переданная энергия', category:'energy' },
    27: { xKey:'avgT', yKey:'pressure', zKey:'concentration', xLabel:'Средняя температура (°K)', yLabel:'Давление (Па)', zLabel:'Концентрация (м⁻³)', title:'T · P → Концентрация', category:'plasma' },
    28: { xKey:'avgT', yKey:'voltage', zKey:'totalDamage', xLabel:'Средняя температура (°K)', yLabel:'Напряжение (В)', zLabel:'Суммарные повреждения (дефекты/м²)', title:'T · V → Суммарные повреждения', category:'damage' },
    29: { xKey:'electronDensity', yKey:'electronTemperature', zKey:'pressure', xLabel:'Плотность электронов (м⁻³)', yLabel:'Температура электронов (°K)', zLabel:'Давление (Па)', title:'Давление от параметров плазмы', category:'plasma' },
    30: { xKey:'ionEnergy', yKey:'electronTemperature', zKey:'electronDensity', xLabel:'Энергия иона (эВ)', yLabel:'Температура электронов (°K)', zLabel:'Плотность электронов (м⁻³)', title:'Плотность электронов от энергетики', category:'plasma' },
    31: { xKey:'currentDensity', yKey:'electronDensity', zKey:'electronVelocity', xLabel:'Плотность тока (А/м²)', yLabel:'Плотность электронов (м⁻³)', zLabel:'Скорость электронов (м/с)', title:'Кинетика электронов от тока и концентрации', category:'plasma' },
    32: { xKey:'pressure', yKey:'electronTemperature', zKey:'currentDensity', xLabel:'Давление (Па)', yLabel:'Температура электронов (°K)', zLabel:'Плотность тока (А/м²)', title:'Ток от термодинамических параметров плазмы', category:'plasma' },
    33: { xKey:'voltage', yKey:'pressure', zKey:'electronDensity', xLabel:'Напряжение (В)', yLabel:'Давление (Па)', zLabel:'Плотность электронов (м⁻³)', title:'Разрядные характеристики: V·P → n_e', category:'plasma' },
    34: { xKey:'ionEnergy', yKey:'avgTransferredPerAtom', zKey:'totalTransferredEnergy', xLabel:'Энергия иона (эВ)', yLabel:'Энергия на атом (эВ)', zLabel:'Полная переданная энергия (Дж)', title:'Баланс энергии: ион → атом → полная', category:'energy' },
    35: { xKey:'voltage', yKey:'electronVelocity', zKey:'totalTransferredEnergy', xLabel:'Напряжение (В)', yLabel:'Скорость электронов (м/с)', zLabel:'Полная переданная энергия (Дж)', title:'Энергопередача от скорости электронов', category:'energy' },
    36: { xKey:'currentDensity', yKey:'avgTransferredPerAtom', zKey:'concentration', xLabel:'Плотность тока (А/м²)', yLabel:'Энергия на атом (эВ)', zLabel:'Концентрация дефектов (м⁻³)', title:'Концентрация от энергопередачи', category:'energy' },
    37: { xKey:'totalMomentum', yKey:'ionEnergy', zKey:'totalTransferredEnergy', xLabel:'Суммарный импульс (кг·м/с)', yLabel:'Энергия иона (эВ)', zLabel:'Полная переданная энергия (Дж)', title:'Связь импульса и энергии в столкновениях', category:'energy' },
    38: { xKey:'totalTransferredEnergy', yKey:'depths', zKey:'concentration', xLabel:'Полная переданная энергия (Дж)', yLabel:'Глубина (м)', zLabel:'Концентрация (м⁻³)', title:'Профиль концентрации от энергии и глубины', category:'energy' },
    39: { xKey:'avgTransferredPerAtom', yKey:'pressure', zKey:'totalDamage', xLabel:'Энергия на атом (эВ)', yLabel:'Давление (Па)', zLabel:'Суммарные повреждения (дефекты/м²)', title:'Повреждения от энергии на атом и давления', category:'damage' },
    40: { xKey:'totalDamage', yKey:'totalDisplacement', zKey:'concentration', xLabel:'Суммарные повреждения (дефекты/м²)', yLabel:'Суммарное смещение (м)', zLabel:'Концентрация дефектов (м⁻³)', title:'Концентрация от повреждений и смещений', category:'damage' },
    41: { xKey:'totalMomentum', yKey:'totalDamage', zKey:'avgT', xLabel:'Суммарный импульс (кг·м/с)', yLabel:'Суммарные повреждения (дефекты/м²)', zLabel:'Средняя температура (°K)', title:'Температурные эффекты от импульса и повреждений', category:'damage' },
    42: { xKey:'currentDensity', yKey:'totalDamage', zKey:'totalTransferredEnergy', xLabel:'Плотность тока (А/м²)', yLabel:'Суммарные повреждения (дефекты/м²)', zLabel:'Полная переданная энергия (Дж)', title:'Энергетический баланс при дефектообразовании', category:'damage' },
    43: { xKey:'ionEnergy', yKey:'totalDisplacement', zKey:'totalDamage', xLabel:'Энергия иона (эВ)', yLabel:'Суммарное смещение (м)', zLabel:'Суммарные повреждения (дефекты/м²)', title:'Каскады смещений от энергии иона', category:'damage' },
    44: { xKey:'voltage', yKey:'totalDisplacement', zKey:'depths', xLabel:'Напряжение (В)', yLabel:'Суммарное смещение (м)', zLabel:'Глубина проникновения (м)', title:'Глубина проникновения дефектов', category:'damage' },
    45: { xKey:'pressure', yKey:'totalDamage', zKey:'totalDisplacement', xLabel:'Давление (Па)', yLabel:'Суммарные повреждения (дефекты/м²)', zLabel:'Суммарное смещение (м)', title:'Влияние давления на смещения', category:'damage' },
    46: { xKey:'avgT', yKey:'totalDamage', zKey:'diffusionCoefficient1', xLabel:'Средняя температура (°K)', yLabel:'Суммарные повреждения (дефекты/м²)', zLabel:'Коэффициент диффузии D₁ (м²/с)', title:'Термоактивированная диффузия в повреждённом материале', category:'diffusion' },
    47: { xKey:'avgT', yKey:'concentration', zKey:'diffusionCoefficient1', xLabel:'Средняя температура (°K)', yLabel:'Концентрация (м⁻³)', zLabel:'Коэффициент диффузии D₁ (м²/с)', title:'Классическая зависимость D(T, C)', category:'diffusion' },
    48: { xKey:'totalTransferredEnergy', yKey:'diffusionCoefficient1', zKey:'concentration', xLabel:'Полная переданная энергия (Дж)', yLabel:'Коэффициент диффузии D₁ (м²/с)', zLabel:'Концентрация (м⁻³)', title:'Радиационно-ускоренная диффузия', category:'diffusion' },
    49: { xKey:'diffusionCoefficient1', yKey:'depths', zKey:'concentration', xLabel:'Коэффициент диффузии D₁ (м²/с)', yLabel:'Глубина (м)', zLabel:'Концентрация (м⁻³)', title:'Диффузионный профиль концентрации', category:'diffusion' },
    50: { xKey:'avgT', yKey:'diffusionCoefficient2', zKey:'totalDamage', xLabel:'Средняя температура (°K)', yLabel:'Коэффициент диффузии D₂ (м²/с)', zLabel:'Суммарные повреждения (дефекты/м²)', title:'Вторая мода диффузии и дефекты', category:'diffusion' },
    51: { xKey:'pressure', yKey:'avgT', zKey:'diffusionCoefficient1', xLabel:'Давление (Па)', yLabel:'Средняя температура (°K)', zLabel:'Коэффициент диффузии D₁ (м²/с)', title:'Термобарическая диффузия', category:'diffusion' },
    52: { xKey:'voltage', zKey:'totalTransferredEnergy', yKey:'diffusionCoefficient2', xLabel:'Напряжение (В)', zLabel:'Полная переданная энергия (Дж)', yLabel:'Коэффициент диффузии D₂ (м²/с)', title:'Энергетическая стимуляция второй моды диффузии', category:'diffusion' },
    53: { xKey:'ionEnergy', yKey:'pressure', zKey:'depths', xLabel:'Энергия иона (эВ)', yLabel:'Давление (Па)', zLabel:'Глубина проникновения (м)', title:'Пробег ионов от энергии и давления', category:'plasma' },
    54: { xKey:'electronTemperature', yKey:'ionEnergy', zKey:'totalTransferredEnergy', xLabel:'Температура электронов (°K)', yLabel:'Энергия иона (эВ)', zLabel:'Полная переданная энергия (Дж)', title:'Энергообмен электрон-ион-атом', category:'energy' },
    55: { xKey:'currentDensity', yKey:'totalTransferredEnergy', zKey:'avgT', xLabel:'Плотность тока (А/м²)', yLabel:'Полная переданная энергия (Дж)', zLabel:'Средняя температура (°K)', title:'Нагрев от плотности тока и энергопередачи', category:'thermal' },
    56: { xKey:'voltage', yKey:'depths', zKey:'concentration', xLabel:'Напряжение (В)', yLabel:'Глубина (м)', zLabel:'Концентрация (м⁻³)', title:'Профиль концентрации от напряжения и глубины', category:'energy' },
    57: { xKey:'electronVelocity', yKey:'ionEnergy', zKey:'currentDensity', xLabel:'Скорость электронов (м/с)', yLabel:'Энергия иона (эВ)', zLabel:'Плотность тока (А/м²)', title:'Транспортные свойства плазмы', category:'plasma' },
    58: { xKey:'totalMomentum', yKey:'avgT', zKey:'totalDisplacement', xLabel:'Суммарный импульс (кг·м/с)', yLabel:'Средняя температура (°K)', zLabel:'Суммарное смещение (м)', title:'Термоактивированные смещения', category:'damage' },
    59: { xKey:'diffusionCoefficient1', yKey:'totalTransferredEnergy', zKey:'depths', xLabel:'Коэффициент диффузии D₁ (м²/с)', yLabel:'Полная переданная энергия (Дж)', zLabel:'Глубина проникновения (м)', title:'Глубина диффузии от энергии', category:'diffusion' },
    60: { xKey:'concentration', yKey:'avgT', zKey:'totalDamage', xLabel:'Концентрация (м⁻³)', yLabel:'Средняя температура (°K)', zLabel:'Суммарные повреждения (дефекты/м²)', title:'Отжиг дефектов', category:'damage' },
    61: { xKey:'ionFlux', yKey:'fluence', zKey:'currentDensity', xLabel:'Поток ионов (м⁻²·с⁻¹)', yLabel:'Флюенс (м⁻²)', zLabel:'Плотность тока (А/м²)', title:'Накопление флюенса по потоку и плотности тока', category:'fluence' },
    62: { xKey:'fluence', yKey:'totalDamage', zKey:'avgT', xLabel:'Флюенс (м⁻²)', yLabel:'Суммарные повреждения (дефекты/м²)', zLabel:'Средняя температура (°K)', title:'Повреждения от интегрального флюенса', category:'fluence' },
    63: { xKey:'fluence', yKey:'concentration', zKey:'depths', xLabel:'Флюенс (м⁻²)', yLabel:'Концентрация (м⁻³)', zLabel:'Глубина (м)', title:'Профиль концентрации от флюенса', category:'fluence' },
    64: { xKey:'fluence', yKey:'fluenceEff', zKey:'resonanceXi', xLabel:'Флюенс (м⁻²)', yLabel:'Эффективный флюенс (м⁻²)', zLabel:'Резонансный параметр ξ', title:'Эффективный флюенс: реальный vs усиленный', category:'fluence' },
    65: { xKey:'voltage', yKey:'fluence', zKey:'ionFlux', xLabel:'Напряжение (В)', yLabel:'Флюенс (м⁻²)', zLabel:'Поток ионов (м⁻²·с⁻¹)', title:'Накопление дозы от режима разряда', category:'fluence' },
    66: { xKey:'ionEnergy', yKey:'resonanceXi', zKey:'concentration', xLabel:'Энергия иона (эВ)', yLabel:'Резонансный параметр ξ', zLabel:'Концентрация (м⁻³)', title:'Резонансное усиление от энергии иона', category:'resonance' },
    67: { xKey:'resonanceXi', yKey:'dRes', zKey:'diffusionCoefficient1', xLabel:'Резонансный параметр ξ', yLabel:'Резонансный вклад в D (м²/с)', zLabel:'D₁ (м²/с)', title:'Резонансный вклад в диффузию', category:'resonance' },
    68: { xKey:'voltage', yKey:'resonanceXi', zKey:'pressure', xLabel:'Напряжение (В)', yLabel:'Резонансный параметр ξ', zLabel:'Давление (Па)', title:'Резонанс от параметров плазмы', category:'resonance' },
    69: { xKey:'resonanceXi', yKey:'fluenceEff', zKey:'totalDamage', xLabel:'Резонансный параметр ξ', yLabel:'Эффективный флюенс (м⁻²)', zLabel:'Суммарные повреждения (дефекты/м²)', title:'Усиление флюенса и повреждения', category:'resonance' },
    70: { xKey:'avgT', yKey:'resonanceXi', zKey:'dRes', xLabel:'Средняя температура (°K)', yLabel:'Резонансный параметр ξ', zLabel:'Резонансный вклад в D (м²/с)', title:'Температурная зависимость резонансной диффузии', category:'resonance' },
    71: { xKey:'fluence', yKey:'dSlr', zKey:'totalDamage', xLabel:'Флюенс (м⁻²)', yLabel:'Вклад SLR в D (м²/с)', zLabel:'Суммарные повреждения (дефекты/м²)', title:'SLR-диффузия от флюенса и повреждений', category:'slr' },
    72: { xKey:'dSlr', yKey:'diffusionCoefficient1', zKey:'avgT', xLabel:'Вклад SLR в D (м²/с)', yLabel:'D₁ (м²/с)', zLabel:'Средняя температура (°K)', title:'Вклад SLR в термическую диффузию', category:'slr' },
    73: { xKey:'voltage', yKey:'dSlr', zKey:'currentDensity', xLabel:'Напряжение (В)', yLabel:'Вклад SLR в D (м²/с)', zLabel:'Плотность тока (А/м²)', title:'SLR от режима обработки', category:'slr' },
    74: { xKey:'totalDamage', yKey:'dSlr', zKey:'fluenceEff', xLabel:'Суммарные повреждения (дефекты/м²)', yLabel:'Вклад SLR в D (м²/с)', zLabel:'Эффективный флюенс (м⁻²)', title:'Баллистическое перемешивание', category:'slr' },
    75: { xKey:'pressure', yKey:'dSlr', zKey:'ionFlux', xLabel:'Давление (Па)', yLabel:'Вклад SLR в D (м²/с)', zLabel:'Поток ионов (м⁻²·с⁻¹)', title:'SLR от параметров потока', category:'slr' },
    76: { xKey:'dSlr', yKey:'dRes', zKey:'diffusionCoefficient1', xLabel:'Вклад SLR в D (м²/с)', yLabel:'Резонансный вклад в D (м²/с)', zLabel:'D₁ (м²/с)', title:'Сравнение механизмов радиационной диффузии', category:'rad_diffusion' },
    77: { xKey:'dSlr_plus_dRes', yKey:'diffusionCoefficient1', zKey:'avgT', xLabel:'Вклад SLR в D + Резонансный вклад в D (м²/с)', yLabel:'D₁ (м²/с)', zLabel:'Средняя температура (°K)', title:'Полная радиационная диффузия', category:'rad_diffusion' },
    78: { xKey:'diffusionCoefficient1', yKey:'diffusionCoefficient2', zKey:'fluenceEff', xLabel:'D₁ (м²/с)', yLabel:'D₂ (м²/с)', zLabel:'Эффективный флюенс (м⁻²)', title:'Сравнение коэффициентов диффузии от флюенса', category:'rad_diffusion' },
    79: { xKey:'ionEnergy', yKey:'dSlr_plus_dRes', zKey:'totalDamage', xLabel:'Энергия иона (эВ)', yLabel:'Вклад SLR в D + Резонансный вклад в D (м²/с)', zLabel:'Суммарные повреждения (дефекты/м²)', title:'Энергетическая стимуляция диффузии', category:'rad_diffusion' },
    80: { xKey:'depths', yKey:'diffusionCoefficient1', zKey:'dRes', xLabel:'Глубина (м)', yLabel:'D₁ (м²/с)', zLabel:'Резонансный вклад в D (м²/с)', title:'Профиль радиационной диффузии', category:'rad_diffusion' },
    81: { xKey:'ionFlux', yKey:'concentration', zKey:'depths', xLabel:'Поток ионов (м⁻²·с⁻¹)', yLabel:'Концентрация (м⁻³)', zLabel:'Глубина (м)', title:'Концентрация от ионного потока и глубины', category:'flux' },
    82: { xKey:'ionFlux', yKey:'totalDamage', zKey:'avgT', xLabel:'Поток ионов (м⁻²·с⁻¹)', yLabel:'Суммарные повреждения (дефекты/м²)', zLabel:'Средняя температура (°K)', title:'Скорость дефектообразования', category:'flux' },
    83: { xKey:'currentDensity', yKey:'ionFlux', zKey:'voltage', xLabel:'Плотность тока (А/м²)', yLabel:'Поток ионов (м⁻²·с⁻¹)', zLabel:'Напряжение (В)', title:'Связь электрического тока и ионного потока', category:'flux' },
    84: { xKey:'ionFlux', yKey:'totalTransferredEnergy', zKey:'ionEnergy', xLabel:'Поток ионов (м⁻²·с⁻¹)', yLabel:'Полная переданная энергия (Дж)', zLabel:'Энергия иона (эВ)', title:'Мощность энергопередачи', category:'flux' },
    85: { xKey:'ionFlux', yKey:'fluenceEffRatio', zKey:'resonanceXi', xLabel:'Поток ионов (м⁻²·с⁻¹)', yLabel:'Φ_eff / Φ', zLabel:'Резонансный параметр ξ', title:'Коэффициент усиления потока', category:'flux' }
};

// ─────────────────────────────────────────────────────────────
// УТИЛИТЫ
// ─────────────────────────────────────────────────────────────

function isPressureChart(config) {
    return PRESSURE_KEYS.includes(config.xKey) || PRESSURE_KEYS.includes(config.yKey);
}

function getPressureAxis(config) {
    if (PRESSURE_KEYS.includes(config.xKey)) return 'x';
    if (PRESSURE_KEYS.includes(config.yKey)) return 'y';
    if (PRESSURE_KEYS.includes(config.zKey)) return 'z';
    return null;
}

function filterDataByPressureRange(data, config, rangeMin, rangeMax) {
    return data.filter(item => {
        const p = item['pressure'] ?? 0;
        return p >= rangeMin && p <= rangeMax;
    });
}

function getPressureRangeFromData(data, config) {
    const values = DataLoader.extractValues(data, 'pressure');
    const filtered = values.filter(v => isFinite(v) && !isNaN(v));
    if (filtered.length === 0) return { min: 0, max: 100 };
    return { min: Math.min(...filtered), max: Math.max(...filtered) };
}

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// ─────────────────────────────────────────────────────────────
// ТРЕНДЫ
// ─────────────────────────────────────────────────────────────
const Trends = {
    average: arr => arr.reduce((a, b) => a + b, 0) / (arr.length || 1)
};

class TrendPredictor {
    static getTrend(values) {
        const v = values.filter(x => isFinite(x) && !isNaN(x));
        if (v.length < 2) return 'up';
        const third = Math.max(1, Math.ceil(v.length / 3));
        const avgFirst = Trends.average(v.slice(0, third));
        const avgLast = Trends.average(v.slice(-third));
        const diff = avgLast - avgFirst;
        if (Math.abs(diff) < 1e-15) return 'up';
        return diff > 0 ? 'up' : 'down';
    }
}

// ─────────────────────────────────────────────────────────────
// РЕНДЕРЕР ГРАФИКОВ
// ─────────────────────────────────────────────────────────────
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
        near.forEach(p => { const w = 1 / Math.pow(p.d + 1e-10, 2); wz += p.z * w; ws += w; });
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
        const arrow = t => t === 'up' ? ' →' : t === 'down' ? ' ←' : '';
        const arrowZ = t => t === 'up' ? ' ↑' : t === 'down' ? ' ↓' : '';
        const xTitle = `${config.xLabel}${arrow(TrendPredictor.getTrend(data.xValues))}`;
        const yTitle = `${config.yLabel}${arrow(TrendPredictor.getTrend(data.yValues))}`;
        const zTitle = `${config.zLabel}${arrowZ(TrendPredictor.getTrend(data.zValues))}`;

        const surfaceTrace = {
            type: 'surface', x: xGrid, y: yGrid, z: zGrid,
            colorscale: this.getColorScale(config.category),
            colorbar: {
                title: { text: config.zLabel, side: 'right', font: { size: 12 } },
                thickness: 15, len: 0.85, x: 0.92,
                xanchor: 'left', xpad: 0, outlinewidth: 0, tickfont: { size: 11 }
            },
            contours: { z: { show: true, usecolormap: true, highlightcolor: '#42f462', project: { z: true } } },
            hovertemplate: `${config.xLabel}: %{x:.3g}<br>${config.yLabel}: %{y:.3g}<br>${config.zLabel}: %{z:.3g}<extra></extra>`,
            showscale: true
        };

        const axisBase = {
            backgroundcolor: 'rgb(255,255,255)',
            gridcolor: 'black',
            showbackground: true,
            tickfont: { size: 14, family: 'Inter, sans-serif', color: '#000000' },
            nticks: 5,
        };
        const makeInteractiveAxis = (title) => ({
            ...axisBase,
            title: { text: title, font: { size: 14, family: 'Inter, sans-serif' }, standoff: 30 },
        });

        const layout = {
            scene: {
                xaxis: makeInteractiveAxis(xTitle),
                yaxis: makeInteractiveAxis(yTitle),
                zaxis: makeInteractiveAxis(zTitle),
                camera: { eye: { x: 1.6, y: 1.6, z: 1.3 } },
                aspectmode: 'cube',
                domain: { x: [0.0, 0.88], y: [0.0, 1.0] }
            },
            margin: { l: 0, r: 0, t: 0, b: 0 },
            paper_bgcolor: '#ffffff',
            plot_bgcolor: '#ffffff',
            font: { family: 'Inter, sans-serif', size: 14, color: '#374151' },
            autosize: true
        };

        Plotly.newPlot(containerEl, [surfaceTrace], layout, {
            responsive: true, displayModeBar: true, displaylogo: false,
            modeBarButtonsToRemove: ['pan3d', 'select3d', 'lasso3d']
        });
    }

    static async renderForExport(chartData, config, camera = null, axisRange = null, format = 'svg') {
        const tempDiv = document.createElement('div');
        const { width, height, scale } = EXPORT_CONFIG.dimensions[format === 'svg' ? 'svg' : 'png'];

        tempDiv.style.cssText = `
            position: fixed; left: -9999px; top: -9999px;
            width: ${width}px; height: ${height}px;
            z-index: -1000; background: #ffffff;
        `;
        document.body.appendChild(tempDiv);

        try {
            const { xGrid, yGrid, zGrid } = this.createMeshGrid(
                chartData.xValues, chartData.yValues, chartData.zValues
            );

            const arrow = t => t === 'up' ? ' →' : t === 'down' ? ' ←' : '';
            const arrowZ = t => t === 'up' ? ' ←' : t === 'down' ? ' →' : '';
            const xTitle = config.xLabel + arrow(TrendPredictor.getTrend(chartData.xValues));
            const yTitle = config.yLabel + arrow(TrendPredictor.getTrend(chartData.yValues));
            const zTitle = config.zLabel + arrowZ(TrendPredictor.getTrend(chartData.zValues));

            const surfaceTrace = {
                type: 'surface', x: xGrid, y: yGrid, z: zGrid,
                colorscale: this.getColorScale(config.category),
                colorbar: {
                    title: {
                        text: config.zLabel, side: 'right',
                        font: { size: EXPORT_CONFIG.fonts.sizes.cbTitle, family: EXPORT_CONFIG.fonts.family }
                    },
                    thickness: EXPORT_CONFIG.layout.colorbar.thickness,
                    len: 0.85, x: EXPORT_CONFIG.layout.colorbar.x,
                    xanchor: 'left', xpad: EXPORT_CONFIG.layout.colorbar.xpad,
                    outlinewidth: 0,
                    tickfont: { size: EXPORT_CONFIG.fonts.sizes.colorbar, family: EXPORT_CONFIG.fonts.family },
                    tickformat: '.1e'
                },
                contours: {
                    z: { show: true, usecolormap: true, highlightcolor: '#42f462', project: { z: true } }
                },
                hoverinfo: 'skip', showscale: true
            };

            const createAxis = (titleText, rangeOpts = {}) => ({
                backgroundcolor: 'rgb(240,240,240)',
                gridcolor: 'white', showbackground: true, zerolinecolor: 'white',
                tickfont: {
                    size: EXPORT_CONFIG.fonts.sizes.tick,
                    family: EXPORT_CONFIG.fonts.family,
                    color: '#374151'
                },
                tickformat: '.1e', nticks: 6,
                title: {
                    text: titleText,
                    font: {
                        size: EXPORT_CONFIG.fonts.sizes.axisTitle,
                        family: EXPORT_CONFIG.fonts.family,
                        color: '#374151'
                    },
                    standoff: EXPORT_CONFIG.fonts.sizes.standoff
                },
                ...rangeOpts
            });

            const axisOpts = { x: {}, y: {}, z: {} };
            if (axisRange) {
                const range = [axisRange.min, axisRange.max];
                if (axisRange.axis in axisOpts) {
                    axisOpts[axisRange.axis] = { range, autorange: false };
                }
            }

            const cameraSettings = camera
                ? { eye: camera.eye, center: camera.center || {x:0,y:0,z:0}, up: camera.up || {x:0,y:0,z:1} }
                : { eye: { x: 1.6, y: 1.6, z: 1.3 } };

            const layout = {
                width, height,
                margin: EXPORT_CONFIG.layout.margin,
                scene: {
                    xaxis: createAxis(xTitle, axisOpts.x),
                    yaxis: createAxis(yTitle, axisOpts.y),
                    zaxis: createAxis(zTitle, axisOpts.z),
                    domain: EXPORT_CONFIG.layout.sceneDomain,
                    aspectmode: 'manual',
                    aspectratio: { x: 1.25, y: 1.25, z: 1.0 },
                    camera: cameraSettings,
                    bgcolor: '#ffffff'
                },
                font: { family: EXPORT_CONFIG.fonts.family, size: EXPORT_CONFIG.fonts.sizes.tick, color: '#374151' },
                paper_bgcolor: '#ffffff', plot_bgcolor: '#ffffff', showlegend: false
            };

            await Plotly.newPlot(tempDiv, [surfaceTrace], layout, {
                staticPlot: true, displayModeBar: false, displaylogo: false, responsive: false
            });

            await new Promise(r => setTimeout(r, 600));

            if (format === 'svg') {
                const svg = tempDiv.querySelector('svg');
                if (!svg) throw new Error('SVG not rendered');
                svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                return new XMLSerializer().serializeToString(svg);
            } else {
                return await Plotly.toImage(tempDiv, { format: 'png', width, height, scale });
            }

        } catch (err) {
            console.error(`[Export] Render failed (${format}):`, err);
            if (format === 'svg') {
                const { width, height, scale } = EXPORT_CONFIG.dimensions.png;
                return await Plotly.toImage(tempDiv, { format: 'png', width, height, scale: 2 });
            }
            throw err;
        } finally {
            try { Plotly.purge(tempDiv); } catch (_) {}
            document.body.removeChild(tempDiv);
        }
    }
}

// ─────────────────────────────────────────────────────────────
// ЗАГРУЗЧИК ДАННЫХ
// ─────────────────────────────────────────────────────────────
class DataLoader {
    static async loadResults() {
        const response = await window.PlasmaAuth.apiRequest('/results/config', null, true);
        if (!response.ok) throw new Error('Failed to load results');
        return response.data?.data || [];
    }

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
            // Промежуточные параметры из nested intermediate (ResultDTO)
            if (item.intermediate && item.intermediate[key] != null) {
                return item.intermediate[key];
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

    static prepareChartDataFiltered(allData, config, pressureMin, pressureMax) {
        const filtered = filterDataByPressureRange(allData, config, pressureMin, pressureMax);
        if (!filtered.length) return null;
        return this.prepareChartData(filtered, config);
    }
}

// ─────────────────────────────────────────────────────────────
// UI MANAGER
// ─────────────────────────────────────────────────────────────
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
        const rangeIdx = Number(el.dataset.pressureRange ?? -1);

        let chartData;
        if (isPressureChart(config) && rangeIdx >= 0 && ChartsState.pressureRanges?.[chartId]) {
            const range = ChartsState.pressureRanges[chartId];
            chartData = DataLoader.prepareChartDataFiltered(data, config, range.min, range.max);
            if (!chartData) chartData = DataLoader.prepareChartData(data, config);
        } else {
            chartData = DataLoader.prepareChartData(data, config);
        }

        try {
            ChartRenderer.create3DChart(cid, chartData, config);
            el.dataset.loaded = 'true';
            this.loadedCharts.add(chartId);
            this.updateCounter();
            this._updateTrendBadges(chartId, chartData, config);
            const card = el.closest('.chart-card');
            if (card) setTimeout(() => card.classList.add('chart-loaded'), 300);
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
            document.getElementById('loadedCount').textContent = String(this.loadedCharts.size);
            document.getElementById('totalCount').textContent = String(Object.keys(CHART_CONFIGS).length);
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
            const t = TrendPredictor.getTrend(ax.values);
            const span = document.createElement('span');
            span.className = `trend-item ${t}`;
            if (t === 'up')        { span.innerHTML = `<i class="fas fa-arrow-up"></i> ${ax.axis}: рост`;   span.title = `Рост: ${ax.label}`; }
            else if (t === 'down') { span.innerHTML = `<i class="fas fa-arrow-down"></i> ${ax.axis}: спад`; span.title = `Спад: ${ax.label}`; }
            else                   { span.innerHTML = `<i class="fas fa-minus"></i> ${ax.axis}: стаб.`;     span.title = `Без изменений: ${ax.label}`; }
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
            fluence:       { title:'Флюенс и накопление дозы',               description:'Интегральный поток ионов, эффективный флюенс и кинетика',  icon:'fa-clock'           },
            resonance:     { title:'Резонансные эффекты',                    description:'Резонансное усиление диффузии и взаимодействие с плазмой',  icon:'fa-wave-square'     },
            slr:           { title:'SLR – перемешивание поверхности',        description:'Баллистическое перемешивание и SLR-диффузия',              icon:'fa-sync-alt'        },
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
        const hasPressure = isPressureChart(config);

        const pressureRange = hasPressure ? getPressureRangeFromData(data, config) : null;

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
            ${hasPressure ? `
            <div class="pressure-range-control" id="pressure-control-${id}">
                <div class="pressure-range-label">
                    <i class="fas fa-chart-simple"></i>
                    <span>Диапазон давления (Па):</span>
                </div>
                <div class="pressure-preset-row">
                    <select class="pressure-preset" id="pressure-preset-${id}" onchange="setPressurePreset(${id}, this.value)">
                        <option value="full">📊 Весь диапазон</option>
                        <option value="0.1-5">📉 0,1 – 5 Па</option>
                        <option value="5-15">📈 5 – 15 Па</option>
                        <option value="15-100">📊 15 – 100 Па</option>
                    </select>
                </div>
                <div class="pressure-slider-container">
                    <span class="pressure-min-value" id="pressure-min-display-${id}">${pressureRange?.min.toFixed(2) ?? 0}</span>
                    <input type="range" class="pressure-slider" id="pressure-slider-${id}"
                        min="${pressureRange?.min ?? 0}" max="${pressureRange?.max ?? 100}" 
                        step="0.1"
                        value="${pressureRange?.max ?? 100}">
                    <span class="pressure-max-value" id="pressure-max-display-${id}">${pressureRange?.max.toFixed(2) ?? 100}</span>
                    <input type="range" class="pressure-slider-min" id="pressure-slider-min-${id}"
                        min="${pressureRange?.min ?? 0}" max="${pressureRange?.max ?? 100}"
                        step="0.1"
                        value="${pressureRange?.min ?? 0}">
                </div>
                <div class="pressure-range-buttons">
                    <button class="pressure-reset-btn" onclick="resetPressureRange(${id})" title="Сбросить к полному диапазону">
                        <i class="fas fa-undo"></i> Сброс
                    </button>
                </div>
            </div>` : ''}
            <div class="chart-body">
                <div class="chart-container" id="${cid}" data-chart-id="${id}" data-loaded="false" data-pressure-range="-1">
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
                <button class="btn-word" onclick="downloadChartForWord(${id})" title="Экспорт в Word (с выбранным диапазоном давления)">
                    <i class="fas fa-file-word"></i> Экспорт в Word (.docx)
                </button>
                <button class="btn-png-word" onclick="downloadChartPng(${id})" title="Скачать PNG HD">
                    <i class="fas fa-image"></i> Скачать PNG (HD)
                </button>
                <span class="export-hint" title="Покрутите график мышью перед экспортом — угол сохранится">
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

// ─────────────────────────────────────────────────────────────
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ─────────────────────────────────────────────────────────────
const ChartsState = {
    data: [],
    loading: true,
    error: null,
    selectedCategory: 'all',
    currentFilter: 'all',
    pressureRanges: {}
};

function dataUrlToUint8Array(dataUrl) {
    const base64 = dataUrl.split(',')[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
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
            <div class="progress-icon"><i class="fas fa-file-word"></i></div>
            <h3 class="progress-title">Экспорт в Word</h3>
            <p class="progress-description">Генерация графиков в высоком качестве...</p>
            <div class="progress-bar-container">
                <div class="progress-bar" id="exportProgressBar"></div>
            </div>
            <div class="progress-stats">
                <span id="exportProgressText">0 / 0</span>
                <span id="exportProgressPercent">0%</span>
            </div>
        </div>`;
    return overlay;
}

function updateProgress(current, total) {
    const bar  = document.getElementById('exportProgressBar');
    const text = document.getElementById('exportProgressText');
    const pct  = document.getElementById('exportProgressPercent');
    if (bar && text && pct) {
        const p = Math.round((current / total) * 100);
        bar.style.width  = `${p}%`;
        text.textContent = `${current} / ${total}`;
        pct.textContent  = `${p}%`;
    }
}

function removeProgressOverlay() {
    const overlay = document.querySelector('.export-progress-overlay');
    if (overlay) { overlay.style.opacity = '0'; setTimeout(() => overlay.remove(), 300); }
}

function getCameraFromChart(chartId) {
    try {
        const el = document.getElementById(`chart-${chartId}`);
        if (el && el.dataset.loaded === 'true') {
            const plotlyDiv = el;
            if (plotlyDiv._fullLayout?.scene?.camera) {
                return JSON.parse(JSON.stringify(plotlyDiv._fullLayout.scene.camera));
            }
            if (plotlyDiv.layout?.scene?.camera) {
                return JSON.parse(JSON.stringify(plotlyDiv.layout.scene.camera));
            }
        }
    } catch (_) {}
    return null;
}

window.setPressurePreset = function(chartId, preset) {
    const config = CHART_CONFIGS[chartId];
    if (!isPressureChart(config)) return;

    let min, max;
    switch(preset) {
        case '0.1-5': min = 0.1; max = 5; break;
        case '5-15': min = 5; max = 15; break;
        case '15-100': min = 15; max = 100; break;
        case 'full':
        default:
            const full = getPressureRangeFromData(ChartsState.data, config);
            min = full.min; max = full.max;
            break;
    }

    if (preset !== 'custom') {
        ChartsState.pressureRanges[chartId] = { min, max };

        const sliderMax = document.getElementById(`pressure-slider-${chartId}`);
        const sliderMin = document.getElementById(`pressure-slider-min-${chartId}`);
        if (sliderMax) sliderMax.value = max;
        if (sliderMin) sliderMin.value = min;

        const minDisplay = document.getElementById(`pressure-min-display-${chartId}`);
        const maxDisplay = document.getElementById(`pressure-max-display-${chartId}`);
        if (minDisplay) minDisplay.textContent = min.toFixed(2);
        if (maxDisplay) maxDisplay.textContent = max.toFixed(2);

        const container = document.getElementById(`chart-${chartId}`);
        if (container && container.dataset.loaded === 'true') {
            container.dataset.loaded = 'false';
            UIManager.loadedCharts.delete(String(chartId));
            UIManager.loadChart(String(chartId), ChartsState.data);
        }
    }
};

window.initPressureControls = function(chartId) {
    const config = CHART_CONFIGS[chartId];
    if (!isPressureChart(config)) return;

    const sliderMax = document.getElementById(`pressure-slider-${chartId}`);
    const sliderMin = document.getElementById(`pressure-slider-min-${chartId}`);
    const minDisplay = document.getElementById(`pressure-min-display-${chartId}`);
    const maxDisplay = document.getElementById(`pressure-max-display-${chartId}`);

    if (!sliderMax || !sliderMin) return;

    const fullRange = getPressureRangeFromData(ChartsState.data, config);

    if (!ChartsState.pressureRanges[chartId]) {
        ChartsState.pressureRanges[chartId] = { min: fullRange.min, max: fullRange.max };
    }

    const updateRange = () => {
        const minVal = parseFloat(sliderMin.value);
        const maxVal = parseFloat(sliderMax.value);
        if (minVal >= maxVal) return;

        ChartsState.pressureRanges[chartId] = { min: minVal, max: maxVal };
        minDisplay.textContent = minVal.toFixed(2);
        maxDisplay.textContent = maxVal.toFixed(2);

        const container = document.getElementById(`chart-${chartId}`);
        if (container) {
            container.dataset.pressureRange = '0';
            if (container.dataset.loaded === 'true') {
                container.dataset.loaded = 'false';
                UIManager.loadedCharts.delete(String(chartId));
                UIManager.loadChart(String(chartId), ChartsState.data);
            }
        }
    };

    sliderMax.addEventListener('input', () => {
        if (parseFloat(sliderMax.value) <= parseFloat(sliderMin.value)) {
            sliderMax.value = String(parseFloat(sliderMin.value) + 0.01);
        }
        updateRange();
    });

    sliderMin.addEventListener('input', () => {
        if (parseFloat(sliderMin.value) >= parseFloat(sliderMax.value)) {
            sliderMin.value = String(parseFloat(sliderMax.value) - 0.01);
        }
        updateRange();
    });

    sliderMax.value = String(ChartsState.pressureRanges[chartId].max);
    sliderMin.value = String(ChartsState.pressureRanges[chartId].min);
    updateRange();
    const presetSelect = document.getElementById(`pressure-preset-${chartId}`);
    if (presetSelect) {
        const currentRange = ChartsState.pressureRanges[chartId];
        const fullRange = getPressureRangeFromData(ChartsState.data, config);

        if (Math.abs(currentRange.min - 0.1) < 0.01 && Math.abs(currentRange.max - 5) < 0.01) {
            presetSelect.value = '0.1-5';
        } else if (Math.abs(currentRange.min - 5) < 0.01 && Math.abs(currentRange.max - 15) < 0.01) {
            presetSelect.value = '5-15';
        } else if (Math.abs(currentRange.min - 15) < 0.01 && Math.abs(currentRange.max - 100) < 0.01) {
            presetSelect.value = '15-100';
        } else if (Math.abs(currentRange.min - fullRange.min) < 0.01 && Math.abs(currentRange.max - fullRange.max) < 0.01) {
            presetSelect.value = 'full';
        } else {
            presetSelect.value = 'custom';
        }
    }
};

window.resetPressureRange = function(chartId) {
    const config = CHART_CONFIGS[chartId];
    if (!isPressureChart(config)) return;

    const fullRange = getPressureRangeFromData(ChartsState.data, config);
    ChartsState.pressureRanges[chartId] = { min: fullRange.min, max: fullRange.max };

    const sliderMax = document.getElementById(`pressure-slider-${chartId}`);
    const sliderMin = document.getElementById(`pressure-slider-min-${chartId}`);
    const minDisplay = document.getElementById(`pressure-min-display-${chartId}`);
    const maxDisplay = document.getElementById(`pressure-max-display-${chartId}`);

    if (sliderMax) sliderMax.value = String(fullRange.max);
    if (sliderMin) sliderMin.value = String(fullRange.min);
    if (minDisplay) minDisplay.textContent = fullRange.min.toFixed(2);
    if (maxDisplay) maxDisplay.textContent = fullRange.max.toFixed(2);

    const container = document.getElementById(`chart-${chartId}`);
    if (container) {
        container.dataset.pressureRange = '-1';
        if (container.dataset.loaded === 'true') {
            container.dataset.loaded = 'false';
            UIManager.loadedCharts.delete(String(chartId));
            UIManager.loadChart(String(chartId), ChartsState.data);
        }
    }
};

function getSelectedPressureRange(chartId) {
    return ChartsState.pressureRanges[chartId] || null;
}

function getChartDataForExport(chartId) {
    const config = CHART_CONFIGS[chartId];
    const pressureRange = getSelectedPressureRange(chartId);

    if (!isPressureChart(config) || !pressureRange) {
        return {
            chartData: DataLoader.prepareChartData(ChartsState.data, config),
            axisRange: null,
            rangeLabel: null,
        };
    }

    const pressureAxis = getPressureAxis(config);
    const filteredData = DataLoader.prepareChartDataFiltered(
        ChartsState.data, config, pressureRange.min, pressureRange.max
    );

    return {
        chartData: filteredData || DataLoader.prepareChartData(ChartsState.data, config),
        axisRange: { axis: pressureAxis, min: pressureRange.min, max: pressureRange.max },
        rangeLabel: `${pressureRange.min.toFixed(2)} – ${pressureRange.max.toFixed(2)} Па`,
    };
}

// ─────────────────────────────────────────────────────────────
// ГЛОБАЛЬНЫЕ ФУНКЦИИ
// ─────────────────────────────────────────────────────────────

window.downloadChart = function(chartId) {
    const el = document.getElementById(`chart-${chartId}`);
    const config = CHART_CONFIGS[chartId];
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
        const { chartData, axisRange } = getChartDataForExport(chartId);
        const camera = getCameraFromChart(chartId);
        const dataUrl = await ChartRenderer.renderForExport(chartData, config, camera, axisRange, 'png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `PlasmaLab_${chartId}_${config.title.replace(/\s+/g, '_').substring(0, 40)}.png`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        notify('HD PNG сохранён!', 'success');
    } catch (e) { notify('Ошибка: ' + e.message, 'error'); }
};

// Замените функцию downloadChartForWord на эту:

window.downloadChartForWord = async function(chartId) {
    const lib = window.docx;
    if (!lib) { notify('Библиотека docx не загружена', 'error'); return; }

    notify('Подготовка графика…', 'info');

    try {
        const config = CHART_CONFIGS[chartId];
        const { chartData, axisRange, rangeLabel } = getChartDataForExport(chartId);
        const camera = getCameraFromChart(chartId);

        // Рендерим в PNG высокого качества (вместо SVG)
        const pngDataUrl = await ChartRenderer.renderForExport(
            chartData, config, camera, axisRange, 'png'
        );

        // Конвертируем dataURL в Uint8Array
        const imgData = dataUrlToUint8Array(pngDataUrl);

        const meta = {
            category: config.category,
            title: config.title,
            date: new Date().toLocaleString('ru-RU'),
            pressureRange: rangeLabel
        };

        const doc = new lib.Document({
            creator: 'PlasmaLab Export Engine',
            title: `График ${chartId}: ${config.title}`,
            description: meta.category,
            keywords: [meta.category, 'simulation', '3d-plot'],
            sections: [{
                properties: {
                    page: { margin: EXPORT_CONFIG.word.margins },
                    titlePage: false
                },
                children: buildProfessionalChartDocumentPNG(lib, chartId, config, chartData, imgData, meta)
            }]
        });

        const blob = await lib.Packer.toBlob(doc);
        const filename = `PlasmaLab_Chart_${String(chartId).padStart(3,'0')}_${config.title.replace(/[^\wа-яА-ЯёЁ-]/g, '_').slice(0,40)}.docx`;
        saveAs(blob, filename);

        notify(`✅ "${filename}" сохранён!`, 'success');

    } catch (err) {
        console.error('[Export] Word export failed:', err);
        notify(`❌ Ошибка экспорта: ${err.message}`, 'error');
    }
};

// Новая функция для PNG (вместо SVG)
function buildProfessionalChartDocumentPNG(lib, chartId, config, chartData, imageData, meta) {
    const { Paragraph, TextRun, ImageRun, HeadingLevel, AlignmentType,
        Table, TableRow, TableCell, WidthType, BorderStyle } = lib;

    const styles = EXPORT_CONFIG.word.styles;

    const makeHeading = (text, level) => new Paragraph({
        text, heading: level === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
        spacing: level === 1 ? styles.heading1.spacing : styles.heading2.spacing
    });

    const makeNormal = (text, opts = {}) => new Paragraph({
        children: [new TextRun({ text, size: opts.size || styles.normal.size,
            color: opts.color || styles.normal.color,
            bold: opts.bold, italics: opts.italics,
            font: EXPORT_CONFIG.fonts.family })],
        spacing: opts.spacing || styles.normal.spacing,
        alignment: opts.align || AlignmentType.LEFT
    });

    const categoryNames = {
        plasma:'Параметры плазмы', energy:'Энергетика', thermal:'Температура',
        diffusion:'Диффузия', damage:'Повреждения', fluence:'Флюенс',
        resonance:'Резонанс', slr:'SLR', rad_diffusion:'Рад. диффузия', flux:'Поток'
    };

    // Размеры для вставки в Word (в пунктах, 1 пункт = 1/72 дюйма)
    const imgWidth = 600;  // ширина изображения
    const imgHeight = 375; // высота (сохраняем пропорции 16:10)

    const children = [
        makeNormal(categoryNames[config.category] || config.category, {
            size: 16, color: '64748b', bold: true, spacing: { before: 0, after: 120 }, align: AlignmentType.CENTER
        }),
        makeHeading(`График ${chartId}: ${config.title}`, 2),
        ...(meta.pressureRange ? [
            makeNormal(`📊 Диапазон: ${meta.pressureRange}`, {
                size: 18, color: '0f4c75', spacing: { before: 0, after: 240 }
            })
        ] : []),

        // Изображение PNG
        new Paragraph({
            children: [new ImageRun({
                type: 'png',  // Явно указываем PNG
                data: imageData,
                transformation: {
                    width: imgWidth,
                    height: imgHeight
                }
            })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 }
        }),

        makeHeading('Параметры осей', 2),
        buildCleanLegendTable(lib, config, chartData),
        makeHeading('Статистика', 2),
        buildCleanStatsTable(lib, chartData),
        new Paragraph({
            children: [new TextRun({
                text: `PlasmaLab · ${meta.date} · Chart #${chartId}`,
                size: 16, color: '94a3b8', italics: true, font: EXPORT_CONFIG.fonts.family
            })],
            alignment: AlignmentType.RIGHT,
            spacing: { before: 400, after: 0 },
            border: { top: { style: BorderStyle.SINGLE, size: 1, color: 'e2e8f0' } }
        })
    ];

    return children;
}

function buildCleanLegendTable(lib, config, chartData) {
    const { Table, TableRow, TableCell, Paragraph, TextRun, WidthType, BorderStyle } = lib;

    const rows = [
        ['🔹 Ось X', config.xLabel],
        ['🔹 Ось Y', config.yLabel],
        ['🔹 Ось Z (цвет)', config.zLabel],
        ['📈 Тренд X', `${TrendPredictor.getTrend(chartData.xValues) === 'up' ? '▲ Рост' : '▼ Спад'}`],
        ['📈 Тренд Y', `${TrendPredictor.getTrend(chartData.yValues) === 'up' ? '▲ Рост' : '▼ Спад'}`],
        ['📈 Тренд Z', `${TrendPredictor.getTrend(chartData.zValues) === 'up' ? '▲ Рост' : '▼ Спад'}`]
    ];

    return new Table({
        rows: rows.map(([label, value], i) => new TableRow({
            children: [
                new TableCell({
                    children: [new Paragraph({
                        children: [new TextRun({
                            text: label, bold: true, size: 18, color: '1e40af',
                            font: EXPORT_CONFIG.fonts.family
                        })], spacing: { before: 60, after: 60 }
                    })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    shading: { fill: i % 2 === 0 ? 'f8fafc' : 'f1f5f9' }
                }),
                new TableCell({
                    children: [new Paragraph({
                        children: [new TextRun({
                            text: value, size: 18, color: '374151',
                            font: EXPORT_CONFIG.fonts.family
                        })], spacing: { before: 60, after: 60 }
                    })],
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    shading: { fill: i % 2 === 0 ? 'ffffff' : 'f8fafc' }
                })
            ]
        })),
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
            inside: { style: BorderStyle.NONE } }
    });
}

function buildCleanStatsTable(lib, chartData) {
    const { Table, TableRow, TableCell, Paragraph, TextRun, WidthType, BorderStyle } = lib;
    const stats = ChartRenderer.getStats(chartData.zValues);

    const rows = [
        ['📉 Минимум', stats.min.toExponential(3)],
        ['📈 Максимум', stats.max.toExponential(3)],
        ['⚖ Среднее', stats.avg.toExponential(3)],
        ['📊 Точек', String(chartData.xValues.length)]
    ];

    return new Table({
        rows: rows.map(([label, value]) => new TableRow({
            children: [
                new TableCell({
                    children: [new Paragraph({
                        children: [new TextRun({
                            text: label, bold: true, size: 18, color: '166534',
                            font: EXPORT_CONFIG.fonts.family
                        })], spacing: { before: 50, after: 50 }
                    })],
                    width: { size: 40, type: WidthType.PERCENTAGE },
                    shading: { fill: 'f0fdf4' }
                }),
                new TableCell({
                    children: [new Paragraph({
                        children: [new TextRun({
                            text: value, size: 18, color: '374151', family: 'Courier New'
                        })], spacing: { before: 50, after: 50 }
                    })],
                    width: { size: 60, type: WidthType.PERCENTAGE },
                    shading: { fill: 'fafafa' }
                })
            ]
        })),
        width: { size: 70, type: WidthType.PERCENTAGE },
        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
            inside: { style: BorderStyle.NONE } }
    });
}

window.fullscreenChart = function(chartId) {
    const el = document.getElementById(`chart-${chartId}`);
    if (el.dataset.loaded !== 'true') {
        notify('График ещё не загружен.', 'warning');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    if (!document.fullscreenElement) el.requestFullscreen().catch(() => {});
    else void document.exitFullscreen();
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
    if (!lib) throw new Error('docx library not loaded');

    const progressOverlay = createProgressOverlay();
    document.body.appendChild(progressOverlay);

    try {
        const { Document, Packer, Paragraph, TextRun, ImageRun,
            HeadingLevel, AlignmentType, PageBreak } = lib;

        const totalRenders = chartIds.reduce((sum, id) =>
            sum + (isPressureChart(CHART_CONFIGS[id]) ? EXPORT_CONFIG.pressurePresets.length : 1), 0);
        let currentRender = 0;

        const allChildren = [
            new Paragraph({
                children: [new TextRun({
                    text: 'PlasmaLab — Отчёт по результатам симуляции',
                    size: 36, bold: true, color: '1e40af', font: EXPORT_CONFIG.fonts.family
                })],
                alignment: AlignmentType.CENTER, spacing: { after: 200 }
            }),
            new Paragraph({
                children: [new TextRun({
                    text: `Дата генерации: ${new Date().toLocaleString('ru-RU')} | Графиков: ${chartIds.length}`,
                    size: 18, color: '64748b', font: EXPORT_CONFIG.fonts.family
                })],
                alignment: AlignmentType.CENTER, spacing: { after: 800 }
            }),
            new PageBreak()
        ];

        const byCategory = {};
        chartIds.forEach(id => {
            const cat = CHART_CONFIGS[id].category;
            if (!byCategory[cat]) byCategory[cat] = [];
            byCategory[cat].push(id);
        });

        for (const [category, ids] of Object.entries(byCategory)) {
            const catInfo = {
                plasma: { title:'Параметры плазмы', desc:'Электронные характеристики и процессы' },
                energy: { title:'Энергетика', desc:'Перенос и распределение энергии' },
                thermal: { title:'Температурные профили', desc:'Распределение температуры' },
                diffusion: { title:'Диффузия', desc:'Коэффициенты и механизмы' },
                damage: { title:'Повреждения', desc:'Дефекты и смещения атомов' },
                fluence: { title:'Флюенс', desc:'Интегральный поток ионов' },
                resonance: { title:'Резонанс', desc:'Резонансные эффекты' },
                slr: { title:'SLR', desc:'Поверхностное перемешивание' },
                rad_diffusion: { title:'Радиационная диффузия', desc:'Сравнение механизмов' },
                flux: { title:'Потоки', desc:'Ионные потоки и кинетика' }
            }[category] || { title: category, desc: '' };

            allChildren.push(
                new Paragraph({ text: catInfo.title, heading: HeadingLevel.HEADING_1,
                    spacing: { before: 600, after: 100 } }),
                new Paragraph({
                    children: [new TextRun({ text: catInfo.desc, size: 20, color: '64748b',
                        italics: true, font: EXPORT_CONFIG.fonts.family })],
                    spacing: { after: 400 }
                }),
                new PageBreak()
            );

            for (const chartId of ids) {
                const config = CHART_CONFIGS[chartId];
                const hasPressure = isPressureChart(config);

                allChildren.push(new Paragraph({
                    text: `${chartId}. ${config.title}`, heading: HeadingLevel.HEADING_2,
                    spacing: { before: 400, after: 150 }
                }));

                const camera = getCameraFromChart(chartId);
                const fullData = DataLoader.prepareChartData(ChartsState.data, config);

                if (hasPressure) {
                    for (const preset of EXPORT_CONFIG.pressurePresets) {
                        currentRender++;
                        updateProgress(currentRender, totalRenders);

                        const filtered = DataLoader.prepareChartDataFiltered(
                            ChartsState.data, config, preset.min, preset.max
                        );
                        if (!filtered?.xValues.length) continue;

                        allChildren.push(new Paragraph({
                            children: [new TextRun({
                                text: `📊 ${preset.label}`, bold: true, size: 20,
                                color: '0f4c75', font: EXPORT_CONFIG.fonts.family
                            })], spacing: { before: 200, after: 100 }
                        }));

                        try {
                            const svg = await ChartRenderer.renderForExport(
                                filtered, config, camera,
                                { axis: getPressureAxis(config), min: preset.min, max: preset.max },
                                'svg'
                            );
                            const svgBase64 = await blobToBase64(new Blob([svg], {type:'image/svg+xml'}));

                            allChildren.push(
                                new Paragraph({
                                    children: [new ImageRun({
                                        type: 'png', data: imgData,
                                        transformation: EXPORT_CONFIG.dimensions.word
                                    })], alignment: AlignmentType.CENTER, spacing: { after: 200 }
                                }),
                                buildCleanLegendTable(lib, config, filtered),
                                new Paragraph({ spacing: { after: 300 } })
                            );
                        } catch (err) {
                            console.warn(`[Export] Failed chart ${chartId} range ${preset.label}:`, err);
                            allChildren.push(new Paragraph({
                                children: [new TextRun({
                                    text: `⚠️ Ошибка рендеринга: ${err.message}`,
                                    color: 'ef4444', size: 18, font: EXPORT_CONFIG.fonts.family
                                })], spacing: { after: 200 }
                            }));
                        }
                    }
                } else {
                    currentRender++;
                    updateProgress(currentRender, totalRenders);

                    try {
                        const pngDataUrl = await ChartRenderer.renderForExport(
                            filtered, config, camera,
                            { axis: getPressureAxis(config), min: preset.min, max: preset.max },
                            'png'
                        );
                        const imgData = dataUrlToUint8Array(pngDataUrl);

                        allChildren.push(
                            new Paragraph({
                                children: [new ImageRun({
                                    type: lib.ImageType.PNG,
                                    data: imgData,
                                    transformation: EXPORT_CONFIG.dimensions.word
                                })], alignment: AlignmentType.CENTER, spacing: { after: 200 }
                            }),
                            buildCleanLegendTable(lib, config, fullData),
                            new Paragraph({ spacing: { after: 400 } })
                        );
                    } catch (err) {
                        console.warn(`[Export] Failed chart ${chartId}:`, err);
                        allChildren.push(new Paragraph({
                            children: [new TextRun({
                                text: `⚠️ Ошибка: ${err.message}`, color: 'ef4444', size: 18
                            })], spacing: { after: 200 }
                        }));
                    }
                }
            }
            allChildren.push(new PageBreak());
        }

        allChildren.push(new Paragraph({
            children: [new TextRun({
                text: `PlasmaLab Export Engine · Сгенерировано: ${new Date().toLocaleString('ru-RU')}`,
                size: 16, color: '94a3b8', italics: true, font: EXPORT_CONFIG.fonts.family
            })], alignment: AlignmentType.RIGHT, spacing: { before: 400 }
        }));

        const doc = new Document({
            creator: 'PlasmaLab', title: 'Simulation Report',
            sections: [{ properties: { page: { margin: EXPORT_CONFIG.word.margins } }, children: allChildren }]
        });

        const blob = await Packer.toBlob(doc);
        const filename = `PlasmaLab_Report_${new Date().toISOString().split('T')[0]}_${chartIds.length}charts.docx`;
        saveAs(blob, filename);

        notify(`✅ Отчёт "${filename}" сохранён!`, 'success');

    } finally {
        removeProgressOverlay();
        if (UIManager.chartObserver) UIManager.initLazyLoading(ChartsState.data);
    }
}

window.setExportCategory = function(category) {
    ChartsState.selectedCategory = category;
    document.querySelectorAll('.export-tab').forEach(t => t.classList.remove('active'));
    const tab = document.querySelector(`.export-tab[data-category="${category}"]`);
    if (tab) tab.classList.add('active');
    if (category !== 'all') filterCharts(category);
};

window.exportCategoryToWord = async function() {
    const category = ChartsState.selectedCategory;
    let chartIds;
    if (category === 'all') {
        chartIds = Object.keys(CHART_CONFIGS);
        notify('Подготовка всех 85 графиков…', 'info');
    } else {
        chartIds = Object.keys(CHART_CONFIGS).filter(id => CHART_CONFIGS[id].category === category);
        const catNames = {
            plasma:'Плазма', energy:'Энергия', thermal:'Температура',
            diffusion:'Диффузия', damage:'Повреждения', fluence:'Флюенс',
            resonance:'Резонанс', slr:'SLR', rad_diffusion:'Рад. диффузия', flux:'Поток'
        };
        notify(`Подготовка "${catNames[category]}" (${chartIds.length} шт.)…`, 'info');
    }
    try { await exportChartsToWord(chartIds); }
    catch (e) { notify('Ошибка: ' + e.message, 'error'); }
};

function updateCategoryCounts() {
    const counts = { all:0, plasma:0, energy:0, thermal:0, diffusion:0, damage:0, fluence:0, resonance:0, slr:0, rad_diffusion:0, flux:0 };
    Object.values(CHART_CONFIGS).forEach(cfg => { counts.all++; if (counts[cfg.category] !== undefined) counts[cfg.category]++; });
    Object.entries(counts).forEach(([cat, count]) => {
        const el  = document.getElementById(`count-${cat}`);
        const fel = document.getElementById(`filter-count-${cat}`);
        if (el)  el.textContent  = String(count);
        if (fel) fel.textContent = String(count);
    });
}

window.filterCharts = function(category) {
    ChartsState.currentFilter    = category;
    ChartsState.selectedCategory = category;

    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    const filterTab = document.querySelector(`.filter-tab[data-filter="${category}"]`);
    if (filterTab) filterTab.classList.add('active');

    document.querySelectorAll('.export-tab').forEach(t => t.classList.remove('active'));
    const exportTab = document.querySelector(`.export-tab[data-category="${category}"]`);
    if (exportTab) exportTab.classList.add('active');

    const sections = document.querySelectorAll('.category-section');
    sections.forEach(section => {
        const sc = section.dataset.category;
        if (category === 'all' || sc === category) {
            section.style.display = 'contents';
            section.querySelectorAll('.chart-card').forEach((card, idx) => {
                card.style.animation = `fadeInUp 0.4s ease-out ${idx * 0.05}s both`;
            });
        } else {
            section.style.display = 'none';
        }
    });

    const visibleSections = Array.from(sections).filter(s => s.style.display !== 'none');
    const totalCharts = visibleSections.reduce((sum, s) => sum + s.querySelectorAll('.chart-card').length, 0);
    const catNames = {
        all:'Все графики', plasma:'Плазма', energy:'Энергия', thermal:'Температура',
        diffusion:'Диффузия', damage:'Повреждения', fluence:'Флюенс',
        resonance:'Резонанс', slr:'SLR', rad_diffusion:'Рад. диффузия', flux:'Поток'
    };

    const subtitle = document.getElementById('filterSubtitle');
    if (subtitle) subtitle.textContent = `${catNames[category]} (${totalCharts} шт.)`;
    notify(`${catNames[category]}: ${totalCharts} графиков`, 'info');
};

window.resetFilter = function() { filterCharts('all'); };

// ─────────────────────────────────────────────────────────────
// ИНИЦИАЛИЗАЦИЯ
// ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Charts] v8.0 Professional Export init…');
    if (!window.PlasmaAuth?.requireAuth()) return;
    if (!await window.PlasmaAuth.verifyAuth()) return;

    try {
        UIManager.showLoading();
        const data = await DataLoader.loadResults();
        if (!data?.length) { UIManager.showNoData(); return; }
        ChartsState.data    = data;
        ChartsState.loading = false;
        UIManager.renderCharts(data);
        updateCategoryCounts();

        setTimeout(() => {
            Object.keys(CHART_CONFIGS).forEach(id => {
                if (isPressureChart(CHART_CONFIGS[id])) {
                    window.initPressureControls(id);
                }
            });
        }, 500);

        console.log('[Charts] Ready. Total charts:', Object.keys(CHART_CONFIGS).length);
    } catch (e) {
        console.error('[Charts] Init error:', e);
        UIManager.showNoData();
        notify('Ошибка загрузки: ' + e.message, 'error');
    }
});

console.log('[Charts] Professional Engine v8.0 loaded.');