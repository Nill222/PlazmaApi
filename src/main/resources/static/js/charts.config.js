// charts.config.js — константы, цвета, общие опции

export const COLORS = {
    electronDensity: '#5eead4', electronVelocity: '#818cf8',
    currentDensity:  '#f472b6', ionEnergy:        '#34d399',
    electronTemp:    '#60a5fa', thermalization:   '#a78bfa',
    tempVsVoltage:   '#f87171', tempRange:        ['#3b82f6','#f59e0b','#ef4444'],
    tempVsPressure:  '#22d3ee', tempVsCurrent:    '#d946ef',
    totalEnergy:     '#10b981', energyPerAtom:    '#8b5cf6',
    energyDistrib:   '#ec4899', energyVsTemp:     '#14b8a6',
    energyVsPres:    '#f59e0b', diffusion1:       '#5eead4',
    diffusion2:      '#818cf8', diffusionVsV:     '#34d399',
    damageVsEnergy:  '#ef4444', momentumVsE:      '#22c55e',
    displVsMom:      '#a855f7', damageVsTemp:     '#fb923c',
};

export const CHART_DEFAULTS = {
    bgTooltip:  'rgba(15,23,41,0.95)',
    textLight:  '#e2e8f0',
    textMuted:  '#94a3b8',
    gridColor:  'rgba(94,234,212,0.1)',
};

Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.color = CHART_DEFAULTS.textMuted;

export function fmt(num) {
    if (num === 0) return '0';
    return (Math.abs(num) < 0.001 || Math.abs(num) > 1e4)
        ? num.toExponential(2)
        : +num.toPrecision(3) + '';
}

export function axisConfig(label) {
    return {
        title: { display: true, text: label, color: CHART_DEFAULTS.textLight, font: { size: 12, weight: '500' } },
        grid:  { color: CHART_DEFAULTS.gridColor },
        ticks: { color: CHART_DEFAULTS.textMuted, callback: fmt },
    };
}

export function basePlugins(title, color) {
    return {
        title:   { display: true, text: title, color: CHART_DEFAULTS.textLight, font: { size: 14, weight: 'bold' } },
        legend:  { display: false },
        tooltip: {
            backgroundColor: CHART_DEFAULTS.bgTooltip,
            titleColor: '#5eead4',
            bodyColor:  CHART_DEFAULTS.textLight,
            ...(color ? { borderColor: color, borderWidth: 1 } : {}),
        },
    };
}

export function histogram(values, bins = 10) {
    const min = Math.min(...values), max = Math.max(...values);
    const size = (max - min) / bins;
    const counts = Array(bins).fill(0);
    const labels = Array.from({ length: bins }, (_, i) => {
        const s = min + i * size, e = s + size;
        counts[i] = values.filter(v => v >= s && (i === bins - 1 ? v <= e : v < e)).length;
        return `${fmt(s)}–${fmt(e)}`;
    });
    return { labels, counts };
}