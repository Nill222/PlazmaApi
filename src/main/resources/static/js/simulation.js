'use strict';

const SIMULATION_CONFIG = {
    API_SIMULATION: '/api/simulation/run',
    API_SAVE: '/api/simulation/create',
    API_ATOMS: '/atoms',
    API_IONS: '/ions',
};

const AUTOGEN_PRESETS = {
    low: { voltage: [1200, 3500], current: [0.005, 0.05], pressure: [0.1, 5], et: [4000, 4000], width: [0.55, 0.55], depth: [0.55, 0.55], time: [1800, 1800], angle: [0, 60], ambient: [300, 300] },
    medium: { voltage: [700, 1200], current: [0.05, 0.1], pressure: [5, 15], et: [4000, 4000], width: [0.55, 0.55], depth: [0.55, 0.55], time: [1800, 1800], angle: [0, 60], ambient: [300, 300] },
    high: { voltage: [300, 800], current: [0.01, 5.0], pressure: [15, 100], et: [4000, 4000], width: [0.55, 0.55], depth: [0.55, 0.55], time: [1800, 1800], angle: [0, 60], ambient: [300, 300] },
    custom: { voltage: [100, 3500], current: [0.005, 5], pressure: [0.1, 100], et: [4000, 4000], width: [0.55, 0.55], depth: [0.55, 0.55], time: [600, 3600], angle: [0, 90], ambient: [280, 300] }
};

const SimulationState = {
    currentResult: null,
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
    }
};

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
        const profile = result.profile || {};
        const stats = result.stats || {};
        const plasma = result.plasmaConfig || {};
        const energy = profile.energyDeposition || result.intermediate?.energyDeposition || {};
        const diffInt = profile.diffusionIntermediate || result.intermediate?.diffusion || {};

        const fmtSci = (v) => (v == null || isNaN(Number(v))) ? '—' : Number(v).toExponential(3);
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

        // OVERVIEW - только уникальные входные + геометрия из результата
        if (simReq) {
            set('r_composition', fmtComp(simReq.composition));
            set('r_ion_composition', fmtIon(simReq.ionComposition));
            set('r_current', fmtNum(simReq.current, 3));
            set('r_chamber_width', fmtNum(simReq.chamberWidth, 3));
            set('r_chamber_depth', fmtNum(simReq.chamberDepth, 3));
            set('r_exposure_time', fmtNum(simReq.exposureTime, 0));
            set('r_angle', fmtNum(simReq.angle, 1));
        }
        // electrodeDistance и ionIncidenceAngle из результата (бэкенд берет из конфига)
        set('r_electrode_distance', fmtNum(result.electrodeDistance, 3));
        set('r_ion_incidence_angle', fmtNum(result.ionIncidenceAngle, 1));

        // PLASMA - параметры плазмы
        set('r_voltage', fmtNum(result.voltage || simReq?.voltage, 0));
        set('r_pressure', fmtNum(result.pressure || simReq?.pressure, 2));
        set('r_electron_temp', fmtNum(result.electronTemperature || simReq?.electronTemp, 0));
        set('pc_ion_energy', fmtNum(result.ionEnergy || plasma.ionEnergyOverride, 3));
        set('plasma_electron_density', fmtSci(stats.electronDensity));
        set('plasma_electron_velocity', fmtSci(stats.electronVelocity));
        set('plasma_current_density', fmtSci(stats.currentDensity));
        set('damage_ion_flux', fmtSci(stats.ionFlux));

        // THERMAL & ENERGY - энергия и температура
        set('ps_total_energy', fmtSci(stats.totalTransferredEnergy));
        set('ps_avg_energy', fmtSci(stats.avgTransferredPerAtom));
        set('ps_binding_energy', fmtNum(stats.surfaceBindingEnergy, 3));

        set('thermal_probe_temp', fmtNum(stats.finalProbeTemperature, 2));
        set('thermal_debye_speed', fmtSci(stats.debyeFrontSpeed));
        set('thermal_debye_depth', fmtSci(stats.debyeFrontDepth));

        set('skin_depth', fmtSci(energy.skinDepth));
        set('skin_surface_power', fmtSci(energy.skinSurfacePower));
        set('skin_accumulated_energy', fmtSci(energy.skinAccumulatedEnergy));
        set('skin_temperature_delta', fmtNum(energy.skinTemperatureDelta, 2));
        set('skin_effective_temp', fmtNum(energy.effectiveSurfaceTemperature, 2));

        // MATERIAL MODIFICATION - модификация материала
        set('r_d_effective', fmtSci(profile.d_effective));
        set('r_d_thermal', fmtSci(profile.d_thermal));
        set('r_mean_depth', fmtSci(profile.meanDepth));
        set('diff_concentration', fmtSci(result.concentration || profile.concentration));

        set('r_d1', fmtSci(profile.d1));
        set('r_d2', fmtSci(profile.d2));
        set('r_q1', fmtNum(profile.q1_ev, 3));
        set('r_q2', fmtNum(profile.q2_ev, 3));

        set('energy_gain_factor', fmtNum(energy.energyGainFactor, 4));
        set('plasma_correction_factor', fmtNum(energy.plasmaCorrectionFactor, 4));
        set('exposure_rate', fmtSci(energy.exposureRate));
        set('modified_layer_thickness', fmtSci(energy.modifiedLayerThickness));
        set('energy_potential_surface', fmtNum(energy.potentialAtSurface, 2));
        set('energy_accelerating_field', fmtSci(energy.acceleratingField));

        // DAMAGE & STRUCTURE - повреждения и структура
        set('damage_total', fmtSci(stats.totalDamage));
        set('damage_displacement', fmtSci(stats.totalDisplacement));
        set('damage_momentum', fmtSci(stats.totalMomentum));
        set('damage_fluence', fmtSci(stats.fluence));
        set('damage_fluence_eff', fmtSci(stats.fluenceEff));

        set('diff_d_radiation', fmtSci(diffInt.dRadiation));
        set('diff_d_collision', fmtSci(diffInt.dCollision));
        set('diff_slr_factor', fmtNum(diffInt.slrFactor, 4));
        set('diff_damage_rate', fmtSci(diffInt.damageRate));
        set('diff_d_slr', fmtSci(stats.dSlr));
        set('diff_d_res', fmtSci(stats.dRes));
        set('diff_resonance_xi', fmtNum(stats.resonanceXi, 4));

        set('diff_projected_range', fmtSci(diffInt.projectedRange));
        set('diff_straggle_sigma', fmtSci(diffInt.straggleSigma));
        set('diff_lattice_stiffness', fmtSci(diffInt.latticeStiffness));
        set('diff_equilibrium_dist', fmtSci(diffInt.equilibriumDistance));

        // 3D ВИЗУАЛИЗАЦИЯ
        if (window.addPhysics3DData) window.addPhysics3DData(stats, simReq);
        if (window.renderPhysicsStats3D) window.renderPhysicsStats3D(window.current3DViewType || 'surface');
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
            composition: SimulationState.alloyComponents.map(buildAlloyComponentDto),
            ionComposition: SimulationState.ionComponents.map(buildIonComponentDto)
        };

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
            intermediate: result.intermediate || null
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
        return {
            voltage: this.rand(p.voltage[0], p.voltage[1], 0),
            current: this.rand(p.current[0], p.current[1], 3),
            pressure: this.rand(p.pressure[0], p.pressure[1], 3),
            electronTemp: this.rand(p.et[0], p.et[1], 0),
            chamberWidth: this.rand(p.width[0], p.width[1], 3),
            chamberDepth: this.rand(p.depth[0], p.depth[1], 3),
            exposureTime: this.rand(p.time[0], p.time[1], 2),
            angle: this.rand(p.angle[0], p.angle[1], 1),
            ambientTemp: this.rand(p.ambient[0], p.ambient[1], 0)
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
            width: def.width, depth: def.depth, time: def.time, angle: def.angle, ambient: def.ambient
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

                const prevAlloy = SimulationState.alloyComponents;
                const prevIons = SimulationState.ionComponents;
                SimulationState.alloyComponents = runAlloy;
                SimulationState.ionComponents = runIons;

                await window.saveResults(true);

                SimulationState.alloyComponents = prevAlloy;
                SimulationState.ionComponents = prevIons;
                SimulationState.autoGenResults.push({ request: requestData, result });
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