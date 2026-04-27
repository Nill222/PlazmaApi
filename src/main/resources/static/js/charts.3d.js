// charts.3d.js — 3D графики через Plotly

import { allResults } from './charts.data.js';

const MODES = {
    depth:     { x: 'voltage', y: 'currentDensity', z: 'depths',               xL: 'Напряжение (В)',  yL: 'Плотность тока (А/м²)', zL: 'Глубина слоя (м)' },
    ionEnergy: { x: 'voltage', y: 'currentDensity', z: 'ionEnergy',             xL: 'Напряжение (В)',  yL: 'Плотность тока (А/м²)', zL: 'Энергия ионов (Дж)' },
    diffusion: { x: 'avgT',    y: 'pressure',       z: 'diffusionCoefficient1', xL: 'Температура (K)', yL: 'Давление (Па)',          zL: 'D₁ (м²/с)' },
    damage:    { x: 'avgT',    y: 'voltage',         z: 'totalDamage',           xL: 'Температура (K)', yL: 'Напряжение (В)',         zL: 'Повреждения' },
};

const LAYOUT_BASE = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    margin: { l: 0, r: 0, b: 0, t: 50 },
    font: { family: 'Inter, sans-serif', color: '#94a3b8' },
};

function sceneAxis(title) {
    return { title, color: '#94a3b8', gridcolor: '#2a3650', zerolinecolor: '#2a3650' };
}

function interpGrid(xUniq, yUniq, filtered, cfg) {
    const grid = yUniq.map(yv => xUniq.map(xv => {
        const pt = filtered.find(r => r[cfg.x] === xv && r[cfg.y] === yv);
        return pt ? pt[cfg.z] : null;
    }));
    // nearest-neighbor fill
    for (let i = 0; i < grid.length; i++)
        for (let j = 0; j < grid[i].length; j++)
            if (grid[i][j] === null) {
                const nb = [
                    i > 0              ? grid[i-1][j] : null,
                    i < grid.length-1  ? grid[i+1][j] : null,
                    j > 0              ? grid[i][j-1] : null,
                    j < grid[i].length-1 ? grid[i][j+1] : null,
                ].filter(v => v !== null);
                grid[i][j] = nb.length ? nb.reduce((a,b) => a+b, 0) / nb.length : 0;
            }
    return grid;
}

export function render3D() {
    const container = document.getElementById('chart3d');
    if (!container) return;

    const modeKey  = document.getElementById('chart3dMode')?.value  || 'depth';
    const typeKey  = document.getElementById('chart3dType')?.value  || 'scatter';
    const cfg      = MODES[modeKey] || MODES.depth;

    const filtered = allResults.filter(r => r[cfg.x] > 0 && r[cfg.y] > 0 && r[cfg.z] > 0);
    if (!filtered.length) { container.innerHTML = '<p style="color:#94a3b8;padding:2rem">Нет данных</p>'; return; }

    const xs = filtered.map(r => r[cfg.x]);
    const ys = filtered.map(r => r[cfg.y]);
    const zs = filtered.map(r => r[cfg.z]);

    const layout = {
        ...LAYOUT_BASE,
        title: { text: `${cfg.zL} от ${cfg.xL} / ${cfg.yL}`, font: { color: '#f8fafc', size: 13 } },
        scene: {
            xaxis: sceneAxis(cfg.xL), yaxis: sceneAxis(cfg.yL), zaxis: sceneAxis(cfg.zL),
            bgcolor: 'rgba(0,0,0,0)',
            camera: { eye: { x: 1.5, y: 1.5, z: 1.2 } },
        },
    };

    if (typeKey === 'scatter') {
        Plotly.react('chart3d', [{
            type: 'scatter3d', mode: 'markers',
            x: xs, y: ys, z: zs,
            marker: { size: 5, color: zs, colorscale: 'Viridis', showscale: true,
                colorbar: { title: cfg.zL, tickfont: { color: '#94a3b8' }, len: 0.7, thickness: 12 } },
            hovertemplate: `${cfg.xL}: %{x}<br>${cfg.yL}: %{y}<br>${cfg.zL}: %{z}<extra></extra>`,
        }], layout, { responsive: true, displayModeBar: false });
        return;
    }

    // surface — строим равномерную сетку
    const xUniq = [...new Set(xs)].sort((a,b) => a-b);
    const yUniq = [...new Set(ys)].sort((a,b) => a-b);
    const zGrid = interpGrid(xUniq, yUniq, filtered, cfg);

    Plotly.react('chart3d', [{
        type: 'surface', x: xUniq, y: yUniq, z: zGrid,
        colorscale: 'Viridis', showscale: true,
        colorbar: { title: cfg.zL, tickfont: { color: '#94a3b8' }, len: 0.7, thickness: 12 },
        hovertemplate: `${cfg.xL}: %{x}<br>${cfg.yL}: %{y}<br>${cfg.zL}: %{z}<extra></extra>`,
        contours: { z: { show: true, usecolormap: true, highlightcolor: '#42f462', project: { z: true } } },
    }], layout, { responsive: true, displayModeBar: false });
}