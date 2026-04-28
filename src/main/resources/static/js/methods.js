// Professional Simulation Module
const API = '/api/simulation';
let curRes = null;
let simReq = null;
let allAtoms = [];
let allIons = [];
let currentPreset = 'magnetron';
const thermal3dHistory = [];

const AUTOGEN_PRESETS = {
    magnetron: { voltage:[200,800],   current:[0.2,3.0],   pressure:[0.1,5],     etemp:[11600,34800],   width:[0.1,0.4],  depth:[0.1,0.4],  time:[5,120],   angle:[0,20] },
    etching:   { voltage:[100,400],   current:[0.05,1.0],  pressure:[1,50],      etemp:[23200,69600],   width:[0.1,0.3],  depth:[0.1,0.3],  time:[10,300],  angle:[0,45] },
    implant:   { voltage:[500,2000],  current:[0.001,0.1], pressure:[0.001,1],   etemp:[58000,116000],  width:[0.05,0.2], depth:[0.05,0.2], time:[0.1,5],   angle:[0,30] },
    cvd:       { voltage:[50,300],    current:[0.5,5.0],   pressure:[10,200],    etemp:[5800,23200],    width:[0.15,0.5], depth:[0.15,0.5], time:[30,600],  angle:[0,10] },
    custom:    { voltage:[100,2000],  current:[0.01,5.0],  pressure:[0.01,200],  etemp:[5800,116000],   width:[0.05,0.5], depth:[0.05,0.5], time:[0.5,120], angle:[0,60] },
};

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadData();
    setupHandlers();
    addMissingElements();
    initCompositionRows();
    setupPresetListeners();
});

// ── init ─────────────────────────────────────────────────────────────────────

function initCompositionRows() {
    if (!document.getElementById('compositionList')?.children.length)    addRow();
    if (!document.getElementById('ionCompositionList')?.children.length) addIonRow();
}

function setupPresetListeners() {
    ['customVoltage','customCurrent','customPressure','customETemp','customWidth','customDepth','customTime','customAngle']
        .forEach(id => document.getElementById(id)?.addEventListener('change', updateCustomPreset));
}

function updateCustomPreset() {
    if (currentPreset !== 'custom') return;
    const parse = str => { const p = str.split('-').map(Number); return p.length === 2 ? p : [0, 100]; };
    AUTOGEN_PRESETS.custom = {
        voltage:  parse(document.getElementById('customVoltage')?.value  || '100-2000'),
        current:  parse(document.getElementById('customCurrent')?.value  || '0.01-5.0'),
        pressure: parse(document.getElementById('customPressure')?.value || '0.01-200'),
        etemp:    parse(document.getElementById('customETemp')?.value    || '5800-116000'),
        width:    parse(document.getElementById('customWidth')?.value    || '0.05-0.5'),
        depth:    parse(document.getElementById('customDepth')?.value    || '0.05-0.5'),
        time:     parse(document.getElementById('customTime')?.value     || '0.5-120'),
        angle:    parse(document.getElementById('customAngle')?.value    || '0-60'),
    };
}

function addMissingElements() {
    const resDisplay = document.getElementById('resDisplay');
    if (!resDisplay) return;

    if (!document.getElementById('resIdle')) {
        const el = document.createElement('div');
        el.id = 'resIdle'; el.className = 'res-state'; el.style.display = 'block';
        el.innerHTML = `<i class="fas fa-play-circle"></i><h4>Готов к запуску</h4><p>Задайте состав атомов и ионов, затем нажмите «Запустить»</p>`;
        resDisplay.parentNode.insertBefore(el, resDisplay);
    }
    if (!document.getElementById('resRunning')) {
        const el = document.createElement('div');
        el.id = 'resRunning'; el.className = 'res-state'; el.style.display = 'none';
        el.innerHTML = `<div class="spinner-lg"></div><h4>Выполняется симуляция</h4><p>Пожалуйста, подождите...</p><div class="progress-bar"><div id="progressBar" class="progress-fill" style="width:0%"></div></div>`;
        resDisplay.parentNode.insertBefore(el, resDisplay);
    }
}

// ── auth ─────────────────────────────────────────────────────────────────────

function checkAuth() {
    const auth = window.PlasmaAuth?.isAuthenticated?.() || false;
    document.getElementById('authGate').style.display    = auth ? 'none'  : 'flex';
    document.getElementById('simWorkspace').style.display = auth ? 'block' : 'none';
}

// ── data loading ─────────────────────────────────────────────────────────────

async function loadData() {
    try {
        const [aRes, iRes] = await Promise.all([fetch('/atoms'), fetch('/ions')]);
        if (!aRes.ok) throw new Error('atoms');
        if (!iRes.ok) throw new Error('ions');
        allAtoms = (await aRes.json()).data || [];
        allIons  = (await iRes.json()).data || [];
        updateAllCompositionSelects();
        updateCompositionInfo();
        updateIonCompositionInfo();
    } catch (e) {
        console.error('loadData:', e);
        showMsg('Ошибка загрузки данных', 'error');
    }
}

function updateAllCompositionSelects() {
    const aOpts = '<option value="">Выбрать атом...</option>' +
        allAtoms.map(x => `<option value="${x.id}">${x.atomName || x.name} — ${x.fullName || ''}</option>`).join('');
    const iOpts = '<option value="">Выбрать ион...</option>' +
        allIons.map(x => `<option value="${x.id}">${x.name} (${x.charge > 0 ? '+' : ''}${x.charge})</option>`).join('');
    document.querySelectorAll('.comp-atom').forEach(s => s.innerHTML = aOpts);
    document.querySelectorAll('.comp-ion') .forEach(s => s.innerHTML = iOpts);
}

// ── event handlers ────────────────────────────────────────────────────────────

function setupHandlers() {
    const form = document.getElementById('simForm');
    if (form) { form.removeEventListener('submit', runSimHandler); form.addEventListener('submit', runSimHandler); }

    document.querySelectorAll('.res-tab').forEach(t => {
        t.removeEventListener('click', tabHandler);
        t.addEventListener('click', tabHandler);
    });
    document.getElementById('compositionList')   ?.addEventListener('change', updateCompositionInfo);
    document.getElementById('ionCompositionList')?.addEventListener('change', updateIonCompositionInfo);
}

function runSimHandler(e) { e.preventDefault(); runSim(); }

function tabHandler(e) {
    const tab = e.currentTarget;
    document.querySelectorAll('.res-tab') .forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.res-panel').forEach(x => x.classList.remove('active'));
    tab.classList.add('active');
    document.querySelector(`.res-panel[data-tab="${tab.dataset.tab}"]`)?.classList.add('active');
}

// ── atom composition ──────────────────────────────────────────────────────────

function makeAtomRow(atomId = null, percent = 100) {
    const row = document.createElement('div');
    row.className = 'composition-row';
    const opts = '<option value="">Выбрать атом...</option>' +
        allAtoms.map(x => `<option value="${x.id}" ${x.id === atomId ? 'selected' : ''}>${x.atomName || x.name} — ${x.fullName || ''}</option>`).join('');
    row.innerHTML = `
        <select class="comp-atom" style="flex:2;padding:8px;border-radius:6px;background:rgba(13,17,23,.8);border:1px solid rgba(94,234,212,.3);color:#e2e8f0">${opts}</select>
        <input type="number" class="comp-fraction" step="0.1" placeholder="Доля, %" value="${percent}" style="flex:1;padding:8px;border-radius:6px;background:rgba(13,17,23,.8);border:1px solid rgba(94,234,212,.3);color:#e2e8f0">
        <button type="button" onclick="removeRow(this)" style="background:none;border:none;color:#ff6b6b;cursor:pointer;font-size:18px;padding:8px"><i class="fas fa-trash"></i></button>`;
    return row;
}

function addRow(atomId = null, percent = 100) {
    document.getElementById('compositionList')?.appendChild(makeAtomRow(atomId, percent));
    updateCompositionInfo();
}

function removeRow(btn) {
    const c = document.getElementById('compositionList');
    if (c?.children.length > 1) { btn.closest('.composition-row').remove(); updateCompositionInfo(); }
    else showMsg('Должен быть хотя бы один компонент мишени', 'error');
}

function randomizeComposition() {
    if (!allAtoms.length) return;
    const c = document.getElementById('compositionList');
    if (!c) return;
    c.innerHTML = '';
    const n = Math.min(Math.floor(Math.random() * 3) + 1, allAtoms.length);
    const shuffled = [...allAtoms].sort(() => Math.random() - 0.5).slice(0, n);
    let fracs = shuffled.map(() => Math.random());
    const sum = fracs.reduce((a,b) => a+b, 0);
    fracs = fracs.map(f => f / sum);
    shuffled.forEach((atom, i) => addRow(atom.id, (fracs[i] * 100).toFixed(1)));
}

function collectComposition(showError = true) {
    const rows = document.querySelectorAll('#compositionList .composition-row');
    const comp = [];
    rows.forEach(row => {
        const id  = row.querySelector('.comp-atom')?.value;
        const pct = row.querySelector('.comp-fraction')?.value;
        if (id && pct && id !== '') comp.push({ atomId: parseInt(id, 10), fraction: parseFloat(pct) / 100 });
    });
    if (!comp.length) { if (showError) showMsg('Добавьте хотя бы один компонент мишени', 'error'); return null; }
    const sum = comp.reduce((s, c) => s + c.fraction, 0);
    if (Math.abs(sum - 1) > 0.01) {
        if (showError) showMsg(`Сумма долей мишени должна быть 100% (сейчас: ${(sum*100).toFixed(1)}%)`, 'error');
        return null;
    }
    return comp;
}

function updateCompositionInfo() {
    const comp = collectComposition(false);
    const info = document.getElementById('compositionInfo');
    const text = document.getElementById('compositionText');
    if (!info || !text) return;
    if (comp?.length) {
        const sum = comp.reduce((s,c) => s+c.fraction, 0);
        if (Math.abs(sum-1) <= 0.01) {
            text.innerHTML = `<strong>${comp.map(c => {
                const a = allAtoms.find(a => a.id === c.atomId);
                return `${a?.atomName || a?.name || '?'} ${(c.fraction*100).toFixed(1)}%`;
            }).join(', ')}</strong> (сумма: ${(sum*100).toFixed(1)}%)`;
            info.style.display = 'block';
            return;
        }
    }
    info.style.display = 'none';
}

function formatComposition(comp) {
    if (!comp?.length) return '—';
    return comp.map(c => {
        const a = allAtoms.find(a => a.id === c.atomId);
        return `${a?.atomName || a?.name || '?'} ${(c.fraction*100).toFixed(1)}%`;
    }).join(', ');
}

// ── ion composition ───────────────────────────────────────────────────────────

function makeIonRow(ionId = null, percent = 100) {
    const row = document.createElement('div');
    row.className = 'composition-row';
    const opts = '<option value="">Выбрать ион...</option>' +
        allIons.map(x => `<option value="${x.id}" ${x.id === ionId ? 'selected' : ''}>${x.name} (${x.charge > 0 ? '+' : ''}${x.charge})</option>`).join('');
    row.innerHTML = `
        <select class="comp-ion" style="flex:2;padding:8px;border-radius:6px;background:rgba(13,17,23,.8);border:1px solid rgba(94,234,212,.3);color:#e2e8f0">${opts}</select>
        <input type="number" class="comp-fraction" step="0.1" placeholder="Доля, %" value="${percent}" style="flex:1;padding:8px;border-radius:6px;background:rgba(13,17,23,.8);border:1px solid rgba(94,234,212,.3);color:#e2e8f0">
        <button type="button" onclick="removeIonRow(this)" style="background:none;border:none;color:#ff6b6b;cursor:pointer;font-size:18px;padding:8px"><i class="fas fa-trash"></i></button>`;
    return row;
}

function addIonRow(ionId = null, percent = 100) {
    document.getElementById('ionCompositionList')?.appendChild(makeIonRow(ionId, percent));
    updateIonCompositionInfo();
}

function removeIonRow(btn) {
    const c = document.getElementById('ionCompositionList');
    if (c?.children.length > 1) { btn.closest('.composition-row').remove(); updateIonCompositionInfo(); }
    else showMsg('Должен быть хотя бы один ион', 'error');
}

function randomizeIonComposition() {
    if (!allIons.length) return;
    const c = document.getElementById('ionCompositionList');
    if (!c) return;
    c.innerHTML = '';
    const n = Math.min(Math.floor(Math.random() * 3) + 1, allIons.length);
    const shuffled = [...allIons].sort(() => Math.random() - 0.5).slice(0, n);
    let fracs = shuffled.map(() => Math.random());
    const sum = fracs.reduce((a,b) => a+b, 0);
    fracs = fracs.map(f => f / sum);
    shuffled.forEach((ion, i) => addIonRow(ion.id, (fracs[i] * 100).toFixed(1)));
}

function collectIonComposition(showError = true) {
    const rows = document.querySelectorAll('#ionCompositionList .composition-row');
    const comp = [];
    rows.forEach(row => {
        const id  = row.querySelector('.comp-ion')?.value;
        const pct = row.querySelector('.comp-fraction')?.value;
        if (id && pct && id !== '') {
            const ion = allIons.find(i => i.id === parseInt(id));
            if (ion) comp.push({ ion, fraction: parseFloat(pct) / 100 });
        }
    });
    if (!comp.length && showError) { showMsg('Добавьте хотя бы один ион', 'error'); return null; }
    const sum = comp.reduce((s, c) => s + c.fraction, 0);
    if (Math.abs(sum - 1) > 0.01) {
        if (showError) showMsg(`Сумма долей ионов должна быть 100% (сейчас: ${(sum*100).toFixed(1)}%)`, 'error');
        return null;
    }
    return comp;
}

function updateIonCompositionInfo() {
    const comp = collectIonComposition(false);
    const info = document.getElementById('ionCompositionInfo');
    const text = document.getElementById('ionCompositionText');
    if (!info || !text) return;
    if (comp?.length) {
        const sum = comp.reduce((s,c) => s+c.fraction, 0);
        if (Math.abs(sum-1) <= 0.01) {
            text.innerHTML = `<strong>${comp.map(c => `${c.ion?.name || '?'} ${(c.fraction*100).toFixed(1)}%`).join(', ')}</strong> (сумма: ${(sum*100).toFixed(1)}%)`;
            info.style.display = 'block';
            return;
        }
    }
    info.style.display = 'none';
}

function formatIonComposition(comp) {
    if (!comp?.length) return '—';
    return comp.map(c => {
        const ion = c.ion || allIons.find(i => i.id === c.ionId);
        return `${ion?.name || '?'} ${(c.fraction * 100).toFixed(1)}%`;
    }).join(', ');
}

// ── parameter generation ──────────────────────────────────────────────────────

function rndBetween(min, max) { return parseFloat((Math.random() * (max - min) + min).toFixed(4)); }

function generateRandomParameters() {
    const p = AUTOGEN_PRESETS[currentPreset];
    if (!p) return;
    document.getElementById('voltage').value       = rndBetween(...p.voltage);
    document.getElementById('current').value       = rndBetween(...p.current);
    document.getElementById('pressure').value      = rndBetween(...p.pressure);
    document.getElementById('electronTemp').value  = rndBetween(...p.etemp);
    document.getElementById('chamberWidth').value  = rndBetween(...p.width);
    document.getElementById('chamberDepth').value  = rndBetween(...p.depth);
    document.getElementById('exposureTime').value  = rndBetween(...p.time);
    document.getElementById('angle').value         = rndBetween(...p.angle);
    showMsg('Параметры сгенерированы!', 'success');
}

function randomizeParameters() { generateRandomParameters(); }

function generateAndRun() {
    if (!collectComposition(false)) randomizeComposition();
    if (!collectIonComposition(false)) randomizeIonComposition();
    generateRandomParameters();
    document.getElementById('runBtn').click();
}

// ── simulation ────────────────────────────────────────────────────────────────

async function runSim() {
    if (window.PlasmaAuth && !window.PlasmaAuth.isAuthenticated?.()) {
        window.PlasmaAuth.showMessage?.('Требуется авторизация', 'error');
        return;
    }

    const atomComposition = collectComposition();
    const ionComposition  = collectIonComposition();
    if (!atomComposition || !ionComposition) return;

    const req = {
        atomId:       atomComposition[0]?.atomId,
        ionId:        ionComposition[0]?.ion?.id,
        composition:  atomComposition,
        ionComposition,
        configId:     1,
        voltage:      parseFloat(document.getElementById('voltage').value),
        current:      parseFloat(document.getElementById('current').value),
        pressure:     parseFloat(document.getElementById('pressure').value),
        electronTemp: parseFloat(document.getElementById('electronTemp').value),
        chamberWidth: parseFloat(document.getElementById('chamberWidth').value),
        chamberDepth: parseFloat(document.getElementById('chamberDepth').value),
        exposureTime: parseFloat(document.getElementById('exposureTime').value),
        angle:        parseFloat(document.getElementById('angle').value),
        ambientTemp:  300.0,
    };

    console.log('📤 Запрос:', JSON.stringify(req, null, 2));
    simReq = req;
    showRunning();

    try {
        const token = window.PlasmaAuth?.getToken();
        const res = await fetch(`${API}/run`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
            body: JSON.stringify(req),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
            throw new Error(err.message || `HTTP ${res.status}`);
        }

        const result = await res.json();
        curRes = result.data;
        console.log('=== RESULT ===', curRes);
        showResults(curRes);

    } catch (e) {
        console.error('Simulation error:', e);
        showIdle();
        window.PlasmaAuth?.showMessage?.('Ошибка: ' + e.message, 'error');
    }
}

// ── show results ──────────────────────────────────────────────────────────────
// Структура ответа SimulationResult:
//   r.profile        — DiffusionProfile
//   r.atom           — AtomList
//   r.ion            — Ion
//   r.plasmaConfig   — PlasmaConfiguration
//   r.stats          — PhysicsStats { electronDensity, electronVelocity,
//                        currentDensity, surfaceBindingEnergy,
//                        totalTransferredEnergy, avgTransferredPerAtom,
//                        totalDamage, totalMomentum, totalDisplacement }

function showResults(r) {
    document.getElementById('resRunning').style.display = 'none';
    document.getElementById('resDisplay').style.display = 'block';

    const fmt = n => {
        if (n === undefined || n === null) return '—';
        const v = +n;
        if (isNaN(v)) return '—';
        return (Math.abs(v) < 1e-3 || Math.abs(v) > 1e3) ? v.toExponential(3) : v.toPrecision(4);
    };

    const pc    = r.plasmaConfig || {};   // PlasmaConfiguration
    const stats = r.stats        || {};   // PhysicsStats  ← ключевое исправление

    // MATERIAL
    set('r_composition',     formatComposition(simReq?.composition));
    set('r_ion_composition', formatIonComposition(simReq?.ionComposition));

    // PLASMA
    set('r_voltage',              fmt(pc.voltage          ?? simReq?.voltage));
    set('r_current',              fmt(pc.current          ?? simReq?.current));
    set('r_pressure',             fmt(pc.pressure         ?? simReq?.pressure));
    set('r_electron_temperature', fmt(pc.electronTemperature ?? simReq?.electronTemp));
    set('r_exposure_time',        fmt(pc.exposureTime     ?? simReq?.exposureTime));
    // эти три поля теперь в stats, НЕ в r напрямую
    set('r_electron_density',     fmt(stats.electronDensity  ?? 0));
    set('r_electron_velocity',    fmt(stats.electronVelocity ?? 0));
    set('r_current_density',      fmt(stats.currentDensity   ?? 0));

    // CHAMBER
    set('r_chamber_width', fmt(pc.chamberWidth ?? simReq?.chamberWidth));
    set('r_chamber_depth', fmt(pc.chamberDepth ?? simReq?.chamberDepth));

    // ION IMPACT
    set('r_ion_energy',            fmt(pc.ionEnergyOverride   ?? 0));
    set('r_ion_incidence_angle',   fmt(pc.ionIncidenceAngle   ?? simReq?.angle));
    set('r_target_temperature',    fmt(pc.targetTemperature));
    set('r_surface_binding_energy', fmt(stats.surfaceBindingEnergy ?? pc.surfaceBindingEnergy ?? 0));

    // THERMAL
    set('r_thermal_conductivity', fmt(pc.thermalConductivity));
    set('r_heat_capacity',        fmt(pc.heatCapacity));
    set('r_density',              fmt(pc.density));

    // DAMAGE / PHYSICS STATS — всё из r.stats
    set('r_total_transferred_energy', fmt(stats.totalTransferredEnergy ?? 0));
    set('r_avg_transferred_per_atom', fmt(stats.avgTransferredPerAtom  ?? 0));
    set('r_total_damage',             fmt(stats.totalDamage            ?? 0));
    set('r_total_momentum',           fmt(stats.totalMomentum          ?? 0));
    set('r_total_displacement',       fmt(stats.totalDisplacement      ?? 0));

    // DIFFUSION PROFILE
    if (r.profile) {
        set('r_d1',          fmt(r.profile.d1));
        set('r_d2',          fmt(r.profile.d2));
        set('r_q1',          fmt(r.profile.q1_ev));
        set('r_q2',          fmt(r.profile.q2_ev));
        set('r_d_thermal',   fmt(r.profile.d_thermal));
        set('r_d_effective', fmt(r.profile.d_effective));
        set('r_mean_depth',  fmt(r.profile.meanDepth));
    }

    updateThermal3D(stats);
}

function updateThermal3D(stats) {
    const chartWrap = document.getElementById('thermal3dWrap');
    const chartId = 'thermal3dChart';
    if (!chartWrap || typeof window.Plotly === 'undefined') return;

    const finalProbeTemperature = Number(stats?.finalProbeTemperature);
    const debyeFrontSpeed = Number(stats?.debyeFrontSpeed);
    const debyeFrontDepth = Number(stats?.debyeFrontDepth);

    const validPoint =
        Number.isFinite(finalProbeTemperature) &&
        Number.isFinite(debyeFrontSpeed) &&
        Number.isFinite(debyeFrontDepth);

    if (validPoint) {
        thermal3dHistory.push({
            x: finalProbeTemperature,
            y: debyeFrontSpeed,
            z: debyeFrontDepth,
        });
    }

    if (!thermal3dHistory.length) {
        chartWrap.style.display = 'none';
        return;
    }

    chartWrap.style.display = 'block';

    window.Plotly.react(chartId, [{
        type: 'scatter3d',
        mode: 'markers+text',
        x: thermal3dHistory.map(p => p.x),
        y: thermal3dHistory.map(p => p.y),
        z: thermal3dHistory.map(p => p.z),
        text: thermal3dHistory.map((_, i) => `#${i + 1}`),
        textposition: 'top center',
        marker: {
            size: 6,
            color: thermal3dHistory.map((_, i) => i + 1),
            colorscale: 'Turbo',
            opacity: 0.9,
        },
        hovertemplate:
            'Tfinal: %{x:.4g} K<br>' +
            'Vdebye: %{y:.4g} м/с<br>' +
            'Depth: %{z:.4g} м<extra></extra>',
    }], {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        margin: { l: 0, r: 0, t: 8, b: 0 },
        scene: {
            xaxis: { title: 'finalProbeTemperature (K)' },
            yaxis: { title: 'debyeFrontSpeed (м/с)' },
            zaxis: { title: 'debyeFrontDepth (м)' },
        },
    }, { responsive: true, displaylogo: false });
}

function set(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

// ── save ──────────────────────────────────────────────────────────────────────

async function saveRes() {
    if (!curRes || !simReq) { showMsg('Нет результатов для сохранения', 'error'); return; }

    const pickFirstValidId = (...candidates) => {
        for (const candidate of candidates) {
            if (Array.isArray(candidate)) {
                for (const item of candidate) {
                    const id = Number(item?.id ?? item?.atomId ?? item?.ionId ?? item);
                    if (Number.isInteger(id) && id > 0) return id;
                }
                continue;
            }
            const id = Number(candidate);
            if (Number.isInteger(id) && id > 0) return id;
        }
        return null;
    };

    const stats = curRes.stats || {};
    const plasma = curRes.plasmaConfig || {};
    const profile = curRes.profile || {};
    const atomId = pickFirstValidId(
        simReq.atomId,
        simReq.atomIds,
        simReq.composition?.map(x => x?.atomId),
        curRes.atom?.id
    );
    const ionId = pickFirstValidId(
        simReq.ionId,
        simReq.ionIds,
        simReq.ionComposition?.map(x => x?.ion?.id ?? x?.ionId),
        curRes.ion?.id
    );
    const configId = pickFirstValidId(simReq.configId, simReq.configIds, curRes.plasmaConfig?.id);

    const plasmaParameters = {
        electronDensity: Number(stats.electronDensity ?? 0),
        electronVelocity: Number(stats.electronVelocity ?? 0),
        currentDensity: Number(stats.currentDensity ?? 0),
        ionEnergy: Number(plasma.ionEnergyOverride ?? 0),
        voltage: Number(plasma.voltage ?? simReq.voltage ?? 0),
        pressure: Number(plasma.pressure ?? simReq.pressure ?? 0),
        electronTemp: Number(plasma.electronTemperature ?? simReq.electronTemp ?? 0),
        ionFlux: 0,
    };

    const diffusionProfile = {
        D1: Number(profile.d1 ?? profile.D1 ?? 0),
        D2: Number(profile.d2 ?? profile.D2 ?? 0),
        Q1: Number(profile.q1_ev ?? profile.Q1 ?? 0),
        Q2: Number(profile.q2_ev ?? profile.Q2 ?? 0),
        D_thermal: Number(profile.d_thermal ?? profile.D_thermal ?? 0),
        D_effective: Number(profile.d_effective ?? profile.D_effective ?? 0),
        depth: Number(profile.meanDepth ?? profile.depth ?? 0),
    };

    const avgT = Number(plasma.targetTemperature ?? simReq.ambientTemp ?? 300);

    try {
        if (!atomId || !ionId || !configId) {
            throw new Error('Не заданы atomId/ionId/configId для сохранения результата');
        }

        const token = window.PlasmaAuth?.getToken();
        const res = await fetch(`${API}/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
            body: JSON.stringify({
                atomId,
                configId,
                ionId,
                atomName:             curRes.atom?.atomName || '',
                s:                    formatComposition(simReq.composition),
                totalTransferredEnergy: Number(stats.totalTransferredEnergy ?? 0),
                avgTransferredPerAtom:  Number(stats.avgTransferredPerAtom ?? 0),
                avgT,
                minT: avgT,
                maxT: avgT,
                diffusionCoefficient1: Number(profile.d1 ?? profile.D1 ?? 0),
                diffusionCoefficient2: Number(profile.d2 ?? profile.D2 ?? 0),
                plasmaParameters,
                perAtomTransferredEnergies: [],
                diffusionProfile,
                coolingProfile: [],
                totalDamage:            Number(stats.totalDamage ?? 0),
                totalMomentum:          Number(stats.totalMomentum ?? 0),
                totalDisplacement:      Number(stats.totalDisplacement ?? 0),
            }),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
            throw new Error(err.message || `HTTP ${res.status}`);
        }

        window.PlasmaAuth?.showMessage?.('Результаты сохранены!', 'success');
        showMsg('Результаты сохранены!', 'success');

    } catch (e) {
        console.error('Save error:', e);
        window.PlasmaAuth?.showMessage?.('Ошибка сохранения: ' + e.message, 'error');
    }
}

// ── ui helpers ────────────────────────────────────────────────────────────────

function showRunning() {
    document.getElementById('resIdle')   ?.setAttribute('style', 'display:none');
    document.getElementById('resRunning')?.setAttribute('style', 'display:block');
    document.getElementById('resDisplay')?.setAttribute('style', 'display:none');
    animProgress();
}

function showIdle() {
    document.getElementById('resIdle')   ?.setAttribute('style', 'display:block');
    document.getElementById('resRunning')?.setAttribute('style', 'display:none');
    document.getElementById('resDisplay')?.setAttribute('style', 'display:none');
}

function animProgress() {
    let p = 0;
    const bar = document.getElementById('progressBar');
    if (!bar) return;
    const t = setInterval(() => { bar.style.width = (p += 10) + '%'; if (p >= 100) clearInterval(t); }, 200);
}

function resetForm() {
    ['compositionList', 'ionCompositionList'].forEach(id => {
        const c = document.getElementById(id);
        if (c) { c.innerHTML = ''; id === 'compositionList' ? addRow() : addIonRow(); }
    });
    const defaults = { voltage:'500', current:'0.5', pressure:'10', electronTemp:'11600',
        chamberWidth:'0.1', chamberDepth:'0.1', exposureTime:'1.0', angle:'0' };
    Object.entries(defaults).forEach(([id, val]) => { const el = document.getElementById(id); if (el) el.value = val; });
    curRes = null; simReq = null;
    thermal3dHistory.length = 0;
    const chartWrap = document.getElementById('thermal3dWrap');
    if (chartWrap) chartWrap.style.display = 'none';
    if (typeof window.Plotly !== 'undefined' && document.getElementById('thermal3dChart')) {
        window.Plotly.purge('thermal3dChart');
    }
    showIdle();
    updateCompositionInfo();
    updateIonCompositionInfo();
}

function showMsg(msg, type) {
    const m = document.getElementById('formMsg');
    if (m) {
        m.textContent = msg;
        m.style.color   = type === 'error' ? '#ff6b6b' : '#28a745';
        m.style.display = 'block';
        setTimeout(() => { m.style.display = 'none'; }, 5000);
    } else { alert(msg); }
}

function toggleAutogen() {
    document.querySelector('.autogen-header')?.classList.toggle('open');
    document.getElementById('autogenBody')    ?.classList.toggle('open');
}

function selectPreset(el) {
    document.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    currentPreset = el.dataset.preset;
    const cr = document.getElementById('customRanges');
    if (cr) cr.style.display = currentPreset === 'custom' ? 'block' : 'none';
    if (currentPreset !== 'custom') generateRandomParameters();
}

function changeCount(delta) {
    const s = document.getElementById('genCount');
    if (s) s.textContent = Math.max(1, Math.min(100, parseInt(s.textContent) + delta));
}

// ── globals ───────────────────────────────────────────────────────────────────

Object.assign(window, {
    addRow, removeRow, randomizeComposition,
    addIonRow, removeIonRow, randomizeIonComposition,
    randomizeParameters, generateAndRun,
    saveRes, resetForm, toggleAutogen, selectPreset, changeCount,
    newSim: () => { resetForm(); showIdle(); },
    showAuthModal: () => window.PlasmaAuth?.showModal?.() || alert('Функция авторизации недоступна'),
    hideAuthModal: () => window.PlasmaAuth?.hideModal?.(),
    logout: () => { window.PlasmaAuth?.logout?.(); checkAuth(); },
});