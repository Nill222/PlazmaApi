// charts.js — точка входа, все renderChartN

import { COLORS }                               from './charts.config.js';
import { scatter, line, bar, doublebar, histChart } from './charts.factory.js';
import { loadAll, allResults, atomsMap, ionsMap, byAtom, byIon } from './charts.data.js';
import { render3D }                             from './charts.3d.js';

// ── инициализация ────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('chart3dMode')?.addEventListener('change', render3D);
    document.getElementById('chart3dType')?.addEventListener('change', render3D);
    checkAuth();
});

function checkAuth() {
    const auth    = window.PlasmaAuth?.isAuthenticated() || false;
    document.getElementById('authGate').style.display       = auth ? 'none' : 'flex';
    document.getElementById('chartsWorkspace').style.display = auth ? 'block' : 'none';
    if (auth) init();
}

async function init() {
    try {
        await loadAll(window.PlasmaAuth?.getToken());
        updateStats();
        populateFilters();
        renderAll();
    } catch (e) {
        console.error('[Charts]', e);
        window.PlasmaAuth?.showMessage('Ошибка загрузки: ' + e.message, 'error');
    }
}

// ── статистика / фильтры ─────────────────────────────────────────────────────

function updateStats() {
    const set = key => new Set(allResults.map(r => r[key]).filter(n => n && n !== 'Unknown'));
    document.getElementById('totalSimulations').textContent = allResults.length;
    document.getElementById('uniqueAtoms').textContent = set('atomName').size || allResults.length;
    document.getElementById('uniqueIons').textContent  = set('ionName').size  || allResults.length;
}

function populateFilters() {
    const atoms = [...new Set(allResults.map(r => r.atomName).filter(n => n !== 'Unknown'))];
    const ions  = [...new Set(allResults.map(r => r.ionName) .filter(n => n !== 'Unknown'))];

    const fill = (ids, names, label) => ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = `<option value="all">${label}</option>`;
        names.forEach(n => { const o = new Option(n, n); el.appendChild(o); });
        el.addEventListener('change', renderAll);
    });

    fill(['filter1','filter2','filter3','filter4','filter5'], ions,  'Все ионы');
    fill(Array.from({length:24}, (_,i) => `filter${i+6}`),   atoms, 'Все атомы');
}

// ── главный render ───────────────────────────────────────────────────────────

function renderAll() {
    // Plasma (1-5) — по ионам
    [1,2,3,4,5].forEach(n => window[`renderC${n}`]());
    // Thermal (6-10), Energy (11-15), Diffusion (16-20), Damage (21-24) — по атомам
    for (let n = 6; n <= 24; n++) window[`renderC${n}`]();
    render3D();
}

// ── вспомогательные ─────────────────────────────────────────────────────────

const fv  = id => document.getElementById(id)?.value || 'all';
const pts = (rows, xk, yk) => rows.filter(r => r[xk] > 0 && r[yk] > 0).map(r => ({ x: r[xk], y: r[yk] }));

// ── Plasma (1-5) ─────────────────────────────────────────────────────────────

window.renderC1 = () => scatter('chart1', pts(byIon(fv('filter1')), 'pressure', 'electronDensity'),
    'Давление (Па)', 'Плотность электронов (м⁻³)', 'Плотность электронов от давления', COLORS.electronDensity);

window.renderC2 = () => scatter('chart2', pts(byIon(fv('filter2')), 'voltage', 'electronVelocity'),
    'Напряжение (В)', 'Скорость электронов (м/с)', 'Скорость электронов от напряжения', COLORS.electronVelocity);

window.renderC3 = () => scatter('chart3', pts(byIon(fv('filter3')), 'voltage', 'currentDensity'),
    'Напряжение (В)', 'Плотность тока (А/м²)', 'ВАХ: Плотность тока от напряжения', COLORS.currentDensity);

window.renderC4 = () => scatter('chart4', pts(byIon(fv('filter4')), 'voltage', 'ionEnergy'),
    'Напряжение (В)', 'Энергия ионов (Дж)', 'Энергия ионов от напряжения', COLORS.ionEnergy);

window.renderC5 = () => scatter('chart5', pts(byIon(fv('filter5')), 'voltage', 'electronTemperature'),
    'Напряжение (В)', 'T электронов (K)', 'Температура электронов от напряжения', COLORS.electronTemp);

// ── Thermal (6-10) ───────────────────────────────────────────────────────────

window.renderC6 = () => scatter('chart6', pts(byAtom(fv('filter6')), 'totalTransferredEnergy', 'avgT'),
    'Переданная энергия (Дж)', 'Средняя T (K)', 'Термализация: T от энергии', COLORS.thermalization);

window.renderC7 = () => scatter('chart7', pts(byAtom(fv('filter7')), 'voltage', 'avgT'),
    'Напряжение (В)', 'Средняя T (K)', 'Температура от напряжения', COLORS.tempVsVoltage);

window.renderC8 = () => {
    const rows = byAtom(fv('filter8'));
    line('chart8', rows.map((_,i) => `#${i+1}`),[
        { label: 'T_min', data: rows.map(r => r.minT||0), color: COLORS.tempRange[0] },
        { label: 'T_avg', data: rows.map(r => r.avgT||0), color: COLORS.tempRange[1] },
        { label: 'T_max', data: rows.map(r => r.maxT||0), color: COLORS.tempRange[2] },
    ], 'Симуляции', 'Температура (K)', 'Диапазон температур');
};

window.renderC9 = () => scatter('chart9', pts(byAtom(fv('filter9')), 'pressure', 'avgT'),
    'Давление (Па)', 'Средняя T (K)', 'Температура от давления', COLORS.tempVsPressure);

window.renderC10 = () => scatter('chart10', pts(byAtom(fv('filter10')), 'currentDensity', 'avgT'),
    'Плотность тока (А/м²)', 'Средняя T (K)', 'Температура от плотности тока', COLORS.tempVsCurrent);

// ── Energy (11-15) ───────────────────────────────────────────────────────────

window.renderC11 = () => scatter('chart11', pts(byAtom(fv('filter11')), 'voltage', 'totalTransferredEnergy'),
    'Напряжение (В)', 'Полная энергия (Дж)', 'Полная энергия от напряжения', COLORS.totalEnergy);

window.renderC12 = () => scatter('chart12', pts(byAtom(fv('filter12')), 'voltage', 'avgTransferredPerAtom'),
    'Напряжение (В)', 'Энергия на атом (Дж)', 'Энергия на атом от напряжения', COLORS.energyPerAtom);

window.renderC13 = () => histChart('chart13',
    byAtom(fv('filter13')).map(r => r.totalTransferredEnergy).filter(e => e > 0),
    'Распределение энергии', COLORS.energyDistrib);

window.renderC14 = () => scatter('chart14', pts(byAtom(fv('filter14')), 'avgT', 'totalTransferredEnergy'),
    'Средняя T (K)', 'Полная энергия (Дж)', 'Энергия от температуры', COLORS.energyVsTemp);

window.renderC15 = () => scatter('chart15', pts(byAtom(fv('filter15')), 'pressure', 'totalTransferredEnergy'),
    'Давление (Па)', 'Полная энергия (Дж)', 'Энергия от давления', COLORS.energyVsPres);

// ── Diffusion (16-20) ────────────────────────────────────────────────────────

window.renderC16 = () => scatter('chart16', pts(byAtom(fv('filter16')), 'avgT', 'diffusionCoefficient1'),
    'Температура (K)', 'D₁ (м²/с)', 'D₁ от температуры (Arrhenius)', COLORS.diffusion1, true);

window.renderC17 = () => scatter('chart17', pts(byAtom(fv('filter17')), 'avgT', 'diffusionCoefficient2'),
    'Температура (K)', 'D₂ (м²/с)', 'D₂ от температуры (Arrhenius)', COLORS.diffusion2, true);

window.renderC18 = () => {
    const rows = byAtom(fv('filter18'));
    doublebar('chart18', rows.map(r => r.atomName), rows.map(r => r.diffusionCoefficient1||0),
        rows.map(r => r.diffusionCoefficient2||0), 'Атомы', 'Коэффициент (м²/с)', 'Сравнение D₁ и D₂');
};

window.renderC19 = () => scatter('chart19', pts(byAtom(fv('filter19')), 'voltage', 'diffusionCoefficient1'),
    'Напряжение (В)', 'D₁ (м²/с)', 'Диффузия от напряжения', COLORS.diffusionVsV, true);

window.renderC20 = () => {
    const rows = byAtom(fv('filter20'));
    doublebar('chart20', rows.map(r => r.atomName), rows.map(r => r.diffusionCoefficient1||0),
        rows.map(r => r.diffusionCoefficient2||0), 'Атомы', 'Коэффициент (м²/с)', 'D₁ vs D₂ после SLR');
};

// ── Damage (21-24) ───────────────────────────────────────────────────────────

window.renderC21 = () => scatter('chart21', pts(byAtom(fv('filter21')), 'totalTransferredEnergy', 'totalDamage'),
    'Переданная энергия (Дж)', 'Повреждения (Дж)', 'Повреждения от энергии', COLORS.damageVsEnergy);

window.renderC22 = () => scatter('chart22', pts(byAtom(fv('filter22')), 'totalTransferredEnergy', 'totalMomentum'),
    'Переданная энергия (Дж)', 'Импульс (кг·м/с)', 'Импульс от энергии', COLORS.momentumVsE);

window.renderC23 = () => scatter('chart23', pts(byAtom(fv('filter23')), 'totalMomentum', 'totalDisplacement'),
    'Импульс (кг·м/с)', 'Смещение (м)', 'Смещение от импульса', COLORS.displVsMom);

window.renderC24 = () => scatter('chart24', pts(byAtom(fv('filter24')), 'avgT', 'totalDamage'),
    'Средняя T (K)', 'Повреждения (Дж)', 'Повреждения от температуры', COLORS.damageVsTemp);

console.log('[Charts] Loaded — 5 modules, 24 + 3D charts');