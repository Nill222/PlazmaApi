// charts-modal.js - модальное окно для графиков со стрелками на осях

import { loadAll, allResults, byAtom, byIon }        from './charts.data.js';
import { export3DChartToWord, exportAllChartsToWord } from './charts.export.js';

let currentChartNum = null;
let currentMode = 'surface';

// Конфигурации для всех 28 графиков
const CONFIGS = {
    1: {
        xKey: 'pressure',
        yKey: 'electronDensity',
        zKey: 'voltage',
        xLabel: 'Давление (Па)',
        yLabel: 'Плотность электронов (м⁻³)',
        zLabel: 'Напряжение (В)',
        title: 'Плотность электронов от давления' },
    2: {
        xKey: 'voltage',
        yKey: 'electronVelocity',
        zKey: 'currentDensity',
        xLabel: 'Напряжение (В)',
        yLabel: 'Скорость электронов (м/с)',
        zLabel: 'Плотность тока (А/м²)',
        title: 'Скорость электронов от напряжения' },
    3: {
        xKey: 'voltage',
        yKey: 'currentDensity',
        zKey: 'ionEnergy',
        xLabel: 'Напряжение (В)',
        yLabel: 'Плотность тока (А/м²)',
        zLabel: 'Энергия ионов (Дж)',
        title: 'Плотность тока от напряжения' },
    4: {
        xKey: 'voltage',
        yKey: 'electronTemperature',
        zKey: 'currentDensity',
        xLabel: 'Напряжение (В)',
        yLabel: 'Температура электронов (K)',
        zLabel: 'Плотность тока (А/м²)',
        title: 'Температура электронов' },
    5: {
        xKey: 'totalTransferredEnergy',
        yKey: 'depths',
        zKey: 'avgT',
        xLabel: 'Общая переданная энергия (Дж)',
        yLabel: 'Глубина слоя (м)',
        zLabel: 'Средняя температура (K)',
        title: 'Температура от энергии и глубины'
    },
    6: {
        xKey: 'voltage',
        yKey: 'depths',
        zKey: 'avgT',
        xLabel: 'Напряжение (В)',
        yLabel: 'Глубина слоя (м)',
        zLabel: 'Средняя температура (K)',
        title: 'Температура от напряжения и глубины'
    },
    7: {
        xKey: 'pressure',
        yKey: 'depths',
        zKey: 'avgT',
        xLabel: 'Давление (Па)',
        yLabel: 'Глубина слоя (м)',
        zLabel: 'Средняя температура (K)',
        title: 'Температура от давления и глубины'
    },
    8: {
        xKey: 'currentDensity',
        yKey: 'depths',
        zKey: 'avgT',
        xLabel: 'Плотность тока (А/м²)',
        yLabel: 'Глубина слоя (м)',
        zLabel: 'Средняя температура (K)',
        title: 'Температура от плотности тока и глубины'
    },
    9: {
        xKey: 'voltage',
        yKey: 'currentDensity',
        zKey: 'totalTransferredEnergy',
        xLabel: 'Напряжение (В)',
        yLabel: 'Плотность тока (А/м²)',
        zLabel: 'Полная энергия (Дж)',
        title: 'Полная энергия от напряжения и плотности тока' },
    10: {
        title: 'Энергия на атом от напряжения и температуры',
        xKey: 'voltage',
        yKey: 'avgTransferredPerAtom',
        zKey: 'concentration',
        xLabel: 'Напряжение (В)',
        yLabel: 'Средняя переданная энергия на атом (эВ)',
        zLabel: 'Концентрация (м⁻³)'
    },
    11: {
        xKey: 'voltage',
        yKey: 'ionEnergy',
        zKey: 'concentration',
        xLabel: 'Напряжение (В)',
        yLabel: 'Энергия иона (эВ)',
        zLabel: 'Концентрация (м⁻³)',
        title: 'Энергия иона от напряжения и концентрации'
    },
    12: {
        xKey: 'diffusionCoefficient1',
        yKey: 'totalTransferredEnergy',
        zKey: 'avgT',
        xLabel: 'D₁ (м²/с)',
        yLabel: 'Полная переданная энергия (эВ)',
        zLabel: 'Средняя температура (K)',
        title: 'D₁ от температуры и энергии'
    },
    13: {
        xKey: 'totalTransferredEnergy',
        yKey: 'totalDamage',
        zKey: 'avgT',
        xLabel: 'Переданная энергия (эВ)',
        yLabel: 'Суммарные повреждения (дефекты/м²)',
        zLabel: 'Средняя температура (K)',
        title: 'Энергия → Повреждения при разных температурах'
    },
    14: {
        xKey: 'totalTransferredEnergy',
        yKey: 'voltage',
        zKey: 'avgT',
        xLabel: 'Полная переданная энергия (эВ)',
        yLabel: 'Напряжение (В)',
        zLabel: 'Средняя температура (K)',
        title: 'Энергия от температуры и напряжения'
    },
    15: {
        xKey: 'pressure',
        yKey: 'totalTransferredEnergy',
        zKey: 'avgT',
        xLabel: 'Давление (Па)',
        yLabel: 'Полная переданная энергия (эВ)',
        zLabel: 'Средняя температура (K)',
        title: 'Энергия от давления и температуры'
    },
    16: {
        zKey: 'avgT',
        xKey: 'diffusionCoefficient1',
        yKey: 'voltage',
        zLabel: 'Средняя температура (K)',
        xLabel: 'D₁ (м²/с)',
        yLabel: 'Напряжение (В)',
        title: 'D₁ от температуры и напряжения'
    },
    17: {
        zKey: 'avgT',
        xKey: 'diffusionCoefficient2',
        yKey: 'voltage',
        zLabel: 'Средняя температура (K)',
        xLabel: 'D₂ (м²/с)',
        yLabel: 'Напряжение (В)',
        title: 'D₂ от температуры и напряжения'
    },
    18: {
        xKey: 'diffusionCoefficient1',
        yKey: 'diffusionCoefficient2',
        zKey: 'avgT',
        xLabel: 'D₁ (м²/с)',
        yLabel: 'D₂ (м²/с)',
        zLabel: 'Средняя температура (K)',
        title: 'Сравнение D₁ и D₂ при разных температурах'
    },
    19: {
        xKey: 'voltage',
        yKey: 'diffusionCoefficient1',
        zKey: 'avgT',
        xLabel: 'Напряжение (В)',
        yLabel: 'Термическая диффузия D (м²/с)',
        zLabel: 'Средняя температура (K)',
        title: 'Диффузия D₁ от напряжения и температуры'
    },
    20: {
        xKey: 'diffusionCoefficient1',
        yKey: 'diffusionCoefficient2',
        zKey: 'avgT',
        xLabel: 'D₁ (м²/с)',
        yLabel: 'D₂ (м²/с)',
        zLabel: 'Средняя температура (K)',
        title: 'Сравнение D₁ и D₂ при разных температурах после SLR'
    },
    21: {
        xKey: 'totalTransferredEnergy',
        yKey: 'totalDamage',
        zKey: 'avgT',
        xLabel: 'Переданная энергия (эВ)',
        yLabel: 'Суммарные повреждения (дефекты/м²)',
        zLabel: 'Средняя температура (K)',
        title: 'Повреждения от энергии и температуры'
    },
    22: {
        xKey: 'totalTransferredEnergy',
        yKey: 'totalMomentum',
        zKey: 'totalDamage',
        xLabel: 'Переданная энергия (эВ)',
        yLabel: 'Суммарный импульс (кг·м/с)',
        zLabel: 'Суммарные повреждения (дефекты/м²)',
        title: 'Импульс от энергии и повреждений'
    },
    23: {
        xKey: 'totalMomentum',
        yKey: 'totalDisplacement',
        zKey: 'totalDamage',
        xLabel: 'Суммарный импульс (кг·м/с)',
        yLabel: 'Суммарное смещение (м)',
        zLabel: 'Суммарные повреждения (дефекты/м²)',
        title: 'Смещение от импульса и повреждений'
    },
    24: {
        zKey: 'avgT',
        xKey: 'totalDamage',
        yKey: 'voltage',
        zLabel: 'Средняя температура (K)',
        xLabel: 'Суммарные повреждения (дефекты/м²)',
        yLabel: 'Напряжение (В)',
        title: 'Повреждения от температуры и напряжения'
    },
    25: {
        xKey: 'voltage',
        yKey: 'currentDensity',
        zKey: 'depths',
        xLabel: 'Напряжение (В)',
        yLabel: 'Плотность тока (А/м²)',
        zLabel: 'Глубина проникновения (м)',
        title: 'V · j → Глубина проникновения ионов'
    },
    26: {
        xKey: 'voltage',
        yKey: 'currentDensity',
        zKey: 'ionEnergy',
        xLabel: 'Напряжение (В)',
        yLabel: 'Плотность тока (А/м²)',
        zLabel: 'Энергия ионов (Дж)',
        title: 'V · j → Суммарная переданная энергия'
    },
    27: {
        xKey: 'avgT',
        yKey: 'pressure',
        zKey: 'concentration',
        xLabel: 'Средняя температура (K)',
        yLabel: 'Давление (Па)',
        zLabel: 'Концентрация (м⁻³)',
        title: 'T · P → Концентрация'
    },
    28: {
        xKey: 'avgT',
        yKey: 'voltage',
        zKey: 'totalDamage',
        xLabel: 'Средняя температура (K)',
        yLabel: 'Напряжение (В)',
        zLabel: 'Суммарные повреждения (дефекты/м²)',
        title: 'T · V → Суммарные повреждения'
    },
};

// Функция расчета тренда
function getSlope(data, keyX, keyY) {
    const pts = data.filter(d => isFinite(d[keyX]) && isFinite(d[keyY]))
        .sort((a,b) => a[keyX] - b[keyX]);
    if (pts.length < 3) return 0;
    const n = pts.length;
    let sumX=0, sumY=0, sumXY=0, sumX2=0;
    pts.forEach(p => { sumX += p[keyX]; sumY += p[keyY]; sumXY += p[keyX]*p[keyY]; sumX2 += p[keyX]*p[keyX]; });
    return (n*sumXY - sumX*sumY) / ((n*sumX2 - sumX*sumX) || 1);
}

function getArrows(rows, config) {
    const slopeY = getSlope(rows, config.xKey, config.yKey);
    const slopeZ = getSlope(rows, config.xKey, config.zKey);
    return {
        x: '→',
        y: slopeY >= 0 ? '↑' : '↓',
        z: slopeZ >= 0 ? '↗' : '↘',
        slopeY,
        slopeZ
    };
}

function fmt10(v) {
    if (v === null || !isFinite(v)) return '—';
    if (v === 0) return '0';
    const exp = Math.floor(Math.log10(Math.abs(v)));
    const mant = v / Math.pow(10, exp);
    const m = (+mant.toPrecision(3)).toString();
    return `${m}·10<sup>${exp}</sup>`;
}

// Layout — график растягивается на всю доступную область, colorbar вплотную
function getLayout(title, xTitle, yTitle, zTitle, arrows = {x:'→', y:'↑', z:'↗'}) {
    return {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        margin: { l: 20, r: 20, b: 20, t: 20, pad: 0 },
        title: { text: '', font: { color: '#f8fafc', size: 1 } },
        scene: {
            // 'auto' позволяет сцене занять всё доступное пространство контейнера
            // 'cube' принудительно делает маленький квадрат — не используем
            aspectmode: 'auto',
            domain: { x: [0, 1], y: [0, 1] },
            xaxis: {
                title: { text: `${xTitle} ${arrows.x}`, font: { size: 12, color: '#cbd5e1' } },
                color: '#94a3b8', gridcolor: '#2a3650', linecolor: '#5eead4', linewidth: 2, showline: true
            },
            yaxis: {
                title: { text: `${arrows.y} ${yTitle}`, font: { size: 12, color: '#cbd5e1' } },
                color: '#94a3b8', gridcolor: '#2a3650', linecolor: '#5eead4', linewidth: 2, showline: true
            },
            zaxis: {
                title: { text: `${zTitle} ${arrows.z}`, font: { size: 12, color: '#cbd5e1' } },
                color: '#94a3b8', gridcolor: '#2a3650', linecolor: '#5eead4', linewidth: 2, showline: true
            },
            bgcolor: 'rgba(0,0,0,0)',
            camera: { eye: { x: 1.6, y: 1.6, z: 1.1 } }
        },
        autosize: true,
        hovermode: 'closest'
    };
}

// Scatter с улучшенными маркерами
function prepareScatterData(rows, xKey, yKey, zKey) {
    const validRows = rows.filter(r => r[xKey] !== undefined && !isNaN(r[xKey]) &&
        r[yKey] !== undefined && !isNaN(r[yKey]));
    if (!validRows.length) return null;

    return {
        x: validRows.map(r => r[xKey]),
        y: validRows.map(r => r[yKey]),
        z: zKey ? validRows.map(r => r[zKey] !== undefined ? r[zKey] : 0) : validRows.map((_, i) => i),
        color: zKey ? validRows.map(r => r[zKey] !== undefined ? r[zKey] : 0) : validRows.map((_, i) => i)
    };
}

function renderScatter(containerId, rows, config) {
    const data = prepareScatterData(rows, config.xKey, config.yKey, config.zKey);
    if (!data || !data.x.length) return;

    const validRows = rows.filter(r => r[config.xKey] !== undefined && r[config.yKey] !== undefined);
    const arrows = getArrows(validRows, config);
    const layout = getLayout(config.title, config.xLabel, config.yLabel, config.zLabel, arrows);

    const texts = data.x.map((x,i) =>
        `<b>${config.xLabel}</b>: ${fmt10(x)}<br>`+
        `<b>${config.yLabel}</b>: ${fmt10(data.y[i])}<br>`+
        `<b>${config.zLabel}</b>: ${fmt10(data.z[i])}`
    );

    const trace = {
        type: 'scatter3d', mode: 'markers',
        x: data.x, y: data.y, z: data.z,
        text: texts,
        hoverinfo: 'text',
        marker: {
            size: 5,
            color: data.color,
            colorscale: 'Viridis',
            opacity: 0.85,
            showscale: true,
            colorbar: {
                title: { text: config.zLabel, font: { color: '#cbd5e1', size: 10 } },
                tickfont: { color: '#94a3b8', size: 10 },
                x: 1.0,
                xanchor: 'left',
                xpad: 4,
                len: 0.7,
                thickness: 12,
                yanchor: 'middle',
                y: 0.5
            }
        }
    };

    Plotly.react(containerId, [trace], layout, { responsive: true, displayModeBar: true });
}

// Surface с улучшенной визуализацией
function prepareSurfaceData(rows, xKey, yKey, zKey) {
    const validRows = rows.filter(r => r[xKey] !== undefined && !isNaN(r[xKey]) &&
        r[yKey] !== undefined && !isNaN(r[yKey]) &&
        r[zKey] !== undefined && !isNaN(r[zKey]));
    if (!validRows.length) return null;

    const xVals = [...new Set(validRows.map(r => r[xKey]))].sort((a, b) => a - b);
    const yVals = [...new Set(validRows.map(r => r[yKey]))].sort((a, b) => a - b);

    const zGrid = yVals.map(y =>
        xVals.map(x => {
            const point = validRows.find(p => p[xKey] === x && p[yKey] === y);
            return point ? point[zKey] : null;
        })
    );

    // Интерполяция пропущенных значений
    for (let i = 0; i < zGrid.length; i++) {
        for (let j = 0; j < zGrid[i].length; j++) {
            if (zGrid[i][j] === null) {
                const neighbors = [];
                if (i > 0 && zGrid[i - 1][j] !== null) neighbors.push(zGrid[i - 1][j]);
                if (i < zGrid.length - 1 && zGrid[i + 1][j] !== null) neighbors.push(zGrid[i + 1][j]);
                if (j > 0 && zGrid[i][j - 1] !== null) neighbors.push(zGrid[i][j - 1]);
                if (j < zGrid[i].length - 1 && zGrid[i][j + 1] !== null) neighbors.push(zGrid[i][j + 1]);
                zGrid[i][j] = neighbors.length
                    ? neighbors.reduce((a, b) => a + b, 0) / neighbors.length
                    : 0;
            }
        }
    }

    return { x: xVals, y: yVals, z: zGrid };
}

function renderSurface(containerId, rows, config) {
    const data = prepareSurfaceData(rows, config.xKey, config.yKey, config.zKey);
    if (!data) return;

    const validRows = rows.filter(r => r[config.xKey] !== undefined && r[config.yKey] !== undefined);
    const arrows = getArrows(validRows, config);
    const layout = getLayout(config.title, config.xLabel, config.yLabel, config.zLabel, arrows);

    const hovertext = data.y.map((yv, yi) =>
        data.x.map((xv, xi) => {
            const zv = data.z[yi][xi];
            return `<b>${config.xLabel}</b>: ${fmt10(xv)}<br>`+
                `<b>${config.yLabel}</b>: ${fmt10(yv)}<br>`+
                `<b>${config.zLabel}</b>: ${fmt10(zv)}`;
        })
    );

    const trace = {
        type: 'surface',
        x: data.x,
        y: data.y,
        z: data.z,
        hovertext: hovertext,
        hoverinfo: 'text',
        colorscale: 'Viridis',
        showscale: true,
        colorbar: {
            title: { text: config.zLabel, font: { color: '#cbd5e1', size: 10 } },
            tickfont: { color: '#94a3b8', size: 10 },
            x: 1.0,
            xanchor: 'left',
            xpad: 4,
            len: 0.7,
            thickness: 12,
            yanchor: 'middle',
            y: 0.5
        },
        contours: { z: { show: true, usecolormap: true, project: { z: true } } },
        lighting: { ambient: 0.8, diffuse: 0.9 }
    };

    Plotly.react(containerId, [trace], layout, { responsive: true });
}

// Главный рендер
function renderModalChart(chartNum, mode) {
    const config = CONFIGS[chartNum];
    if (!config) return;

    const rows = allResults;

    if (!rows.length) {
        document.getElementById('modalChart').innerHTML =
            '<div style="color:#94a3b8;text-align:center;padding:50px">Нет данных</div>';
        return;
    }

    const containerId = 'modalChart';

    if (mode === 'scatter') {
        renderScatter(containerId, rows, config);
    } else {
        renderSurface(containerId, rows, config);
    }
}

function cleanupModal() {
    const modalChart = document.getElementById('modalChart');
    if (modalChart) {
        modalChart.innerHTML = '';
        if (typeof Plotly !== 'undefined') {
            try { Plotly.purge(modalChart); } catch(e) {}
        }
    }
}

// Инициализация
export async function initCharts() {
    await loadAll(window.PlasmaAuth?.getToken());

    const totalSimulations = document.getElementById('totalSimulations');
    const uniqueAtoms = document.getElementById('uniqueAtoms');
    const uniqueIons = document.getElementById('uniqueIons');

    if (totalSimulations) totalSimulations.textContent = allResults.length;
    if (uniqueAtoms) uniqueAtoms.textContent = new Set(allResults.map(r => r.atomName)).size;
    if (uniqueIons) uniqueIons.textContent = new Set(allResults.map(r => r.ionName)).size;

    const modal = document.getElementById('chartModal');
    const modalScatterBtn = document.getElementById('modalScatterBtn');
    const modalSurfaceBtn = document.getElementById('modalSurfaceBtn');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const modalExportBtn = document.getElementById('modalExportBtn');
    const modalExportWordBtn = document.getElementById('modalExportWordBtn');
    const modalFormulaEl = document.getElementById('modalFormula');

    document.querySelectorAll('.view-chart-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.chart-card');
            if (!card) return;

            currentChartNum = parseInt(card.dataset.chart);
            document.getElementById('modalTitle').textContent = card.dataset.title;
            document.getElementById('modalFormula').textContent = card.dataset.formula;

            currentMode = 'surface';
            modalSurfaceBtn.classList.add('active');
            modalScatterBtn.classList.remove('active');

            cleanupModal();
            renderModalChart(currentChartNum, currentMode);
            modal.style.display = 'flex';
        });
    });

    modalScatterBtn.addEventListener('click', () => {
        if (currentMode === 'scatter' || currentChartNum === null) return;
        currentMode = 'scatter';
        modalScatterBtn.classList.add('active');
        modalSurfaceBtn.classList.remove('active');
        cleanupModal();
        renderModalChart(currentChartNum, currentMode);
    });

    modalSurfaceBtn.addEventListener('click', () => {
        if (currentMode === 'surface' || currentChartNum === null) return;
        currentMode = 'surface';
        modalSurfaceBtn.classList.add('active');
        modalScatterBtn.classList.remove('active');
        cleanupModal();
        renderModalChart(currentChartNum, currentMode);
    });

    modalCloseBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        cleanupModal();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            cleanupModal();
        }
    });

    modalExportBtn.addEventListener('click', async () => {
        const el = document.getElementById('modalChart');
        if (el && typeof Plotly !== 'undefined') {
            try {
                const url = await Plotly.toImage(el, { format: 'png', width: 1920, height: 1080, scale: 2 });
                const link = document.createElement('a');
                link.href = url;
                link.download = `chart_${currentChartNum}_${currentMode}.png`;
                link.click();
            } catch (e) {
                console.error('Export error:', e);
                alert('Ошибка экспорта графика');
            }
        }
    });

    modalExportWordBtn?.addEventListener('click', async () => {
        if (currentChartNum === null) return;
        const cfg = CONFIGS[currentChartNum];
        if (!cfg) return;
        const title = document.getElementById('modalTitle')?.textContent || 'График';
        const formula = document.getElementById('modalFormula')?.textContent || '';
        const modeText = currentMode === 'surface' ? 'Поверхность' : 'Точки';
        await export3DChartToWord(cfg, title, formula, modeText);
    });

    document.getElementById('exportAllWordBtn')?.addEventListener('click', exportAllChartsToWord);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && modal.style.display === 'flex') {
            modal.style.display = 'none';
            cleanupModal();
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

function checkAuth() {
    const auth = window.PlasmaAuth?.isAuthenticated() || false;
    const authGate = document.getElementById('authGate');
    const workspace = document.getElementById('chartsWorkspace');

    if (authGate) authGate.style.display = auth ? 'none' : 'flex';
    if (workspace) workspace.style.display = auth ? 'block' : 'none';

    if (auth) {
        setTimeout(() => { initCharts(); }, 100);
    }
}
