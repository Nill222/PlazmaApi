// Professional Simulation Module
const API = '/api/simulation';
let curRes = null;

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadData();
    setupHandlers();
});

function checkAuth() {
    const ok = window.PlasmaAuth?.isAuthenticated() || false;
    document.getElementById('authGate').style.display = ok ? 'none' : 'flex';
    document.getElementById('simWorkspace').style.display = ok ? 'block' : 'none';
}

async function loadData() {
    try {
        const [atomsRes, ionsRes] = await Promise.all([
            fetch('/atoms'),
            fetch('/ions')
        ]);

        const atoms = await atomsRes.json();
        const ions = await ionsRes.json();

        const as = document.getElementById('atomSel');
        const is = document.getElementById('ionSel');

        as.innerHTML = '<option value="">Выбрать...</option>' +
            (atoms.data || []).map(x => `<option value="${x.id}">${x.atomName || x.name} - ${x.fullName || ''}</option>`).join('');
        is.innerHTML = '<option value="">Выбрать...</option>' +
            (ions.data || []).map(x => `<option value="${x.id}">${x.name} (${x.charge > 0 ? '+' : ''}${x.charge})</option>`).join('');
    } catch (e) {
        console.error('Error loading data:', e);
    }
}

function setupHandlers() {
    document.getElementById('simForm').addEventListener('submit', async e => {
        e.preventDefault();
        await runSim();
    });

    document.querySelectorAll('.res-tab').forEach(t => {
        t.addEventListener('click', () => {
            document.querySelectorAll('.res-tab').forEach(x => x.classList.remove('active'));
            document.querySelectorAll('.res-panel').forEach(x => x.classList.remove('active'));
            t.classList.add('active');
            document.querySelector(`.res-panel[data-tab="${t.dataset.tab}"]`).classList.add('active');
        });
    });
}

async function runSim() {
    if (!window.PlasmaAuth?.isAuthenticated()) {
        window.PlasmaAuth?.showMessage('Требуется авторизация', 'error');
        return;
    }

    const form = document.getElementById('simForm');
    const formData = new FormData(form);

    if (!formData.get('atomId') || !formData.get('ionId')) {
        showMsg('Выберите атом и ион', 'error');
        return;
    }

    const req = {
        ionId: formData.get('ionId'),
        configId: formData.get('configId'),
        atomId: formData.get('atomId'),
        voltage: formData.get('voltage'),
        current: formData.get('current'),
        pressure: formData.get('pressure'),
        electronTemperature: formData.get('electronTemperature'),
        chamberWidth: formData.get('chamberWidth'),
        chamberDepth: formData.get('chamberDepth'),
        exposureTime: formData.get('exposureTime'),
        angle: formData.get('angle')
    };

    showRunning();

    try {
        const token = window.PlasmaAuth?.getToken();

        const response = await fetch(`${API}/run`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(req)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || `HTTP error! status: ${response.status}`);
        }
        curRes = result.data;
        showResults(curRes);
    } catch (e) {
        console.error('Simulation error:', e);
        showIdle();
        window.PlasmaAuth?.showMessage('Ошибка: ' + e.message, 'error');
    }
}

function showRunning() {
    document.getElementById('resIdle').style.display = 'none';
    document.getElementById('resRunning').style.display = 'block';
    document.getElementById('resDisplay').style.display = 'none';
    animProgress();
}

function showIdle() {
    document.getElementById('resIdle').style.display = 'block';
    document.getElementById('resRunning').style.display = 'none';
    document.getElementById('resDisplay').style.display = 'none';
}

function animProgress() {
    let p = 0;
    const interval = setInterval(() => {
        p += 10;
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.style.width = p + '%';
        }
        if (p >= 100) clearInterval(interval);
    }, 200);
}

function showResults(r) {
    document.getElementById('resRunning').style.display = 'none';
    document.getElementById('resDisplay').style.display = 'block';

    const fmt = (n) => {
        if (n === undefined || n === null) return '0';
        const num = typeof n === 'number' ? n : parseFloat(n);
        if (isNaN(num)) return '0';
        if (Math.abs(num) < 1e-3 || Math.abs(num) > 1e3) return num.toExponential(3);
        return num.toPrecision(4);
    };


    // ===== ENERGY =====
    setTextContent('r_total_transferred_energy', fmt(r.totalTransferredEnergy) + ' Дж');
    setTextContent('r_avg_transferred_per_atom', fmt(r.avgTransferredPerAtom) + ' Дж');

    // ===== Temperature =====
    setTextContent('r_minT', fmt(r.minT) + ' K');
    setTextContent('r_avgTemp', fmt(r.avgT) + ' K');
    setTextContent('r_maxT', fmt(r.maxT) + ' K');

    // ===== DIFFUSION =====
    setTextContent('r_diffusion_coefficient_1', fmt(r.diffusionCoefficient1) + ' м²/с');
    setTextContent('r_diffusion_coefficient_2', fmt(r.diffusionCoefficient2) + ' м²/с');

    // ===== PLASMA  =====
    setTextContent('r_voltage', fmt(r.plasmaParameters.voltage) + 'В');
    setTextContent('r_electron_temperature', fmt(r.plasmaParameters.electronTemp) + ' K');
    setTextContent('r_ion_energy', fmt(r.plasmaParameters.ionEnergy) + ' Дж');
    setTextContent('r_pressure', fmt(r.plasmaParameters.pressure) + ' Па');
    setTextContent('r_electron_density', fmt(r.plasmaParameters.electronDensity) + ' м⁻³');
    setTextContent('r_electron_velocity', fmt(r.plasmaParameters.electronVelocity) + ' м/с');
    setTextContent('r_current_density', fmt(r.plasmaParameters.currentDensity) + ' А/м²');

    // ===== Additional Physics  =====
    setTextContent('r_depth', fmt(r.diffusionProfile.depth) + 'м');
    setTextContent('r_concentration', fmt(r.diffusionProfile.D_effective) + ' м⁻³');
    setTextContent('r_d_thermal', fmt(r.diffusionProfile.D_thermal) + ' м²/с');
    setTextContent('r_total_momentum', fmt(r.totalMomentum) + ' кг⋅м/с');
    setTextContent('r_total_damage', fmt(r.totalDamage) + ' Дж');
    setTextContent('r_total_displacement', fmt(r.totalDisplacement) + ' м');
    setTextContent('r_created_at', fmt(r.createdAt));
}

// Вспомогательная функция для безопасной установки текста
function setTextContent(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

async function saveRes() {
    if (!curRes) {
        window.PlasmaAuth?.showMessage('Нет результатов для сохранения', 'error');
        return;
    }

    try {
        const response = await fetch(`${API}/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.PlasmaAuth.getToken()}`
            },
            body: JSON.stringify(curRes)
        });

        if (!response.ok) {
            throw new Error('Save failed');
        }

        window.PlasmaAuth?.showMessage('Результаты сохранены!', 'success');
    } catch (e) {
        console.error('Save error:', e);
        window.PlasmaAuth?.showMessage('Ошибка сохранения', 'error');
    }
}

function resetForm() {
    document.getElementById('simForm').reset();
    showIdle();
}

function showMsg(msg, type) {
    const m = document.getElementById('formMsg');
    if (m) {
        m.textContent = msg;
        m.style.color = type === 'error' ? '#ff6b6b' : '#28a745';
        m.style.display = 'block';
        setTimeout(() => m.style.display = 'none', 5000);
    }
}

// Экспортируем функции в глобальную область
window.saveRes = saveRes;
window.resetForm = resetForm;
window.showAuthModal = () => window.PlasmaAuth?.showModal();
window.hideAuthModal = () => window.PlasmaAuth?.hideModal();
window.logout = () => window.PlasmaAuth?.logout();
window.newSim = () => {
    resetForm();
    showIdle();
};