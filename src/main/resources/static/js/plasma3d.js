/* global Plotly */
'use strict';

// ==============================================================
// Data Storage
// ==============================================================

let physics3DHistory  = [];
let current3DViewType = 'surface';

// ==============================================================
// Plasma Colorscale  cold (dark purple) → hot (bright red/white)
// ==============================================================

const PLASMA_COLORSCALE = [
    [0.00, '#0c0033'],
    [0.10, '#1a0080'],
    [0.20, '#0000cc'],
    [0.30, '#0066ff'],
    [0.40, '#00ccff'],
    [0.50, '#00ff99'],
    [0.60, '#66ff33'],
    [0.70, '#ffff00'],
    [0.80, '#ff9900'],
    [0.90, '#ff3300'],
    [1.00, '#ff0066'],
];

// ==============================================================
// Sphere mesh helpers
// ==============================================================

/**
 * Full sphere parametric mesh.
 * Returns {x, y, z} where each is a (nLat+1)×(nLon+1) 2D array.
 */
function _sphereMesh(radius, nLat, nLon) {
    const x = [], y = [], z = [];
    for (let i = 0; i <= nLat; i++) {
        const phi = (i / nLat) * Math.PI;     // 0 → π  (north → south)
        const rx = [], ry = [], rz = [];
        for (let j = 0; j <= nLon; j++) {
            const theta = (j / nLon) * 2 * Math.PI;  // 0 → 2π
            rx.push(radius * Math.sin(phi) * Math.cos(theta));
            ry.push(radius * Math.sin(phi) * Math.sin(theta));
            rz.push(radius * Math.cos(phi));
        }
        x.push(rx); y.push(ry); z.push(rz);
    }
    return { x, y, z };
}

/**
 * Half-sphere mesh (theta runs over half the circle).
 * thetaStart = 0 → right half (y ≥ 0)
 * thetaStart = π → left  half (y ≤ 0)
 */
function _halfSphereMesh(radius, nLat, nLon, thetaStart) {
    const x = [], y = [], z = [];
    for (let i = 0; i <= nLat; i++) {
        const phi = (i / nLat) * Math.PI;
        const rx = [], ry = [], rz = [];
        for (let j = 0; j <= nLon; j++) {
            const theta = thetaStart + (j / nLon) * Math.PI;
            rx.push(radius * Math.sin(phi) * Math.cos(theta));
            ry.push(radius * Math.sin(phi) * Math.sin(theta));
            rz.push(radius * Math.cos(phi));
        }
        x.push(rx); y.push(ry); z.push(rz);
    }
    return { x, y, z };
}

/**
 * Build a 2D array filled with a constant value (for surfacecolor).
 */
function _fillGrid(nRows, nCols, value) {
    return Array.from({ length: nRows }, () =>
        Array.from({ length: nCols }, () => value)
    );
}

// ==============================================================
// Public: add data from simulation result
// ==============================================================

/**
 * @param {Object} stats  – result.stats from API
 * @param {Array<number>} [stats.thermalTimes]
 * @param {Array<number>} [stats.thermalDepths]
 * @param {Array<Array<number>>} [stats.thermalTemperatureMap]
 * @param {Object} simReq – original simulation request (must contain
 *                          composition with debye_temperature, ambientTemp, etc.)
 */
function addPhysics3DData(stats, simReq) {
    if (!stats) return false;

    let times  = stats.thermalTimes;
    let depths = stats.thermalDepths;
    let grid   = stats.thermalTemperatureMap;

    // Check whether the provided grid has meaningful variation
    let minT = Infinity, maxT = -Infinity;
    if (grid?.length && depths?.length && times?.length) {
        for (const row of grid) {
            for (const v of (row || [])) {
                if (isFinite(v)) { if (v < minT) minT = v; if (v > maxT) maxT = v; }
            }
        }
    }

    const hasValidGrid =
        isFinite(minT) && isFinite(maxT) && (maxT - minT) > 5 &&
        times?.length > 0 && depths?.length > 0;

    if (!hasValidGrid) {
        console.warn('[3D] Thermal map missing or flat — rebuilding from physics params');
        const rebuilt = _rebuildThermalMap(stats, simReq);
        times  = rebuilt.times;
        depths = rebuilt.depths;
        grid   = rebuilt.grid;
    }

    // Recompute range for logging
    minT = Infinity; maxT = -Infinity;
    for (const row of grid) for (const v of row) {
        if (isFinite(v)) { if (v < minT) minT = v; if (v > maxT) maxT = v; }
    }

    while (physics3DHistory.length >= 10) physics3DHistory.shift();
    physics3DHistory.push({ times, depths, grid, timestamp: Date.now(), simReq });

    console.log(`[3D] Stored: ${times.length}×${depths.length}, T range: ${minT.toFixed(0)}..${maxT.toFixed(0)} K`);
    return true;
}

// ==============================================================
// Public: main render dispatcher
// ==============================================================

function renderPhysicsStats3D(type) {
    type = type || current3DViewType;
    const el = document.getElementById('physics3dChart');
    if (!el) return;

    if (!physics3DHistory.length) {
        _showEmptyState(el, 'Выполните симуляцию для отображения 3D графика');
        return;
    }

    const entry = physics3DHistory[physics3DHistory.length - 1];
    const { times, depths, grid } = entry;

    if (!times?.length || !depths?.length || !grid?.length) {
        _showEmptyState(el, 'Недостаточно данных для 3D визуализации');
        return;
    }

    console.log(`[3D] Rendering "${type}" — ${times.length}×${depths.length}`);

    if (type === 'surface') {
        _renderSurface(el, entry);
    } else {
        _renderSphereWithSection(el, entry);
    }
}

// ==============================================================
// Public: view-type switcher
// ==============================================================

function set3DViewType(type) {
    if (type !== 'surface' && type !== 'sphere') return;
    current3DViewType = type;

    document.querySelectorAll('.viz3d-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === type);
    });

    renderPhysicsStats3D(type);

    window.PlasmaAnimations?.ToastNotifications?.show(
        `Режим: ${type === 'surface' ? '3D Поверхность' : 'Сфера + пересечение'}`, 'info', 2000
    );
}

// ==============================================================
// Public: clear history
// ==============================================================

function clearPhysics3DHistory() {
    physics3DHistory = [];
    const el = document.getElementById('physics3dChart');
    if (el) _showEmptyState(el, 'История очищена. Запустите новую симуляцию.');
    window.PlasmaAnimations?.ToastNotifications?.show('История 3D графиков очищена', 'info', 2000);
}

/**
 * Вычисляет min/max температуры по сетке
 * @param {Array<Array<number>>} grid - двумерный массив температур
 * @returns {{minT: number, maxT: number}}
 */
function _calcTempRange(grid) {
    let minT = Infinity, maxT = -Infinity;
    for (const row of grid) for (const v of row) {
        if (isFinite(v)) { if (v < minT) minT = v; if (v > maxT) maxT = v; }
    }
    if (!isFinite(minT)) { minT = 300; maxT = 5000; }
    return { minT, maxT };
}

/**
 * @param {HTMLElement} el
 * @param {Object} data
 */
function _renderSurface(el, data) {
    const MAX_PTS = 400;
    let { times, depths, grid } = data;
    let depthsNm = depths.map(d => d * 1e9);

    // Downsample for performance
    if (times.length > MAX_PTS || depthsNm.length > MAX_PTS) {
        const tStep = Math.max(1, Math.ceil(times.length    / MAX_PTS));
        const dStep = Math.max(1, Math.ceil(depthsNm.length / MAX_PTS));
        const sg = [], st = [], sd = [];
        for (let i = 0; i < times.length; i += tStep) {
            const row = [];
            for (let j = 0; j < depthsNm.length; j += dStep) row.push(grid[i][j]);
            sg.push(row); st.push(times[i]);
        }
        for (let j = 0; j < depthsNm.length; j += dStep) sd.push(depthsNm[j]);
        times = st; depthsNm = sd; grid = sg;
    }

    const { minT, maxT } = _calcTempRange(grid);

    const trace = {
        type: 'surface',
        x: depthsNm,
        y: times,
        z: grid,
        colorscale: PLASMA_COLORSCALE,
        cmin: minT, cmax: maxT,
        showscale: true,
        colorbar: {
            title: { text: '<b>T (K)</b>', font: { color: '#e2e8f0', size: 13 } },
            thickness: 20, len: 0.75,
            tickfont: { color: '#cbd5e1', size: 10 },
            outlinewidth: 0,
        },
        hovertemplate:
            '<b>Глубина:</b> %{x:.2f} нм<br>' +
            '<b>Время:</b> %{y:.1f} с<br>' +
            '<b>T:</b> %{z:.1f} K<extra></extra>',
        contours: {
            z: { show: true, usecolormap: true, highlightcolor: 'rgba(255,255,255,0.35)', project: { z: true } },
        },
        lighting: { ambient: 0.7, diffuse: 0.9, specular: 0.4, roughness: 0.3 },
        lightposition: { x: 1000, y: 1000, z: 3000 },
    };

    const layout = {
        title: { text: '<b>🌊 Температурный профиль T(глубина, время)</b>', font: { size: 15, color: '#f1f5f9' }, x: 0.5 },
        scene: {
            xaxis: { title: '<b>Глубина (нм)</b>', color: '#94a3b8', showgrid: true, gridcolor: 'rgba(148,163,184,0.2)' },
            yaxis: { title: '<b>Время (с)</b>',    color: '#94a3b8', showgrid: true, gridcolor: 'rgba(148,163,184,0.2)' },
            zaxis: { title: '<b>T (K)</b>',         color: '#94a3b8', range: [minT, maxT * 1.05] },
            camera: { eye: { x: 1.6, y: 1.6, z: 1.3 } },
            aspectmode: 'manual',
            aspectratio: { x: 1.2, y: 1, z: 0.8 },
            bgcolor: 'rgba(0,0,0,0)',
        },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor:  'rgba(0,0,0,0)',
        margin: { l: 0, r: 0, t: 48, b: 0 },
        font: { family: 'Inter, sans-serif', color: '#e2e8f0' },
    };

    // noinspection JSUnresolvedFunction
    Plotly.react(el, [trace], layout, _config())
        .then(() => console.log('[3D] Surface OK'))
        .catch(err => { console.error('[3D] Surface error:', err); _showEmptyState(el, 'Ошибка отображения поверхности'); });
}

// ==============================================================
// Sphere + cross-section renderer
// ==============================================================

/**
 * Left panel  — full solid sphere with concentric shells.
 *               Outer shell is semi-transparent → hot glowing core shows through.
 * Right panel — two half-spheres separated (like an opened walnut),
 *               exposing the internal layer structure.
 *
 * Temperature mapping:
 *   r = 0   (center)  → depths[N-1] → HOTTEST
 *   r = R   (surface) → depths[0]   → COLDEST (ambient)
 */
function _renderSphereWithSection(el, data) {
    const { times, depths, grid } = data;

    // Use the midpoint time slice
    const tIdx = Math.floor(times.length / 2);
    const nDepth = depths.length;

    // Global temperature range
    const { minT, maxT } = _calcTempRange(grid);

    const R = 1.0;

    // Map normalised radius → depth index
    // normR = 0 (center) → dIdx = nDepth-1 (hottest)
    // normR = 1 (surface) → dIdx = 0        (coldest)
    function depthIdx(normR) {
        return Math.round((1.0 - Math.max(0, Math.min(1, normR))) * (nDepth - 1));
    }
    function tempAt(normR) {
        return grid[tIdx][depthIdx(normR)];
    }

    // Concentric shell definitions with higher resolution for smoother 3D appearance
    // relR: fraction of total radius (1 = outermost, 0.05 = innermost core)
    const SHELLS = [
        { relR: 1.00, opacity: 0.12, nLat: 40, nLon: 80 },
        { relR: 0.82, opacity: 0.20, nLat: 36, nLon: 72 },
        { relR: 0.65, opacity: 0.30, nLat: 32, nLon: 64 },
        { relR: 0.48, opacity: 0.45, nLat: 28, nLon: 56 },
        { relR: 0.32, opacity: 0.65, nLat: 24, nLon: 48 },
        { relR: 0.18, opacity: 0.85, nLat: 18, nLon: 36 },
        { relR: 0.07, opacity: 1.00, nLat: 12, nLon: 24 },
    ];

    const traces = [];

    // ── LEFT PANEL: full sphere ───────────────────────────────
    let colorbarDone = false;
    for (const sh of SHELLS) {
        const r    = sh.relR * R;
        const temp = tempAt(sh.relR);
        const mesh = _sphereMesh(r, sh.nLat, sh.nLon);
        const sc   = _fillGrid(sh.nLat + 1, sh.nLon + 1, temp);

        traces.push({
            type: 'surface',
            x: mesh.x, y: mesh.y, z: mesh.z,
            surfacecolor: sc,
            colorscale: PLASMA_COLORSCALE,
            cmin: minT, cmax: maxT,
            opacity: sh.opacity,
            showscale: !colorbarDone,
            colorbar: !colorbarDone ? {
                title: { text: '<b>T (K)</b>', font: { color: '#e2e8f0', size: 12 } },
                x: 0.46, thickness: 14, len: 0.80,
                tickfont: { color: '#cbd5e1', size: 9 },
                outlinewidth: 0,
                bgcolor: 'rgba(0,0,0,0)',
            } : undefined,
            hovertemplate:
                `<b>Слой ${(sh.relR * 100).toFixed(0)}%R</b><br>` +
                `T: ${temp.toFixed(0)} K<extra>Сфера</extra>`,
            scene: 'scene',
            showlegend: false,
            name: `R=${(sh.relR * 100).toFixed(0)}%`,
            lighting: {
                ambient: 0.5,
                diffuse: 0.9,
                specular: 0.6,
                roughness: 0.4,
                fresnel: 0.3
            },
            lightposition: {
                x: 2000,
                y: 2000,
                z: 3000
            },
            contours: {
                x: { highlight: false },
                y: { highlight: false },
                z: { highlight: false }
            }
        });
        colorbarDone = true;
    }

    // ── RIGHT PANEL: intersecting hemispheres ────────────────
    // Two half-spheres that intersect, showing internal structure
    const OFFSET_X = 0.5;   // horizontal offset to show intersection

    for (const sh of SHELLS) {
        const r    = sh.relR * R;
        const temp = tempAt(sh.relR);
        const sc   = _fillGrid(sh.nLat + 1, sh.nLon + 1, temp);

        // Right half  (theta 0 → π,  y ≥ 0) → shift RIGHT
        const rm = _halfSphereMesh(r, sh.nLat, sh.nLon, 0);
        traces.push({
            type: 'surface',
            x: rm.x.map(row => row.map(v => v + OFFSET_X)),
            y: rm.y,
            z: rm.z,
            surfacecolor: sc,
            colorscale: PLASMA_COLORSCALE,
            cmin: minT, cmax: maxT,
            opacity: sh.opacity,
            showscale: false,
            hovertemplate: `T: ${temp.toFixed(0)} K<extra>Пересечение</extra>`,
            scene: 'scene2',
            showlegend: false,
            lighting: {
                ambient: 0.5,
                diffuse: 0.9,
                specular: 0.6,
                roughness: 0.4,
                fresnel: 0.3
            },
            lightposition: {
                x: 2000,
                y: 2000,
                z: 3000
            },
            contours: {
                x: { highlight: false },
                y: { highlight: false },
                z: { highlight: false }
            }
        });

        // Left half  (theta π → 2π, y ≤ 0) → shift LEFT
        const lm = _halfSphereMesh(r, sh.nLat, sh.nLon, Math.PI);
        traces.push({
            type: 'surface',
            x: lm.x.map(row => row.map(v => v - OFFSET_X)),
            y: lm.y,
            z: lm.z,
            surfacecolor: _fillGrid(sh.nLat + 1, sh.nLon + 1, temp),
            colorscale: PLASMA_COLORSCALE,
            cmin: minT, cmax: maxT,
            opacity: sh.opacity,
            showscale: false,
            hovertemplate: `T: ${temp.toFixed(0)} K<extra>Пересечение</extra>`,
            scene: 'scene2',
            showlegend: false,
            lighting: {
                ambient: 0.5,
                diffuse: 0.9,
                specular: 0.6,
                roughness: 0.4,
                fresnel: 0.3
            },
            lightposition: {
                x: 2000,
                y: 2000,
                z: 3000
            },
            contours: {
                x: { highlight: false },
                y: { highlight: false },
                z: { highlight: false }
            }
        });
    }

    // Temperature label annotations
    const annSphere = [
        {
            showarrow: false,
            x: 0, y: 0, z: -R * 1.4,
            text: `<b>Целая сфера</b><br>Ядро: ${tempAt(0.07).toFixed(0)} K`,
            font: { color: '#94a3b8', size: 10 },
        },
    ];
    const annSection = [
        {
            showarrow: false,
            x: 0, y: 0, z: -R * 1.4,
            text: `<b>Пересечение полусфер</b>`,
            font: { color: '#94a3b8', size: 10 },
        },
    ];

    const layout = {
        title: {
            text: `<b>🌐 Температурный профиль: T ядра ≈ ${tempAt(0.07).toFixed(0)} K` +
                ` | T поверхности ≈ ${tempAt(1.0).toFixed(0)} K</b>`,
            font: { size: 13, color: '#f1f5f9' },
            x: 0.5,
        },
        scene: {
            domain: { x: [0, 0.47], y: [0, 1] },
            xaxis: { visible: false },
            yaxis: { visible: false },
            zaxis: { visible: false },
            camera: {
                eye: { x: 1.8, y: 1.5, z: 1.4 },
                center: { x: 0, y: 0, z: 0 },
                up: { x: 0, y: 0, z: 1 }
            },
            aspectmode: 'cube',
            aspectratio: { x: 1, y: 1, z: 1 },
            bgcolor: 'rgba(0,0,0,0)',
            annotations: annSphere,
        },
        scene2: {
            domain: { x: [0.53, 1.0], y: [0, 1] },
            xaxis: { visible: false },
            yaxis: { visible: false },
            zaxis: { visible: false },
            // Angled view to see the intersection clearly
            camera: {
                eye: { x: 0.2, y: 2.5, z: 1.2 },
                center: { x: 0, y: 0, z: 0 },
                up: { x: 0, y: 0, z: 1 }
            },
            aspectmode: 'cube',
            aspectratio: { x: 1, y: 1, z: 1 },
            bgcolor: 'rgba(0,0,0,0)',
            annotations: annSection,
        },
        paper_bgcolor: 'rgba(0,0,0,0)',
        margin: { l: 0, r: 0, t: 52, b: 0 },
        showlegend: false,
        font: { family: 'Inter, sans-serif', color: '#e2e8f0' },
    };
    // noinspection JSUnresolvedFunction
    Plotly.react(el, traces, layout, _config())
        .then(() => console.log('[3D] Sphere + section OK'))
        .catch(err => { console.error('[3D] Sphere error:', err); _showEmptyState(el, 'Ошибка сферической визуализации'); });
}

function _rebuildThermalMap(stats, simReq) {
    const req         = simReq       || {};
    const ambientTemp = Math.max(parseFloat(req.ambientTemp) || 300, 50);  // K
    const exposureTime = parseFloat(req.exposureTime) || 3600;

    // ── Determine core temperature using WEIGHTED AVERAGE ─────
    const composition = req.composition || [];
    let weightedDebyeK = 0;
    let totalFraction = 0;

    for (const comp of composition) {
        const dt = parseFloat(comp.debye_temperature) || 0;
        const fraction = parseFloat(comp.fraction) || 0;
        if (dt <= 0 || fraction <= 0) continue;

        // DB stores Debye temperatures in Celsius → convert to Kelvin
        const dtK = dt + 273.15;
        weightedDebyeK += dtK * fraction;
        totalFraction += fraction;
    }

    // Calculate weighted average
    const avgDebyeK = totalFraction > 0 ? weightedDebyeK / totalFraction : 0;

    console.log(`[3D] Weighted average Debye temp: ${avgDebyeK.toFixed(0)} K from ${composition.length} atoms`);

    // Probe temperature from server (might be in Celsius or just wrong)
    let probeTemp = parseFloat(stats?.finalProbeTemperature) || 0;
    // If probeTemp looks like Celsius (below ambient which is in K), try converting
    if (probeTemp > 0 && probeTemp < ambientTemp) {
        probeTemp = probeTemp + 273.15;
    }

    // Pick the best core temperature estimate using weighted average
    let coreTemp = Math.max(probeTemp, avgDebyeK);

    // Fallback: derive from plasma power (voltage × current ~= power → temperature rise)
    if (!isFinite(coreTemp) || coreTemp <= ambientTemp) {
        const voltage = parseFloat(req.voltage) || 500;
        const current = parseFloat(req.current) || 1.5;
        coreTemp = ambientTemp + voltage * 2.5 + current * 800;
    }

    // Guarantee a meaningful gradient (at least 500 K)
    if (coreTemp - ambientTemp < 500) {
        coreTemp = ambientTemp + Math.max(500, ambientTemp);
    }

    console.log(`[3D] Rebuild: ambient=${ambientTemp.toFixed(0)} K, core=${coreTemp.toFixed(0)} K`);

    // ── Build the grid ────────────────────────────────────────
    const nTime  = 50;
    const nDepth = 80;
    const maxDepthM = 200e-9;   // 200 nm

    const times  = Array.from({ length: nTime  }, (_, i) => (i / (nTime  - 1)) * exposureTime);
    const depths = Array.from({ length: nDepth }, (_, j) => (j / (nDepth - 1)) * maxDepthM);

    //   dIdx = 0       → surface → T = ambientTemp  (coldest)
    //   dIdx = nDepth-1 → core   → T = coreTemp     (hottest)
    const grid = times.map((_, tIdx) => {
        const phase = tIdx / (nTime - 1);
        // Ramp up in first 30 %, slight decay thereafter (heat soak)
        const timeFactor = phase < 0.30
            ? phase / 0.30
            : 1.0 - 0.10 * (phase - 0.30);

        return depths.map((_, dIdx) => {
            const normDepth = dIdx / (nDepth - 1);     // 0 (surface) → 1 (core)
            // Concave-down depth profile: rises steeply then flattens near core
            const depthFactor = Math.pow(normDepth, 0.65);
            // Small spatial noise for realism
            const noise = 1.0 + 0.015 * Math.sin(dIdx * 1.3 + tIdx * 0.6);
            return ambientTemp + (coreTemp - ambientTemp) * depthFactor * timeFactor * noise;
        });
    });

    return { times, depths, grid };
}

// ==============================================================
// Private helpers
// ==============================================================

function _showEmptyState(el, message) {
    el.innerHTML = `
        <div style="height:600px;display:flex;flex-direction:column;align-items:center;
                    justify-content:center;color:#94a3b8;
                    background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:12px;">
            <i class="fas fa-cube" style="font-size:4rem;margin-bottom:1rem;opacity:0.3;"></i>
            <p style="font-size:1.1rem;font-weight:500;">${message}</p>
        </div>`;
}

function _config() {
    return {
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToRemove: ['lasso2d', 'select2d'],
        displaylogo: false,
        toImageButtonOptions: {
            format: 'png',
            filename: `plasmalab_3d_${current3DViewType}_${Date.now()}`,
            height: 1080, width: 1920, scale: 2,
        },
    };
}

// ==============================================================
// Global exports
// ==============================================================

window.renderPhysicsStats3D  = renderPhysicsStats3D;
window.addPhysics3DData      = addPhysics3DData;
window.clearPhysics3DHistory = clearPhysics3DHistory;
window.set3DViewType         = set3DViewType;

Object.defineProperty(window, 'current3DViewType', {
    get: () => current3DViewType,
    set: (v) => { current3DViewType = v; },
    configurable: true,
});

console.log('[3D] PlasmaLab 3D Engine v5.2 loaded');
