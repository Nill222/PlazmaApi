// ═══════════════════════════════════════════════════════
//  methods.js  —  PlasmaLab Simulation Module
//  Версия с 4 вкладками: Входные данные, DiffusionProfile,
//  PlasmaConfiguration, PhysicsStats
//  РЕАЛЬНЫЕ ЗАПРОСЫ К API (БЕЗ МОКОВ)
// ═══════════════════════════════════════════════════════

const API = '/api/simulation';
let curRes = null;
let simReq = null;
let allAtoms = [];
let allIons = [];
let currentPreset = 'magnetron';

// Batch generation state
let isGenerationActive = false;
let shouldStopGeneration = false;

// 3D history for PhysicsStats
let physics3DHistory = [];

// Presets
const AUTOGEN_PRESETS = {
    magnetron: { voltage: [200, 800], current: [0.2, 3.0], pressure: [0.1, 5], etemp: [11600, 34800], width: [0.1, 0.4], depth: [0.1, 0.4], time: [5, 120], angle: [0, 20] },
    etching: { voltage: [100, 400], current: [0.05, 1.0], pressure: [1, 50], etemp: [23200, 69600], width: [0.1, 0.3], depth: [0.1, 0.3], time: [10, 300], angle: [0, 45] },
    implant: { voltage: [500, 2000], current: [0.001, 0.1], pressure: [0.001, 1], etemp: [58000, 116000], width: [0.05, 0.2], depth: [0.05, 0.2], time: [0.1, 5], angle: [0, 30] },
    cvd: { voltage: [50, 300], current: [0.5, 5.0], pressure: [10, 200], etemp: [5800, 23200], width: [0.15, 0.5], depth: [0.15, 0.5], time: [30, 600], angle: [0, 10] },
    custom: { voltage: [100, 2000], current: [0.01, 5.0], pressure: [0.01, 200], etemp: [5800, 116000], width: [0.05, 0.5], depth: [0.05, 0.5], time: [0.5, 120], angle: [0, 60] },
};

// ══════════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadData();
    setupHandlers();
    addMissingElements();
    initCompositionRows();
    setupPresetListeners();

    const genCountInput = document.getElementById('genCountInput');
    if (genCountInput) {
        genCountInput.addEventListener('change', function () {
            let v = Math.min(100, Math.max(1, parseInt(this.value) || 1));
            this.value = v;
            const genCountSpan = document.getElementById('genCount');
            if (genCountSpan) genCountSpan.textContent = v;
        });
    }
});

function initCompositionRows() {
    const compositionList = document.getElementById('compositionList');
    const ionCompositionList = document.getElementById('ionCompositionList');
    if (compositionList && !compositionList.children.length) addRow();
    if (ionCompositionList && !ionCompositionList.children.length) addIonRow();
}

function setupPresetListeners() {
    const customIds = ['customVoltage', 'customCurrent', 'customPressure', 'customETemp', 'customWidth', 'customDepth', 'customTime', 'customAngle'];
    customIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', updateCustomPreset);
    });
}

function updateCustomPreset() {
    if (currentPreset !== 'custom') return;
    const parse = str => {
        const p = str.split('-').map(Number);
        return p.length === 2 && !isNaN(p[0]) && !isNaN(p[1]) ? p : [0, 100];
    };
    AUTOGEN_PRESETS.custom = {
        voltage: parse(document.getElementById('customVoltage')?.value || '100-2000'),
        current: parse(document.getElementById('customCurrent')?.value || '0.01-5.0'),
        pressure: parse(document.getElementById('customPressure')?.value || '0.01-200'),
        etemp: parse(document.getElementById('customETemp')?.value || '5800-116000'),
        width: parse(document.getElementById('customWidth')?.value || '0.05-0.5'),
        depth: parse(document.getElementById('customDepth')?.value || '0.05-0.5'),
        time: parse(document.getElementById('customTime')?.value || '0.5-120'),
        angle: parse(document.getElementById('customAngle')?.value || '0-60'),
    };
}

function addMissingElements() {
    const resDisplay = document.getElementById('resDisplay');
    if (!resDisplay) return;

    if (!document.getElementById('resIdle')) {
        const el = document.createElement('div');
        el.id = 'resIdle';
        el.className = 'res-state';
        el.style.display = 'block';
        el.innerHTML = `<i class="fas fa-play-circle"></i><h4>Готов к запуску</h4><p>Задайте состав атомов и ионов, затем нажмите «Запустить»</p>`;
        resDisplay.parentNode.insertBefore(el, resDisplay);
    }
    if (!document.getElementById('resRunning')) {
        const el = document.createElement('div');
        el.id = 'resRunning';
        el.className = 'res-state';
        el.style.display = 'none';
        el.innerHTML = `<div class="spinner-lg"></div><h4>Выполняется симуляция</h4><p>Пожалуйста, подождите...</p><div class="progress-bar"><div id="progressBar" class="progress-fill" style="width:0%"></div></div>`;
        resDisplay.parentNode.insertBefore(el, resDisplay);
    }
}

// ══════════════════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════════════════
function checkAuth() {
    const auth = window.PlasmaAuth?.isAuthenticated?.() || false;
    const authGate = document.getElementById('authGate');
    const simWorkspace = document.getElementById('simWorkspace');
    if (authGate) authGate.style.display = auth ? 'none' : 'flex';
    if (simWorkspace) simWorkspace.style.display = auth ? 'block' : 'none';
}

// ══════════════════════════════════════════════════════════
//  DATA LOADING
// ══════════════════════════════════════════════════════════
async function loadData() {
    try {
        const [aRes, iRes] = await Promise.all([fetch('/atoms'), fetch('/ions')]);
        if (!aRes.ok || !iRes.ok) throw new Error('load failed');
        allAtoms = (await aRes.json()).data || [];
        allIons = (await iRes.json()).data || [];
        updateAllCompositionSelects();
        updateCompositionInfo();
        updateIonCompositionInfo();
    } catch (e) {
        console.error('Error loading data:', e);
        showMsg('Ошибка загрузки данных', 'error');
    }
}

function updateAllCompositionSelects() {
    const aOpts = '<option value="">Выбрать атом...</option>' +
        allAtoms.map(x => `<option value="${x.id}">${x.atomName || x.name} — ${x.fullName || ''}</option>`).join('');
    const iOpts = '<option value="">Выбрать ион...</option>' +
        allIons.map(x => `<option value="${x.id}">${x.name} (${x.charge > 0 ? '+' : ''}${x.charge})</option>`).join('');
    document.querySelectorAll('.comp-atom').forEach(s => s.innerHTML = aOpts);
    document.querySelectorAll('.comp-ion').forEach(s => s.innerHTML = iOpts);
}

// ══════════════════════════════════════════════════════════
//  HANDLERS
// ══════════════════════════════════════════════════════════
function setupHandlers() {
    const form = document.getElementById('simForm');
    if (form) {
        form.removeEventListener('submit', _onSubmit);
        form.addEventListener('submit', _onSubmit);
    }
    document.querySelectorAll('.res-tab').forEach(t => {
        t.removeEventListener('click', _onTab);
        t.addEventListener('click', _onTab);
    });
    const compositionList = document.getElementById('compositionList');
    const ionCompositionList = document.getElementById('ionCompositionList');
    if (compositionList) compositionList.addEventListener('change', updateCompositionInfo);
    if (ionCompositionList) ionCompositionList.addEventListener('change', updateIonCompositionInfo);
}

function _onSubmit(e) {
    e.preventDefault();
    runSingleSim();
}

function _onTab(e) {
    const tab = e.currentTarget;
    document.querySelectorAll('.res-tab').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.res-panel').forEach(x => x.classList.remove('active'));
    tab.classList.add('active');
    const panel = document.querySelector(`.res-panel[data-tab="${tab.dataset.tab}"]`);
    if (panel) panel.classList.add('active');

    // Рендерим 3D график только при переключении на вкладку debye3d
    if (tab.dataset.tab === 'debye3d') {
        renderPhysicsStats3D();
    }
}

// ══════════════════════════════════════════════════════════
//  ATOM COMPOSITION
// ══════════════════════════════════════════════════════════
function makeAtomRow(atomId = null, percent = 100) {
    const row = document.createElement('div');
    row.className = 'composition-row';
    const opts = '<option value="">Выбрать атом...</option>' +
        allAtoms.map(x => `<option value="${x.id}" ${x.id == atomId ? 'selected' : ''}>${x.atomName || x.name} — ${x.fullName || ''}</option>`).join('');
    row.innerHTML = `
        <select class="comp-atom">${opts}</select>
        <input type="number" class="comp-fraction" step="0.1" placeholder="Доля, %" value="${percent}">
        <button type="button" onclick="removeRow(this)" style="background:none;border:none;color:#ff6b6b;cursor:pointer;font-size:18px;padding:8px"><i class="fas fa-trash"></i></button>`;
    return row;
}

function addRow(atomId = null, percent = 100) {
    const container = document.getElementById('compositionList');
    if (container) container.appendChild(makeAtomRow(atomId, percent));
    updateCompositionInfo();
}

function removeRow(btn) {
    const c = document.getElementById('compositionList');
    if (c && c.children.length > 1) {
        btn.closest('.composition-row').remove();
        updateCompositionInfo();
    } else {
        showMsg('Должен быть хотя бы один компонент мишени', 'error');
    }
}

function randomizeComposition() {
    if (!allAtoms.length) return;
    const c = document.getElementById('compositionList');
    if (!c) return;
    c.innerHTML = '';
    const n = Math.min(Math.floor(Math.random() * 3) + 1, allAtoms.length);
    const shuffled = [...allAtoms].sort(() => Math.random() - 0.5).slice(0, n);
    let fracs = shuffled.map(() => Math.random());
    const sum = fracs.reduce((a, b) => a + b, 0);
    shuffled.forEach((atom, i) => addRow(atom.id, (fracs[i] / sum * 100).toFixed(1)));
}

function collectComposition(showError = true) {
    const rows = document.querySelectorAll('#compositionList .composition-row');
    const comp = [];
    rows.forEach(row => {
        const id = row.querySelector('.comp-atom')?.value;
        const pct = parseFloat(row.querySelector('.comp-fraction')?.value);
        if (id && id !== '' && !isNaN(pct)) comp.push({ atomId: parseInt(id, 10), fraction: pct / 100 });
    });
    if (!comp.length) {
        if (showError) showMsg('Добавьте хотя бы один компонент мишени', 'error');
        return null;
    }
    const sum = comp.reduce((s, c) => s + c.fraction, 0);
    if (Math.abs(sum - 1) > 0.01) {
        if (showError) showMsg(`Сумма долей мишени должна быть 100% (сейчас: ${(sum * 100).toFixed(1)}%)`, 'error');
        return null;
    }
    return comp;
}

function updateCompositionInfo() {
    const comp = collectComposition(false);
    const info = document.getElementById('compositionInfo');
    const text = document.getElementById('compositionText');
    if (!info || !text) return;
    if (comp?.length && Math.abs(comp.reduce((s, c) => s + c.fraction, 0) - 1) <= 0.01) {
        text.innerHTML = `<strong>${comp.map(c => {
            const a = allAtoms.find(a => a.id === c.atomId);
            return `${a?.atomName || a?.name || '?'} ${(c.fraction * 100).toFixed(1)}%`;
        }).join(', ')}</strong>`;
        info.style.display = 'block';
    } else {
        info.style.display = 'none';
    }
}

function formatComposition(comp) {
    if (!comp?.length) return '—';
    return comp.map(c => {
        const a = allAtoms.find(a => a.id === c.atomId);
        return `${a?.atomName || a?.name || '?'} ${(c.fraction * 100).toFixed(1)}%`;
    }).join(', ');
}

// ══════════════════════════════════════════════════════════
//  ION COMPOSITION
// ══════════════════════════════════════════════════════════
function makeIonRow(ionId = null, percent = 100) {
    const row = document.createElement('div');
    row.className = 'composition-row';
    const opts = '<option value="">Выбрать ион...</option>' +
        allIons.map(x => `<option value="${x.id}" ${x.id == ionId ? 'selected' : ''}>${x.name} (${x.charge > 0 ? '+' : ''}${x.charge})</option>`).join('');
    row.innerHTML = `
        <select class="comp-ion">${opts}</select>
        <input type="number" class="comp-fraction" step="0.1" placeholder="Доля, %" value="${percent}">
        <button type="button" onclick="removeIonRow(this)" style="background:none;border:none;color:#ff6b6b;cursor:pointer;font-size:18px;padding:8px"><i class="fas fa-trash"></i></button>`;
    return row;
}

function addIonRow(ionId = null, percent = 100) {
    const container = document.getElementById('ionCompositionList');
    if (container) container.appendChild(makeIonRow(ionId, percent));
    updateIonCompositionInfo();
}

function removeIonRow(btn) {
    const c = document.getElementById('ionCompositionList');
    if (c && c.children.length > 1) {
        btn.closest('.composition-row').remove();
        updateIonCompositionInfo();
    } else {
        showMsg('Должен быть хотя бы один ион', 'error');
    }
}

function randomizeIonComposition() {
    if (!allIons.length) return;
    const c = document.getElementById('ionCompositionList');
    if (!c) return;
    c.innerHTML = '';
    const n = Math.min(Math.floor(Math.random() * 3) + 1, allIons.length);
    const shuffled = [...allIons].sort(() => Math.random() - 0.5).slice(0, n);
    let fracs = shuffled.map(() => Math.random());
    const sum = fracs.reduce((a, b) => a + b, 0);
    shuffled.forEach((ion, i) => addIonRow(ion.id, (fracs[i] / sum * 100).toFixed(1)));
}

function collectIonComposition(showError = true) {
    const rows = document.querySelectorAll('#ionCompositionList .composition-row');
    const comp = [];
    rows.forEach(row => {
        const id = row.querySelector('.comp-ion')?.value;
        const pct = parseFloat(row.querySelector('.comp-fraction')?.value);
        if (id && id !== '' && !isNaN(pct)) {
            const ion = allIons.find(i => i.id === parseInt(id));
            if (ion) comp.push({ ion, fraction: pct / 100 });
        }
    });
    if (!comp.length) {
        if (showError) showMsg('Добавьте хотя бы один ион', 'error');
        return null;
    }
    const sum = comp.reduce((s, c) => s + c.fraction, 0);
    if (Math.abs(sum - 1) > 0.01) {
        if (showError) showMsg(`Сумма долей ионов должна быть 100% (сейчас: ${(sum * 100).toFixed(1)}%)`, 'error');
        return null;
    }
    return comp;
}

function updateIonCompositionInfo() {
    const comp = collectIonComposition(false);
    const info = document.getElementById('ionCompositionInfo');
    const text = document.getElementById('ionCompositionText');
    if (!info || !text) return;
    if (comp?.length && Math.abs(comp.reduce((s, c) => s + c.fraction, 0) - 1) <= 0.01) {
        text.innerHTML = `<strong>${comp.map(c => `${c.ion?.name || '?'} ${(c.fraction * 100).toFixed(1)}%`).join(', ')}</strong>`;
        info.style.display = 'block';
    } else {
        info.style.display = 'none';
    }
}

function formatIonComposition(comp) {
    if (!comp?.length) return '—';
    return comp.map(c => {
        const ion = c.ion || allIons.find(i => i.id === c.ionId);
        return `${ion?.name || '?'} ${(c.fraction * 100).toFixed(1)}%`;
    }).join(', ');
}

// ══════════════════════════════════════════════════════════
//  PARAMETERS
// ══════════════════════════════════════════════════════════
function rndBetween(min, max) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(4));
}

function generateRandomParameters() {
    const p = AUTOGEN_PRESETS[currentPreset];
    if (!p) return;
    const voltageEl = document.getElementById('voltage');
    const currentEl = document.getElementById('current');
    const pressureEl = document.getElementById('pressure');
    const electronTempEl = document.getElementById('electronTemp');
    const chamberWidthEl = document.getElementById('chamberWidth');
    const chamberDepthEl = document.getElementById('chamberDepth');
    const exposureTimeEl = document.getElementById('exposureTime');
    const angleEl = document.getElementById('angle');

    if (voltageEl) voltageEl.value = rndBetween(...p.voltage);
    if (currentEl) currentEl.value = rndBetween(...p.current);
    if (pressureEl) pressureEl.value = rndBetween(...p.pressure);
    if (electronTempEl) electronTempEl.value = rndBetween(...p.etemp);
    if (chamberWidthEl) chamberWidthEl.value = rndBetween(...p.width);
    if (chamberDepthEl) chamberDepthEl.value = rndBetween(...p.depth);
    if (exposureTimeEl) exposureTimeEl.value = rndBetween(...p.time);
    if (angleEl) angleEl.value = rndBetween(...p.angle);
    showMsg('Параметры сгенерированы!', 'success');
}

function randomizeParameters() {
    generateRandomParameters();
}

// ══════════════════════════════════════════════════════════
//  BUILD REQUEST
// ══════════════════════════════════════════════════════════
function buildRequest(atomComposition, ionComposition) {
    const voltageEl = document.getElementById('voltage');
    const currentEl = document.getElementById('current');
    const pressureEl = document.getElementById('pressure');
    const electronTempEl = document.getElementById('electronTemp');
    const chamberWidthEl = document.getElementById('chamberWidth');
    const chamberDepthEl = document.getElementById('chamberDepth');
    const exposureTimeEl = document.getElementById('exposureTime');
    const angleEl = document.getElementById('angle');

    return {
        atomId: atomComposition[0]?.atomId,
        ionId: ionComposition[0]?.ion?.id,
        composition: atomComposition,
        ionComposition: ionComposition,
        configId: 1,
        voltage: parseFloat(voltageEl?.value || 0),
        current: parseFloat(currentEl?.value || 0),
        pressure: parseFloat(pressureEl?.value || 0),
        electronTemp: parseFloat(electronTempEl?.value || 0),
        chamberWidth: parseFloat(chamberWidthEl?.value || 0),
        chamberDepth: parseFloat(chamberDepthEl?.value || 0),
        exposureTime: parseFloat(exposureTimeEl?.value || 0),
        angle: parseFloat(angleEl?.value || 0),
        ambientTemp: 300,
    };
}

function buildSavePayload(r, atomComposition, ionComposition) {
    const profile = r.profile || {};
    const plasma = r.plasmaConfig || {};
    const stats = r.stats || {};

    return {
        atomId: atomComposition[0]?.atomId || null,
        configId: plasma.id || 1,
        ionId: ionComposition[0]?.ion?.id || null,
        atomName: r.atom?.atomName || '',
        s: formatComposition(atomComposition),
        totalTransferredEnergy: Number(stats.totalTransferredEnergy || 0),
        avgTransferredPerAtom: Number(stats.avgTransferredPerAtom || 0),
        avgT: Number(stats.finalProbeTemperature || 0),
        minT: Number(stats.finalProbeTemperature || 0),
        maxT: Number(stats.finalProbeTemperature || 0),
        diffusionCoefficient1: Number(profile.d1 || 0),
        diffusionCoefficient2: Number(profile.d2 || 0),
        plasmaParameters: {
            electronDensity: Number(stats.electronDensity || 0),
            electronVelocity: Number(stats.electronVelocity || 0),
            currentDensity: Number(stats.currentDensity || 0),
            ionEnergy: Number(plasma.ionEnergyOverride || 0),
            voltage: Number(plasma.voltage || 0),
            pressure: Number(plasma.pressure || 0),
            electronTemp: Number(plasma.electronTemperature || 0),
            ionFlux: 0,
        },
        diffusionProfile: {
            D1: Number(profile.d1 || 0),
            D2: Number(profile.d2 || 0),
            Q1: Number(profile.q1_ev || 0),
            Q2: Number(profile.q2_ev || 0),
            D_thermal: Number(profile.d_thermal || 0),
            D_effective: Number(profile.d_effective || 0),
            depth: Number(profile.meanDepth || 0),
        },
        totalDamage: Number(stats.totalDamage || 0),
        totalMomentum: Number(stats.totalMomentum || 0),
        totalDisplacement: Number(stats.totalDisplacement || 0),
        perAtomTransferredEnergies: [],
        coolingProfile: [],
    };
}

// ══════════════════════════════════════════════════════════
//  REAL API CALLS
// ══════════════════════════════════════════════════════════
async function runSimulationAPI(req, token) {
    const response = await fetch(`${API}/run`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(req)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const result = await response.json();
    return result.data;
}

async function saveSimulationAPI(result, atomComp, ionComp, token) {
    const payload = buildSavePayload(result, atomComp, ionComp);
    const response = await fetch(`${API}/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return true;
}

// ══════════════════════════════════════════════════════════
//  SINGLE SIMULATION (РЕАЛЬНЫЙ)
// ══════════════════════════════════════════════════════════
async function runSingleSim() {
    if (window.PlasmaAuth && !window.PlasmaAuth.isAuthenticated?.()) {
        window.PlasmaAuth.showMessage?.('Требуется авторизация', 'error');
        return;
    }

    const atomComposition = collectComposition();
    const ionComposition = collectIonComposition();
    if (!atomComposition || !ionComposition) return;

    const req = buildRequest(atomComposition, ionComposition);
    simReq = req;
    showRunning();

    try {
        const token = window.PlasmaAuth?.getToken();
        const result = await runSimulationAPI(req, token);
        curRes = result;
        showResults(curRes);
        showMsg('Симуляция выполнена успешно!', 'success');
    } catch (e) {
        showIdle();
        showMsg('Ошибка: ' + e.message, 'error');
        console.error('Simulation error:', e);
    }
}

// ══════════════════════════════════════════════════════════
//  BATCH GENERATION (РЕАЛЬНЫЙ)
// ══════════════════════════════════════════════════════════
async function generateAndSave() {
    if (isGenerationActive) {
        shouldStopGeneration = true;
        showMsg('Остановка генерации...', 'warning');
        const stopBtn = document.getElementById('stopGenBtn');
        if (stopBtn) {
            stopBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Остановка...';
            stopBtn.disabled = true;
        }
        return;
    }

    if (window.PlasmaAuth && !window.PlasmaAuth.isAuthenticated?.()) {
        window.PlasmaAuth.showMessage?.('Требуется авторизация', 'error');
        return;
    }

    const genCountInput = document.getElementById('genCountInput');
    const genCountSpan = document.getElementById('genCount');
    let numSim = Math.min(100, Math.max(1, parseInt(genCountInput?.value || genCountSpan?.textContent || 1)));

    isGenerationActive = true;
    shouldStopGeneration = false;

    const runBtn = document.getElementById('autoRunBtn');
    const stopBtn = document.getElementById('stopGenBtn');
    const progressContainer = document.getElementById('genProgressContainer');

    if (runBtn) {
        runBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Генерация...';
        runBtn.disabled = true;
    }
    if (stopBtn) {
        stopBtn.style.display = 'inline-flex';
        stopBtn.disabled = false;
        stopBtn.innerHTML = '<i class="fas fa-stop"></i> Остановить';
    }
    if (progressContainer) progressContainer.style.display = 'block';

    showMsg(`Запуск ${numSim} симуляций...`, 'success');

    let ok = 0, fail = 0;
    const token = window.PlasmaAuth?.getToken();

    for (let i = 1; i <= numSim; i++) {
        if (shouldStopGeneration) {
            showMsg(`Остановлено. Сохранено: ${ok}, Ошибок: ${fail}`, 'warning');
            break;
        }

        try {
            // Генерируем случайные параметры
            generateRandomParameters();
            if (Math.random() > 0.7) randomizeComposition();
            if (Math.random() > 0.7) randomizeIonComposition();

            const atomComp = collectComposition(false) || [];
            const ionComp = collectIonComposition(false) || [];

            if (!atomComp.length || !ionComp.length) {
                fail++;
                updateGenProgress(i, numSim, ok, fail);
                continue;
            }

            // 1. Запускаем симуляцию
            const req = buildRequest(atomComp, ionComp);
            const simulationResult = await runSimulationAPI(req, token);

            if (!simulationResult) {
                fail++;
                updateGenProgress(i, numSim, ok, fail);
                continue;
            }

            // 2. Сохраняем результат
            await saveSimulationAPI(simulationResult, atomComp, ionComp, token);
            ok++;

        } catch (e) {
            console.error('Generation error:', e);
            fail++;
        }

        updateGenProgress(i, numSim, ok, fail);
    }

    isGenerationActive = false;

    if (runBtn) {
        runBtn.innerHTML = '<i class="fas fa-save"></i> Сгенерировать и сохранить';
        runBtn.disabled = false;
    }
    if (stopBtn) {
        stopBtn.style.display = 'none';
        stopBtn.disabled = false;
        stopBtn.innerHTML = '<i class="fas fa-stop"></i> Остановить';
    }

    setTimeout(() => {
        if (progressContainer) progressContainer.style.display = 'none';
    }, 3000);

    showMsg(fail === 0 ? `✅ Сохранено: ${ok}` : `⚠️ Сохранено: ${ok}, Ошибок: ${fail}`, fail === 0 ? 'success' : 'warning');
}

function updateGenProgress(current, total, success, fail) {
    const pct = Math.floor(current / total * 100);
    const bar = document.getElementById('genProgressBar');
    const text = document.getElementById('genProgressText');
    if (bar) bar.style.width = `${pct}%`;
    if (text) text.innerHTML = `${current}/${total} | ✅ ${success} | ❌ ${fail} | ${pct}%`;
}

// ══════════════════════════════════════════════════════════
//  SHOW RESULTS
// ══════════════════════════════════════════════════════════
function showResults(r) {
    const resRunning = document.getElementById('resRunning');
    const resDisplay = document.getElementById('resDisplay');
    if (resRunning) resRunning.style.display = 'none';
    if (resDisplay) resDisplay.style.display = 'block';

    const fmt = n => {
        if (n === undefined || n === null) return '—';
        const v = +n;
        if (isNaN(v)) return '—';
        return (Math.abs(v) < 1e-3 || Math.abs(v) > 1e3) ? v.toExponential(3) : v.toPrecision(4);
    };

    const profile = r.profile || {};
    const plasma = r.plasmaConfig || {};
    const stats = r.stats || {};

    // ===== 1. Входные данные (из simReq) =====
    if (simReq) {
        set('r_composition', formatComposition(simReq.composition));
        set('r_ion_composition', formatIonComposition(simReq.ionComposition));
        set('r_voltage', fmt(simReq.voltage));
        set('r_current', fmt(simReq.current));
        set('r_pressure', fmt(simReq.pressure));
        set('r_electron_temp', fmt(simReq.electronTemp));
        set('r_chamber_width', fmt(simReq.chamberWidth));
        set('r_chamber_depth', fmt(simReq.chamberDepth));
        set('r_exposure_time', fmt(simReq.exposureTime));
        set('r_angle', fmt(simReq.angle));
    }

    // ===== 2. DiffusionProfile =====
    set('r_d1', fmt(profile.d1));
    set('r_d2', fmt(profile.d2));
    set('r_q1', fmt(profile.q1_ev));
    set('r_q2', fmt(profile.q2_ev));
    set('r_d_thermal', fmt(profile.d_thermal));
    set('r_d_effective', fmt(profile.d_effective));
    set('r_mean_depth', fmt(profile.meanDepth));

    // ===== 3. PlasmaConfiguration =====
    set('pc_voltage', fmt(plasma.voltage));
    set('pc_current', fmt(plasma.current));
    set('pc_pressure', fmt(plasma.pressure));
    set('pc_electron_temp', fmt(plasma.electronTemperature));
    set('pc_exposure_time', fmt(plasma.exposureTime));
    set('pc_chamber_width', fmt(plasma.chamberWidth));
    set('pc_chamber_depth', fmt(plasma.chamberDepth));
    set('pc_ion_energy', fmt(plasma.ionEnergyOverride));
    set('pc_ion_angle', fmt(plasma.ionIncidenceAngle));
    set('pc_target_temp', fmt(plasma.targetTemperature));
    set('pc_thermal_cond', fmt(plasma.thermalConductivity));
    set('pc_heat_cap', fmt(plasma.heatCapacity));
    set('pc_density', fmt(plasma.density));

    // ===== 4. PhysicsStats =====
    set('ps_electron_density', fmt(stats.electronDensity));
    set('ps_electron_velocity', fmt(stats.electronVelocity));
    set('ps_current_density', fmt(stats.currentDensity));
    set('ps_binding_energy', fmt(stats.surfaceBindingEnergy));
    set('ps_total_energy', fmt(stats.totalTransferredEnergy));
    set('ps_avg_energy', fmt(stats.avgTransferredPerAtom));
    set('ps_total_damage', fmt(stats.totalDamage));
    set('ps_total_momentum', fmt(stats.totalMomentum));
    set('ps_total_displacement', fmt(stats.totalDisplacement));
    set('ps_probe_temp', fmt(stats.finalProbeTemperature));
    set('ps_debye_speed', fmt(stats.debyeFrontSpeed));
    set('ps_debye_depth', fmt(stats.debyeFrontDepth));

    // Сохраняем 3D данные для отдельной вкладки
    if (stats.thermalTimes && stats.thermalDepths && stats.thermalTemperatureMap) {
        physics3DHistory.push({
            times: [...stats.thermalTimes],
            depths: [...stats.thermalDepths],
            grid: stats.thermalTemperatureMap.map(row => [...row]),
            timestamp: Date.now()
        });
        if (physics3DHistory.length > 10) physics3DHistory.shift();
    }
}

// ══════════════════════════════════════════════════════════
//  3D SURFACE PLOT
// ══════════════════════════════════════════════════════════
function renderPhysicsStats3D() {
    const el = document.getElementById('physics3dChart');
    if (!el) return;

    if (!physics3DHistory.length) {
        el.innerHTML = '<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#64748b;">Выполните симуляцию для 3D графика</div>';
        return;
    }

    const data = physics3DHistory[physics3DHistory.length - 1];
    const depthsNm = data.depths.map(d => d * 1e9);

    Plotly.react(el, [{
        type: 'surface',
        x: depthsNm,
        y: data.times,
        z: data.grid,
        colorscale: [
            [0, 'rgb(0,0,139)'],
            [0.25, 'rgb(0,191,255)'],
            [0.5, 'rgb(0,255,127)'],
            [0.75, 'rgb(255,255,0)'],
            [1, 'rgb(255,69,0)']
        ],
        showscale: true,
        colorbar: { title: { text: 'T (K)', font: { color: '#94a3b8' } } },
        hovertemplate: 'Глубина: %{x:.1f} нм<br>Время: %{y:.3f} с<br>T: %{z:.1f} K<extra></extra>',
        contours: { z: { show: true, usecolormap: true, project: { z: true } } }
    }], {
        title: { text: '3D температурный профиль', font: { size: 14, color: '#e2e8f0' } },
        scene: {
            xaxis: { title: { text: 'Глубина (нм)', font: { color: '#94a3b8' } }, color: '#475569', gridcolor: '#1e2d40' },
            yaxis: { title: { text: 'Время (с)', font: { color: '#94a3b8' } }, color: '#475569', gridcolor: '#1e2d40' },
            zaxis: { title: { text: 'Температура (K)', font: { color: '#94a3b8' } }, color: '#475569', gridcolor: '#1e2d40' },
            camera: { eye: { x: 1.5, y: 1.5, z: 1.3 } }
        },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)'
    }, { responsive: true, displayModeBar: true });
}

function clearPhysics3DHistory() {
    physics3DHistory = [];
    const el = document.getElementById('physics3dChart');
    if (el) {
        el.innerHTML = '<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#64748b;">График очищен</div>';
    }
    showMsg('3D история очищена', 'success');
}

// ══════════════════════════════════════════════════════════
//  SAVE SINGLE RESULT
// ══════════════════════════════════════════════════════════
async function saveRes() {
    if (!curRes || !simReq) {
        showMsg('Нет результатов для сохранения', 'error');
        return;
    }

    try {
        const token = window.PlasmaAuth?.getToken();
        await saveSimulationAPI(curRes, simReq.composition, simReq.ionComposition, token);
        showMsg('Результаты сохранены!', 'success');
        if (window.PlasmaAuth?.showMessage) {
            window.PlasmaAuth.showMessage('Результаты сохранены!', 'success');
        }
    } catch (e) {
        showMsg('Ошибка сохранения: ' + e.message, 'error');
        console.error('Save error:', e);
    }
}

// ══════════════════════════════════════════════════════════
//  UI HELPERS
// ══════════════════════════════════════════════════════════
function showRunning() {
    const idle = document.getElementById('resIdle');
    const running = document.getElementById('resRunning');
    const display = document.getElementById('resDisplay');
    if (idle) idle.style.display = 'none';
    if (running) running.style.display = 'block';
    if (display) display.style.display = 'none';

    let p = 0;
    const bar = document.getElementById('progressBar');
    if (bar) {
        const t = setInterval(() => {
            p += 8;
            bar.style.width = p + '%';
            if (p >= 96) clearInterval(t);
        }, 180);
    }
}

function showIdle() {
    const idle = document.getElementById('resIdle');
    const running = document.getElementById('resRunning');
    const display = document.getElementById('resDisplay');
    if (idle) idle.style.display = 'block';
    if (running) running.style.display = 'none';
    if (display) display.style.display = 'none';
}

function set(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function resetForm() {
    const compositionList = document.getElementById('compositionList');
    const ionCompositionList = document.getElementById('ionCompositionList');

    if (compositionList) {
        compositionList.innerHTML = '';
        addRow();
    }
    if (ionCompositionList) {
        ionCompositionList.innerHTML = '';
        addIonRow();
    }

    const defaults = {
        voltage: '500', current: '0.5', pressure: '10', electronTemp: '11600',
        chamberWidth: '0.1', chamberDepth: '0.1', exposureTime: '1.0', angle: '0'
    };

    Object.entries(defaults).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
    });

    curRes = null;
    simReq = null;
    showIdle();
    updateCompositionInfo();
    updateIonCompositionInfo();
    physics3DHistory = [];

    const physChart = document.getElementById('physics3dChart');
    if (physChart) physChart.innerHTML = '';
}

function showMsg(msg, type) {
    const m = document.getElementById('formMsg');
    if (m) {
        m.textContent = msg;
        m.style.color = type === 'error' ? '#ff6b6b' : type === 'warning' ? '#f59e0b' : '#2dd4bf';
        m.style.display = 'block';
        setTimeout(() => {
            m.style.display = 'none';
        }, 5000);
    } else {
        alert(msg);
    }
}

function toggleAutogen() {
    const header = document.querySelector('.autogen-header');
    const body = document.getElementById('autogenBody');
    if (header) header.classList.toggle('open');
    if (body) body.classList.toggle('open');
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
    const span = document.getElementById('genCount');
    const input = document.getElementById('genCountInput');
    if (span) {
        let v = Math.min(100, Math.max(1, parseInt(span.textContent) + delta));
        span.textContent = v;
        if (input) input.value = v;
    }
}

function updateGenCountFromInput() {
    const input = document.getElementById('genCountInput');
    const span = document.getElementById('genCount');
    if (input && span) {
        let v = Math.min(100, Math.max(1, parseInt(input.value) || 1));
        span.textContent = v;
        input.value = v;
    }
}

function newSim() {
    resetForm();
    showIdle();
}

function showAuthModal() {
    window.PlasmaAuth?.showModal?.() || alert('Авторизация недоступна');
}

function hideAuthModal() {
    window.PlasmaAuth?.hideModal?.();
}

function logout() {
    window.PlasmaAuth?.logout?.();
    checkAuth();
}

// ── Globals ────────────────────────────────────────────────
Object.assign(window, {
    addRow, removeRow, randomizeComposition,
    addIonRow, removeIonRow, randomizeIonComposition,
    randomizeParameters, generateAndSave, runSingleSim,
    saveRes, resetForm, toggleAutogen, selectPreset, changeCount, updateGenCountFromInput,
    renderPhysicsStats3D, clearPhysics3DHistory,
    newSim, showAuthModal, hideAuthModal, logout
});