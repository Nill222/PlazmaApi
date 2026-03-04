// Professional Simulation Module
const API = '/api/simulation';
let curRes = null;
let simReq = null;

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadData();
    setupHandlers();
    addMissingElements();
});

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
                <p>Задайте параметры и нажмите "Запустить"</p>
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

        const as = document.getElementById('atomSel');
        const is = document.getElementById('ionSel');

        if (as) {
            as.innerHTML = '<option value="">Выбрать...</option>' +
                (atoms.data || []).map(x => `<option value="${x.id}">${x.atomName || x.name} - ${x.fullName || ''}</option>`).join('');
        }

        if (is) {
            is.innerHTML = '<option value="">Выбрать...</option>' +
                (ions.data || []).map(x => `<option value="${x.id}">${x.name} (${x.charge > 0 ? '+' : ''}${x.charge})</option>`).join('');
        }
    } catch (e) {
        console.error('Error loading data:', e);
        showMsg('Ошибка загрузки данных', 'error');
    }
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

async function runSim() {
    if (window.PlasmaAuth && typeof window.PlasmaAuth.isAuthenticated === 'function' && !window.PlasmaAuth.isAuthenticated()) {
        if (window.PlasmaAuth.showMessage) {
            window.PlasmaAuth.showMessage('Требуется авторизация', 'error');
        } else {
            alert('Требуется авторизация');
        }
        return;
    }

    const form = document.getElementById('simForm');
    if (!form) {
        console.error('Форма не найдена');
        return;
    }

    const formData = new FormData(form);

    if (!formData.get('atomId') || !formData.get('ionId')) {
        showMsg('Выберите атом и ион', 'error');
        return;
    }

    const req = {
        ionId: parseInt(formData.get('ionId'), 10),
        configId: parseInt(formData.get('configId'), 10),
        atomId: parseInt(formData.get('atomId'), 10),
        voltage: parseFloat(formData.get('voltage')),
        current: parseFloat(formData.get('current')),
        pressure: parseFloat(formData.get('pressure')),
        electronTemp: parseFloat(formData.get('electronTemperature')),
        chamberWidth: parseFloat(formData.get('chamberWidth')),
        chamberDepth: parseFloat(formData.get('chamberDepth')),
        exposureTime: parseFloat(formData.get('exposureTime')),
        angle: parseFloat(formData.get('angle'))
    };

    // Убираем undefined поля
    Object.keys(req).forEach(k => req[k] === undefined && delete req[k]);

    // Сохраняем запрос для использования при сохранении
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

        console.log('=== РЕЗУЛЬТАТ СИМУЛЯЦИИ ===', curRes);
        showResults(curRes);

    } catch (e) {
        console.error('Simulation error:', e);
        showIdle();

        if (window.PlasmaAuth && window.PlasmaAuth.showMessage) {
            window.PlasmaAuth.showMessage('Ошибка: ' + e.message, 'error');
        } else {
            showMsg('Ошибка: ' + e.message, 'error');
        }
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
    setTextContent('r_atom_name', r.atom?.atomName || r.atom?.name || '—');
    setTextContent('r_ion_name', r.ion?.name || '—');

    // PLASMA TAB
    const pc = r.plasmaConfig || r.plasmaParameters || {};
    setTextContent('r_voltage',              fmt(pc.voltage              ?? simReq?.voltage));
    setTextContent('r_current',              fmt(pc.current              ?? simReq?.current));
    setTextContent('r_pressure',             fmt(pc.pressure             ?? simReq?.pressure));
    setTextContent('r_electrontemp',         fmt(pc.electronTemp         ?? simReq?.electronTemp));
    setTextContent('r_exposure_time',        fmt(pc.exposureTime         ?? simReq?.exposureTime));
    setTextContent('r_electron_density',     fmt(pc.electronDensity      ?? simReq?.electronDensity));
    setTextContent('r_electron_velocity',    fmt(pc.electronVelocity     ?? simReq?.electronVelocity));
    setTextContent('r_current_density',      fmt(pc.currentDensity       ?? simReq?.currentDensity));

    // CHAMBER TAB
    setTextContent('r_chamber_width', fmt(pc.chamberWidth ?? simReq?.chamberWidth));
    setTextContent('r_chamber_depth', fmt(pc.chamberDepth ?? simReq?.chamberDepth));

    // ION IMPACT TAB
    setTextContent('r_ion_energy_override',    fmt(pc.ionEnergyOverride));
    setTextContent('r_ion_incidence_angle',    fmt(pc.ionIncidenceAngle  ?? simReq?.angle));
    setTextContent('r_target_temperature',     fmt(pc.targetTemperature));
    setTextContent('r_surface_binding_energy', fmt(pc.surfaceBindingEnergy));

    // THERMAL TAB
    setTextContent('r_thermal_conductivity', fmt(pc.thermalConductivity));
    setTextContent('r_heat_capacity',        fmt(pc.heatCapacity));
    setTextContent('r_density',              fmt(pc.density));

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

        // Payload по структуре SimulationResultDto
        const pc = curRes.plasmaConfig || {};
        const pr = curRes.profile     || {};
        const electronTemp = pc.electronTemp ?? simReq.electronTemp ?? 0;

        // PlasmaResultDto — точные имена полей как в Java record
        const plasmaParameters = {
            voltage:         pc.voltage          ?? simReq.voltage   ?? 0,
            pressure:        pc.pressure         ?? simReq.pressure  ?? 0,
            electronTemp:    electronTemp,                               // маппер читает electronTemp
            ionEnergy:       pc.ionEnergyOverride ?? 0,                 // маппер читает ionEnergy
            electronDensity: curRes.electronDensity ?? pc.electronDensity ?? 0,
            electronVelocity: curRes.electronVelocity ?? pc.electronVelocity ?? 0,
            currentDensity:  curRes.currentDensity ?? pc.currentDensity ?? 0,
            ionFlux:         pc.ionFlux           ?? 0
        };

        // DiffusionProfileDto — точные имена полей как в Java record
        const diffusionProfile = {
            D1:          pr.d1          ?? 0,
            D2:          pr.d2          ?? 0,
            Q1:          pr.q1_ev       ?? 0,
            Q2:          pr.q2_ev       ?? 0,
            D_thermal:   pr.d_thermal   ?? 0,
            D_effective: pr.d_effective ?? 0,
            depth:       pr.meanDepth   ?? 0
        };

        const payload = {
            atomId:   curRes.atom?.id ?? simReq.atomId,
            ionId:    curRes.ion?.id  ?? simReq.ionId,
            configId: simReq.configId,

            atomName: curRes.atom?.atomName || curRes.atom?.name || '',
            s:        curRes.ion?.name      || '',

            totalTransferredEnergy: curRes.totalTransferredEnergy ?? 0,
            avgTransferredPerAtom:  curRes.avgTransferredPerAtom  ?? 0,

            // avgT/minT/maxT = температура электронов
            avgT: electronTemp,
            minT: electronTemp,
            maxT: electronTemp,

            diffusionCoefficient1: pr.d1 ?? 0,
            diffusionCoefficient2: pr.d2 ?? 0,

            totalMomentum:     curRes.totalMomentum     ?? 0,
            totalDamage:       curRes.totalDamage       ?? 0,
            totalDisplacement: curRes.totalDisplacement ?? 0,

            plasmaParameters,
            diffusionProfile,
            perAtomTransferredEnergies: curRes.perAtomTransferredEnergies || [],
            coolingProfile:             curRes.coolingProfile             || []
        };

        console.log('Сохранение payload:', payload);

        const response = await fetch(`${API}/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errBody = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
            console.error('Save 400 body:', errBody);
            throw new Error(errBody.message || JSON.stringify(errBody) || `HTTP ${response.status}`);
        }

        const msg = 'Результаты сохранены!';
        if (window.PlasmaAuth && window.PlasmaAuth.showMessage) {
            window.PlasmaAuth.showMessage(msg, 'success');
        } else {
            showMsg(msg, 'success');
        }
    } catch (e) {
        console.error('Save error:', e);
        const msg = 'Ошибка сохранения: ' + e.message;
        if (window.PlasmaAuth && window.PlasmaAuth.showMessage) {
            window.PlasmaAuth.showMessage(msg, 'error');
        } else {
            showMsg(msg, 'error');
        }
    }
}

function resetForm() {
    const form = document.getElementById('simForm');
    if (form) form.reset();
    curRes = null;
    simReq = null;
    showIdle();
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

// Глобальные функции для вызова из HTML
window.saveRes = saveRes;
window.resetForm = resetForm;
window.showAuthModal = () => {
    if (window.PlasmaAuth && window.PlasmaAuth.showModal) {
        window.PlasmaAuth.showModal();
    } else {
        alert('Функция авторизации недоступна');
    }
};
window.hideAuthModal = () => {
    if (window.PlasmaAuth && window.PlasmaAuth.hideModal) {
        window.PlasmaAuth.hideModal();
    }
};
window.logout = () => {
    if (window.PlasmaAuth && window.PlasmaAuth.logout) {
        window.PlasmaAuth.logout();
    }
    checkAuth();
};
window.newSim = () => {
    resetForm();
    showIdle();
};


//