// Professional Simulation Module
const API = '/api/simulation';
let curRes = null;
let simReq = null;
let allAtoms = [];
let allIons = [];
let currentPreset = 'magnetron';

// Preset ranges
const AUTOGEN_PRESETS = {
    magnetron: { voltage:[200,800], current:[0.2,3.0], pressure:[0.1,5], etemp:[11600,34800], width:[0.1,0.4], depth:[0.1,0.4], time:[5,120], angle:[0,20] },
    etching: { voltage:[100,400], current:[0.05,1.0], pressure:[1,50], etemp:[23200,69600], width:[0.1,0.3], depth:[0.1,0.3], time:[10,300], angle:[0,45] },
    implant: { voltage:[500,2000], current:[0.001,0.1], pressure:[0.001,1], etemp:[58000,116000], width:[0.05,0.2], depth:[0.05,0.2], time:[0.1,5], angle:[0,30] },
    cvd: { voltage:[50,300], current:[0.5,5.0], pressure:[10,200], etemp:[5800,23200], width:[0.15,0.5], depth:[0.15,0.5], time:[30,600], angle:[0,10] },
    custom: { voltage:[100,2000], current:[0.01,5.0], pressure:[0.01,200], etemp:[5800,116000], width:[0.05,0.5], depth:[0.05,0.5], time:[0.5,120], angle:[0,60] }
};

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadData();
    setupHandlers();
    addMissingElements();
    initCompositionRows();
    setupPresetListeners();
});

function initCompositionRows() {
    const atomContainer = document.getElementById('compositionList');
    const ionContainer = document.getElementById('ionCompositionList');
    if (atomContainer && atomContainer.children.length === 0) addRow();
    if (ionContainer && ionContainer.children.length === 0) addIonRow();
}

function setupPresetListeners() {
    const customInputs = ['customVoltage', 'customCurrent', 'customPressure', 'customETemp', 'customWidth', 'customDepth', 'customTime', 'customAngle'];
    customInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('change', () => updateCustomPreset());
        }
    });
}

function updateCustomPreset() {
    if (currentPreset !== 'custom') return;

    const parseRange = (str) => {
        const parts = str.split('-').map(Number);
        return parts.length === 2 ? [parts[0], parts[1]] : [0, 100];
    };

    AUTOGEN_PRESETS.custom = {
        voltage: parseRange(document.getElementById('customVoltage')?.value || '100-2000'),
        current: parseRange(document.getElementById('customCurrent')?.value || '0.01-5.0'),
        pressure: parseRange(document.getElementById('customPressure')?.value || '0.01-200'),
        etemp: parseRange(document.getElementById('customETemp')?.value || '5800-116000'),
        width: parseRange(document.getElementById('customWidth')?.value || '0.05-0.5'),
        depth: parseRange(document.getElementById('customDepth')?.value || '0.05-0.5'),
        time: parseRange(document.getElementById('customTime')?.value || '0.5-120'),
        angle: parseRange(document.getElementById('customAngle')?.value || '0-60')
    };
}

function addMissingElements() {
    if (!document.getElementById('resIdle')) {
        const resDisplay = document.getElementById('resDisplay');
        if (resDisplay) {
            const idleDiv = document.createElement('div');
            idleDiv.id = 'resIdle';
            idleDiv.className = 'res-state';
            idleDiv.style.display = 'block';
            idleDiv.innerHTML = `
                <i class="fas fa-play-circle"></i>
                <h4>Готов к запуску</h4>
                <p>Задайте состав мишени и ионов, затем нажмите "Запустить"</p>
            `;
            resDisplay.parentNode.insertBefore(idleDiv, resDisplay);
        }
    }

    if (!document.getElementById('resRunning')) {
        const resDisplay = document.getElementById('resDisplay');
        if (resDisplay) {
            const runningDiv = document.createElement('div');
            runningDiv.id = 'resRunning';
            runningDiv.className = 'res-state';
            runningDiv.style.display = 'none';
            runningDiv.innerHTML = `
                <div class="spinner-lg"></div>
                <h4>Выполняется симуляция</h4>
                <p>Пожалуйста, подождите...</p>
                <div class="progress-bar">
                    <div id="progressBar" class="progress-fill" style="width: 0%;"></div>
                </div>
            `;
            resDisplay.parentNode.insertBefore(runningDiv, resDisplay);
        }
    }
}

function checkAuth() {
    const isAuth = window.PlasmaAuth && typeof window.PlasmaAuth.isAuthenticated === 'function'
        ? window.PlasmaAuth.isAuthenticated()
        : false;

    const authGate = document.getElementById('authGate');
    const simWorkspace = document.getElementById('simWorkspace');

    if (authGate) authGate.style.display = isAuth ? 'none' : 'flex';
    if (simWorkspace) simWorkspace.style.display = isAuth ? 'block' : 'none';
}

async function loadData() {
    try {
        const [atomsRes, ionsRes] = await Promise.all([
            fetch('/atoms'),
            fetch('/ions')
        ]);

        if (!atomsRes.ok) throw new Error('Failed to load atoms');
        if (!ionsRes.ok) throw new Error('Failed to load ions');

        const atoms = await atomsRes.json();
        const ions = await ionsRes.json();

        allAtoms = atoms.data || [];
        allIons = ions.data || [];

        updateAllCompositionSelects();
        updateCompositionInfo();
        updateIonCompositionInfo();

    } catch (e) {
        console.error('Error loading data:', e);
        showMsg('Ошибка загрузки данных', 'error');
    }
}

function updateAllCompositionSelects() {
    const atomOptions = '<option value="">Выбрать атом...</option>' +
        allAtoms.map(x => `<option value="${x.id}">${x.atomName || x.name} - ${x.fullName || ''}</option>`).join('');

    const ionOptions = '<option value="">Выбрать ион...</option>' +
        allIons.map(x => `<option value="${x.id}">${x.name} (${x.charge > 0 ? '+' : ''}${x.charge})</option>`).join('');

    document.querySelectorAll('.comp-atom').forEach(sel => {
        sel.innerHTML = atomOptions;
    });

    document.querySelectorAll('.comp-ion').forEach(sel => {
        sel.innerHTML = ionOptions;
    });
}

function setupHandlers() {
    const simForm = document.getElementById('simForm');
    if (simForm) {
        simForm.removeEventListener('submit', runSimHandler);
        simForm.addEventListener('submit', runSimHandler);
    }

    document.querySelectorAll('.res-tab').forEach(t => {
        t.removeEventListener('click', tabHandler);
        t.addEventListener('click', tabHandler);
    });

    document.getElementById('compositionList')?.addEventListener('change', () => updateCompositionInfo());
    document.getElementById('ionCompositionList')?.addEventListener('change', () => updateIonCompositionInfo());
}

function runSimHandler(e) {
    e.preventDefault();
    runSim();
}

function tabHandler(e) {
    const tab = e.currentTarget;
    document.querySelectorAll('.res-tab').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.res-panel').forEach(x => x.classList.remove('active'));
    tab.classList.add('active');
    const panel = document.querySelector(`.res-panel[data-tab="${tab.dataset.tab}"]`);
    if (panel) panel.classList.add('active');
}

// ============================================
// ATOM COMPOSITION MANAGEMENT (МИШЕНЬ)
// ============================================

function addRow() {
    const container = document.getElementById('compositionList');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'composition-row';

    const options = '<option value="">Выбрать атом...</option>' +
        allAtoms.map(x => `<option value="${x.id}">${x.atomName || x.name} - ${x.fullName || ''}</option>`).join('');

    row.innerHTML = `
        <select class="comp-atom" style="flex: 2; padding: 8px; border-radius: 6px; background: rgba(13,17,23,0.8); border: 1px solid rgba(94,234,212,0.3); color: #e2e8f0;">
            ${options}
        </select>
        <input type="number" class="comp-fraction" step="0.1" placeholder="Доля, %" value="100" style="flex: 1; padding: 8px; border-radius: 6px; background: rgba(13,17,23,0.8); border: 1px solid rgba(94,234,212,0.3); color: #e2e8f0;">
        <button type="button" class="remove-row-btn" onclick="removeRow(this)" style="background: none; border: none; color: #ff6b6b; cursor: pointer; font-size: 18px; padding: 8px;">
            <i class="fas fa-trash"></i>
        </button>
    `;

    container.appendChild(row);
    updateCompositionInfo();
}

function removeRow(button) {
    const row = button.closest('.composition-row');
    const container = document.getElementById('compositionList');

    if (row && container) {
        if (container.children.length > 1) {
            row.remove();
            updateCompositionInfo();
        } else {
            showMsg('Должен быть хотя бы один компонент мишени', 'error');
        }
    }
}

function randomizeComposition() {
    if (!allAtoms.length) return;

    const container = document.getElementById('compositionList');
    if (!container) return;

    container.innerHTML = '';

    const numComponents = Math.min(Math.floor(Math.random() * 3) + 1, allAtoms.length);
    const shuffled = [...allAtoms];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const selected = shuffled.slice(0, numComponents);
    let fractions = selected.map(() => Math.random());
    const sum = fractions.reduce((a, b) => a + b, 0);
    fractions = fractions.map(f => f / sum);

    selected.forEach((atom, idx) => {
        const percent = (fractions[idx] * 100).toFixed(1);
        addRowWithValues(atom.id, percent);
    });

    updateCompositionInfo();
}

function addRowWithValues(atomId, percent) {
    const container = document.getElementById('compositionList');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'composition-row';

    const options = '<option value="">Выбрать атом...</option>' +
        allAtoms.map(x => `<option value="${x.id}" ${x.id === atomId ? 'selected' : ''}>${x.atomName || x.name} - ${x.fullName || ''}</option>`).join('');

    row.innerHTML = `
        <select class="comp-atom" style="flex: 2; padding: 8px; border-radius: 6px; background: rgba(13,17,23,0.8); border: 1px solid rgba(94,234,212,0.3); color: #e2e8f0;">
            ${options}
        </select>
        <input type="number" class="comp-fraction" step="0.1" placeholder="Доля, %" value="${percent}" style="flex: 1; padding: 8px; border-radius: 6px; background: rgba(13,17,23,0.8); border: 1px solid rgba(94,234,212,0.3); color: #e2e8f0;">
        <button type="button" class="remove-row-btn" onclick="removeRow(this)" style="background: none; border: none; color: #ff6b6b; cursor: pointer; font-size: 18px; padding: 8px;">
            <i class="fas fa-trash"></i>
        </button>
    `;

    container.appendChild(row);
}

function collectComposition(showError = true) {
    const rows = document.querySelectorAll('#compositionList .composition-row');
    const composition = [];

    rows.forEach(row => {
        const atomId = row.querySelector('.comp-atom')?.value;
        const fractionPercent = row.querySelector('.comp-fraction')?.value;

        if (atomId && fractionPercent && atomId !== '') {
            const fraction = parseFloat(fractionPercent) / 100;
            composition.push({
                atomId: parseInt(atomId, 10),
                fraction: fraction
            });
        }
    });

    if (!composition.length) {
        if (showError) showMsg('Добавьте хотя бы один компонент мишени', 'error');
        return null;
    }

    const sum = composition.reduce((s, c) => s + c.fraction, 0);

    if (Math.abs(sum - 1) > 0.01) {
        if (showError) {
            const sumPercent = (sum * 100).toFixed(1);
            showMsg(`Сумма долей мишени должна быть = 100% (сейчас: ${sumPercent}%)`, 'error');
        }
        return null;
    }

    return composition;
}

function updateCompositionInfo() {
    const composition = collectComposition(false);
    const infoDiv = document.getElementById('compositionInfo');
    const textSpan = document.getElementById('compositionText');

    if (composition && composition.length > 0) {
        const sum = composition.reduce((s, c) => s + c.fraction, 0);
        if (Math.abs(sum - 1) <= 0.01) {
            const compositionText = composition.map(c => {
                const atom = allAtoms.find(a => a.id === c.atomId);
                const percent = (c.fraction * 100).toFixed(1);
                return `${atom?.atomName || atom?.name || '?'} ${percent}%`;
            }).join(', ');
            textSpan.innerHTML = `<strong>${compositionText}</strong> (сумма: ${(sum * 100).toFixed(1)}%)`;
            infoDiv.style.display = 'block';
            return;
        }
    }
    infoDiv.style.display = 'none';
}

function formatComposition(comp) {
    if (!comp || !comp.length) return '—';
    return comp.map(c => {
        const atom = allAtoms.find(a => a.id === c.atomId);
        const percent = (c.fraction * 100).toFixed(1);
        return `${atom?.atomName || atom?.name || '?'} ${percent}%`;
    }).join(', ');
}

// ============================================
// ION COMPOSITION MANAGEMENT (БОМБАРДИРОВКА)
// ============================================

function addIonRow(ionId = null, percent = 100) {
    const container = document.getElementById('ionCompositionList');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'composition-row';

    const options = '<option value="">Выбрать ион...</option>' +
        allIons.map(x => `<option value="${x.id}" ${x.id === ionId ? 'selected' : ''}>${x.name} (${x.charge > 0 ? '+' : ''}${x.charge})</option>`).join('');

    row.innerHTML = `
        <select class="comp-ion" style="flex: 2; padding: 8px; border-radius: 6px; background: rgba(13,17,23,0.8); border: 1px solid rgba(94,234,212,0.3); color: #e2e8f0;">
            ${options}
        </select>
        <input type="number" class="comp-fraction" step="0.1" placeholder="Доля, %" value="${percent}" style="flex: 1; padding: 8px; border-radius: 6px; background: rgba(13,17,23,0.8); border: 1px solid rgba(94,234,212,0.3); color: #e2e8f0;">
        <button type="button" class="remove-row-btn" onclick="removeIonRow(this)" style="background: none; border: none; color: #ff6b6b; cursor: pointer; font-size: 18px; padding: 8px;">
            <i class="fas fa-trash"></i>
        </button>
    `;

    container.appendChild(row);
    updateIonCompositionInfo();
}

function removeIonRow(button) {
    const row = button.closest('.composition-row');
    const container = document.getElementById('ionCompositionList');

    if (row && container && container.children.length > 1) {
        row.remove();
        updateIonCompositionInfo();
    } else {
        showMsg('Должен быть хотя бы один ион', 'error');
    }
}

function randomizeIonComposition() {
    if (!allIons.length) return;

    const container = document.getElementById('ionCompositionList');
    if (!container) return;

    container.innerHTML = '';

    const numComponents = Math.min(Math.floor(Math.random() * 3) + 1, allIons.length);
    const shuffled = [...allIons].sort(() => Math.random() - 0.5);
    let fractions = Array(numComponents).fill().map(() => Math.random());
    const sum = fractions.reduce((a, b) => a + b, 0);
    fractions = fractions.map(f => f / sum);

    shuffled.slice(0, numComponents).forEach((ion, idx) => {
        addIonRow(ion.id, (fractions[idx] * 100).toFixed(1));
    });

    updateIonCompositionInfo();
}

function collectIonComposition(showError = true) {
    const rows = document.querySelectorAll('#ionCompositionList .composition-row');
    const composition = [];

    rows.forEach(row => {
        const ionId = row.querySelector('.comp-ion')?.value;
        const percent = row.querySelector('.comp-fraction')?.value;

        if (ionId && percent && ionId !== '') {
            composition.push({ ionId: parseInt(ionId), fraction: parseFloat(percent) / 100 });
        }
    });

    if (!composition.length && showError) showMsg('Добавьте хотя бы один ион', 'error');

    const sum = composition.reduce((s, c) => s + c.fraction, 0);
    if (Math.abs(sum - 1) > 0.01 && showError) {
        showMsg(`Сумма долей ионов должна быть 100% (сейчас: ${(sum*100).toFixed(1)}%)`, 'error');
    }

    return Math.abs(sum - 1) <= 0.01 ? composition : null;
}

function updateIonCompositionInfo() {
    const comp = collectIonComposition(false);
    const infoDiv = document.getElementById('ionCompositionInfo');
    const textSpan = document.getElementById('ionCompositionText');

    if (comp && comp.length) {
        const sum = comp.reduce((s, c) => s + c.fraction, 0);
        if (Math.abs(sum - 1) <= 0.01) {
            const text = comp.map(c => {
                const ion = allIons.find(i => i.id === c.ionId);
                return `${ion?.name || '?'} ${(c.fraction * 100).toFixed(1)}%`;
            }).join(', ');
            textSpan.innerHTML = `<strong>${text}</strong> (сумма: ${(sum*100).toFixed(1)}%)`;
            infoDiv.style.display = 'block';
            return;
        }
    }
    infoDiv.style.display = 'none';
}

function formatIonComposition(comp) {
    if (!comp || !comp.length) return '—';
    return comp.map(c => {
        const ion = allIons.find(i => i.id === c.ionId);
        return `${ion?.name || '?'} ${(c.fraction * 100).toFixed(1)}%`;
    }).join(', ');
}

// ============================================
// PARAMETER GENERATION
// ============================================

function rndBetween(min, max) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(4));
}

function generateRandomParameters() {
    const preset = AUTOGEN_PRESETS[currentPreset];
    if (!preset) return;

    document.getElementById('voltage').value = rndBetween(...preset.voltage);
    document.getElementById('current').value = rndBetween(...preset.current);
    document.getElementById('pressure').value = rndBetween(...preset.pressure);
    document.getElementById('electronTemp').value = rndBetween(...preset.etemp);
    document.getElementById('chamberWidth').value = rndBetween(...preset.width);
    document.getElementById('chamberDepth').value = rndBetween(...preset.depth);
    document.getElementById('exposureTime').value = rndBetween(...preset.time);
    document.getElementById('angle').value = rndBetween(...preset.angle);

    showMsg('Параметры сгенерированы!', 'success');
}

function randomizeParameters() {
    generateRandomParameters();
}

function generateAndRun() {
    if (document.querySelectorAll('#compositionList .composition-row').length === 0 || !collectComposition(false)) {
        randomizeComposition();
    }
    if (document.querySelectorAll('#ionCompositionList .composition-row').length === 0 || !collectIonComposition(false)) {
        randomizeIonComposition();
    }
    generateRandomParameters();
    document.getElementById('runBtn').click();
}

// ============================================
// SIMULATION
// ============================================

async function runSim() {
    if (window.PlasmaAuth && typeof window.PlasmaAuth.isAuthenticated === 'function' && !window.PlasmaAuth.isAuthenticated()) {
        window.PlasmaAuth.showMessage?.('Требуется авторизация', 'error');
        return;
    }

    const atomComposition = collectComposition();
    const ionComposition = collectIonComposition();

    if (!atomComposition || !ionComposition) return;

    // 🔥 ПРАВИЛЬНАЯ СТРУКТУРА для бэкенда
    const req = {
        // Для совместимости со старым кодом (fallback)
        atomId: atomComposition[0]?.atomId,  // первый атом как fallback
        ionId: ionComposition[0]?.ionId,      // первый ион как fallback

        // 🔥 ОСНОВНЫЕ ПОЛЯ - сплавы
        composition: atomComposition,  // сплав мишени
        ionComposition: ionComposition, // сплав ионов

        configId: 1,
        voltage: parseFloat(document.getElementById('voltage').value),
        current: parseFloat(document.getElementById('current').value),
        pressure: parseFloat(document.getElementById('pressure').value),
        electronTemp: parseFloat(document.getElementById('electronTemp').value),
        chamberWidth: parseFloat(document.getElementById('chamberWidth').value),
        chamberDepth: parseFloat(document.getElementById('chamberDepth').value),
        exposureTime: parseFloat(document.getElementById('exposureTime').value),
        angle: parseFloat(document.getElementById('angle').value),
        ambientTemp: 300.0
    };

    console.log('📤 Отправляем запрос:', JSON.stringify(req, null, 2));
    simReq = req;
    showRunning();

    try {
        const token = window.PlasmaAuth?.getToken();

        const response = await fetch(`${API}/run`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify(req)
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
            throw new Error(error.message || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        curRes = result.data;

        console.log('=== SIMULATION RESULT ===', curRes);
        showResults(curRes);

    } catch (e) {
        console.error('Simulation error:', e);
        showIdle();
        window.PlasmaAuth?.showMessage?.('Ошибка: ' + e.message, 'error');
    }
}

function showRunning() {
    const resIdle = document.getElementById('resIdle');
    const resRunning = document.getElementById('resRunning');
    const resDisplay = document.getElementById('resDisplay');

    if (resIdle) resIdle.style.display = 'none';
    if (resRunning) resRunning.style.display = 'block';
    if (resDisplay) resDisplay.style.display = 'none';

    animProgress();
}

function showIdle() {
    const resIdle = document.getElementById('resIdle');
    const resRunning = document.getElementById('resRunning');
    const resDisplay = document.getElementById('resDisplay');

    if (resIdle) resIdle.style.display = 'block';
    if (resRunning) resRunning.style.display = 'none';
    if (resDisplay) resDisplay.style.display = 'none';
}

function animProgress() {
    let p = 0;
    const interval = setInterval(() => {
        p += 10;
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.style.width = p + '%';
        }
        if (p >= 100) {
            clearInterval(interval);
        }
    }, 200);
}

function showResults(r) {
    document.getElementById('resRunning').style.display = 'none';
    document.getElementById('resDisplay').style.display = 'block';

    const fmt = (n) => {
        if (n === undefined || n === null) return '—';
        const num = typeof n === 'number' ? n : parseFloat(n);
        if (isNaN(num)) return '—';
        if (Math.abs(num) < 1e-3 || Math.abs(num) > 1e3) return num.toExponential(3);
        return num.toPrecision(4);
    };

    // MATERIAL TAB
    setTextContent('r_composition', formatComposition(simReq?.composition));
    setTextContent('r_ion_composition', formatIonComposition(simReq?.ionComposition));

    // PLASMA TAB
    const pc = r.plasmaConfig || r.plasmaParameters || {};
    setTextContent('r_voltage', fmt(pc.voltage ?? simReq?.voltage));
    setTextContent('r_current', fmt(pc.current ?? simReq?.current));
    setTextContent('r_pressure', fmt(pc.pressure ?? simReq?.pressure));
    setTextContent('r_electron_temperature', fmt(pc.electronTemperature ?? simReq?.electronTemp));
    setTextContent('r_exposure_time', fmt(pc.exposureTime ?? simReq?.exposureTime));
    setTextContent('r_electron_density', fmt(r.electronDensity ?? pc.electronDensity ?? 0));
    setTextContent('r_electron_velocity', fmt(r.electronVelocity ?? pc.electronVelocity ?? 0));
    setTextContent('r_current_density', fmt(r.currentDensity ?? pc.currentDensity ?? 0));

    // CHAMBER TAB
    setTextContent('r_chamber_width', fmt(pc.chamberWidth ?? simReq?.chamberWidth));
    setTextContent('r_chamber_depth', fmt(pc.chamberDepth ?? simReq?.chamberDepth));

    // ION IMPACT TAB
    setTextContent('r_ion_energy', fmt(pc.ionEnergyOverride ?? 0));
    setTextContent('r_ion_incidence_angle', fmt(pc.ionIncidenceAngle ?? simReq?.angle));
    setTextContent('r_target_temperature', fmt(pc.targetTemperature));
    setTextContent('r_surface_binding_energy', fmt(pc.surfaceBindingEnergy));

    // THERMAL TAB
    setTextContent('r_thermal_conductivity', fmt(pc.thermalConductivity));
    setTextContent('r_heat_capacity', fmt(pc.heatCapacity));
    setTextContent('r_density', fmt(pc.density));

    // DAMAGE TAB
    setTextContent('r_total_transferred_energy', fmt(r.totalTransferredEnergy ?? 0));
    setTextContent('r_avg_transferred_per_atom', fmt(r.avgTransferredPerAtom ?? 0));
    setTextContent('r_total_damage', fmt(r.totalDamage ?? 0));
    setTextContent('r_total_momentum', fmt(r.totalMomentum ?? 0));
    setTextContent('r_total_displacement', fmt(r.totalDisplacement ?? 0));

    // DIFFUSION PROFILE
    if (r.profile) {
        setTextContent('r_d1', fmt(r.profile.d1));
        setTextContent('r_d2', fmt(r.profile.d2));
        setTextContent('r_q1', fmt(r.profile.q1_ev));
        setTextContent('r_q2', fmt(r.profile.q2_ev));
        setTextContent('r_d_thermal', fmt(r.profile.d_thermal));
        setTextContent('r_d_effective', fmt(r.profile.d_effective));
        setTextContent('r_mean_depth', fmt(r.profile.meanDepth));
    }
}

function setTextContent(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

async function saveRes() {
    if (!curRes || !simReq) {
        showMsg('Нет результатов для сохранения', 'error');
        return;
    }

    try {
        const token = window.PlasmaAuth?.getToken();

        const response = await fetch(`${API}/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify({
                ionComposition: simReq.ionComposition,
                atomComposition: simReq.composition,
                configId: simReq.configId,
                voltage: simReq.voltage,
                current: simReq.current,
                pressure: simReq.pressure,
                electronTemp: simReq.electronTemp,
                chamberWidth: simReq.chamberWidth,
                chamberDepth: simReq.chamberDepth,
                exposureTime: simReq.exposureTime,
                angle: simReq.angle,
                totalTransferredEnergy: curRes.totalTransferredEnergy,
                avgTransferredPerAtom: curRes.avgTransferredPerAtom,
                totalDamage: curRes.totalDamage,
                totalMomentum: curRes.totalMomentum,
                totalDisplacement: curRes.totalDisplacement,
                profile: curRes.profile,
                plasmaConfig: curRes.plasmaConfig
            })
        });

        if (!response.ok) {
            const errBody = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
            throw new Error(errBody.message || `HTTP ${response.status}`);
        }

        window.PlasmaAuth?.showMessage?.('Результаты сохранены!', 'success');
        showMsg('Результаты сохранены!', 'success');

    } catch (e) {
        console.error('Save error:', e);
        window.PlasmaAuth?.showMessage?.('Ошибка сохранения: ' + e.message, 'error');
    }
}

function resetForm() {
    const atomContainer = document.getElementById('compositionList');
    const ionContainer = document.getElementById('ionCompositionList');

    if (atomContainer) {
        atomContainer.innerHTML = '';
        addRow();
    }
    if (ionContainer) {
        ionContainer.innerHTML = '';
        addIonRow();
    }

    document.getElementById('voltage').value = '500';
    document.getElementById('current').value = '0.5';
    document.getElementById('pressure').value = '10';
    document.getElementById('electronTemp').value = '11600';
    document.getElementById('chamberWidth').value = '0.1';
    document.getElementById('chamberDepth').value = '0.1';
    document.getElementById('exposureTime').value = '1.0';
    document.getElementById('angle').value = '0';

    curRes = null;
    simReq = null;
    showIdle();
    updateCompositionInfo();
    updateIonCompositionInfo();
}

function showMsg(msg, type) {
    const m = document.getElementById('formMsg');
    if (m) {
        m.textContent = msg;
        m.style.color = type === 'error' ? '#ff6b6b' : '#28a745';
        m.style.display = 'block';
        setTimeout(() => { m.style.display = 'none'; }, 5000);
    } else {
        alert(msg);
    }
}

// ============================================
// UI CONTROLS
// ============================================

function toggleAutogen() {
    const header = document.querySelector('.autogen-header');
    const body = document.getElementById('autogenBody');
    if (header && body) {
        header.classList.toggle('open');
        body.classList.toggle('open');
    }
}

function selectPreset(el) {
    document.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    currentPreset = el.dataset.preset;

    const customRanges = document.getElementById('customRanges');
    if (customRanges) {
        customRanges.style.display = currentPreset === 'custom' ? 'block' : 'none';
    }

    if (currentPreset !== 'custom') {
        generateRandomParameters();
    }
}

function changeCount(delta) {
    const countSpan = document.getElementById('genCount');
    if (countSpan) {
        let newCount = parseInt(countSpan.textContent) + delta;
        newCount = Math.max(1, Math.min(100, newCount));
        countSpan.textContent = newCount;
    }
}

// ============================================
// GLOBAL FUNCTIONS
// ============================================

window.addRow = addRow;
window.removeRow = removeRow;
window.randomizeComposition = randomizeComposition;
window.addIonRow = addIonRow;
window.removeIonRow = removeIonRow;
window.randomizeIonComposition = randomizeIonComposition;
window.randomizeParameters = randomizeParameters;
window.generateAndRun = generateAndRun;
window.saveRes = saveRes;
window.resetForm = resetForm;
window.showAuthModal = () => window.PlasmaAuth?.showModal?.() || alert('Функция авторизации недоступна');
window.hideAuthModal = () => window.PlasmaAuth?.hideModal?.();
window.logout = () => {
    window.PlasmaAuth?.logout?.();
    checkAuth();
};
window.newSim = () => {
    resetForm();
    showIdle();
};
window.toggleAutogen = toggleAutogen;
window.selectPreset = selectPreset;
window.changeCount = changeCount;