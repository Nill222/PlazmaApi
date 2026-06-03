'use strict';

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

const FONT_FAMILY = "'Segoe UI', 'Roboto', 'Open Sans', sans-serif";

const PRESSURE_KEYS = new Set(['pressure']);

const EXPORT_CONFIG = Object.freeze({
    dimensions: {
        svg:  { width: 2400, height: 1500 },
        png:  { width: 3200, height: 2000, scale: 3 },
        word: { width: 650,  height: 406 },
    },
    fonts: {
        family: FONT_FAMILY,
        sizes: {
            tick: 14,
            axisTitle: 13,
            colorbar: 13,
            cbTitle: 13,
            chartTitle: 18
        },
    },
    layout: {
        margin:       { l: 70, r: 20, t: 80, b: 60 },
        marginMobile: { l: 60, r: 10, t: 40, b: 50 },
        sceneDomain:  { x: [0.0, 0.82], y: [0.0, 1.0] },
        colorbar:     { thickness: 18, x: 0.88, xpad: 10 },
    },
    word: {
        margins: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        styles: {
            heading1: { size: 32, bold: true,  color: '1e40af', spacing: { before: 600, after: 200 } },
            heading2: { size: 24, bold: true,  color: '1e293b', spacing: { before: 400, after: 150 } },
            normal:   { size: 20, color: '374151', spacing: { before: 0, after: 100 } },
            caption:  { size: 18, color: '64748b', italics: true },
        },
    },
    pressurePresets: [
        { label: '0,1 – 5 Па',  min: 0.1, max: 5   },
        { label: '5 – 15 Па',   min: 5,   max: 15  },
        { label: '15 – 100 Па', min: 15,  max: 100 },
    ],
});

// ─────────────────────────────────────────────────────────────
// CHART CONFIGS (85 шт.)
// ─────────────────────────────────────────────────────────────

const CHART_CONFIGS = {
    1:  { xKey:'pressure', yKey:'electronDensity', zKey:'voltage', xLabel:'Давление (Па)', yLabel:'Плотность электронов (м⁻³)', zLabel:'Напряжение (В)', title:'Плотность электронов от давления', category:'plasma' },
    3:  { xKey:'voltage', yKey:'currentDensity', zKey:'ionEnergy', xLabel:'Напряжение (В)', yLabel:'Плотность тока (А/м²)', zLabel:'Энергия ионов (Дж)', title:'Плотность тока от напряжения', category:'plasma' },
    4:  { xKey:'voltage', yKey:'electronTemperature', zKey:'currentDensity', xLabel:'Напряжение (В)', yLabel:'Температура электронов (°K)', zLabel:'Плотность тока (А/м²)', title:'Температура электронов', category:'thermal' },
    5:  { xKey:'totalTransferredEnergy',yKey:'depths', zKey:'avgT', xLabel:'Общая переданная энергия (Дж)', yLabel:'Глубина слоя (м)', zLabel:'Средняя температура (°K)', title:'Температура от энергии и глубины', category:'thermal' },
    6:  { xKey:'voltage', yKey:'depths', zKey:'avgT', xLabel:'Напряжение (В)', yLabel:'Глубина слоя (м)', zLabel:'Средняя температура (°K)', title:'Температура от напряжения и глубины', category:'thermal' },
    7:  { xKey:'pressure', yKey:'depths', zKey:'avgT', xLabel:'Давление (Па)', yLabel:'Глубина слоя (м)', zLabel:'Средняя температура (°K)', title:'Температура от давления и глубины', category:'thermal' },
    8:  { xKey:'currentDensity', yKey:'depths', zKey:'avgT', xLabel:'Плотность тока (А/м²)', yLabel:'Глубина слоя (м)', zLabel:'Средняя температура (°K)', title:'Температура от плотности тока и глубины', category:'thermal' },
    9:  { xKey:'voltage', yKey:'currentDensity', zKey:'totalTransferredEnergy', xLabel:'Напряжение (В)', yLabel:'Плотность тока (А/м²)', zLabel:'Полная энергия (Дж)', title:'Полная энергия от напряжения и плотности тока', category:'energy' },
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
    32: { xKey:'pressure', yKey:'electronTemperature', zKey:'currentDensity', xLabel:'Давление (Па)', yLabel:'Температура электронов (°K)', zLabel:'Плотность тока (А/м²)', title:'Ток от термодинамических параметров плазмы', category:'plasma' },
    33: { xKey:'voltage', yKey:'pressure', zKey:'electronDensity', xLabel:'Напряжение (В)', yLabel:'Давление (Па)', zLabel:'Плотность электронов (м⁻³)', title:'Разрядные характеристики: V·P → n_e', category:'plasma' },
    34: { xKey:'ionEnergy', yKey:'avgTransferredPerAtom', zKey:'totalTransferredEnergy', xLabel:'Энергия иона (эВ)', yLabel:'Энергия на атом (эВ)', zLabel:'Полная переданная энергия (Дж)', title:'Баланс энергии: ион → атом → полная', category:'energy' },
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
    46: { xKey:'avgT', yKey:'totalDamage', zKey:'diffusionCoefficient1', xLabel:'Средняя температура (°K)', yLabel:'Суммарные повреждения (дефекты/м²)', zLabel:'Кф диффузии D₁ (м²/с)', title:'Термоактивированная диффузия в повреждённом материале', category:'diffusion' },
    47: { xKey:'avgT', yKey:'concentration', zKey:'diffusionCoefficient1', xLabel:'Средняя температура (°K)', yLabel:'Концентрация (м⁻³)', zLabel:'Кф диффузии D₁ (м²/с)', title:'Классическая зависимость D(T, C)', category:'diffusion' },
    48: { xKey:'totalTransferredEnergy', yKey:'diffusionCoefficient1', zKey:'concentration', xLabel:'Полная переданная энергия (Дж)', yLabel:'Кф диффузии D₁ (м²/с)', zLabel:'Концентрация (м⁻³)', title:'Радиационно-ускоренная диффузия', category:'diffusion' },
    49: { xKey:'diffusionCoefficient1', yKey:'depths', zKey:'concentration', xLabel:'Кф диффузии D₁ (м²/с)', yLabel:'Глубина (м)', zLabel:'Концентрация (м⁻³)', title:'Диффузионный профиль концентрации', category:'diffusion' },
    50: { xKey:'avgT', yKey:'diffusionCoefficient2', zKey:'totalDamage', xLabel:'Средняя температура (°K)', yLabel:'Кф диффузии D₂ (м²/с)', zLabel:'Суммарные повреждения (дефекты/м²)', title:'Вторая мода диффузии и дефекты', category:'diffusion' },
    51: { xKey:'pressure', yKey:'avgT', zKey:'diffusionCoefficient1', xLabel:'Давление (Па)', yLabel:'Средняя температура (°K)', zLabel:'Кф диффузии D₁ (м²/с)', title:'Термобарическая диффузия', category:'diffusion' },
    52: { xKey:'voltage', zKey:'totalTransferredEnergy', yKey:'diffusionCoefficient2', xLabel:'Напряжение (В)', zLabel:'Полная переданная энергия (Дж)', yLabel:'Кф диффузии D₂ (м²/с)', title:'Энергетическая стимуляция второй моды диффузии', category:'diffusion' },
    53: { xKey:'ionEnergy', yKey:'pressure', zKey:'depths', xLabel:'Энергия иона (эВ)', yLabel:'Давление (Па)', zLabel:'Глубина проникновения (м)', title:'Пробег ионов от энергии и давления', category:'plasma' },
    54: { xKey:'electronTemperature', yKey:'ionEnergy', zKey:'totalTransferredEnergy', xLabel:'Температура электронов (°K)', yLabel:'Энергия иона (эВ)', zLabel:'Полная переданная энергия (Дж)', title:'Энергообмен электрон-ион-атом', category:'energy' },
    55: { xKey:'currentDensity', yKey:'totalTransferredEnergy', zKey:'avgT', xLabel:'Плотность тока (А/м²)', yLabel:'Полная переданная энергия (Дж)', zLabel:'Средняя температура (°K)', title:'Нагрев от плотности тока и энергопередачи', category:'thermal' },
    56: { xKey:'voltage', yKey:'depths', zKey:'concentration', xLabel:'Напряжение (В)', yLabel:'Глубина (м)', zLabel:'Концентрация (м⁻³)', title:'Профиль концентрации от напряжения и глубины', category:'energy' },
    58: { xKey:'totalMomentum', yKey:'avgT', zKey:'totalDisplacement', xLabel:'Суммарный импульс (кг·м/с)', yLabel:'Средняя температура (°K)', zLabel:'Суммарное смещение (м)', title:'Термоактивированные смещения', category:'damage' },
    59: { xKey:'diffusionCoefficient1', yKey:'totalTransferredEnergy', zKey:'depths', xLabel:'Кф диффузии D₁ (м²/с)', yLabel:'Полная переданная энергия (Дж)', zLabel:'Глубина проникновения (м)', title:'Глубина диффузии от энергии', category:'diffusion' },
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
    78: { xKey:'diffusionCoefficient1', yKey:'diffusionCoefficient2', zKey:'fluenceEff', xLabel:'D₁ (м²/с)', yLabel:'D₂ (м²/с)', zLabel:'Эффективный флюенс (м⁻²)', title:'Сравнение Кфов диффузии от флюенса', category:'rad_diffusion' },
    79: { xKey:'ionEnergy', yKey:'dSlr_plus_dRes', zKey:'totalDamage', xLabel:'Энергия иона (эВ)', yLabel:'Вклад SLR в D + Резонансный вклад в D (м²/с)', zLabel:'Суммарные повреждения (дефекты/м²)', title:'Энергетическая стимуляция диффузии', category:'rad_diffusion' },
    80: { xKey:'depths', yKey:'diffusionCoefficient1', zKey:'dRes', xLabel:'Глубина (м)', yLabel:'D₁ (м²/с)', zLabel:'Резонансный вклад в D (м²/с)', title:'Профиль радиационной диффузии', category:'rad_diffusion' },
    81: { xKey:'ionFlux', yKey:'concentration', zKey:'depths', xLabel:'Поток ионов (м⁻²·с⁻¹)', yLabel:'Концентрация (м⁻³)', zLabel:'Глубина (м)', title:'Концентрация от ионного потока и глубины', category:'flux' },
    82: { xKey:'ionFlux', yKey:'totalDamage', zKey:'avgT', xLabel:'Поток ионов (м⁻²·с⁻¹)', yLabel:'Суммарные повреждения (дефекты/м²)', zLabel:'Средняя температура (°K)', title:'Скорость дефектообразования', category:'flux' },
    83: { xKey:'currentDensity', yKey:'ionFlux', zKey:'voltage', xLabel:'Плотность тока (А/м²)', yLabel:'Поток ионов (м⁻²·с⁻¹)', zLabel:'Напряжение (В)', title:'Связь электрического тока и ионного потока', category:'flux' },
    84: { xKey:'ionFlux', yKey:'totalTransferredEnergy', zKey:'ionEnergy', xLabel:'Поток ионов (м⁻²·с⁻¹)', yLabel:'Полная переданная энергия (Дж)', zLabel:'Энергия иона (эВ)', title:'Мощность энергопередачи', category:'flux' },
    85: { xKey:'ionFlux', yKey:'fluenceEffRatio', zKey:'resonanceXi', xLabel:'Поток ионов (м⁻²·с⁻¹)', yLabel:'Φ_eff / Φ', zLabel:'Резонансный параметр ξ', title:'Кф усиления потока', category:'flux' },
    86: {
        xKey: 'fluence',
        yKey: 'angle',
        zKey: 'fluenceEff',
        xLabel: 'Флюенс (м⁻²)',
        yLabel: 'Угол падения (°)',
        zLabel: 'Эффективный флюенс (м⁻²)',
        title: 'Эффективный флюенс от флюенса и угла',
        category: 'fluence'
    },

    87: {
        xKey: 'fluenceEff',
        yKey: 'transferredEnergy',
        zKey: 'damageRate',
        xLabel: 'Эффективный флюенс (м⁻²)',
        yLabel: 'Переданная энергия (Дж)',
        zLabel: 'Скорость повреждений (дефекты/(м²·с))',
        title: 'Скорость повреждений от эффективного флюенса и энергии',
        category: 'fluence'
    },

    88: {
        xKey: 'fluenceEff',
        yKey: 'damageRate',
        zKey: 'slrFactor',
        xLabel: 'Эффективный флюенс (м⁻²)',
        yLabel: 'Скорость повреждений (дефекты/(м²·с))',
        zLabel: 'SLR-фактор',
        title: 'SLR-фактор от эффективного флюенса и скорости повреждений',
        category: 'fluence'
    },

    89: {
        xKey: 'dCollision',
        yKey: 'slrFactor',
        zKey: 'dSlr',
        xLabel: 'D_collision (м²/с)',
        yLabel: 'SLR-фактор',
        zLabel: 'D_SLR (м²/с)',
        title: 'Вклад SLR-диффузии от столкновительной диффузии',
        category: 'fluence'
    },

};

// ─────────────────────────────────────────────────────────────
// INTERACTION STATE
// ─────────────────────────────────────────────────────────────

const ChartInteractionState = {
    activeChart: null,
    _timers: new Map(),

    setActive(id) {
        this.activeChart = id;
        const t = this._timers.get(id);
        if (t) clearTimeout(t);
        this._timers.delete(id);
    },

    setIdle(id, delayMs = 1000) {
        const t = setTimeout(() => {
            if (this.activeChart === id) this.activeChart = null;
            this._timers.delete(id);
        }, delayMs);
        this._timers.set(id, t);
    },
};

// ─────────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────────

const ChartsState = {
    data: [],
    loading: true,
    error: null,
    selectedCategory: 'all',
    currentFilter: 'all',
    pressureRanges: {},
};

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

const avg = arr => arr.reduce((a, b) => a + b, 0) / (arr.length || 1);

function getTrend(values) {
    const v = values.filter(x => Number.isFinite(x));
    if (v.length < 2) return 'up';
    const chunk = Math.max(1, Math.ceil(v.length / 3));
    return avg(v.slice(-chunk)) >= avg(v.slice(0, chunk)) ? 'up' : 'down';
}

/**
 * Unicode trend arrow for axis title.
 */
function trendArrow(values, axis) {
    const up = getTrend(values) === 'up';

    // X и Z: рост ←, спад →
    if (axis === 'x' || axis === 'z') {
        return up ? ' ←' : ' →';
    }

    // Y: рост →, спад ←
    return up ? ' →' : ' ←';
}

const isPressureChart = cfg =>
    PRESSURE_KEYS.has(cfg.xKey) || PRESSURE_KEYS.has(cfg.yKey) || PRESSURE_KEYS.has(cfg.zKey);

function getPressureAxis(cfg) {
    if (PRESSURE_KEYS.has(cfg.xKey)) return 'x';
    if (PRESSURE_KEYS.has(cfg.yKey)) return 'y';
    if (PRESSURE_KEYS.has(cfg.zKey)) return 'z';
    return null;
}

const filterByPressure = (data, min, max) =>
    data.filter(item => {
        const p = item.pressure ?? 0;
        return p >= min && p <= max;
    });

function pressureRangeFromData(data) {
    const vals = DataLoader.extractValues(data, 'pressure').filter(Number.isFinite);
    if (!vals.length) return { min: 0, max: 100 };
    return { min: Math.min(...vals), max: Math.max(...vals) };
}

function dataUrlToBytes(dataUrl) {
    const bin = atob(dataUrl.split(',')[1]);
    return Uint8Array.from(bin, c => c.charCodeAt(0));
}

function blobToBase64(blob) {
    return new Promise((res, rej) => {
        const r = new FileReader();
        r.onload  = () => res(r.result.split(',')[1]);
        r.onerror = rej;
        r.readAsDataURL(blob);
    });
}

const isMobile = () => window.innerWidth < 768;

function notify(msg, type = 'info') {
    window.PlasmaAnimations?.ToastNotifications?.show(msg, type, 3500)
    ?? console.info(`[Charts][${type}] ${msg}`);
}

// ─────────────────────────────────────────────────────────────
// AXIS & COLORBAR BUILDERS
// ─────────────────────────────────────────────────────────────

const { tick: TICK_SIZE, axisTitle: AXIS_TITLE_SIZE, colorbar: CB_SIZE, cbTitle: CB_TITLE_SIZE } =
    EXPORT_CONFIG.fonts.sizes;

/**
 * Builds a Plotly 3D axis config.
 */
function buildAxis(label, values = [], axis = 'x', extra = {}) {
    const valid  = values.filter(Number.isFinite);
    const absMax = valid.length ? Math.max(...valid.map(Math.abs)) : 0;

    // Научный стиль для |x| >= 10000 или 0 < |x| < 0.001
    const useScientific = valid.some(v =>
        v !== 0 && (Math.abs(v) >= 10000 || Math.abs(v) < 0.001)
    );

    const spread = valid.length > 1 ? Math.max(...valid) - Math.min(...valid) : 0;
    const nticks = spread === 0 ? 2 : Math.min(8, Math.max(4, Math.ceil(Math.log10(spread + 1) + 3)));

    const titleText = label + trendArrow(values, axis);

    return {
        title: {
            text: titleText,
            font: { family: FONT_FAMILY, size: AXIS_TITLE_SIZE, color: '#000000' },
        },
        tickfont:        { family: FONT_FAMILY, size: TICK_SIZE, color: '#333333' },
        nticks,
        tickmode:        'auto',
        exponentformat:  useScientific ? 'e' : 'f',
        showexponent:    useScientific ? 'all' : 'last',
        linecolor:       '#000000',
        linewidth:       2,
        zerolinecolor:   '#000000',
        zerolinewidth:   1,
        gridcolor:       'black',
        gridwidth:       1,
        showgrid:        true,
        backgroundcolor: 'rgba(255,255,255,0.92)',
        showbackground:  true,
        mirror:          true,
        ...extra,
    };
}

function buildColorbar(zLabel, fontScale = 1) {
    const titleSize = Math.round(CB_TITLE_SIZE * fontScale);
    const tickSize  = Math.round(CB_SIZE * fontScale);

    return {
        title: {
            text: zLabel,
            font: { family: FONT_FAMILY, size: titleSize, color: '#111827' },
            side: 'right',
        },
        thickness: Math.round(EXPORT_CONFIG.layout.colorbar.thickness * Math.max(1, fontScale)),
        len: 0.86,
        x: 0.83,
        xanchor: 'left',
        xpad: 16,
        outlinewidth: 0,
        tickfont: {
            family: FONT_FAMILY,
            size: tickSize,
            color: '#111827'
        },
        tickformat: '.2g',
    };
}

// ─────────────────────────────────────────────────────────────
// COLOR SCALES
// ─────────────────────────────────────────────────────────────

const COLORSCALE_MAP = {
    plasma:        'Viridis',
    energy:        'Hot',
    thermal:       'RdYlBu',
    diffusion:     'Portland',
    damage:        'Reds',
    fluence:       'Electric',
    resonance:     'Cividis',
    slr:           'Magma',
    rad_diffusion: 'YlOrRd',
    flux:          'Jet',
};

const SWATCH_CSS = {
    Viridis:  'linear-gradient(90deg,#440154,#31688e,#35b779,#fde725)',
    Hot:      'linear-gradient(90deg,#000,#f00,#ff0,#fff)',
    RdYlBu:   'linear-gradient(90deg,#313695,#74add1,#ffffbf,#d73027)',
    Portland: 'linear-gradient(90deg,#0c3383,#ea6a47,#f9d057)',
    Reds:     'linear-gradient(90deg,#fff5f0,#fc8a6a,#a50f15)',
    Electric: 'linear-gradient(90deg,#000,#9400d3,#00bfff,#fff)',
    Cividis:  'linear-gradient(90deg,#00224e,#5a6c8a,#b8b974,#fde738)',
    Magma:    'linear-gradient(90deg,#000004,#3b0f70,#f05b12,#fcfdbf)',
    YlOrRd:   'linear-gradient(90deg,#ffffcc,#fd8d3c,#bd0026)',
    Jet:      'linear-gradient(90deg,#00007f,#0000ff,#00ffff,#ffff00,#ff0000,#7f0000)',
};

// ─────────────────────────────────────────────────────────────
// DATA LOADER
// ─────────────────────────────────────────────────────────────

class DataLoader {
    static async loadResults() {
        const res = await window.PlasmaAuth.apiRequest('/results/config', null, true);
        if (!res.ok) throw new Error(res.data?.message ?? 'Не удалось загрузить результаты');
        const results = res.data?.data ?? res.data ?? [];
        if (!Array.isArray(results)) {
            console.warn('[DataLoader] unexpected shape:', results);
            return [];
        }
        console.log(`[DataLoader] loaded ${results.length} records`);
        return results;
    }

    static getNestedValue(obj, path) {
        if (!obj || !path) return null;
        if (path.includes('.')) {
            return path.split('.').reduce((cur, k) => cur?.[k] ?? null, obj);
        }
        return (
            obj[path] ??
            obj.intermediate?.[path] ??
            obj.diffusionProfile?.[path] ??
            obj.plasmaParameters?.[path] ??
            null
        );
    }

    static extractValues(data, key) {
        const get = item => this.getNestedValue(item, key) ?? 0;

        switch (key) {
            // Конвертация мм → м: делим на 1000
            case 'depths':
                return data.map(item => (get(item) || 0) / 1000);

            case 'dSlr_plus_dRes':
                return data.map(item => (get({ ...item, __k: 'd_Slr' }) || this.getNestedValue(item, 'dSlr') || 0)
                    + (this.getNestedValue(item, 'd_Res') || this.getNestedValue(item, 'dRes') || 0));

            case 'fluenceEffRatio':
            case 'fluenceEff_div_fluence':
                return data.map(item => {
                    const f    = this.getNestedValue(item, 'fluence')    || 1;
                    const fEff = this.getNestedValue(item, 'fluenceEff') || 0;
                    return fEff / (f || 1);
                });

            default:
                return data.map(get);
        }
    }

    static prepareChartData(data, config) {
        return {
            xValues: this.extractValues(data, config.xKey),
            yValues: this.extractValues(data, config.yKey),
            zValues: this.extractValues(data, config.zKey),
        };
    }

    static prepareChartDataFiltered(data, config, min, max) {
        const filtered = filterByPressure(data, min, max);
        if (!filtered.length) {
            console.warn(`[DataLoader] no data in pressure range ${min}–${max} Pa`);
            return null;
        }
        return this.prepareChartData(filtered, config);
    }
}

// ── Helper: nice axis range with rounding up ──────────────────
function getNiceAxisRange(values, extraMax = null) {
    const valid = values.filter(Number.isFinite);
    if (!valid.length) return { min: 0, max: 10, dtick: 2 };

    let min = Math.min(...valid);
    let max = extraMax !== null ? extraMax : Math.max(...valid);

    // Небольшой запас, чтобы точка не была на самой границе
    const margin = (max - min) * 0.05 || 1;
    min -= margin;
    max += margin;

    const range = max - min;
    const rawStep = range / 5; // ~5-6 делений
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const normalized = rawStep / magnitude;

    // Выбираем «красивый» шаг: 1, 2, 5, 10 × 10ⁿ
    let niceStep;
    if (normalized <= 1) niceStep = 1;
    else if (normalized <= 2.5) niceStep = 2;
    else if (normalized <= 6) niceStep = 5;
    else niceStep = 10;
    niceStep *= magnitude;

    // Округляем границы до кратных niceStep
    const niceMin = Math.floor(min / niceStep) * niceStep;
    const niceMax = Math.ceil(max / niceStep) * niceStep;

    return { min: niceMin, max: niceMax, dtick: niceStep };
}


// ─────────────────────────────────────────────────────────────
// CHART RENDERER
// ─────────────────────────────────────────────────────────────
class ChartRenderer {
    // ── IDW mesh interpolation ──────────────────────────────────────
    static _idw(xn, yn, xV, yV, zV, xMin, xR, yMin, yR) {
        const dists = xV.map((xi, i) => {
            const dx = xn - (xi - xMin) / xR;
            const dy = yn - (yV[i] - yMin) / yR;
            return { d: Math.hypot(dx, dy), z: zV[i] };
        });
        const exact = dists.find(p => p.d < 1e-10);
        if (exact) return exact.z;
        dists.sort((a, b) => a.d - b.d);
        const near = dists.slice(0, Math.min(Math.max(5, Math.floor(xV.length / 10)), 20));
        let ws = 0, wz = 0;
        for (const p of near) { const w = 1 / (p.d + 1e-10) ** 2; wz += p.z * w; ws += w; }
        return ws > 0 ? wz / ws : near[0].z;
    }

    static createMeshGrid(xV, yV, zV) {
        const idx = xV.reduce((acc, x, i) => {
            if (Number.isFinite(x) && Number.isFinite(yV[i]) && Number.isFinite(zV[i])) acc.push(i);
            return acc;
        }, []);
        if (idx.length < 3)
            return { xGrid: [[0,1],[0,1]], yGrid: [[0,0],[1,1]], zGrid: [[0,0],[0,0]] };

        const vx = idx.map(i => xV[i]), vy = idx.map(i => yV[i]), vz = idx.map(i => zV[i]);
        const xMin = Math.min(...vx), xMax = Math.max(...vx);
        const yMin = Math.min(...vy), yMax = Math.max(...vy);
        const xR = xMax - xMin || 1, yR = yMax - yMin || 1;
        const gs = Math.min(Math.max(Math.floor(Math.sqrt(idx.length)), 15), 30);

        const xGrid = [], yGrid = [], zGrid = [];
        for (let i = 0; i < gs; i++) {
            const xR_ = [], yR_ = [], zR_ = [];
            for (let j = 0; j < gs; j++) {
                const x = xMin + j * xR / (gs - 1);
                const y = yMin + i * yR / (gs - 1);
                xR_.push(x); yR_.push(y);
                zR_.push(this._idw((x - xMin) / xR, (y - yMin) / yR, vx, vy, vz, xMin, xR, yMin, yR));
            }
            xGrid.push(xR_); yGrid.push(yR_); zGrid.push(zR_);
        }
        return { xGrid, yGrid, zGrid };
    }

    static getStats(values) {
        const f = values.filter(Number.isFinite);
        if (!f.length) return { min: 0, max: 0, avg: 0 };
        return { min: Math.min(...f), max: Math.max(...f), avg: avg(f) };
    }

    // ── Surface trace factory ───────────────────────────────────────
    static _surfaceTrace(xGrid, yGrid, zGrid, config, colorbarScale = 1) {
        return {
            type: 'surface',
            x: xGrid, y: yGrid, z: zGrid,
            colorscale: COLORSCALE_MAP[config.category] ?? 'Viridis',
            colorbar: buildColorbar(config.zLabel, colorbarScale * 1.1),
            contours: {
                z: { show: true, usecolormap: true, highlightcolor: '#42f462', project: { z: true }, width: 1 },
            },
            hovertemplate:
                `<b>${config.xLabel}</b>: %{x:.2g}<br>` +
                `<b>${config.yLabel}</b>: %{y:.2g}<br>` +
                `<b>${config.zLabel}</b>: %{z:.2g}<extra></extra>`,
            showscale: true,
        };
    }

    // ── Interactive 3D chart ────────────────────────────────────────
    static create3DChart(el, data, config) {
        const valid = [data.xValues, data.yValues, data.zValues]
            .flatMap(a => a.filter(Number.isFinite)).length;
        if (valid < 3) {
            el.innerHTML = '<div class="chart-error">⚠️ Недостаточно данных</div>';
            return;
        }
        const flat = a => { const f = a.filter(Number.isFinite); return f.length && Math.min(...f) === Math.max(...f); };
        if (flat(data.xValues) && flat(data.yValues)) {
            el.innerHTML = '<div class="chart-error">️ Данные вырождены</div>';
            return;
        }

        const { xGrid, yGrid, zGrid } = this.createMeshGrid(data.xValues, data.yValues, data.zValues);
        const mobile = isMobile();

        const layout = {
            paper_bgcolor: '#ffffff',
            plot_bgcolor:  '#ffffff',
            font:          { family: FONT_FAMILY, size: TICK_SIZE, color: '#1a1a1a' },
            margin:        mobile ? EXPORT_CONFIG.layout.marginMobile : { l: 60, r: 15, t: 55, b: 50 },
            autosize:      true,
            showlegend:    false,
            scene: {
                bgcolor:    '#ffffff',
                aspectmode: 'cube',
                domain:     EXPORT_CONFIG.layout.sceneDomain,
                camera:     { eye: { x: 1.6, y: 1.6, z: 1.3 } },
                xaxis: buildAxis(config.xLabel, data.xValues, 'x'),
                yaxis: buildAxis(config.yLabel, data.yValues, 'y'),
                zaxis: buildAxis(config.zLabel, data.zValues, 'z'),
            },
        };

        const plotCfg = {
            responsive:     true,
            displayModeBar: true,
            displaylogo:    false,
            scrollZoom:     false,
            plotGlPixelRatio: window.devicePixelRatio || 2,
            doubleClickDelay: 300,
            modeBarButtonsToRemove: ['select3d', 'lasso3d', 'hoverClosest3d', 'resetCameraDefault3d'],
            toImageButtonOptions: {
                format:   'png',
                filename: `plasma_${String(config.title).replace(/\s+/g, '_').slice(0, 40)}`,
                ...EXPORT_CONFIG.dimensions.png,
            },
        };

        el.innerHTML = '';
        window.Plotly.newPlot(el, [this._surfaceTrace(xGrid, yGrid, zGrid, config, 1.25)], layout, plotCfg)
            .then(gd => {
                const id = el.id;
                gd.on('plotly_relayout', () => ChartInteractionState.setActive(id));
                gd.on('plotly_afterplot', () => ChartInteractionState.setIdle(id));
                gd.addEventListener('mouseenter', () => ChartInteractionState.setActive(id));
                gd.addEventListener('mouseleave', () => ChartInteractionState.setIdle(id));
                gd.addEventListener('mousedown',  () => ChartInteractionState.setActive(id));
            })
            .catch(err => {
                console.error('[ChartRenderer] plot failed:', err);
                el.innerHTML = `<div class="chart-error">❌ ${err.message}</div>`;
            });
    }

    // ── Off-screen high-quality export (PNG & SVG) ──────────────────
    static async renderForExport(chartData, config, camera = null, axisRange = null, format = 'png') {
        const dims = format === 'svg' ? EXPORT_CONFIG.dimensions.svg : EXPORT_CONFIG.dimensions.png;
        const { width, height } = dims;

        const tmp = Object.assign(document.createElement('div'), {
            style: `position:fixed;left:-9999px;top:-9999px;width:${width}px;height:${height}px;z-index:-1000;background:#fff`,
        });
        document.body.appendChild(tmp);

        try {
            const { xGrid, yGrid, zGrid } = this.createMeshGrid(
                chartData.xValues, chartData.yValues, chartData.zValues,
            );

            const cam = camera
                ? { eye: camera.eye, center: camera.center ?? { x:0,y:0,z:0 }, up: camera.up ?? { x:0,y:0,z:1 } }
                : { eye: { x: 1.6, y: 1.6, z: 1.3 } };

            const axisExtra = { x: {}, y: {}, z: {} };
            if (axisRange?.axis) {
                axisExtra[axisRange.axis] = { range: [axisRange.min, axisRange.max], autorange: false };
            }

            const EXPORT_STYLE = {
                baseFont: 42,
                tickFont: 20,
                axisTitle: 42,
                lineWidth: 2,
                gridWidth: 1,
                margin: { l: 120, r: 180, t: 80, b: 120 },
                sceneDomain: { x: [0.02, 0.88], y: [0.02, 0.98] },
                camera: camera
                    ? {
                        eye: {
                            x: (camera.eye?.x ?? 1.6) * 1.15,
                            y: (camera.eye?.y ?? 1.6) * 1.15,
                            z: (camera.eye?.z ?? 1.3) * 1.15,
                        },
                        center: camera.center ?? { x: 0, y: 0, z: 0 },
                        up: camera.up ?? { x: 0, y: 0, z: 1 },
                    }
                    : { eye: { x: 1.85, y: 1.85, z: 1.50 } },
            };

            const mkAxis = (label, vals, ax) => {
                const axisCfg = axisExtra[ax] || {};
                const rangeCfg = getNiceAxisRange(vals, axisCfg.range?.[1]);

                const safeMin = Math.max(0, rangeCfg.min);
                const safeMax = Math.max(safeMin + rangeCfg.dtick, rangeCfg.max);

                const tickStep = rangeCfg.dtick * 2;
                const tickVals = [];
                const startTick = safeMin;
                for (let v = startTick; v < safeMax - rangeCfg.dtick / 2; v += tickStep) {
                    tickVals.push(+v.toFixed(10));
                }
                const maxRounded = +safeMax.toFixed(10);
                if (!tickVals.includes(maxRounded)) {
                    tickVals.push(maxRounded);
                }

                const validExport = vals.filter(Number.isFinite);
                const useScientificExport = validExport.some(v =>
                    v !== 0 && (Math.abs(v) >= 10000 || Math.abs(v) < 0.001)
                );

                return buildAxis(label, vals, ax, {
                    ...axisExtra[ax],
                    autorange: false,
                    range: [safeMin, safeMax],
                    title: {
                        text: label + trendArrow(vals, ax),
                        font: { family: FONT_FAMILY, size: EXPORT_STYLE.axisTitle, color: '#000' },
                    },
                    tickfont: {
                        family: FONT_FAMILY,
                        size: EXPORT_STYLE.tickFont,
                        color: '#111827',
                    },
                    tickmode: 'array',
                    tickvals: tickVals,
                    nticks: undefined,
                    linewidth: EXPORT_STYLE.lineWidth,
                    zerolinewidth: 1,
                    gridwidth: EXPORT_STYLE.gridWidth,
                    gridcolor: 'black',
                    backgroundcolor: 'rgba(255,255,255,1)',
                    exponentformat: useScientificExport ? 'e' : 'f',
                    showexponent:    useScientificExport ? 'all' : 'last',
                });
            };

            const layout = {
                width, height,
                paper_bgcolor: '#ffffff',
                plot_bgcolor:  '#ffffff',
                font: {
                    family: FONT_FAMILY,
                    size: EXPORT_STYLE.baseFont,
                    color: '#111827'
                },
                margin: EXPORT_STYLE.margin,
                showlegend: false,
                scene: {
                    bgcolor:     '#ffffff',
                    aspectmode:  'manual',
                    aspectratio: { x: 1.2, y: 1.0, z: 0.8 },
                    camera:      EXPORT_STYLE.camera,
                    domain:      EXPORT_STYLE.sceneDomain,
                    xaxis: mkAxis(config.xLabel, chartData.xValues, 'x'),
                    yaxis: mkAxis(config.yLabel, chartData.yValues, 'y'),
                    zaxis: mkAxis(config.zLabel, chartData.zValues, 'z'),
                },
            };

            await window.Plotly.newPlot(
                tmp,
                [this._surfaceTrace(xGrid, yGrid, zGrid, config, 2.5)],
                layout,
                { staticPlot: true, displayModeBar: false, displaylogo: false, responsive: false },
            );

            await new Promise(r => setTimeout(r, 700));

            if (format === 'svg') {
                const svg = tmp.querySelector('svg');
                if (!svg) throw new Error('SVG not rendered');
                svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                return new XMLSerializer().serializeToString(svg);
            }

            return await window.Plotly.toImage(tmp, { format: 'png', width, height, scale: dims.scale ?? 3 });

        } catch (err) {
            console.error('[ChartRenderer.renderForExport]', err);
            if (format === 'svg')
                return window.Plotly.toImage(tmp, { format: 'png', width, height, scale: 2 });
            throw err;
        } finally {
            try { window.Plotly.purge(tmp); } catch (_) {}
            document.body.removeChild(tmp);
        }
    }
}

// ─────────────────────────────────────────────────────────────
// UI MANAGER
// ─────────────────────────────────────────────────────────────

class UIManager {
    static observer = null;
    static loadedCharts = new Set();
    static pendingLoads = new Set();
    static MAX_LOADED = 15;

    // ── State display ───────────────────────────────────────────────
    static showLoading() { this._setState('loading'); }
    static showNoData()  { this._setState('noData');  }
    static showCharts()  { this._setState('charts');  }

    static _setState(state) {
        document.getElementById('loadingState').style.display  = state === 'loading' ? 'flex'  : 'none';
        document.getElementById('noDataState').style.display   = state === 'noData'  ? 'flex'  : 'none';
        document.getElementById('chartsGrid').style.display    = state === 'charts'  ? 'grid'  : 'none';
        document.getElementById('exportActions').style.display = state === 'charts'  ? 'flex'  : 'none';
        document.getElementById('filterControls').style.display= state === 'charts'  ? 'block' : 'none';
    }

    // ── Render all charts ───────────────────────────────────────────
    static renderCharts(data) {
        const grid = document.getElementById('chartsGrid');
        grid.innerHTML = '';

        const byCategory = {};
        for (const [id, cfg] of Object.entries(CHART_CONFIGS)) {
            (byCategory[cfg.category] ??= []).push({ id, config: cfg });
        }
        for (const [cat, charts] of Object.entries(byCategory)) {
            grid.appendChild(this._createCategorySection(cat, charts, data));
        }
        this.showCharts();
        this._initLazyLoading(data);
    }

    static _initLazyLoading(data) {
        this.observer?.disconnect();
        this.observer = new IntersectionObserver(entries => {
            for (const e of entries) {
                const id = e.target.dataset.chartId;
                e.isIntersecting ? this.loadChart(id, data) : this._unloadChart(id);
            }
        }, { rootMargin: '300px' });

        document.querySelectorAll('.chart-container[data-chart-id]')
            .forEach(el => this.observer.observe(el));
    }

    static loadChart(chartId, data) {
        const el = document.getElementById(`chart-${chartId}`);
        if (!el) return;

        if (el.dataset.loaded === 'true') {
            el.style.visibility = 'visible';
            el.style.opacity    = '1';
            return;
        }
        if (this.pendingLoads.has(chartId)) return;
        this.pendingLoads.add(chartId);

        // Evict oldest non-active chart if over limit
        if (this.loadedCharts.size >= this.MAX_LOADED) {
            for (const oldest of this.loadedCharts) {
                if (oldest !== chartId && ChartInteractionState.activeChart !== `chart-${oldest}`) {
                    this._unloadChart(oldest);
                    break;
                }
            }
        }

        const config    = CHART_CONFIGS[chartId];
        const rangeIdx  = Number(el.dataset.pressureRange ?? -1);
        const pRange    = ChartsState.pressureRanges[chartId];

        const chartData = isPressureChart(config) && rangeIdx >= 0 && pRange
            ? (DataLoader.prepareChartDataFiltered(data, config, pRange.min, pRange.max)
                ?? DataLoader.prepareChartData(data, config))
            : DataLoader.prepareChartData(data, config);

        requestAnimationFrame(() => {
            try {
                ChartRenderer.create3DChart(el, chartData, config);
                el.dataset.loaded = 'true';
                this.loadedCharts.add(chartId);
                this._updateCounter();
                this._updateTrendBadges(chartId, chartData, config);
                el.closest('.chart-card')?.classList.add('chart-loaded');
            } catch (err) {
                console.error(`[UIManager] chart #${chartId} failed:`, err);
            } finally {
                this.pendingLoads.delete(chartId);
            }
        });
    }

    static _unloadChart(chartId) {
        const el = document.getElementById(`chart-${chartId}`);
        if (!el || el.dataset.loaded !== 'true') return;
        el.style.visibility = 'hidden';
        el.style.opacity    = '0';
        this.loadedCharts.delete(chartId);
    }

    static _updateCounter() {
        const wrap = document.getElementById('chartsCounter');
        if (!wrap) return;
        wrap.style.display = 'flex';
        document.getElementById('loadedCount').textContent = String(this.loadedCharts.size);
        document.getElementById('totalCount').textContent  = String(Object.keys(CHART_CONFIGS).length);
    }

    static _updateTrendBadges(chartId, chartData, config) {
        const trendEl = document.querySelector(`#legend-${chartId} .legend-trends`);
        if (!trendEl) return;

        const axes = [
            { label: config.xLabel, values: chartData.xValues, ax: 'X' },
            { label: config.yLabel, values: chartData.yValues, ax: 'Y' },
            { label: config.zLabel, values: chartData.zValues, ax: 'Z' },
        ];

        trendEl.innerHTML = axes.map(({ label, values, ax }) => {
            const t = getTrend(values);
            const [cls, icon, word] = t === 'up'
                ? ['up',   'fa-arrow-up',   'рост']
                : ['down', 'fa-arrow-down', 'спад'];
            return `<span class="trend-item ${cls}" title="${word}: ${label}">
                        <i class="fas ${icon}"></i> ${ax}: ${word}
                    </span>`;
        }).join('');
    }

    // ── Category section ────────────────────────────────────────────
    static _createCategorySection(category, charts, data) {
        const INFO = {
            plasma:        { title: 'Параметры плазмы',                  desc: 'Электронные характеристики и плазменные процессы',        icon: 'fa-atom'             },
            energy:        { title: 'Энергетические характеристики',      desc: 'Перенос и распределение энергии',                         icon: 'fa-fire'             },
            thermal:       { title: 'Температурные профили',              desc: 'Распределение температуры по глубине',                    icon: 'fa-thermometer-half' },
            diffusion:     { title: 'Диффузионные процессы',              desc: 'Кфы диффузии, радиационные механизмы и профили',  icon: 'fa-chart-line'       },
            damage:        { title: 'Радиационное повреждение',           desc: 'Дефекты, импульс и смещение атомов',                      icon: 'fa-radiation-alt'    },
            fluence:       { title: 'Флюенс и накопление дозы',           desc: 'Интегральный поток ионов, эффективный флюенс и кинетика', icon: 'fa-clock'            },
            resonance:     { title: 'Резонансные эффекты',                desc: 'Резонансное усиление диффузии и взаимодействие с плазмой', icon: 'fa-wave-square'     },
            slr:           { title: 'SLR – перемешивание поверхности',    desc: 'Баллистическое перемешивание и SLR-диффузия',             icon: 'fa-sync-alt'         },
            rad_diffusion: { title: 'Радиационно-ускоренная диффузия',    desc: 'Сравнение SLR и резонансных механизмов диффузии',         icon: 'fa-bezier-curve'     },
            flux:          { title: 'Потоковые характеристики',           desc: 'Ионный поток и скорость дефектообразования',              icon: 'fa-wind'             },
        };
        const info = INFO[category] ?? { title: category, desc: '', icon: 'fa-chart-area' };

        const sec = document.createElement('div');
        sec.className       = 'category-section';
        sec.dataset.category = category;
        sec.innerHTML = `
            <div class="category-header">
                <div class="category-icon ${category}"><i class="fas ${info.icon}"></i></div>
                <div><h2>${info.title}</h2><p>${info.desc}</p></div>
            </div>`;

        for (const { id, config } of charts) {
            sec.appendChild(this._createChartCard(id, config, data));
        }
        return sec;
    }

    // ── Single chart card ───────────────────────────────────────────
    static _createChartCard(id, config, data) {
        const card      = document.createElement('div');
        card.className  = 'chart-card';

        const chartData  = DataLoader.prepareChartData(data, config);
        const stats      = ChartRenderer.getStats(chartData.zValues);
        const hasPressure = isPressureChart(config);
        const pRange     = hasPressure ? pressureRangeFromData(data) : null;
        const colorscale = COLORSCALE_MAP[config.category] ?? 'Viridis';
        const swatch     = SWATCH_CSS[colorscale] ?? SWATCH_CSS.Viridis;

        const pressureHtml = hasPressure ? `
            <div class="pressure-range-control" id="pressure-control-${id}">
                <div class="pressure-range-label">
                    <i class="fas fa-chart-simple"></i>
                    <span>Диапазон давления (Па):</span>
                </div>
                <div class="pressure-preset-row">
                    <select class="pressure-preset" id="pressure-preset-${id}"
                            onchange="setPressurePreset(${id}, this.value)">
                        <option value="full">📊 Весь диапазон</option>
                        <option value="0.1-5">📉 0,1 – 5 Па</option>
                        <option value="5-15">📈 5 – 15 Па</option>
                        <option value="15-100">📊 15 – 100 Па</option>
                    </select>
                </div>
                <div class="pressure-slider-container">
                    <span class="pressure-min-value" id="pressure-min-display-${id}">${pRange.min.toFixed(2)}</span>
                    <input type="range" class="pressure-slider"     id="pressure-slider-${id}"
                           min="${pRange.min}" max="${pRange.max}" step="0.1" value="${pRange.max}">
                    <span class="pressure-max-value" id="pressure-max-display-${id}">${pRange.max.toFixed(2)}</span>
                    <input type="range" class="pressure-slider-min" id="pressure-slider-min-${id}"
                           min="${pRange.min}" max="${pRange.max}" step="0.1" value="${pRange.min}">
                </div>
                <div class="pressure-range-buttons">
                    <button class="pressure-reset-btn" onclick="resetPressureRange(${id})">
                        <i class="fas fa-undo"></i> Сброс
                    </button>
                </div>
            </div>` : '';

        card.innerHTML = `
            <div class="chart-header">
                <div class="chart-title">
                    <div class="chart-number">${id}</div>
                    <h3>${config.title}</h3>
                </div>
                <div class="chart-actions">
                    <button class="chart-btn" onclick="downloadChart(${id})"     title="Скачать PNG"><i class="fas fa-download"></i></button>
                    <button class="chart-btn" onclick="fullscreenChart(${id})"   title="На весь экран"><i class="fas fa-expand"></i></button>
                </div>
            </div>
            ${pressureHtml}
            <div class="chart-body">
                <div class="chart-container" id="chart-${id}"
                     data-chart-id="${id}" data-loaded="false" data-pressure-range="-1">
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
                    <span class="axis-badge axis-x">X</span><span>${config.xLabel}</span>
                </div>
                <div class="chart-legend-item">
                    <span class="axis-badge axis-y">Y</span><span>${config.yLabel}</span>
                </div>
                <div class="legend-trends"></div>
            </div>
            <div class="word-export-bar">
                <button class="btn-word"     onclick="downloadChartForWord(${id})"><i class="fas fa-file-word"></i> Экспорт в Word</button>
                <button class="btn-png-word" onclick="downloadChartPng(${id})"><i class="fas fa-image"></i> PNG HD</button>
                <span class="export-hint" title="Угол обзора сохранится"><i class="fas fa-video"></i> Сохраняет угол</span>
            </div>
            <div class="chart-info">
                ${[
            ['fa-arrow-down','Мин',   stats.min.toExponential(2)],
            ['fa-arrow-up',  'Макс',  stats.max.toExponential(2)],
            ['fa-equals',    'Средн', stats.avg.toExponential(2)],
            ['fa-database',  'Точек', chartData.xValues.length],
        ].map(([icon, label, val]) => `
                    <div class="chart-info-item">
                        <i class="fas ${icon}"></i>
                        <span class="chart-info-label">${label}:</span>
                        <span class="chart-info-value">${val}</span>
                    </div>`).join('')}
            </div>`;

        return card;
    }
}

// ─────────────────────────────────────────────────────────────
// EXPORT HELPERS
// ─────────────────────────────────────────────────────────────

function getCameraFromChart(chartId) {
    try {
        const el = document.getElementById(`chart-${chartId}`);
        if (el?.dataset.loaded === 'true') {
            const cam = el._fullLayout?.scene?.camera ?? el.layout?.scene?.camera;
            return cam ? JSON.parse(JSON.stringify(cam)) : null;
        }
    } catch (_) {}
    return null;
}

function getChartDataForExport(chartId) {
    const config = CHART_CONFIGS[chartId];
    const pRange = ChartsState.pressureRanges[chartId] ?? null;

    if (!isPressureChart(config) || !pRange) {
        return {
            chartData:  DataLoader.prepareChartData(ChartsState.data, config),
            axisRange:  null,
            rangeLabel: null,
        };
    }
    const pressureAxis = getPressureAxis(config);
    return {
        chartData:  DataLoader.prepareChartDataFiltered(ChartsState.data, config, pRange.min, pRange.max)
            ?? DataLoader.prepareChartData(ChartsState.data, config),
        axisRange:  { axis: pressureAxis, min: pRange.min, max: pRange.max },
        rangeLabel: `${pRange.min.toFixed(2)} – ${pRange.max.toFixed(2)} Па`,
    };
}

function createProgressOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'export-progress-overlay';
    overlay.innerHTML = `
        <div class="export-progress-modal">
            <div class="progress-icon"><i class="fas fa-file-word"></i></div>
            <h3 class="progress-title">Экспорт в Word</h3>
            <p class="progress-description">Генерация графиков в высоком качестве…</p>
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
    const pct = Math.round((current / total) * 100);
    const bar  = document.getElementById('exportProgressBar');
    if (bar) bar.style.width = `${pct}%`;
    const txt  = document.getElementById('exportProgressText');
    if (txt) txt.textContent = `${current} / ${total}`;
    const pEl  = document.getElementById('exportProgressPercent');
    if (pEl) pEl.textContent = `${pct}%`;
}

function removeProgressOverlay() {
    const el = document.querySelector('.export-progress-overlay');
    if (!el) return;
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
}

// ─────────────────────────────────────────────────────────────
// WORD DOCUMENT BUILDERS
// ─────────────────────────────────────────────────────────────

const CAT_NAMES_RU = {
    plasma: 'Параметры плазмы', energy: 'Энергетика', thermal: 'Температура',
    diffusion: 'Диффузия', damage: 'Повреждения', fluence: 'Флюенс',
    resonance: 'Резонанс', slr: 'SLR', rad_diffusion: 'Рад. диффузия', flux: 'Поток',
};

function buildWordImage(lib, bytes, scale = 1) {
    const iw = Math.round(454 * scale);
    const ih = Math.round(iw * (EXPORT_CONFIG.dimensions.png.height / EXPORT_CONFIG.dimensions.png.width));
    return new lib.Paragraph({
        children:  [new lib.ImageRun({ type: 'png', data: bytes, transformation: { width: iw, height: ih } })],
        alignment: lib.AlignmentType.CENTER,
        spacing:   { after: 300 },
    });
}

function buildLegendTable(lib, config, chartData) {
    const { Table, TableRow, TableCell, Paragraph, TextRun, WidthType, BorderStyle } = lib;

    const rows = [
        ['🔹 Ось X',        config.xLabel],
        ['🔹 Ось Y',        config.yLabel],
        ['🔹 Ось Z (цвет)', config.zLabel],
        ['📈 Тренд X', getTrend(chartData.xValues) === 'up' ? '▲ Рост' : '▼ Спад'],
        ['📈 Тренд Y', getTrend(chartData.yValues) === 'up' ? '▲ Рост' : '▼ Спад'],
        ['📈 Тренд Z', getTrend(chartData.zValues) === 'up' ? '▲ Рост' : '▼ Спад'],
    ];

    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            inside: { style: BorderStyle.NONE }
        },
        rows: rows.map(([label, value], i) => new TableRow({
            children: [
                new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    shading: { fill: i % 2 === 0 ? 'f8fafc' : 'f1f5f9' },
                    children: [new Paragraph({
                        spacing: { before: 80, after: 80 },
                        children: [new TextRun({
                            text: label,
                            bold: true,
                            size: 24,
                            color: '1e40af',
                            font: FONT_FAMILY
                        })]
                    })],
                }),
                new TableCell({
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    shading: { fill: i % 2 === 0 ? 'ffffff' : 'f8fafc' },
                    children: [new Paragraph({
                        spacing: { before: 80, after: 80 },
                        children: [new TextRun({
                            text: value,
                            size: 24,
                            color: '374151',
                            font: FONT_FAMILY,
                            bold: true
                        })]
                    })],
                }),
            ],
        })),
    });
}

function buildStatsTable(lib, chartData) {
    const { Table, TableRow, TableCell, Paragraph, TextRun, WidthType, BorderStyle } = lib;
    const stats = ChartRenderer.getStats(chartData.zValues);
    const rows  = [
        ['📉 Минимум', stats.min.toExponential(3)],
        ['📈 Максимум', stats.max.toExponential(3)],
        ['⚖ Среднее',   stats.avg.toExponential(3)],
        ['📊 Точек',    String(chartData.xValues.length)],
    ];

    return new Table({
        width: { size: 70, type: WidthType.PERCENTAGE },
        borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            inside: { style: BorderStyle.NONE }
        },
        rows: rows.map(([label, value]) => new TableRow({
            children: [
                new TableCell({
                    width: { size: 40, type: WidthType.PERCENTAGE },
                    shading: { fill: 'f0fdf4' },
                    children: [new Paragraph({
                        spacing: { before: 70, after: 70 },
                        children: [new TextRun({
                            text: label,
                            bold: true,
                            size: 24,
                            color: '166534',
                            font: FONT_FAMILY
                        })]
                    })],
                }),
                new TableCell({
                    width: { size: 60, type: WidthType.PERCENTAGE },
                    shading: { fill: 'fafafa' },
                    children: [new Paragraph({
                        spacing: { before: 70, after: 70 },
                        children: [new TextRun({
                            text: value,
                            size: 24,
                            color: '374151',
                            font: 'Courier New',
                            bold: true
                        })]
                    })],
                }),
            ],
        })),
    });
}

function buildSingleChartWordContent(lib, chartId, config, chartData, imgBytes, meta) {
    const { Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = lib;

    return [
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing:   { before: 0, after: 120 },
            children:  [new TextRun({ text: CAT_NAMES_RU[config.category] ?? config.category, size: 16, color: '64748b', bold: true, font: FONT_FAMILY })],
        }),
        new Paragraph({
            text:    `График ${chartId}: ${config.title}`,
            heading: HeadingLevel.HEADING_2,
            spacing: EXPORT_CONFIG.word.styles.heading2.spacing,
        }),
        ...(meta.rangeLabel ? [new Paragraph({
            spacing: { before: 0, after: 240 },
            children: [new TextRun({ text: `📊 Диапазон давления: ${meta.rangeLabel}`, size: 18, color: '0f4c75', font: FONT_FAMILY })],
        })] : []),
        buildWordImage(lib, imgBytes),
        new Paragraph({ text: 'Параметры осей', heading: HeadingLevel.HEADING_2, spacing: EXPORT_CONFIG.word.styles.heading2.spacing }),
        buildLegendTable(lib, config, chartData),
        new Paragraph({ text: 'Статистика', heading: HeadingLevel.HEADING_2, spacing: EXPORT_CONFIG.word.styles.heading2.spacing }),
        buildStatsTable(lib, chartData),
        new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing:   { before: 400, after: 0 },
            border:    { top: { style: BorderStyle.SINGLE, size: 1, color: 'e2e8f0' } },
            children:  [new TextRun({ text: `PlasmaLab · ${meta.date} · Chart #${chartId}`, size: 16, color: '94a3b8', italics: true, font: FONT_FAMILY })],
        }),
    ];
}

// ─────────────────────────────────────────────────────────────
// PRESSURE CONTROLS (global, referenced from HTML)
// ─────────────────────────────────────────────────────────────

window.setPressurePreset = function(chartId, preset) {
    const config = CHART_CONFIGS[chartId];
    if (!isPressureChart(config)) return;

    const PRESETS = { '0.1-5': { min: 0.1, max: 5 }, '5-15': { min: 5, max: 15 }, '15-100': { min: 15, max: 100 } };
    const range = PRESETS[preset] ?? pressureRangeFromData(ChartsState.data);

    ChartsState.pressureRanges[chartId] = range;
    _syncPressureSliders(chartId, range.min, range.max);
    _reloadChart(chartId);
};

window.initPressureControls = function(chartId) {
    const config = CHART_CONFIGS[chartId];
    if (!isPressureChart(config)) return;

    const fullRange = pressureRangeFromData(ChartsState.data);
    ChartsState.pressureRanges[chartId] ??= { ...fullRange };

    const sliderMax = document.getElementById(`pressure-slider-${chartId}`);
    const sliderMin = document.getElementById(`pressure-slider-min-${chartId}`);
    if (!sliderMax || !sliderMin) return;

    const onInput = () => {
        const mn = parseFloat(sliderMin.value);
        const mx = parseFloat(sliderMax.value);
        if (mn >= mx) return;
        ChartsState.pressureRanges[chartId] = { min: mn, max: mx };
        document.getElementById(`pressure-min-display-${chartId}`).textContent = mn.toFixed(2);
        document.getElementById(`pressure-max-display-${chartId}`).textContent = mx.toFixed(2);
        _reloadChart(chartId);
    };

    sliderMax.addEventListener('input', () => {
        if (parseFloat(sliderMax.value) <= parseFloat(sliderMin.value))
            sliderMax.value = String(parseFloat(sliderMin.value) + 0.01);
        onInput();
    });
    sliderMin.addEventListener('input', () => {
        if (parseFloat(sliderMin.value) >= parseFloat(sliderMax.value))
            sliderMin.value = String(parseFloat(sliderMax.value) - 0.01);
        onInput();
    });

    const cur = ChartsState.pressureRanges[chartId];
    _syncPressureSliders(chartId, cur.min, cur.max);

    // Set correct preset selection
    const sel = document.getElementById(`pressure-preset-${chartId}`);
    if (sel) {
        const isClose = (a, b) => Math.abs(a - b) < 0.01;
        if      (isClose(cur.min, 0.1) && isClose(cur.max, 5))   sel.value = '0.1-5';
        else if (isClose(cur.min, 5)   && isClose(cur.max, 15))  sel.value = '5-15';
        else if (isClose(cur.min, 15)  && isClose(cur.max, 100)) sel.value = '15-100';
        else if (isClose(cur.min, fullRange.min) && isClose(cur.max, fullRange.max)) sel.value = 'full';
    }
};

window.resetPressureRange = function(chartId) {
    if (!isPressureChart(CHART_CONFIGS[chartId])) return;
    const full = pressureRangeFromData(ChartsState.data);
    ChartsState.pressureRanges[chartId] = full;
    _syncPressureSliders(chartId, full.min, full.max);
    const sel = document.getElementById(`pressure-preset-${chartId}`);
    if (sel) sel.value = 'full';
    _reloadChart(chartId);
};

function _syncPressureSliders(chartId, min, max) {
    const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = String(v); };
    const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v.toFixed(2); };
    setVal(`pressure-slider-${chartId}`,     max);
    setVal(`pressure-slider-min-${chartId}`, min);
    setText(`pressure-min-display-${chartId}`, min);
    setText(`pressure-max-display-${chartId}`, max);
}

function _reloadChart(chartId) {
    const el = document.getElementById(`chart-${chartId}`);
    if (!el) return;
    el.dataset.pressureRange = '0';
    if (el.dataset.loaded === 'true') {
        el.dataset.loaded = 'false';
        UIManager.loadedCharts.delete(String(chartId));
        UIManager.loadChart(String(chartId), ChartsState.data);
    }
}

// ─────────────────────────────────────────────────────────────
// GLOBAL EXPORT ACTIONS
// ─────────────────────────────────────────────────────────────

window.downloadChart = function(chartId) {
    const el = document.getElementById(`chart-${chartId}`);
    const config = CHART_CONFIGS[chartId];
    if (el.dataset.loaded !== 'true') {
        notify('График ещё не загружен — прокрутите до него.', 'warning');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    window.Plotly.downloadImage(`chart-${chartId}`, {
        format:   'png',
        width:    1920,
        height:   1080,
        filename: `plasma-chart-${chartId}-${config.title.replace(/\s+/g, '-')}`,
    })
        .then(()  => notify('PNG сохранён!', 'success'))
        .catch(() => notify('Ошибка сохранения PNG', 'error'));
};

window.downloadChartPng = async function(chartId) {
    const config = CHART_CONFIGS[chartId];
    notify('Генерирую HD PNG…', 'info');
    try {
        const { chartData, axisRange } = getChartDataForExport(chartId);
        const dataUrl = await ChartRenderer.renderForExport(chartData, config, getCameraFromChart(chartId), axisRange, 'png');
        const a = Object.assign(document.createElement('a'), {
            href:     dataUrl,
            download: `PlasmaLab_${chartId}_${config.title.replace(/\s+/g, '_').slice(0, 40)}.png`,
        });
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        notify('HD PNG сохранён!', 'success');
    } catch (e) {
        notify('Ошибка: ' + e.message, 'error');
    }
};

window.downloadChartForWord = async function(chartId) {
    const lib = window.docx;
    if (!lib) { notify('Библиотека docx не загружена', 'error'); return; }
    notify('Подготовка графика для Word…', 'info');
    try {
        const config = CHART_CONFIGS[chartId];
        const { chartData, axisRange, rangeLabel } = getChartDataForExport(chartId);
        const pngUrl = await ChartRenderer.renderForExport(chartData, config, getCameraFromChart(chartId), axisRange, 'png');
        const imgBytes = dataUrlToBytes(pngUrl);

        const meta = { rangeLabel, date: new Date().toLocaleString('ru-RU') };
        const doc = new lib.Document({
            creator: 'PlasmaLab',
            title:   `График ${chartId}: ${config.title}`,
            sections: [{
                properties: { page: { margin: EXPORT_CONFIG.word.margins } },
                children: buildSingleChartWordContent(lib, chartId, config, chartData, imgBytes, meta),
            }],
        });

        const blob     = await lib.Packer.toBlob(doc);
        const filename = `PlasmaLab_Chart_${String(chartId).padStart(3, '0')}_${config.title.replace(/[^\wа-яА-ЯёЁ-]/g, '_').slice(0, 40)}.docx`;
        window.saveAs(blob, filename);
        notify(`✅ "${filename}" сохранён!`, 'success');
    } catch (err) {
        console.error('[Export] Word export failed:', err);
        notify(`❌ Ошибка: ${err.message}`, 'error');
    }
};

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
    await exportChartsToWord(ids).catch(e => notify('Ошибка: ' + e.message, 'error'));
};

// ─────────────────────────────────────────────────────────────
// MASS EXPORT TO WORD
// ─────────────────────────────────────────────────────────────

async function exportChartsToWord(chartIds) {
    const lib = window.docx;
    if (!lib) throw new Error('docx library not loaded');

    const CAT_LABELS = {
        plasma:        { title: 'Параметры плазмы',       desc: 'Электронные характеристики' },
        energy:        { title: 'Энергетика',             desc: 'Перенос и распределение энергии' },
        thermal:       { title: 'Температурные профили',  desc: 'Распределение температуры' },
        diffusion:     { title: 'Диффузия',               desc: 'Кфы и механизмы' },
        damage:        { title: 'Повреждения',             desc: 'Дефекты и смещения атомов' },
        fluence:       { title: 'Флюенс',                 desc: 'Интегральный поток ионов' },
        resonance:     { title: 'Резонанс',               desc: 'Резонансные эффекты' },
        slr:           { title: 'SLR',                    desc: 'Поверхностное перемешивание' },
        rad_diffusion: { title: 'Радиационная диффузия',  desc: 'Сравнение механизмов' },
        flux:          { title: 'Потоки',                 desc: 'Ионные потоки и кинетика' },
    };

    const { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel, AlignmentType, PageBreak } = lib;

    const overlay = createProgressOverlay();
    document.body.appendChild(overlay);

    try {
        const totalRenders = chartIds.reduce((s, id) =>
            s + (isPressureChart(CHART_CONFIGS[id]) ? EXPORT_CONFIG.pressurePresets.length : 1), 0);
        let rendered = 0;

        const children = [
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing:   { after: 200 },
                children:  [new TextRun({ text: 'PlasmaLab — Отчёт по результатам симуляции', size: 36, bold: true, color: '1e40af', font: FONT_FAMILY })],
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing:   { after: 800 },
                children:  [new TextRun({ text: `Дата: ${new Date().toLocaleString('ru-RU')} | Графиков: ${chartIds.length}`, size: 18, color: '64748b', font: FONT_FAMILY })],
            }),
            new PageBreak(),
        ];

        // Group by category
        const byCategory = {};
        for (const id of chartIds) {
            (byCategory[CHART_CONFIGS[id].category] ??= []).push(id);
        }

        for (const [cat, ids] of Object.entries(byCategory)) {
            const info = CAT_LABELS[cat] ?? { title: cat, desc: '' };
            children.push(
                new Paragraph({ text: info.title, heading: HeadingLevel.HEADING_1, spacing: { before: 600, after: 100 } }),
                new Paragraph({ spacing: { after: 400 }, children: [new TextRun({ text: info.desc, size: 20, color: '64748b', italics: true, font: FONT_FAMILY })] }),
                new PageBreak(),
            );

            for (const chartId of ids) {
                const config      = CHART_CONFIGS[chartId];
                const hasPressure = isPressureChart(config);
                const camera      = getCameraFromChart(chartId);

                children.push(new Paragraph({ text: `${chartId}. ${config.title}`, heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 150 } }));

                const presets = hasPressure ? EXPORT_CONFIG.pressurePresets : [null];

                for (const preset of presets) {
                    rendered++;
                    updateProgress(rendered, totalRenders);

                    const filteredData = preset
                        ? DataLoader.prepareChartDataFiltered(ChartsState.data, config, preset.min, preset.max)
                        : DataLoader.prepareChartData(ChartsState.data, config);

                    if (!filteredData?.xValues.length) continue;

                    if (preset) {
                        children.push(new Paragraph({
                            spacing: { before: 200, after: 100 },
                            children: [new TextRun({ text: `📊 ${preset.label}`, bold: true, size: 20, color: '0f4c75', font: FONT_FAMILY })],
                        }));
                    }

                    try {
                        const axisRange = preset ? { axis: getPressureAxis(config), min: preset.min, max: preset.max } : null;
                        const pngUrl = await ChartRenderer.renderForExport(filteredData, config, camera, axisRange, 'png');
                        children.push(
                            buildWordImage(lib, dataUrlToBytes(pngUrl)),
                            buildLegendTable(lib, config, filteredData),
                            new Paragraph({ spacing: { after: 300 } }),
                        );
                    } catch (err) {
                        console.warn(`[Export] chart ${chartId}:`, err);
                        children.push(new Paragraph({
                            spacing: { after: 200 },
                            children: [new TextRun({ text: `⚠️ ${err.message}`, color: 'ef4444', size: 18, font: FONT_FAMILY })],
                        }));
                    }
                }
            }
            children.push(new PageBreak());
        }

        children.push(new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing:   { before: 400 },
            children:  [new TextRun({ text: `PlasmaLab · ${new Date().toLocaleString('ru-RU')}`, size: 16, color: '94a3b8', italics: true, font: FONT_FAMILY })],
        }));

        const doc = new Document({
            creator: 'PlasmaLab',
            title:   'Simulation Report',
            sections: [{ properties: { page: { margin: EXPORT_CONFIG.word.margins } }, children }],
        });

        const blob     = await Packer.toBlob(doc);
        const filename = `PlasmaLab_Report_${new Date().toISOString().split('T')[0]}_${chartIds.length}charts.docx`;
        window.saveAs(blob, filename);
        notify(`✅ "${filename}" сохранён!`, 'success');

    } finally {
        removeProgressOverlay();
        UIManager.observer && UIManager._initLazyLoading(ChartsState.data);
    }
}

// ─────────────────────────────────────────────────────────────
// FILTER / CATEGORY CONTROLS
// ─────────────────────────────────────────────────────────────

window.filterCharts = function(category) {
    ChartsState.currentFilter    = category;
    ChartsState.selectedCategory = category;

    document.querySelectorAll('.filter-tab, .export-tab').forEach(el => {
        el.classList.toggle('active',
            el.dataset.filter === category || el.dataset.category === category);
    });

    let visible = 0;
    document.querySelectorAll('.category-section').forEach((sec, si) => {
        const show = category === 'all' || sec.dataset.category === category;
        sec.style.display = show ? 'contents' : 'none';
        if (show) {
            sec.querySelectorAll('.chart-card').forEach((card, i) => {
                card.style.animation = `fadeInUp 0.4s ease-out ${i * 0.05}s both`;
            });
            visible += sec.querySelectorAll('.chart-card').length;
        }
    });

    const CAT_RU = {
        all: 'Все графики', plasma: 'Плазма', energy: 'Энергия', thermal: 'Температура',
        diffusion: 'Диффузия', damage: 'Повреждения', fluence: 'Флюенс',
        resonance: 'Резонанс', slr: 'SLR', rad_diffusion: 'Рад. диффузия', flux: 'Поток',
    };
    const sub = document.getElementById('filterSubtitle');
    if (sub) sub.textContent = `${CAT_RU[category] ?? category} (${visible} шт.)`;
    notify(`${CAT_RU[category] ?? category}: ${visible} графиков`, 'info');
};

window.setExportCategory = function(category) {
    ChartsState.selectedCategory = category;
    document.querySelectorAll('.export-tab').forEach(t =>
        t.classList.toggle('active', t.dataset.category === category));
    if (category !== 'all') window.filterCharts(category);
};

window.exportCategoryToWord = async function() {
    const category = ChartsState.selectedCategory;
    const chartIds = category === 'all'
        ? Object.keys(CHART_CONFIGS)
        : Object.keys(CHART_CONFIGS).filter(id => CHART_CONFIGS[id].category === category);

    const label = CAT_NAMES_RU[category] ?? 'Все';
    notify(`Подготовка "${label}" (${chartIds.length} шт.)…`, 'info');
    await exportChartsToWord(chartIds).catch(e => notify('Ошибка: ' + e.message, 'error'));
};

window.resetFilter = () => window.filterCharts('all');

function updateCategoryCounts() {
    const counts = Object.values(CHART_CONFIGS).reduce((acc, cfg) => {
        acc.all++;
        acc[cfg.category] = (acc[cfg.category] ?? 0) + 1;
        return acc;
    }, { all: 0 });

    for (const [cat, count] of Object.entries(counts)) {
        const s = String(count);
        document.getElementById(`count-${cat}`)?.textContent && (document.getElementById(`count-${cat}`).textContent = s);
        document.getElementById(`filter-count-${cat}`)?.textContent && (document.getElementById(`filter-count-${cat}`).textContent = s);
    }
}

// ─────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Charts] v10.0 init…');
    if (!window.PlasmaAuth?.requireAuth() || !await window.PlasmaAuth.verifyAuth()) return;

    try {
        UIManager.showLoading();
        const data = await DataLoader.loadResults();
        if (!data?.length) { UIManager.showNoData(); return; }

        ChartsState.data    = data;
        ChartsState.loading = false;

        UIManager.renderCharts(data);
        updateCategoryCounts();

        setTimeout(() => {
            for (const id of Object.keys(CHART_CONFIGS)) {
                if (isPressureChart(CHART_CONFIGS[id])) window.initPressureControls(id);
            }
        }, 500);

        console.log(`[Charts] Ready. ${Object.keys(CHART_CONFIGS).length} charts configured.`);
    } catch (e) {
        console.error('[Charts] init error:', e);
        UIManager.showNoData();
        notify('Ошибка загрузки: ' + e.message, 'error');
    }
});

console.log('[Charts] v10.0 loaded.');