'use strict';

// ==============================================================
// Configuration
// ==============================================================

const SIMULATION_CONFIG = {
    API_SIMULATION: '/api/simulation/run', API_SAVE: '/api/simulation/create', API_ATOMS: '/atoms', API_IONS: '/ions',
};

const AUTOGEN_PRESETS = {
    cvd: {
        voltage: [50, 300],
        current: [0.5, 5.0],
        pressure: [10, 200],
        et: [5800, 23200],
        width: [0.15, 0.5],
        depth: [0.15, 0.5],
        time: [30, 600],
        angle: [0, 10]
    }, magnetron: {
        voltage: [1200, 4000],
        current: [0.005, 0.05],
        pressure: [0.1, 8],
        et: [4000, 4000],
        width: [0.55, 0.55],
        depth: [0.55, 0.55],
        time: [1800, 1800],
        angle: [0, 60]
    }, etching: {
        voltage: [600, 1500],
        current: [0.05, 0.1],
        pressure: [4, 20],
        et: [4000, 4000],
        width: [0.55, 0.55],
        depth: [0.55, 0.55],
        time: [1800, 1800],
        angle: [0, 60]
    }, implant: {
        voltage: [150, 1000],
        current: [0.01, 5.0],
        pressure: [10, 110],
        et: [4000, 4000],
        width: [0.55, 0.55],
        depth: [0.55, 0.55],
        time: [1800, 1800],
        angle: [0, 60]
    }, custom: {
        voltage: [100, 2000],
        current: [0.01, 5.0],
        pressure: [0.01, 200],
        et: [5800, 116000],
        width: [0.05, 0.5],
        depth: [0.05, 0.5],
        time: [0.5, 120],
        angle: [0, 60]
    },
};

// ==============================================================
// JSDoc typedefs
// ==============================================================

/**
 * @typedef {Object} AlloyComponent
 * @property {number} atomId
 * @property {string} atomName
 * @property {string} fullName
 * @property {number} debye_temperature
 * @property {number} fraction
 */

/**
 * @typedef {Object} IonComponent
 * @property {number} ionId
 * @property {string} ionName
 * @property {number} charge
 * @property {number} fraction
 */

/**
 * @typedef {Object} DiffusionProfile
 * @property {number} d1
 * @property {number} d2
 * @property {number} q1_ev
 * @property {number} q2_ev
 * @property {number} d_thermal
 * @property {number} d_effective
 * @property {number} meanDepth
 * @property {number[]} depths
 * @property {number[]} concentration
 */

/**
 * @typedef {Object} PhysicsStats
 * @property {number}     electronDensity
 * @property {number}     electronVelocity
 * @property {number}     currentDensity
 * @property {number}     surfaceBindingEnergy
 * @property {number}     totalTransferredEnergy
 * @property {number}     avgTransferredPerAtom
 * @property {number}     totalDamage
 * @property {number}     totalMomentum
 * @property {number}     totalDisplacement
 * @property {number}     finalProbeTemperature
 * @property {number}     debyeFrontSpeed
 * @property {number}     fluence
 * @property {number}     fluenceEff
 * @property {number}     ionFlux
 * @property {number}     resonanceXi
 * @property {number}     dSlr
 * @property {number}     dRes
 * @property {number}     debyeFrontDepth
 * @property {number}     energyGainFactor
 * @property {number}     plasmaCorrectionFactor
 * @property {number}     exposureRate
 * @property {number}     modifiedLayerThickness
 * @property {number}     skinDepth
 * @property {number}     skinSurfacePower
 * @property {number}     skinAccumulatedEnergy
 * @property {number}     skinTemperatureDelta
 * @property {number}     effectiveSurfaceTemperature
 * @property {number[]}   thermalTimes
 * @property {number[]}   thermalDepths
 * @property {number[][]} thermalTemperatureMap
 */

/**
 * @typedef {Object} PlasmaConfig
 * @property {number} [id]
 * @property {number} [voltage]
 * @property {number} [current]
 * @property {number} [pressure]
 * @property {number} [electronTemperature]
 * @property {number} [ionTemperature]
 * @property {number} [ionEnergyOverride]
 * @property {number} [chamberWidth]
 * @property {number} [chamberDepth]
 * @property {number} [exposureTime]
 * @property {number} [currentDensity]
 * @property {number} [electronDensity]
 * @property {number} [electronVelocity]
 */

/**
 * @typedef {Object} SimResult
 * @property {DiffusionProfile} profile
 * @property {PhysicsStats}     stats
 * @property {PlasmaConfig}     plasmaConfig
 * @property {Object}           plasmaResult
 * @property {Object}           intermediate
 * @property {Object}           atom
 * @property {Object}           ion
 */

/**
 * @typedef {Object} SimRequest
 * @property {number}           atomId
 * @property {number}           ionId
 * @property {number}           voltage
 * @property {number}           current
 * @property {number}           pressure
 * @property {number}           electronTemp
 * @property {number}           chamberWidth
 * @property {number}           chamberDepth
 * @property {number}           angle
 * @property {number}           exposureTime
 * @property {number}           ambientTemp
 * @property {AlloyComponent[]} composition
 * @property {Object[]}         ionComposition
 */

// ==============================================================
// State
// ==============================================================

const SimulationState = {
    /** @type {SimResult|null} */
    currentResult: null,
    /** @type {SimRequest|null} */
    currentRequest: null,
    /** @type {AlloyComponent[]} */
    alloyComponents: [],
    /** @type {IonComponent[]} */
    ionComponents: [],
    autoGenRunning: false,
    autoGenCancelled: false,
    /** @type {Array<{request: SimRequest, result: SimResult}>} */
    autoGenResults: [],
};

// ==============================================================
// Fraction normalisation
// ==============================================================

/**
 * @param {number[]} weights
 * @returns {number[]}
 */
function normaliseFractions(weights) {
    const total = weights.reduce((s, w) => s + w, 0);
    const SCALE = 1e6;
    const fracs = weights.map(w => Math.round((w / total) * SCALE) / SCALE);
    const partial = fracs.slice(0, -1).reduce((s, f) => s + f, 0);
    fracs[fracs.length - 1] = Math.round((1 - partial) * SCALE) / SCALE;
    return fracs;
}

// ==============================================================
// Request builders
// ==============================================================

/**
 * Builds AlloyComponentDto — matches Java class AlloyComponentDto fields exactly.
 * Tries both atomId and atom.id to be safe; sends debyeTemperature (camelCase).
 * @param {AlloyComponent} c
 * @returns {Object}
 */
function buildAlloyComponentDto(c) {
    return {
        atomId: Number(c.atomId),
        atomName: c.atomName || '',
        fraction: c.fraction,
        debyeTemperature: c.debye_temperature ?? 400,
    };
}

/**
 * Builds IonComponentDto — matches Java class IonComponentDto fields.
 * Sends both top-level ionId AND nested ion.id since we don't know the exact
 * field name without seeing IonComponentDto.java.
 * @param {IonComponent} c
 * @returns {Object}
 */
function buildIonComponentDto(c) {
    return {
        ionId: Number(c.ionId),
        ion: {id: Number(c.ionId)},
        ionName: c.ionName || '',
        charge: c.charge ?? 0,
        fraction: c.fraction,
    };
}

// ==============================================================
// API Client
// ==============================================================

const SimulationAPI = {
    /**
     * @param {SimRequest} requestData
     * @returns {Promise<SimResult>}
     */
    async run(requestData) {
        const response = await window.PlasmaAuth.apiRequest(SIMULATION_CONFIG.API_SIMULATION, requestData, true);
        if (!response.ok) throw new Error(response.data?.message || 'Simulation failed');
        return response.data?.data ?? response.data;
    },

    /**
     * @param {Object} resultData
     * @returns {Promise<Object>}
     */
    async save(resultData) {
        if (!resultData.atomId || !resultData.ionId) throw new Error('atomId и ionId обязательны для сохранения');
        const response = await window.PlasmaAuth.apiRequest(SIMULATION_CONFIG.API_SAVE, resultData, true);
        if (!response.ok) throw new Error(response.data?.message || 'Failed to save');
        return response.data?.data ?? response.data;
    },

    /** @returns {Promise<Object[]>} */
    async getAtoms() {
        const response = await window.PlasmaAuth.apiRequest(SIMULATION_CONFIG.API_ATOMS, null, true);
        if (!response.ok) throw new Error('Failed to fetch atoms');
        return response.data?.data || response.data || [];
    },

    /** @returns {Promise<Object[]>} */
    async getIons() {
        const response = await window.PlasmaAuth.apiRequest(SIMULATION_CONFIG.API_IONS, null, true);
        if (!response.ok) throw new Error('Failed to fetch ions');
        return response.data?.data || response.data || [];
    },
};

// ==============================================================
// UI Manager
// ==============================================================

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
            } else clearInterval(iv);
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

    /** @param {string} message */
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

    /**
     * @param {SimResult}  result
     * @param {SimRequest} simReq
     */
    fillResults(result, simReq) {
        /** @type {DiffusionProfile} */
        const profile = result.profile || {};
        /** @type {PhysicsStats} */
        const stats = result.stats || {};
        /** @type {PlasmaConfig} */
        const plasma = result.plasmaConfig || {};
        /** @type {EnergyDepositionResult} */
        const energy = profile.energyDeposition || result.intermediate?.energyDeposition || {};
        /** @type {ThermalIntermediate} */
        const thermal = result.intermediate?.thermal || {};
        /** @type {DiffusionIntermediate} */
        const diffInt = profile.diffusionIntermediate || result.intermediate?.diffusion || {};
        /** @type {AlloyComposition} */
        const alloy = result.alloy || {};
        /** @type {IonComposition} */
        const ionComp = result.ionComposition || {};

        const sci = (v) => (v == null || isNaN(+v)) ? '—' : (+v).toExponential(3);
        const num = (v, d = 2) => (v == null || isNaN(+v)) ? '—' : (+v).toFixed(d);
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
            return arr.map(c => {
                const name = c.ionName || c.ionId || '?';
                return `${name} ${((c.fraction ?? 0) * 100).toFixed(1)}%`;
            }).join(' · ');
        };

        // ══════════════════════════════════════════════════════════
        // 1. ВХОДНЫЕ ПАРАМЕТРЫ
        // ══════════════════════════════════════════════════════════
        if (simReq) {
            set('r_composition', fmtComp(simReq.composition));
            set('r_ion_composition', fmtIon(simReq.ionComposition));
            set('r_voltage', num(simReq.voltage, 0));
            set('r_current', num(simReq.current, 3));
            set('r_pressure', num(simReq.pressure, 2));
            set('r_electron_temp', num(simReq.electronTemp, 0));
            set('r_chamber_width', num(simReq.chamberWidth, 3));
            set('r_chamber_depth', num(simReq.chamberDepth, 3));
            set('r_exposure_time', num(simReq.exposureTime, 0));
            set('r_angle', num(simReq.angle, 1));
        }

        // ══════════════════════════════════════════════════════════
        // 2. ДИФФУЗИЯ (вкладка diffusion-tab)
        // ══════════════════════════════════════════════════════════
        set('r_d_effective', sci(profile.d_effective));
        set('r_d_thermal', sci(profile.d_thermal));
        set('r_mean_depth', sci(profile.meanDepth));
        set('r_d1', sci(profile.d1));
        set('r_d2', sci(profile.d2));
        set('r_q1', num(profile.q1_ev, 3));
        set('r_q2', num(profile.q2_ev, 3));

        // Дополнительные параметры диффузии из diffusionIntermediate
        set('diff_d_radiation', sci(diffInt.dRadiation));
        set('diff_d_collision', sci(diffInt.dCollision));
        set('diff_slr_factor', num(diffInt.slrFactor, 4));
        set('diff_damage_rate', sci(diffInt.damageRate));
        set('diff_projected_range', sci(diffInt.projectedRange));
        set('diff_straggle_sigma', sci(diffInt.straggleSigma));
        set('diff_lattice_stiffness', sci(diffInt.latticeStiffness));
        set('diff_equilibrium_dist', sci(diffInt.equilibriumDistance));

        // Резонансные параметры из stats
        set('diff_resonance_xi', num(stats.resonanceXi, 4));
        set('diff_d_slr', sci(stats.dSlr));
        set('diff_d_res', sci(stats.dRes));

        // ══════════════════════════════════════════════════════════
        // 3. ЭНЕРГИЯ (вкладка energy-tab)
        // ══════════════════════════════════════════════════════════

        // Основные энергетические параметры
        set('ps_total_energy', sci(stats.totalTransferredEnergy));
        set('ps_avg_energy', sci(stats.avgTransferredPerAtom));
        set('ps_binding_energy', num(stats.surfaceBindingEnergy, 3));
        set('pc_ion_energy', num(plasma.ionEnergyOverride, 3));

        // Формулы (2)–(5) из EnergyDepositionResult
        set('energy_gain_factor', num(energy.energyGainFactor, 4));
        set('plasma_correction_factor', num(energy.plasmaCorrectionFactor, 4));
        set('exposure_rate', sci(energy.exposureRate));
        set('fluence', sci(energy.fluence));
        set('modified_layer_thickness', sci(energy.modifiedLayerThickness));

        // Потенциал и поле
        set('energy_potential_surface', num(energy.potentialAtSurface, 2));
        set('energy_accelerating_field', sci(energy.acceleratingField));

        // ══════════════════════════════════════════════════════════
        // 4. ТЕМПЕРАТУРА (вкладка thermal-tab)
        // ══════════════════════════════════════════════════════════

        // 4.1 Температурные параметры (из ThermalIntermediate)
        set('thermal_probe_temp', num(stats.finalProbeTemperature, 2));
        set('thermal_debye_speed', sci(stats.debyeFrontSpeed));
        set('thermal_debye_depth', sci(stats.debyeFrontDepth));

        // 4.2 Скин-эффект (формулы 6–12 из EnergyDepositionResult)
        set('skin_depth', sci(energy.skinDepth));
        set('skin_surface_power', sci(energy.skinSurfacePower));
        set('skin_accumulated_energy', sci(energy.skinAccumulatedEnergy));
        set('skin_temperature_delta', num(energy.skinTemperatureDelta, 2));
        set('skin_effective_temp', num(energy.effectiveSurfaceTemperature, 2));

        // 4.3 Параметры плазмы
        set('plasma_electron_density', sci(stats.electronDensity));
        set('plasma_electron_velocity', sci(stats.electronVelocity));
        set('plasma_current_density', sci(stats.currentDensity));

        // 4.4 Радиационное повреждение
        set('damage_total', sci(stats.totalDamage));
        set('damage_momentum', sci(stats.totalMomentum));
        set('damage_displacement', sci(stats.totalDisplacement));
        set('damage_fluence', sci(stats.fluence));
        set('damage_fluence_eff', sci(stats.fluenceEff));
        set('damage_ion_flux', sci(stats.ionFlux));

        // ══════════════════════════════════════════════════════════
        // 5. 3D ВИЗУАЛИЗАЦИЯ
        // ══════════════════════════════════════════════════════════
        if (window.addPhysics3DData) {
            window.addPhysics3DData(stats, simReq);
        }
        if (window.renderPhysicsStats3D) {
            window.renderPhysicsStats3D(window.current3DViewType || 'surface');
        }
    },

};

// ==============================================================
// Alloy Manager
// ==============================================================

const AlloyManager = {
    addComponent() {
        const atomIdEl = /** @type {HTMLSelectElement|null} */ (document.getElementById('alloyAtomId'));
        const fractionEl = /** @type {HTMLInputElement|null}  */ (document.getElementById('alloyFraction'));

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
            fraction,
        });

        this.renderComponents();
        if (fractionEl) fractionEl.value = '';
    },

    /** @param {number} index */
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
    },
};

// ==============================================================
// Ion Composition Manager
// ==============================================================

const IonCompositionManager = {
    addComponent() {
        const ionIdEl = /** @type {HTMLSelectElement|null} */ (document.getElementById('ionCompIonId'));
        const fractionEl = /** @type {HTMLInputElement|null}  */ (document.getElementById('ionCompFraction'));

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
            ionId: ion.id, ionName: ion.name, charge: ion.charge, fraction,
        });

        this.renderComponents();
        if (fractionEl) fractionEl.value = '';
    },

    /** @param {number} index */
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
    },
};

// ==============================================================
// Global helpers
// ==============================================================

window.addAlloyComponent = () => AlloyManager.addComponent();
window.removeAlloyComponent = (idx) => AlloyManager.removeComponent(idx);
window.addIonComponent = () => IonCompositionManager.addComponent();
window.removeIonComponent = (idx) => IonCompositionManager.removeComponent(idx);

// ==============================================================
// Tab Manager
// ==============================================================

const TabManager = {
    init() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.getAttribute('data-tab');
                if (tabName) this.switchTab(tabName);
            });
        });
    },

    /** @param {string} tabName */
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
    },
};

// ==============================================================
// Form Handler
// ==============================================================

const FormHandler = {
    init() {
        const form = document.getElementById('simulationForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                void this.handleSubmit(/** @type {HTMLFormElement} */ (form));
            });
        }
    },

    /** @param {HTMLFormElement} form */
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

        /** @type {SimRequest} */
        const requestData = {
            // top-level ids — SimulationRequest.atomId / ionId
            atomId: Number(primaryAtom.atomId),
            ionId: Number(primaryIon.ionId),

            voltage: parseFloat(getField('voltage')),
            current: parseFloat(getField('current')),
            pressure: parseFloat(getField('pressure')),
            electronTemp: parseFloat(getField('electronTemp')),
            chamberWidth: parseFloat(getField('chamberWidth')),
            chamberDepth: parseFloat(getField('chamberDepth')),
            angle: parseFloat(getField('angle')),
            exposureTime: parseFloat(getField('exposureTime')),
            ambientTemp: parseFloat(getField('ambientTemp')) || 300,

            // List<AlloyComponentDto>
            composition: SimulationState.alloyComponents.map(buildAlloyComponentDto),

            // List<IonComponentDto>
            ionComposition: SimulationState.ionComponents.map(buildIonComponentDto),
        };

        console.log('[Simulation] Request:', JSON.stringify(requestData, null, 2));

        try {
            SimulationUI.showLoading();
            const result = await SimulationAPI.run(requestData);
            SimulationState.currentResult = result;
            SimulationState.currentRequest = requestData;
            SimulationUI.showResults();
            SimulationUI.fillResults(result, requestData);
            window.PlasmaAnimations?.ToastNotifications.show('Симуляция выполнена успешно!', 'success', 3000);
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
        const select = /** @type {HTMLSelectElement|null} */ (document.getElementById('alloyAtomId'));
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
        const select = /** @type {HTMLSelectElement|null} */ (document.getElementById('ionCompIonId'));
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
    },
};

// ==============================================================
// Save Results
// ==============================================================

window.saveResults = async () => {
    if (!SimulationState.currentResult) {
        window.PlasmaAnimations?.ToastNotifications.show('Нет результатов для сохранения', 'error');
        return;
    }

    const saveBtn = /** @type {HTMLButtonElement|null} */ (document.getElementById('saveBtn'));
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Сохранение...';
    }

    try {
        /** @type {SimResult} */
        const result = SimulationState.currentResult;
        /** @type {SimRequest|null} */
        const request = SimulationState.currentRequest;

        const firstAtom = SimulationState.alloyComponents[0];
        const firstIon = SimulationState.ionComponents[0];

        if (!firstAtom?.atomId || !firstIon?.ionId) {
            window.PlasmaAnimations?.ToastNotifications.show('Не удалось определить атом и ион для сохранения', 'error');
            return;
        }

        /** @type {DiffusionProfile} */
        const profile = result.profile || {};
        /** @type {PhysicsStats} */
        const stats = result.stats || {};
        /** @type {PlasmaConfig} */
        const plasma = result.plasmaConfig || {};

        // AtomCompositionItemDTO
        const atomComposition = SimulationState.alloyComponents.map(c => ({
            atomId: Number(c.atomId), fraction: c.fraction,
        }));

        // IonCompositionItemDTO
        const ionComposition = SimulationState.ionComponents.map(c => ({
            ionId: Number(c.ionId), fraction: c.fraction,
        }));

        const saveData = {
            atomId: Number(firstAtom.atomId),
            ionId: Number(firstIon.ionId),
            configId: plasma.id || 1,

            atomComposition,
            ionComposition,

            atomName: firstAtom.atomName || 'Unknown',
            s: `${firstAtom.atomName} ${(firstAtom.fraction * 100).toFixed(1)}%`,

            totalTransferredEnergy: stats.totalTransferredEnergy || 0,
            avgTransferredPerAtom: stats.avgTransferredPerAtom || 0,
            avgT: stats.finalProbeTemperature || 0,
            minT: stats.finalProbeTemperature || 0,
            maxT: stats.finalProbeTemperature || 0,


            totalMomentum: stats.totalMomentum || 0,
            totalDamage: stats.totalDamage || 0,
            totalDisplacement: stats.totalDisplacement || 0,

            fluence: stats.fluence || 0,
            fluenceEff: stats.fluenceEff || 0,
            ionFlux: stats.ionFlux || 0,
            resonanceXi: stats.resonanceXi || 0,
            dSlr: stats.dSlr || 0,
            dRes: stats.dRes || 0,

            diffusionCoefficient1: profile.d_effective || profile.d1 || 0,
            diffusionCoefficient2: profile.d_thermal || profile.d2 || 0,

            depths: profile.meanDepth || 0,
            concentration: profile.concentration?.length ? profile.concentration.reduce((a, b) => a + b, 0) / profile.concentration.length : 0,
            dThermal: profile.d_thermal || 0,

            diffusionProfile: {
                D1: profile.d1 || 0,
                D2: profile.d2 || 0,
                Q1: profile.q1_ev || 0,
                Q2: profile.q2_ev || 0,
                D_thermal: profile.d_thermal || 0,
                D_effective: profile.d_effective || 0,
                depth: profile.meanDepth || 0,
            },

            plasmaParameters: {
                electronDensity: stats.electronDensity || 0,
                electronVelocity: stats.electronVelocity || 0,
                currentDensity: stats.currentDensity || 0,
                ionEnergy: plasma.ionEnergyOverride || request?.voltage || 0,
                voltage: request?.voltage || plasma.voltage || 0,
                pressure: request?.pressure || plasma.pressure || 0,
                electronTemp: request?.electronTemp || plasma.electronTemperature || 0,
                ionFlux: stats.ionFlux || 0,
            },

            perAtomTransferredEnergies: [],
            coolingProfile: stats.thermalTimes || [],
            intermediate: result.intermediate || null,
        };

        await SimulationAPI.save(saveData);

        let msg = 'Результаты сохранены успешно!';
        if (SimulationState.alloyComponents.length > 1) {
            msg = `Сохранён ${firstAtom.atomName} (первый из ${SimulationState.alloyComponents.length} компонентов)`;
        }
        window.PlasmaAnimations?.ToastNotifications.show(msg, 'success', 5000);

    } catch (error) {
        console.error('[Simulation] Save error:', error);
        window.PlasmaAnimations?.ToastNotifications.show(error instanceof Error ? error.message : 'Ошибка сохранения результатов', 'error');
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Сохранить результаты';
        }
    }
};

// ==============================================================
// Auto Generation Manager
// ==============================================================

const AutoGenerationManager = {
    /**
     * @param {number} min
     * @param {number} max
     * @param {number} [fixed]
     * @returns {number}
     */
    rand(min, max, fixed = 3) {
        return +(Math.random() * (max - min) + min).toFixed(fixed);
    },

    /** @param {string} presetName @returns {Object} */
    generateParams(presetName) {
        const p = AUTOGEN_PRESETS[presetName] || AUTOGEN_PRESETS.custom;
        return {
            voltage: this.rand(p.voltage[0], p.voltage[1], 0),
            current: this.rand(p.current[0], p.current[1], 3),
            pressure: this.rand(p.pressure[0], p.pressure[1], 3),
            electronTemp: this.rand(p.et[0], p.et[1], 0),
            chamberWidth: this.rand(p.width[0], p.width[1], 3),
            chamberDepth: this.rand(p.depth[0], p.depth[1], 3),
            exposureTime: this.rand(p.time[0], p.time[1], 2),
            angle: this.rand(p.angle[0], p.angle[1], 1),
            ambientTemp: 300,
        };
    },

    /** @returns {AlloyComponent[]|null} */
    generateRandomAlloy() {
        const pool = window.availableAtoms;
        if (!pool?.length) return null;
        const count = Math.min(pool.length, Math.floor(Math.random() * 3) + 2);
        const picked = [...pool].sort(() => Math.random() - 0.5).slice(0, count);
        const fracs = normaliseFractions(picked.map(() => Math.random() + 0.1));
        return picked.map((atom, i) => ({
            atomId: atom.id,
            atomName: atom.atomName,
            fullName: atom.fullName,
            debye_temperature: atom.debye_temperature ?? 400,
            fraction: fracs[i],
        }));
    },

    /** @returns {IonComponent[]|null} */
    generateRandomIons() {
        const pool = window.availableIons;
        if (!pool?.length) return null;
        const count = Math.min(pool.length, Math.floor(Math.random() * 3) + 1);
        const picked = [...pool].sort(() => Math.random() - 0.5).slice(0, count);
        const fracs = normaliseFractions(picked.map(() => Math.random() + 0.1));
        return picked.map((ion, i) => ({
            ionId: ion.id, ionName: ion.name, charge: ion.charge, fraction: fracs[i],
        }));
    },

    /**
     * @param {number} current
     * @param {number} total
     * @param {string} [status]
     */
    updateProgress(current, total, status = '') {
        const el = document.getElementById('autogenProgress');
        if (!el) return;
        el.innerHTML = `
            <div class="alloy-total">
                <strong>${current}/${total}</strong> (${((current / total) * 100).toFixed(1)}%)
                <br>${status}
            </div>`;
    },

    async start() {
        const randomCheckbox = /** @type {HTMLInputElement|null} */ (document.getElementById('autogenRandomAlloy'));
        const useRandom = randomCheckbox ? randomCheckbox.checked : false;

        if (!useRandom) {
            if (!SimulationState.alloyComponents.length || !SimulationState.ionComponents.length) {
                window.PlasmaAnimations?.ToastNotifications.show('Сначала задайте состав сплава и ионов (или включите «Случайный сплав и ион»)', 'error');
                return;
            }
        } else {
            if (!window.availableAtoms?.length || !window.availableIons?.length) {
                window.PlasmaAnimations?.ToastNotifications.show('Список атомов/ионов ещё не загружен, попробуйте позже', 'error');
                return;
            }
        }

        const presetEl = /** @type {HTMLSelectElement|null} */ (document.getElementById('autogenPreset'));
        const countEl = /** @type {HTMLInputElement|null}  */ (document.getElementById('autogenCount'));
        const preset = presetEl ? presetEl.value : 'custom';
        const count = Math.max(1, parseInt(countEl ? countEl.value : '1', 10));

        SimulationState.autoGenRunning = true;
        SimulationState.autoGenCancelled = false;
        SimulationState.autoGenResults = [];

        const cancelBtn = /** @type {HTMLButtonElement|null} */ (document.getElementById('cancelAutogenBtn'));
        if (cancelBtn) cancelBtn.disabled = false;

        for (let i = 1; i <= count; i++) {
            if (SimulationState.autoGenCancelled) break;

            try {
                this.updateProgress(i - 1, count, `Симуляция ${i}...`);

                /** @type {AlloyComponent[]} */
                let runAlloy;
                /** @type {IonComponent[]} */
                let runIons;

                if (useRandom) {
                    const genAlloy = this.generateRandomAlloy();
                    const genIons = this.generateRandomIons();
                    if (!genAlloy || !genIons) {
                        this.updateProgress(i, count, `Ошибка генерации состава на шаге ${i}`);
                        continue;
                    }
                    runAlloy = genAlloy;
                    runIons = genIons;
                } else {
                    runAlloy = SimulationState.alloyComponents;
                    runIons = SimulationState.ionComponents;
                }

                const gen = this.generateParams(preset);

                /** @type {SimRequest} */
                const requestData = {
                    atomId: Number(runAlloy[0].atomId),
                    ionId: Number(runIons[0].ionId),

                    voltage: gen.voltage,
                    current: gen.current,
                    pressure: gen.pressure,
                    electronTemp: gen.electronTemp,
                    chamberWidth: gen.chamberWidth,
                    chamberDepth: gen.chamberDepth,
                    exposureTime: gen.exposureTime,
                    angle: gen.angle,
                    ambientTemp: gen.ambientTemp,

                    composition: runAlloy.map(buildAlloyComponentDto),
                    ionComposition: runIons.map(buildIonComponentDto),
                };

                const result = await SimulationAPI.run(requestData);
                SimulationState.currentResult = result;
                SimulationState.currentRequest = requestData;

                const prevAlloy = SimulationState.alloyComponents;
                const prevIons = SimulationState.ionComponents;
                SimulationState.alloyComponents = runAlloy;
                SimulationState.ionComponents = runIons;

                await window.saveResults();

                SimulationState.alloyComponents = prevAlloy;
                SimulationState.ionComponents = prevIons;

                SimulationState.autoGenResults.push({request: requestData, result});
                this.updateProgress(i, count, `Сохранено ${i}/${count}`);

            } catch (err) {
                console.error(`[AutoGen] Ошибка в симуляции ${i}:`, err);
                this.updateProgress(i, count, `Ошибка на шаге ${i}`);
            }
        }

        SimulationState.autoGenRunning = false;
        if (cancelBtn) cancelBtn.disabled = true;

        if (SimulationState.autoGenCancelled) {
            window.PlasmaAnimations?.ToastNotifications.show('Автогенерация отменена', 'warning');
        } else {
            window.PlasmaAnimations?.ToastNotifications.show(`Автогенерация завершена: ${SimulationState.autoGenResults.length} симуляций`, 'success', 6000);
        }
    },

    cancel() {
        SimulationState.autoGenCancelled = true;
    },
};

window.startAutoGeneration = () => void AutoGenerationManager.start();
window.cancelAutoGeneration = () => AutoGenerationManager.cancel();

// ==============================================================
// Initialization
// ==============================================================

document.addEventListener('DOMContentLoaded', () => {
    void (async () => {
        console.log('[Simulation] Initializing...');

        if (!window.PlasmaAuth || !window.PlasmaAuth.requireAuth()) return;
        const isValid = await window.PlasmaAuth.verifyAuth();
        if (!isValid) return;

        TabManager.init();
        FormHandler.init();

        await FormHandler.loadAtoms();
        await FormHandler.loadIons();

        FormHandler.populateAlloySelect();
        FormHandler.populateIonCompSelect();

        console.log('[Simulation] Ready');
    })();
});

console.log('[Simulation] loaded');