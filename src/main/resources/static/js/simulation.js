'use strict';

const SIMULATION_CONFIG = {
    API_SIMULATION: '/api/simulation/run',
    API_SAVE: '/api/simulation/create',
    API_ATOMS: '/atoms',
    API_IONS: '/ions',
    API_ATOM_SYMBOL: '/atoms/symbol',  // поиск атома по символу
};

const AUTOGEN_PRESETS = {
    low: {
        voltage: [1200, 3500],
        current: [0.005, 0.05],
        pressure: [0.1, 5],
        et: [4000, 4000],
        width: [0.55, 0.55],
        depth: [0.55, 0.55],
        time: [1800, 1800],
        angle: [0, 60],
        ambient: [300, 300],
        electrodeDistance: [0.55, 0.55]
    },
    medium: {
        voltage: [700, 1200],
        current: [0.05, 0.1],
        pressure: [5, 15],
        et: [4000, 4000],
        width: [0.55, 0.55],
        depth: [0.55, 0.55],
        time: [1800, 1800],
        angle: [0, 60],
        ambient: [300, 300],
        electrodeDistance: [0.55, 0.55]
    },
    high: {
        voltage: [300, 800],
        current: [0.01, 5.0],
        pressure: [15, 100],
        et: [4000, 4000],
        width: [0.55, 0.55],
        depth: [0.55, 0.55],
        time: [1800, 1800],
        angle: [0, 60],
        ambient: [300, 300],
        electrodeDistance: [0.55, 0.55]
    },
    custom: {
        voltage: [100, 3500],
        current: [0.005, 5],
        pressure: [0.1, 100],
        et: [4000, 4000],
        width: [0.55, 0.55],
        depth: [0.55, 0.55],
        time: [600, 3600],
        angle: [0, 90],
        ambient: [280, 300],
        electrodeDistance: [0.55, 0.55]
    }
};

/* ═══════════════════════════════════════════════════════════════
   КАТАЛОГ ГОТОВЫХ СПЛАВОВ И ИОННЫХ СОСТАВОВ
   Адаптировано под вашу БД:

   АТОМЫ (из AtomList):
   - C (IV)      → Carbon
   - Cr (II/III/VI) → Chromium
   - Ni (II/III) → Nickel
   - Fe (II/III) → Iron
   - Mo (IV/VI)  → Molybdenum
   - W (IV/VI)   → Tungsten
   - Co (II/III) → Cobalt

   ИОНЫ (из Ion):
   - H2O, CHN4, O2, H2, CO2, Ar, N, N2, C2H2
   ═══════════════════════════════════════════════════════════════ */

const ALLOY_PRESETS = {
    // ───────── СТАЛИ И СПЛАВЫ ЖЕЛЕЗА ─────────
    steel_fe_cr: {
        name: 'Сталь Fe-Cr',
        source: 'Базовая хромистая сталь',
        components: [
            { atomSymbol: 'Fe', fraction: 0.85 },
            { atomSymbol: 'Cr', fraction: 0.15 }
        ]
    },
    stainless_steel: {
        name: 'Нержавеющая сталь',
        source: 'Fe-Cr-Ni сплав',
        components: [
            { atomSymbol: 'Fe', fraction: 0.70 },
            { atomSymbol: 'Cr', fraction: 0.18 },
            { atomSymbol: 'Ni', fraction: 0.10 },
            { atomSymbol: 'Mo', fraction: 0.02 }
        ]
    },
    fe_co_alloy: {
        name: 'Железо-Кобальт сплав',
        source: 'Магнитный сплав',
        components: [
            { atomSymbol: 'Fe', fraction: 0.50 },
            { atomSymbol: 'Co', fraction: 0.50 }
        ]
    },

    // ───────── ВОЛЬФРАМОВЫЕ СПЛАВЫ ─────────
    pure_tungsten: {
        name: 'Чистый вольфрам',
        source: 'W для плазменных приложений',
        components: [
            { atomSymbol: 'W', fraction: 1.00 }
        ]
    },
    w_mo_alloy: {
        name: 'Вольфрам-Молибден',
        source: 'W-Mo тугоплавкий сплав',
        components: [
            { atomSymbol: 'W', fraction: 0.80 },
            { atomSymbol: 'Mo', fraction: 0.20 }
        ]
    },
    w_fe_alloy: {
        name: 'Вольфрам-Железо',
        source: 'W-Fе псевдосплав',
        components: [
            { atomSymbol: 'W', fraction: 0.90 },
            { atomSymbol: 'Fe', fraction: 0.10 }
        ]
    },

    // ───────── МОЛИБДЕНОВЫЕ СПЛАВЫ ─────────
    pure_molybdenum: {
        name: 'Чистый молибден',
        source: 'Mo для высокотемпературных применений',
        components: [
            { atomSymbol: 'Mo', fraction: 1.00 }
        ]
    },
    mo_cr_alloy: {
        name: 'Молибден-Хром',
        source: 'Mo-Cr жаропрочный сплав',
        components: [
            { atomSymbol: 'Mo', fraction: 0.85 },
            { atomSymbol: 'Cr', fraction: 0.15 }
        ]
    },

    // ───────── НИКЕЛЕВЫЕ СПЛАВЫ ─────────
    pure_nickel: {
        name: 'Чистый никель',
        source: 'Ni для коррозионностойких покрытий',
        components: [
            { atomSymbol: 'Ni', fraction: 1.00 }
        ]
    },
    ni_cr_alloy: {
        name: 'Никель-Хром',
        source: 'Ni-Cr жаропрочный сплав',
        components: [
            { atomSymbol: 'Ni', fraction: 0.80 },
            { atomSymbol: 'Cr', fraction: 0.20 }
        ]
    },
    ni_fe_alloy: {
        name: 'Никель-Железо',
        source: 'Ni-Fe магнитный сплав',
        components: [
            { atomSymbol: 'Ni', fraction: 0.60 },
            { atomSymbol: 'Fe', fraction: 0.40 }
        ]
    },

    // ───────── ХРОМОВЫЕ ПОКРЫТИЯ ─────────
    pure_chromium: {
        name: 'Чистый хром',
        source: 'Cr для гальванических покрытий',
        components: [
            { atomSymbol: 'Cr', fraction: 1.00 }
        ]
    },
    cr_fe_alloy: {
        name: 'Хром-Железо',
        source: 'Cr-Fe феррохром',
        components: [
            { atomSymbol: 'Cr', fraction: 0.70 },
            { atomSymbol: 'Fe', fraction: 0.30 }
        ]
    },

    // ───────── КОБАЛЬТОВЫЕ СПЛАВЫ ─────────
    pure_cobalt: {
        name: 'Чистый кобальт',
        source: 'Co для магнитных материалов',
        components: [
            { atomSymbol: 'Co', fraction: 1.00 }
        ]
    },
    co_cr_alloy: {
        name: 'Кобальт-Хром',
        source: 'Co-Cr биосовместимый сплав',
        components: [
            { atomSymbol: 'Co', fraction: 0.65 },
            { atomSymbol: 'Cr', fraction: 0.30 },
            { atomSymbol: 'Mo', fraction: 0.05 }
        ]
    },

    // ───────── УГЛЕРОДИСТЫЕ МАТЕРИАЛЫ ─────────
    carbon_steel: {
        name: 'Углеродистая сталь',
        source: 'Fe-C конструкционная сталь',
        components: [
            { atomSymbol: 'Fe', fraction: 0.98 },
            { atomSymbol: 'C', fraction: 0.02 }
        ]
    },
    fe_cr_c: {
        name: 'Хромистая сталь с углеродом',
        source: 'Fe-Cr-C инструментальная сталь',
        components: [
            { atomSymbol: 'Fe', fraction: 0.85 },
            { atomSymbol: 'Cr', fraction: 0.12 },
            { atomSymbol: 'C', fraction: 0.03 }
        ]
    },

    // ───────── СЛОЖНЫЕ СПЛАВЫ ─────────
    complex_steel: {
        name: 'Сложная сталь',
        source: 'Fe-Cr-Ni-Mo-Co многокомпонентный',
        components: [
            { atomSymbol: 'Fe', fraction: 0.65 },
            { atomSymbol: 'Cr', fraction: 0.15 },
            { atomSymbol: 'Ni', fraction: 0.10 },
            { atomSymbol: 'Mo', fraction: 0.05 },
            { atomSymbol: 'Co', fraction: 0.05 }
        ]
    },
    refractory_alloy: {
        name: 'Тугоплавкий сплав',
        source: 'W-Mo-Cr жаропрочный',
        components: [
            { atomSymbol: 'W', fraction: 0.60 },
            { atomSymbol: 'Mo', fraction: 0.25 },
            { atomSymbol: 'Cr', fraction: 0.15 }
        ]
    }
};

const ION_PRESETS = {
    // ───────── ВОДОРОДСОДЕРЖАЩАЯ ПЛАЗМА ─────────
    pure_h2: {
        name: 'Водород H₂',
        source: 'Чистая водородная плазма',
        components: [
            { ionName: 'H2', fraction: 1.00 }
        ]
    },
    h2_with_water: {
        name: 'H₂ + H₂O',
        source: 'Влажная водородная плазма',
        components: [
            { ionName: 'H2', fraction: 0.90 },
            { ionName: 'H2O', fraction: 0.10 }
        ]
    },

    // ───────── АЗОТСОДЕРЖАЩАЯ ПЛАЗМА ─────────
    pure_n2: {
        name: 'Азот N₂',
        source: 'Молекулярный азот для нитрирования',
        components: [
            { ionName: 'N2', fraction: 1.00 }
        ]
    },
    pure_n: {
        name: 'Атомарный азот N',
        source: 'Атомарный азот для плазменного азотирования',
        components: [
            { ionName: 'N', fraction: 1.00 }
        ]
    },
    n2_with_ar: {
        name: 'N₂ + Ar',
        source: 'Азотно-аргоновая смесь',
        components: [
            { ionName: 'N2', fraction: 0.80 },
            { ionName: 'Ar', fraction: 0.20 }
        ]
    },

    // ───────── КИСЛОРОДСОДЕРЖАЩАЯ ПЛАЗМА ─────────
    pure_o2: {
        name: 'Кислород O₂',
        source: 'Кислородная плазма для окисления',
        components: [
            { ionName: 'O2', fraction: 1.00 }
        ]
    },
    o2_with_co2: {
        name: 'O₂ + CO₂',
        source: 'Кислород с углекислым газом',
        components: [
            { ionName: 'O2', fraction: 0.85 },
            { ionName: 'CO2', fraction: 0.15 }
        ]
    },

    // ───────── ИНЕРТНЫЕ ГАЗЫ ─────────
    pure_ar: {
        name: 'Аргон Ar',
        source: 'Инертный газ для распыления',
        components: [
            { ionName: 'Ar', fraction: 1.00 }
        ]
    },
    ar_with_n2: {
        name: 'Ar + N₂',
        source: 'Аргон с азотом для реактивного распыления',
        components: [
            { ionName: 'Ar', fraction: 0.70 },
            { ionName: 'N2', fraction: 0.30 }
        ]
    },

    // ───────── УГЛЕВОДОРОДНАЯ ПЛАЗМА ─────────
    ch4_plasma: {
        name: 'CH₄ (метан)',
        source: 'Метановая плазма для CVD',
        components: [
            { ionName: 'CHN4', fraction: 1.00 }  // В вашей БД CHN4, а не CH4
        ]
    },
    c2h2_plasma: {
        name: 'C₂H₂ (ацетилен)',
        source: 'Ацетиленовая плазма для алмазоподобных покрытий',
        components: [
            { ionName: 'C2H2', fraction: 1.00 }
        ]
    },

    // ───────── СМЕШАННАЯ ПЛАЗМА ─────────
    air_simulation: {
        name: 'Имитация воздуха',
        source: 'N₂ + O₂ + Ar',
        components: [
            { ionName: 'N2', fraction: 0.78 },
            { ionName: 'O2', fraction: 0.21 },
            { ionName: 'Ar', fraction: 0.01 }
        ]
    },
    combustion_gas: {
        name: 'Продукты горения',
        source: 'CO₂ + H₂O + N₂',
        components: [
            { ionName: 'CO2', fraction: 0.15 },
            { ionName: 'H2O', fraction: 0.10 },
            { ionName: 'N2', fraction: 0.75 }
        ]
    },
    organic_plasma: {
        name: 'Органическая плазма',
        source: 'CH₄ + C₂H₂ + H₂',
        components: [
            { ionName: 'CHN4', fraction: 0.40 },
            { ionName: 'C2H2', fraction: 0.30 },
            { ionName: 'H2', fraction: 0.30 }
        ]
    },

    // ───────── ТЕХНОЛОГИЧЕСКИЕ СМЕСИ ─────────
    nitriding_gas: {
        name: 'Газ для нитрирования',
        source: 'N₂ + H₂',
        components: [
            { ionName: 'N2', fraction: 0.75 },
            { ionName: 'H2', fraction: 0.25 }
        ]
    },
    carburizing_gas: {
        name: 'Газ для науглероживания',
        source: 'CH₄ + H₂',
        components: [
            { ionName: 'CHN4', fraction: 0.20 },
            { ionName: 'H2', fraction: 0.80 }
        ]
    }
};


const SimulationState = {
    currentResult: null,
    savedResultId: null,
    currentRequest: null,
    alloyComponents: [],
    ionComponents: [],
    autoGenRunning: false,
    autoGenCancelled: false,
    autoGenResults: []
};

function normaliseFractions(weights) {
    const total = weights.reduce((s, w) => s + w, 0);
    const SCALE = 1e6;
    const fracs = weights.map(w => Math.round((w / total) * SCALE) / SCALE);
    const partial = fracs.slice(0, -1).reduce((s, f) => s + f, 0);
    fracs[fracs.length - 1] = Math.round((1 - partial) * SCALE) / SCALE;
    return fracs;
}

function buildAlloyComponentDto(c) {
    return {
        atomId: Number(c.atomId),
        atomName: c.atomName || '',
        fraction: c.fraction,
        debyeTemperature: c.debye_temperature ?? 400
    };
}

function buildIonComponentDto(c) {
    return {
        ionId: Number(c.ionId),
        ion: { id: Number(c.ionId) },
        ionName: c.ionName || '',
        charge: c.charge ?? 0,
        fraction: c.fraction
    };
}

const SimulationAPI = {
    async run(requestData) {
        const response = await window.PlasmaAuth.apiRequest(SIMULATION_CONFIG.API_SIMULATION, requestData, true);
        if (!response.ok) throw new Error(response.data?.message || 'Simulation failed');
        return response.data?.data ?? response.data;
    },

    async save(resultData) {
        if (!resultData.atomId || !resultData.ionId) throw new Error('atomId и ionId обязательны для сохранения');
        const response = await window.PlasmaAuth.apiRequest(SIMULATION_CONFIG.API_SAVE, resultData, true);
        if (!response.ok) throw new Error(response.data?.message || 'Failed to save');
        return response.data?.data ?? response.data;
    },

    async getAtoms() {
        const response = await window.PlasmaAuth.apiRequest(SIMULATION_CONFIG.API_ATOMS, null, true);
        if (!response.ok) throw new Error('Failed to fetch atoms');
        return response.data?.data || response.data || [];
    },

    async getIons() {
        const response = await window.PlasmaAuth.apiRequest(SIMULATION_CONFIG.API_IONS, null, true);
        if (!response.ok) throw new Error('Failed to fetch ions');
        return response.data?.data || response.data || [];
    },

    async getAtomBySymbol(symbol) {
        const response = await window.PlasmaAuth.apiRequest(
            `${SIMULATION_CONFIG.API_ATOM_SYMBOL}/${encodeURIComponent(symbol)}`,
            null,
            true
        );
        if (!response.ok) return [];
        const data = response.data?.data || response.data || [];
        return Array.isArray(data) ? data : [];
    }
};

/* ═══════════════════════════════════════════════════════════════
   ПОИСК АТОМОВ И ИОНОВ ДЛЯ ПРЕСЕТОВ
   ═══════════════════════════════════════════════════════════════ */

/**
 * Извлекает базовый символ из atom_name.
 * Примеры:
 *   "W (IV)" → "W"
 *   "Fe (II)" → "Fe"
 *   "Cr (VI)" → "Cr"
 */
function extractSymbolFromAtomName(atomName) {
    if (!atomName) return '';
    return atomName.split('(')[0].trim();
}

/**
 * Ищет атом в кэше по символу.
 */
function findAtomBySymbol(symbol) {
    if (!window.availableAtoms?.length) return null;
    const sym = symbol.trim();
    const symUpper = sym.toUpperCase();

    // Ищем по извлечённому символу из atom_name
    const bySymbol = window.availableAtoms.find(a => {
        const extracted = extractSymbolFromAtomName(a.atomName);
        return extracted === sym || extracted.toUpperCase() === symUpper;
    });
    if (bySymbol) return bySymbol;

    // Ищем по full_name
    const byFullName = window.availableAtoms.find(a =>
        a.fullName?.toLowerCase() === sym.toLowerCase()
    );
    if (byFullName) return byFullName;

    return null;
}

/**
 * Асинхронный поиск атома: сначала в кэше, затем через API.
 */
async function findAtomBySymbolAsync(symbol) {
    const cached = findAtomBySymbol(symbol);
    if (cached) return cached;

    try {
        const atoms = await SimulationAPI.getAtomBySymbol(symbol);
        if (atoms?.length > 0) {
            const found = atoms[0];
            if (!window.availableAtoms) window.availableAtoms = [];
            window.availableAtoms.push(found);
            console.log(`[Preset] Атом "${symbol}" загружен через API`);
            return found;
        }
    } catch (e) {
        console.warn(`[Preset] API-поиск атома "${symbol}" не удался:`, e);
    }
    return null;
}

/**
 * Ищет ион по имени в кэше.
 */
function findIonByName(name) {
    if (!window.availableIons?.length) return null;
    const n = name.trim();
    const nLower = n.toLowerCase();

    // Точное совпадение
    const exact = window.availableIons.find(ion => ion.name === n);
    if (exact) return exact;

    // Case-insensitive
    const ci = window.availableIons.find(ion =>
        ion.name?.toLowerCase() === nLower
    );
    if (ci) return ci;

    return null;
}

/* ═══════════════════════════════════════════════════════════════
   ПРИМЕНЕНИЕ ПРЕСЕТОВ
   ═══════════════════════════════════════════════════════════════ */

async function applyAlloyPreset() {
    const select = document.getElementById('alloyPreset');
    const hint = document.getElementById('alloyPresetHint');
    const key = select?.value;

    if (!key) {
        window.PlasmaAnimations?.ToastNotifications.show('Выберите сплав из списка', 'warning');
        return;
    }

    const preset = ALLOY_PRESETS[key];
    if (!preset) return;

    SimulationState.alloyComponents = [];
    const missing = [];

    for (const comp of preset.components) {
        const atom = await findAtomBySymbolAsync(comp.atomSymbol);
        if (!atom) {
            missing.push(comp.atomSymbol);
            continue;
        }
        SimulationState.alloyComponents.push({
            atomId: atom.id,
            atomName: atom.atomName,
            fullName: atom.fullName,
            debye_temperature: atom.debye_temperature ?? 400,
            fraction: comp.fraction
        });
    }

    AlloyManager.renderComponents();

    if (missing.length) {
        hint.className = 'preset-hint warning';
        hint.textContent = `⚠ Не найдены: ${missing.join(', ')}`;
        window.PlasmaAnimations?.ToastNotifications.show(
            `Пресет применён частично. Отсутствуют: ${missing.join(', ')}`, 'warning', 5000
        );
    } else {
        hint.className = 'preset-hint success';
        hint.textContent = `✓ ${preset.name} — ${preset.source}`;
        window.PlasmaAnimations?.ToastNotifications.show(
            `Применён сплав: ${preset.name}`, 'success', 3000
        );
    }
}

function clearAlloyPreset() {
    SimulationState.alloyComponents = [];
    AlloyManager.renderComponents();
    const select = document.getElementById('alloyPreset');
    const hint = document.getElementById('alloyPresetHint');
    if (select) select.value = '';
    if (hint) {
        hint.className = 'preset-hint';
        hint.textContent = 'Выберите готовый сплав из каталога';
    }
}

function applyIonPreset() {
    const select = document.getElementById('ionPreset');
    const hint = document.getElementById('ionPresetHint');
    const key = select?.value;

    if (!key) {
        window.PlasmaAnimations?.ToastNotifications.show('Выберите ионный состав из списка', 'warning');
        return;
    }

    const preset = ION_PRESETS[key];
    if (!preset) return;

    SimulationState.ionComponents = [];
    const missing = [];

    for (const comp of preset.components) {
        const ion = findIonByName(comp.ionName);
        if (!ion) {
            missing.push(comp.ionName);
            continue;
        }
        SimulationState.ionComponents.push({
            ionId: ion.id,
            ionName: ion.name,
            charge: ion.charge ?? 1,
            fraction: comp.fraction
        });
    }

    IonCompositionManager.renderComponents();

    if (missing.length) {
        hint.className = 'preset-hint warning';
        hint.textContent = `⚠ Не найдены: ${missing.join(', ')}`;
        window.PlasmaAnimations?.ToastNotifications.show(
            `Пресет применён частично. Отсутствуют: ${missing.join(', ')}`, 'warning', 5000
        );
    } else {
        hint.className = 'preset-hint success';
        hint.textContent = `✓ ${preset.name} — ${preset.source}`;
        window.PlasmaAnimations?.ToastNotifications.show(
            `Применён ионный состав: ${preset.name}`, 'success', 3000
        );
    }
}

function clearIonPreset() {
    SimulationState.ionComponents = [];
    IonCompositionManager.renderComponents();
    const select = document.getElementById('ionPreset');
    const hint = document.getElementById('ionPresetHint');
    if (select) select.value = '';
    if (hint) {
        hint.className = 'preset-hint';
        hint.textContent = 'Выберите готовый ионный состав из каталога';
    }
}

window.applyAlloyPreset = applyAlloyPreset;
window.clearAlloyPreset = clearAlloyPreset;
window.applyIonPreset = applyIonPreset;
window.clearIonPreset = clearIonPreset;

const SimulationUI = {
    showLoading() {
        document.getElementById('initialState').style.display = 'none';
        document.getElementById('loadingState').style.display = 'flex';
        document.getElementById('resultsState').style.display = 'none';
        const btn = document.getElementById('runBtn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Расчёт...';
        }
        const steps = document.querySelectorAll('.loading-step');
        steps.forEach(s => s.classList.remove('active'));
        let stepIdx = 0;
        const iv = setInterval(() => {
            if (stepIdx < steps.length) {
                steps[stepIdx].classList.add('active');
                stepIdx++;
            } else {
                clearInterval(iv);
            }
        }, 600);
    },

    showResults() {
        document.getElementById('initialState').style.display = 'none';
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('resultsState').style.display = 'flex';
        const btn = document.getElementById('runBtn');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-play"></i> Запустить симуляцию';
        }
        const ts = document.getElementById('resultTimestamp');
        if (ts) ts.textContent = new Date().toLocaleTimeString('ru-RU');
    },

    showError(message) {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('initialState').style.display = 'flex';
        const btn = document.getElementById('runBtn');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-play"></i> Запустить симуляцию';
        }
        window.PlasmaAnimations?.ToastNotifications.show(message, 'error', 5000);
    },

    fillResults(result, simReq) {
        try {
            this._fillResultsImpl(result, simReq);
        } catch (err) {
            console.error('[Simulation] fillResults failed:', err, result);
            window.PlasmaAnimations?.ToastNotifications.show(
                'Ошибка отображения результатов: ' + (err?.message || err),
                'error',
                6000
            );
        }
    },

    _fillResultsImpl(result, simReq) {
        const raw = result?.data && result.profile == null ? result.data : result;
        const profile = raw?.profile || {};
        const stats = raw?.stats || profile.stats || {};
        const plasma = raw?.plasmaConfig || {};
        const im = raw?.intermediate || {};
        const energy = profile.energyDeposition || {};
        const transport = stats.diffusionTransport || profile.diffusionIntermediate || {};
        const diffInt = profile.diffusionIntermediate || transport;

        const num = (...vals) => {
            for (const v of vals) {
                const n = Number(v);
                if (v != null && v !== '' && !isNaN(n)) return n;
            }
            return null;
        };

        const pick = (...vals) => {
            for (const v of vals) {
                const n = Number(v);
                if (v != null && !isNaN(n) && n > 0) return n;
            }
            return null;
        };

        const pf = (key, ...aliases) => {
            for (const k of [key, ...aliases]) {
                if (profile[k] != null) return profile[k];
            }
            return null;
        };

        const layerThickness = pick(
            stats.modifiedLayerThickness,
            im.modifiedLayerThickness,
            energy.modifiedLayerThickness
        );
        const integratedFluence = pick(stats.fluence, im.integratedFluence, energy.fluence);
        const plasmaCorrection = pick(stats.plasmaCorrectionFactor, im.plasmaCorrectionFactor, energy.plasmaCorrectionFactor);
        const exposureRate = pick(stats.exposureRate, im.exposureRate, energy.exposureRate);
        const energyGain = pick(stats.energyGainFactor, im.energyGainFactor, energy.energyGainFactor);

        const fmtSci = (v) => (v == null || isNaN(Number(v))) ? '—' : Number(v).toExponential(3);
        const fmtDepth = (v) => {
            if (v == null || isNaN(Number(v))) return '—';
            const m = Number(v);
            if (m < 1e-5) return `${(m * 1e9).toFixed(1)} нм`;
            if (m < 1e-3) return `${(m * 1e6).toFixed(2)} мкм`;
            return `${m.toExponential(3)} м`;
        };
        const fmtNum = (v, d = 2) => (v == null || isNaN(Number(v))) ? '—' : Number(v).toFixed(d);
        const set = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val != null ? val : '—';
        };

        const fmtComp = (arr) => {
            if (!arr?.length) return '—';
            return arr.map(c => `${c.atomName || c.atomId || '?'} ${((c.fraction ?? 0) * 100).toFixed(1)}%`).join(' · ');
        };

        const fmtIon = (arr) => {
            if (!arr?.length) return '—';
            return arr.map(c => `${c.ionName || c.ionId || '?'} ${((c.fraction ?? 0) * 100).toFixed(1)}%`).join(' · ');
        };

        if (simReq) {
            set('r_composition', fmtComp(simReq.composition));
            set('r_ion_composition', fmtIon(simReq.ionComposition));
            set('r_current', fmtNum(simReq.current, 3));
            set('r_chamber_width', fmtNum(simReq.chamberWidth, 3));
            set('r_chamber_depth', fmtNum(simReq.chamberDepth, 3));
            set('r_exposure_time', fmtNum(simReq.exposureTime, 0));
            set('r_angle', fmtNum(simReq.angle, 1));
        }
        set('r_electrode_distance', fmtNum(num(simReq?.electrodeDistance, plasma.electrodeDistance), 3));
        const plasmaResult = raw?.plasmaResult || {};
        set('r_ion_incidence_angle', fmtNum(num(plasma.ionIncidenceAngle, simReq?.angle), 1));

        set('r_voltage', fmtNum(num(plasma.voltage, simReq?.voltage), 0));
        set('r_pressure', fmtNum(num(plasma.pressure, simReq?.pressure), 2));
        set('r_electron_temp', fmtNum(num(plasma.electronTemperature, simReq?.electronTemp), 0));
        set('pc_ion_energy', fmtNum(num(plasmaResult.ionEnergyEv, plasma.ionEnergyOverride), 3));
        set('plasma_electron_density', fmtSci(stats.electronDensity));
        set('plasma_electron_velocity', fmtSci(stats.electronVelocity));
        set('plasma_current_density', fmtSci(stats.currentDensity));
        set('damage_ion_flux', fmtSci(stats.ionFlux));

        set('ps_total_energy', fmtSci(stats.totalTransferredEnergy));
        set('ps_avg_energy', fmtSci(stats.avgTransferredPerAtom));
        set('ps_binding_energy', fmtNum(stats.surfaceBindingEnergy, 3));

        const thermalFromMap = (() => {
            const map = stats.thermalTemperatureMap;
            if (!map?.length) return null;
            let min = Infinity, max = -Infinity, sum = 0, n = 0;
            for (const row of map) {
                for (const v of (row || [])) {
                    const t = Number(v);
                    if (!isFinite(t)) continue;
                    min = Math.min(min, t);
                    max = Math.max(max, t);
                    sum += t;
                    n++;
                }
            }
            return n > 0 ? { min, max, avg: sum / n } : null;
        })();
        const tProbe = pick(im.finalProbeTemperature, stats.finalProbeTemperature);
        const tMin = pick(im.thermalMinTemperature, thermalFromMap?.min, tProbe);
        const tMax = pick(im.thermalMaxTemperature, thermalFromMap?.max, tProbe);
        const tAvg = pick(im.thermalAvgTemperature, thermalFromMap?.avg, tProbe);
        set('thermal_min_temp', fmtNum(tMin, 2));
        set('thermal_max_temp', fmtNum(tMax, 2));
        set('thermal_avg_temp', fmtNum(tAvg, 2));
        set('thermal_probe_temp', fmtNum(tProbe, 2));
        set('thermal_debye_speed', fmtSci(pick(im.debyeFrontSpeed, stats.debyeFrontSpeed)));
        set('thermal_debye_depth', fmtSci(pick(im.debyeFrontDepth, stats.debyeFrontDepth)));

        set('skin_depth', fmtSci(energy.skinDepth));
        set('skin_surface_power', fmtSci(energy.skinSurfacePower));
        set('skin_accumulated_energy', fmtSci(energy.skinAccumulatedEnergy));
        set('skin_temperature_delta', fmtNum(energy.skinTemperatureDelta, 2));
        set('skin_effective_temp', fmtNum(pick(im.effectiveSurfaceTemperature, energy.effectiveSurfaceTemperature, stats.effectiveSurfaceTemperature), 2));

        set('r_d_effective', fmtSci(num(pf('d_effective', 'dEffective', 'D_effective'))));
        set('r_d_thermal', fmtSci(num(pf('d_thermal', 'dThermal', 'D_thermal'))));
        set('r_mean_depth', fmtDepth(num(pf('meanDepth'))));
        set('diff_concentration', fmtSci(num(raw?.concentration, pf('concentration'))));

        set('r_d1', fmtSci(num(pf('d1', 'D1'))));
        set('r_d2', fmtSci(num(pf('d2', 'D2'))));
        set('r_q1', fmtNum(num(pf('q1_ev', 'q1Ev', 'Q1_ev')), 3));
        set('r_q2', fmtNum(num(pf('q2_ev', 'q2Ev', 'Q2_ev')), 3));

        set('energy_gain_factor', fmtNum(energyGain, 4));
        set('plasma_correction_factor', fmtNum(plasmaCorrection, 4));
        set('exposure_rate', fmtSci(exposureRate));
        set('modified_layer_thickness', fmtDepth(layerThickness));
        set('energy_potential_surface', fmtNum(im.potentialAtSurface ?? energy.potentialAtSurface, 2));
        set('energy_accelerating_field', fmtSci(im.acceleratingField ?? energy.acceleratingField));

        set('damage_total', fmtSci(stats.totalDamage));
        set('damage_displacement', fmtSci(stats.totalDisplacement));
        set('damage_momentum', fmtSci(stats.totalMomentum));
        set('damage_fluence', fmtSci(integratedFluence ?? stats.fluence));
        set('damage_fluence_eff', fmtSci(stats.fluenceEff));

        const dCollision = num(diffInt.dCollision, im.dCollision, transport.dCollision);
        const slrFactor = num(diffInt.slrFactor, im.slrFactor, transport.slrFactor) ?? 1;
        const dSlrFromFactor = (slrFactor > 1 && dCollision != null) ? (slrFactor - 1) * dCollision : null;
        set('diff_d_radiation', fmtSci(num(diffInt.dRadiation, im.dRadiation, transport.dRadiation)));
        set('diff_d_collision', fmtSci(dCollision));
        set('diff_slr_factor', fmtNum(slrFactor, 4));
        set('diff_damage_rate', fmtSci(num(diffInt.damageRate, im.damageRate, transport.damageRate)));
        set('diff_d_slr', fmtSci(num(stats.dSlr, dSlrFromFactor)));
        set('diff_d_res', fmtSci(num(stats.dRes)));
        set('diff_resonance_xi', fmtNum(num(stats.resonanceXi), 4));

        set('diff_projected_range', fmtSci(num(diffInt.projectedRange, im.projectedRange, transport.projectedRange)));
        set('diff_straggle_sigma', fmtSci(num(diffInt.straggleSigma, im.straggleSigma, transport.straggleSigma)));
        set('diff_lattice_stiffness', fmtSci(num(diffInt.latticeStiffness, im.latticeStiffness, transport.latticeStiffness)));
        set('diff_equilibrium_dist', fmtSci(num(diffInt.equilibriumDistance, im.equilibriumDistance, transport.equilibriumDistance)));

        try {
            if (window.addPhysics3DData) window.addPhysics3DData(stats, simReq);
            if (window.renderPhysicsStats3D) window.renderPhysicsStats3D(window.current3DViewType || 'surface');
        } catch (e3d) {
            console.warn('[Simulation] 3D render skipped:', e3d);
        }
    }
};

const AlloyManager = {
    addComponent() {
        const atomIdEl = document.getElementById('alloyAtomId');
        const fractionEl = document.getElementById('alloyFraction');
        const atomId = atomIdEl ? atomIdEl.value : '';
        const pct = fractionEl ? parseFloat(fractionEl.value) : NaN;

        if (!atomId || isNaN(pct) || pct <= 0 || pct > 100) {
            window.PlasmaAnimations?.ToastNotifications.show('Выберите атом и укажите долю (1–100%)', 'error');
            return;
        }

        const atom = window.availableAtoms?.find(a => a.id === parseInt(atomId, 10));
        if (!atom) return;

        const fraction = pct / 100;
        const currentTotal = SimulationState.alloyComponents.reduce((s, c) => s + c.fraction, 0);
        if (currentTotal + fraction > 1.0001) {
            window.PlasmaAnimations?.ToastNotifications.show('Сумма долей не может превышать 100%', 'error');
            return;
        }

        SimulationState.alloyComponents.push({
            atomId: atom.id,
            atomName: atom.atomName,
            fullName: atom.fullName,
            debye_temperature: atom.debye_temperature ?? 400,
            fraction
        });

        this.renderComponents();
        if (fractionEl) fractionEl.value = '';
    },

    removeComponent(index) {
        SimulationState.alloyComponents.splice(index, 1);
        this.renderComponents();
    },

    renderComponents() {
        const container = document.getElementById('alloyComponentsList');
        if (!container) return;

        if (!SimulationState.alloyComponents.length) {
            container.innerHTML = '<p class="components-empty">Добавьте компоненты сплава</p>';
            return;
        }

        const total = SimulationState.alloyComponents.reduce((s, c) => s + c.fraction, 0);
        container.innerHTML = `
            <div class="alloy-list">
                ${SimulationState.alloyComponents.map((comp, i) => `
                    <div class="alloy-item">
                        <div class="alloy-info">
                            <strong>${comp.atomName}</strong>
                            <span>${(comp.fraction * 100).toFixed(1)}%</span>
                        </div>
                        <button type="button" class="btn-remove" onclick="removeAlloyComponent(${i})">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>`).join('')}
            </div>
            <div class="alloy-total" style="color:${total > 1 ? '#ef4444' : '#10b981'}">
                <strong>Сумма: ${(total * 100).toFixed(1)}%</strong>
                ${total < 1 ? ` (осталось: ${((1 - total) * 100).toFixed(1)}%)` : ''}
            </div>`;
    }
};

const IonCompositionManager = {
    addComponent() {
        const ionIdEl = document.getElementById('ionCompIonId');
        const fractionEl = document.getElementById('ionCompFraction');
        const ionId = ionIdEl ? ionIdEl.value : '';
        const pct = fractionEl ? parseFloat(fractionEl.value) : NaN;

        if (!ionId || isNaN(pct) || pct <= 0 || pct > 100) {
            window.PlasmaAnimations?.ToastNotifications.show('Выберите ион и укажите долю (1–100%)', 'error');
            return;
        }

        const ion = window.availableIons?.find(n => n.id === parseInt(ionId, 10));
        if (!ion) return;

        const fraction = pct / 100;
        const currentTotal = SimulationState.ionComponents.reduce((s, c) => s + c.fraction, 0);
        if (currentTotal + fraction > 1.0001) {
            window.PlasmaAnimations?.ToastNotifications.show('Сумма долей не может превышать 100%', 'error');
            return;
        }

        SimulationState.ionComponents.push({
            ionId: ion.id,
            ionName: ion.name,
            charge: ion.charge,
            fraction
        });

        this.renderComponents();
        if (fractionEl) fractionEl.value = '';
    },

    removeComponent(index) {
        SimulationState.ionComponents.splice(index, 1);
        this.renderComponents();
    },

    renderComponents() {
        const container = document.getElementById('ionComponentsList');
        if (!container) return;

        if (!SimulationState.ionComponents.length) {
            container.innerHTML = '<p class="components-empty">Добавьте компоненты ионного состава</p>';
            return;
        }

        const total = SimulationState.ionComponents.reduce((s, c) => s + c.fraction, 0);
        container.innerHTML = `
            <div class="alloy-list">
                ${SimulationState.ionComponents.map((comp, i) => `
                    <div class="alloy-item">
                        <div class="alloy-info">
                            <strong>${comp.ionName}</strong>
                            <span>${(comp.fraction * 100).toFixed(1)}%</span>
                        </div>
                        <button type="button" class="btn-remove" onclick="removeIonComponent(${i})">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>`).join('')}
            </div>
            <div class="alloy-total" style="color:${total > 1 ? '#ef4444' : '#10b981'}">
                <strong>Сумма: ${(total * 100).toFixed(1)}%</strong>
                ${total < 1 ? ` (осталось: ${((1 - total) * 100).toFixed(1)}%)` : ''}
            </div>`;
    }
};

window.addAlloyComponent = () => AlloyManager.addComponent();
window.removeAlloyComponent = (idx) => AlloyManager.removeComponent(idx);
window.addIonComponent = () => IonCompositionManager.addComponent();
window.removeIonComponent = (idx) => IonCompositionManager.removeComponent(idx);

const TabManager = {
    init() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.getAttribute('data-tab');
                if (tabName) this.switchTab(tabName);
            });
        });
    },

    switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
        });
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.style.display = 'none';
        });
        const target = document.getElementById(`${tabName}-tab`);
        if (target) {
            target.style.display = 'block';
            if (tabName === 'debye3d' && window.renderPhysicsStats3D) {
                setTimeout(() => window.renderPhysicsStats3D(window.current3DViewType || 'surface'), 150);
            }
        }
    }
};

const FormHandler = {
    init() {
        const form = document.getElementById('simulationForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSubmit(form);
            });
        }
    },

    async handleSubmit(form) {
        if (!SimulationState.alloyComponents.length) {
            window.PlasmaAnimations?.ToastNotifications.show('Добавьте хотя бы один атом сплава', 'error');
            return;
        }
        if (!SimulationState.ionComponents.length) {
            window.PlasmaAnimations?.ToastNotifications.show('Добавьте хотя бы один ион', 'error');
            return;
        }

        const fd = new FormData(form);
        const getField = (name) => String(fd.get(name) ?? '');
        const primaryAtom = SimulationState.alloyComponents[0];
        const primaryIon = SimulationState.ionComponents[0];

        const requestData = {
            configId: 1,
            atomId: Number(primaryAtom.atomId),
            ionId: Number(primaryIon.ionId),
            voltage: parseFloat(getField('voltage')),
            current: parseFloat(getField('current')),
            pressure: parseFloat(getField('pressure')),
            electronTemp: parseFloat(getField('electronTemp')),
            chamberWidth: parseFloat(getField('chamberWidth')),
            chamberDepth: parseFloat(getField('chamberDepth')),
            angle: parseFloat(getField('angle')),
            electrodeDistance: parseFloat(getField('electrodeDistance')) || 0.1,
            exposureTime: parseFloat(getField('exposureTime')),
            ambientTemp: parseFloat(getField('ambientTemp')) || 300,
            composition: SimulationState.alloyComponents.map(buildAlloyComponentDto),
            ionComposition: SimulationState.ionComponents.map(buildIonComponentDto)
        };

        try {
            SimulationState.savedResultId = null;
            SimulationUI.showLoading();
            const result = await SimulationAPI.run(requestData);
            SimulationState.currentResult = result;
            SimulationState.currentRequest = requestData;
            SimulationState.savedResultId = result.savedResult?.id ?? null;
            SimulationUI.showResults();
            SimulationUI.fillResults(result, requestData);
            const saveHint = SimulationState.savedResultId
                ? ` (сохранено #${SimulationState.savedResultId})`
                : '';
            window.PlasmaAnimations?.ToastNotifications.show(`Симуляция выполнена успешно!${saveHint}`, 'success', 3000);
        } catch (error) {
            console.error('[Simulation] Error:', error);
            SimulationUI.showError(error instanceof Error ? error.message : 'Ошибка выполнения симуляции');
        }
    },

    async loadAtoms() {
        try {
            window.availableAtoms = await SimulationAPI.getAtoms();
            this.populateAlloySelect();
        } catch (e) {
            console.error('[Simulation] Failed to load atoms:', e);
        }
    },

    async loadIons() {
        try {
            window.availableIons = await SimulationAPI.getIons();
            this.populateIonCompSelect();
        } catch (e) {
            console.error('[Simulation] Failed to load ions:', e);
        }
    },

    populateAlloySelect() {
        const select = document.getElementById('alloyAtomId');
        if (!select) return;
        if (!window.availableAtoms?.length) {
            select.innerHTML = '<option value="">Нет доступных атомов</option>';
            return;
        }
        select.innerHTML = '<option value="">Выберите атом...</option>';
        window.availableAtoms.forEach(atom => {
            const o = document.createElement('option');
            o.value = String(atom.id);
            o.textContent = `${atom.atomName} — ${atom.fullName}`;
            select.appendChild(o);
        });
    },

    populateIonCompSelect() {
        const select = document.getElementById('ionCompIonId');
        if (!select) return;
        if (!window.availableIons?.length) {
            select.innerHTML = '<option value="">Нет доступных ионов</option>';
            return;
        }
        select.innerHTML = '<option value="">Выберите ион...</option>';
        window.availableIons.forEach(ion => {
            const o = document.createElement('option');
            o.value = String(ion.id);
            const sign = ion.charge > 0 ? '+' : '';
            o.textContent = `${ion.name} (${sign}${ion.charge})`;
            select.appendChild(o);
        });
    }
};

window.saveResults = async (silent = false) => {
    if (!SimulationState.currentResult) {
        if (!silent) window.PlasmaAnimations?.ToastNotifications.show('Нет результатов для сохранения', 'error');
        return;
    }

    if (SimulationState.savedResultId) {
        if (!silent) {
            window.PlasmaAnimations?.ToastNotifications.show(
                `Результат уже сохранён (#${SimulationState.savedResultId})`,
                'info',
                4000
            );
        }
        return;
    }

    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn && !silent) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Сохранение...';
    }

    try {
        const result = SimulationState.currentResult;
        const request = SimulationState.currentRequest;
        const firstAtom = SimulationState.alloyComponents[0];
        const firstIon = SimulationState.ionComponents[0];

        if (!firstAtom?.atomId || !firstIon?.ionId) {
            if (!silent) window.PlasmaAnimations?.ToastNotifications.show('Не удалось определить атом и ион для сохранения', 'error');
            return;
        }

        const profile = result.profile || {};
        const stats = result.stats || {};
        const plasma = result.plasmaConfig || {};

        const saveData = {
            atomId: Number(firstAtom.atomId),
            ionId: Number(firstIon.ionId),
            configId: plasma.id || 1,
            atomComposition: SimulationState.alloyComponents.map(c => ({ atomId: Number(c.atomId), fraction: c.fraction })),
            ionComposition: SimulationState.ionComponents.map(c => ({ ionId: Number(c.ionId), fraction: c.fraction })),
            atomName: firstAtom.atomName || 'Unknown',
            s: `${firstAtom.atomName} ${(firstAtom.fraction * 100).toFixed(1)}%`,
            totalTransferredEnergy: stats.totalTransferredEnergy || 0,
            avgTransferredPerAtom: stats.avgTransferredPerAtom || 0,
            avgT: (() => {
                const im = result.intermediate || {};
                const map = stats.thermalTemperatureMap;
                if (im.thermalAvgTemperature > 0) return im.thermalAvgTemperature;
                if (map?.length) {
                    let sum = 0, n = 0;
                    for (const row of map) for (const v of (row || [])) {
                        const t = Number(v);
                        if (isFinite(t)) { sum += t; n++; }
                    }
                    if (n > 0) return sum / n;
                }
                return stats.finalProbeTemperature || 0;
            })(),
            minT: (() => {
                const im = result.intermediate || {};
                if (im.thermalMinTemperature > 0) return im.thermalMinTemperature;
                const map = stats.thermalTemperatureMap;
                if (map?.length) {
                    let min = Infinity;
                    for (const row of map) for (const v of (row || [])) {
                        const t = Number(v);
                        if (isFinite(t)) min = Math.min(min, t);
                    }
                    if (isFinite(min)) return min;
                }
                return stats.finalProbeTemperature || 0;
            })(),
            maxT: (() => {
                const im = result.intermediate || {};
                if (im.thermalMaxTemperature > 0) return im.thermalMaxTemperature;
                const map = stats.thermalTemperatureMap;
                if (map?.length) {
                    let max = -Infinity;
                    for (const row of map) for (const v of (row || [])) {
                        const t = Number(v);
                        if (isFinite(t)) max = Math.max(max, t);
                    }
                    if (isFinite(max)) return max;
                }
                return stats.finalProbeTemperature || 0;
            })(),
            totalMomentum: stats.totalMomentum || 0,
            totalDamage: stats.totalDamage || 0,
            totalDisplacement: stats.totalDisplacement || 0,
            fluence: stats.fluence || 0,
            fluenceEff: stats.fluenceEff || 0,
            ionFlux: stats.ionFlux || 0,
            resonanceXi: stats.resonanceXi || 0,
            dSlr: stats.dSlr || 0,
            dRes: stats.dRes || 0,
            angle: request?.angle ?? plasma?.ionIncidenceAngle ?? 0,
            electrodeDistance: request?.electrodeDistance ?? plasma?.electrodeDistance ?? 0,
            diffusionCoefficient1: profile.d_effective || profile.d1 || 0,
            diffusionCoefficient2: profile.d_thermal || profile.d2 || 0,
            depths: profile.meanDepth || 0,
            concentration: profile.concentration?.length ? profile.concentration.reduce((a, b) => a + b, 0) / profile.concentration.length : 0,
            dThermal: profile.d_thermal || 0,
            diffusionProfile: {
                D1: profile.d1 || 0, D2: profile.d2 || 0, Q1: profile.q1_ev || 0, Q2: profile.q2_ev || 0,
                D_thermal: profile.d_thermal || 0, D_effective: profile.d_effective || 0, depth: profile.meanDepth || 0
            },
            plasmaParameters: {
                electronDensity: stats.electronDensity || 0, electronVelocity: stats.electronVelocity || 0,
                currentDensity: stats.currentDensity || 0, ionEnergy: plasma.ionEnergyOverride || request?.voltage || 0,
                voltage: request?.voltage || plasma.voltage || 0, pressure: request?.pressure || plasma.pressure || 0,
                electronTemp: request?.electronTemp || plasma.electronTemperature || 0, ionFlux: stats.ionFlux || 0
            },
            perAtomTransferredEnergies: [],
            coolingProfile: stats.thermalTimes || [],
            intermediate: result.intermediate || null,

        };

        await SimulationAPI.save(saveData);

        if (!silent) {
            const msg = SimulationState.alloyComponents.length > 1
                ? `Сохранён ${firstAtom.atomName} (первый из ${SimulationState.alloyComponents.length} компонентов)`
                : 'Результаты сохранены успешно!';
            window.PlasmaAnimations?.ToastNotifications.show(msg, 'success', 5000);
        }
    } catch (error) {
        console.error('[Simulation] Save error:', error);
        if (!silent) window.PlasmaAnimations?.ToastNotifications.show(error instanceof Error ? error.message : 'Ошибка сохранения результатов', 'error');
    } finally {
        if (saveBtn && !silent) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Сохранить результаты';
        }
    }
};

const AutoGenerationManager = {
    rand(min, max, fixed = 3) {
        return +(Math.random() * (max - min) + min).toFixed(fixed);
    },

    generateParams(presetName) {
        const p = this.getPreset(presetName);
        const t = Math.random();

        const pressure = +(p.pressure[0] + t * (p.pressure[1] - p.pressure[0])).toFixed(3);
        const voltage = +(p.voltage[1] - t * (p.voltage[1] - p.voltage[0])).toFixed(0);

        return {
            voltage: voltage,
            current: this.rand(p.current[0], p.current[1], 3),
            pressure: pressure,
            electronTemp: this.rand(p.et[0], p.et[1], 0),
            chamberWidth: this.rand(p.width[0], p.width[1], 3),
            chamberDepth: this.rand(p.depth[0], p.depth[1], 3),
            exposureTime: this.rand(p.time[0], p.time[1], 2),
            angle: this.rand(p.angle[0], p.angle[1], 1),
            ambientTemp: this.rand(p.ambient[0], p.ambient[1], 0),
            electrodeDistance: this.rand(p.electrodeDistance[0], p.electrodeDistance[1], 3)  // всегда 0.55
        };
    },

    generateRandomAlloy() {
        const pool = window.availableAtoms;
        if (!pool?.length) return null;
        const count = Math.min(pool.length, Math.floor(Math.random() * 3) + 2);
        const picked = [...pool].sort(() => Math.random() - 0.5).slice(0, count);
        const fracs = normaliseFractions(picked.map(() => Math.random() + 0.1));
        return picked.map((atom, i) => ({
            atomId: atom.id, atomName: atom.atomName, fullName: atom.fullName,
            debye_temperature: atom.debye_temperature ?? 400, fraction: fracs[i]
        }));
    },

    generateRandomIons() {
        const pool = window.availableIons;
        if (!pool?.length) return null;
        const count = Math.min(pool.length, Math.floor(Math.random() * 3) + 1);
        const picked = [...pool].sort(() => Math.random() - 0.5).slice(0, count);
        const fracs = normaliseFractions(picked.map(() => Math.random() + 0.1));
        return picked.map((ion, i) => ({
            ionId: ion.id, ionName: ion.name, charge: ion.charge, fraction: fracs[i]
        }));
    },

    getPreset(name) {
        if (name !== "custom") return AUTOGEN_PRESETS[name];

        const getRange = (minId, maxId, defMin, defMax) => {
            const min = parseFloat(document.getElementById(minId)?.value);
            const max = parseFloat(document.getElementById(maxId)?.value);
            if (!Number.isFinite(min) || !Number.isFinite(max)) return [defMin, defMax];
            return min > max ? [max, min] : [min, max];
        };

        const def = AUTOGEN_PRESETS.custom;
        return {
            voltage: getRange('cvMin', 'cvMax', def.voltage[0], def.voltage[1]),
            current: getRange('ccMin', 'ccMax', def.current[0], def.current[1]),
            pressure: getRange('cpMin', 'cpMax', def.pressure[0], def.pressure[1]),
            et: getRange('ceMin', 'ceMax', def.et[0], def.et[1]),
            width: def.width,
            depth: def.depth,
            time: def.time,
            angle: def.angle,
            ambient: def.ambient,
            electrodeDistance: def.electrodeDistance
        };
    },

    validateCustomPreset() {
        const fields = [
            { min: 'cvMin', max: 'cvMax', name: 'Напряжение' },
            { min: 'ccMin', max: 'ccMax', name: 'Ток' },
            { min: 'cpMin', max: 'cpMax', name: 'Давление' },
            { min: 'ceMin', max: 'ceMax', name: 'Температура электронов' }
        ];

        for (const field of fields) {
            const min = parseFloat(document.getElementById(field.min)?.value);
            const max = parseFloat(document.getElementById(field.max)?.value);

            if (!Number.isFinite(min) || !Number.isFinite(max)) {
                window.PlasmaAnimations?.ToastNotifications.show(`Заполните корректно диапазон: ${field.name}`, 'error');
                return false;
            }
            if (min < 0 || max < 0) {
                window.PlasmaAnimations?.ToastNotifications.show(`${field.name}: значения не могут быть отрицательными`, 'error');
                return false;
            }
        }
        return true;
    },

    updateProgress(current, total, status = '') {
        const el = document.getElementById('autogenProgress');
        if (!el) return;
        el.innerHTML = `<div class="alloy-total"><strong>${current}/${total}</strong> (${((current / total) * 100).toFixed(1)}%)<br>${status}</div>`;
    },

    async start() {
        const useRandom = document.getElementById('autogenRandomAlloy')?.checked ?? false;

        if (!useRandom && (!SimulationState.alloyComponents.length || !SimulationState.ionComponents.length)) {
            window.PlasmaAnimations?.ToastNotifications.show('Задайте состав или включите «Случайный сплав и ион»', 'error');
            return;
        }
        if (useRandom && (!window.availableAtoms?.length || !window.availableIons?.length)) {
            window.PlasmaAnimations?.ToastNotifications.show('Список атомов/ионов ещё не загружен', 'error');
            return;
        }

        const preset = document.getElementById('autogenPreset')?.value || 'custom';
        const count = Math.max(1, parseInt(document.getElementById('autogenCount')?.value || '1', 10));

        if (preset === 'custom' && !this.validateCustomPreset()) return;

        SimulationState.autoGenRunning = true;
        SimulationState.autoGenCancelled = false;
        SimulationState.autoGenResults = [];
        const cancelBtn = document.getElementById('cancelAutogenBtn');
        if (cancelBtn) cancelBtn.disabled = false;

        for (let i = 1; i <= count; i++) {
            if (SimulationState.autoGenCancelled) break;

            try {
                this.updateProgress(i - 1, count, `Симуляция ${i}...`);

                let runAlloy, runIons;
                if (useRandom) {
                    runAlloy = this.generateRandomAlloy();
                    runIons = this.generateRandomIons();
                    if (!runAlloy || !runIons) {
                        this.updateProgress(i, count, `Ошибка генерации состава на шаге ${i}`);
                        continue;
                    }
                } else {
                    runAlloy = SimulationState.alloyComponents;
                    runIons = SimulationState.ionComponents;
                }

                const gen = this.generateParams(preset);
                const requestData = {
                    configId: 1,
                    atomId: Number(runAlloy[0].atomId),
                    ionId: Number(runIons[0].ionId),
                    voltage: gen.voltage, current: gen.current, pressure: gen.pressure,
                    electronTemp: gen.electronTemp, chamberWidth: gen.chamberWidth,
                    chamberDepth: gen.chamberDepth, exposureTime: gen.exposureTime,
                    angle: gen.angle, ambientTemp: gen.ambientTemp,
                    composition: runAlloy.map(buildAlloyComponentDto),
                    ionComposition: runIons.map(buildIonComponentDto)
                };

                const result = await SimulationAPI.run(requestData);
                SimulationState.currentResult = result;
                SimulationState.currentRequest = requestData;
                SimulationState.autoGenResults.push({
                    request: requestData,
                    result,
                    savedResultId: result.savedResult?.id ?? null
                });
                this.updateProgress(i, count, `Сохранено ${i}/${count}`);

            } catch (err) {
                console.error(`[AutoGen] Ошибка в симуляции ${i}:`, err);
                this.updateProgress(i, count, `Ошибка на шаге ${i}`);
            }
        }

        SimulationState.autoGenRunning = false;
        if (cancelBtn) cancelBtn.disabled = true;

        const msg = SimulationState.autoGenCancelled
            ? 'Автогенерация отменена'
            : `Автогенерация завершена: ${SimulationState.autoGenResults.length} симуляций`;
        window.PlasmaAnimations?.ToastNotifications.show(msg, SimulationState.autoGenCancelled ? 'warning' : 'success', 6000);
    },

    cancel() {
        SimulationState.autoGenCancelled = true;
    }
};

window.startAutoGeneration = () => AutoGenerationManager.start();
window.cancelAutoGeneration = () => AutoGenerationManager.cancel();

const PresetManager = {
    init() {
        const presetSelect = document.getElementById("autogenPreset");
        const customPanel = document.getElementById("customPresetPanel");
        if (!presetSelect || !customPanel) return;

        const applyCustomDefaults = () => {
            const def = AUTOGEN_PRESETS.custom;
            document.getElementById('cvMin').value = def.voltage[0];
            document.getElementById('cvMax').value = def.voltage[1];
            document.getElementById('ccMin').value = def.current[0];
            document.getElementById('ccMax').value = def.current[1];
            document.getElementById('cpMin').value = def.pressure[0];
            document.getElementById('cpMax').value = def.pressure[1];
            document.getElementById('ceMin').value = def.et[0];
            document.getElementById('ceMax').value = def.et[1];
        };

        presetSelect.addEventListener("change", () => {
            if (presetSelect.value === "custom") {
                customPanel.style.display = "block";
                applyCustomDefaults();
            } else {
                customPanel.style.display = "none";
            }
        });

        if (presetSelect.value === "custom") {
            customPanel.style.display = "block";
            applyCustomDefaults();
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    (async () => {
        console.log('[Simulation] Initializing...');
        if (!window.PlasmaAuth || !window.PlasmaAuth.requireAuth()) return;
        const isValid = await window.PlasmaAuth.verifyAuth();
        if (!isValid) return;

        TabManager.init();
        FormHandler.init();
        PresetManager.init();

        await FormHandler.loadAtoms();
        await FormHandler.loadIons();

        console.log('[Simulation] Ready');
    })();
});

console.log('[Simulation] loaded');