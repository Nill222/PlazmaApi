// charts.js — точка входа, все renderChartN

import { COLORS }                                    from './charts.config.js';
import { scatter, line, bar, doublebar, histChart }  from './charts.factory.js';
import { loadAll, allResults, byAtom, byIon }        from './charts.data.js';
import { render3D }                                  from './charts.3d.js';
import { initExportButtons }                         from './charts.export.js';

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('chart3dMode')?.addEventListener('change', render3D);
    document.getElementById('chart3dType')?.addEventListener('change', render3D);
    checkAuth();
});

function checkAuth() {
    const auth = window.PlasmaAuth?.isAuthenticated() || false;
    document.getElementById('authGate').style.display        = auth ? 'none'  : 'flex';
    document.getElementById('chartsWorkspace').style.display = auth ? 'block' : 'none';
    if (auth) init();
}

async function init() {
    try {
        await loadAll(window.PlasmaAuth?.getToken());
        updateStats();
        populateFilters();
        renderAll();
        initExportButtons();
    } catch (e) {
        console.error('[Charts]', e);
        window.PlasmaAuth?.showMessage('Ошибка загрузки: ' + e.message, 'error');
    }
}

function updateStats() {
    const set = key => new Set(allResults.map(r => r[key]).filter(n => n && n !== 'Unknown'));
    document.getElementById('totalSimulations').textContent = allResults.length;
    document.getElementById('uniqueAtoms').textContent      = set('atomName').size || allResults.length;
    document.getElementById('uniqueIons').textContent       = set('ionName').size  || allResults.length;
}

function populateFilters() {
    const atoms = [...new Set(allResults.map(r => r.atomName).filter(n => n !== 'Unknown'))];
    const ions  = [...new Set(allResults.map(r => r.ionName) .filter(n => n !== 'Unknown'))];
    const fill = (ids, names, label) => ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = `<option value="all">${label}</option>`;
        names.forEach(n => el.appendChild(new Option(n, n)));
        el.addEventListener('change', renderAll);
    });
    fill(['filter1','filter2','filter3','filter4','filter5'], ions,  'Все ионы');
    fill(Array.from({ length: 24 }, (_, i) => `filter${i + 6}`), atoms, 'Все атомы');
}

function renderAll() {
    for (let n = 1; n <= 24; n++) window[`renderC${n}`]();
    render3D();
}

const fv  = id => document.getElementById(id)?.value || 'all';
const pts = (rows, xk, yk) => rows.filter(r => r[xk] > 0 && r[yk] > 0).map(r => ({ x: r[xk], y: r[yk] }));

window.renderC1  = () => scatter('chart1',  pts(byIon(fv('filter1')),  'pressure','electronDensity'),    'Давление (Па)',           'Плотность электронов (м⁻³)', '1. Плотность электронов от давления',    COLORS.electronDensity);
window.renderC2  = () => scatter('chart2',  pts(byIon(fv('filter2')),  'voltage','electronVelocity'),    'Напряжение (В)',          'Скорость электронов (м/с)',  '2. Скорость электронов от напряжения',   COLORS.electronVelocity);
window.renderC3  = () => scatter('chart3',  pts(byIon(fv('filter3')),  'voltage','currentDensity'),      'Напряжение (В)',          'Плотность тока (А/м²)',      '3. ВАХ: Плотность тока от напряжения',   COLORS.currentDensity);
window.renderC4  = () => scatter('chart4',  pts(byIon(fv('filter4')),  'voltage','ionEnergy'),           'Напряжение (В)',          'Энергия ионов (Дж)',         '4. Энергия ионов от напряжения',          COLORS.ionEnergy);
window.renderC5  = () => scatter('chart5',  pts(byIon(fv('filter5')),  'voltage','electronTemperature'), 'Напряжение (В)',          'T электронов (K)',           '5. Температура электронов от напряжения', COLORS.electronTemp);
window.renderC6  = () => scatter('chart6',  pts(byAtom(fv('filter6')), 'totalTransferredEnergy','avgT'), 'Переданная энергия (Дж)', 'Средняя T (K)',              '6. Термализация: T от энергии',           COLORS.thermalization);
window.renderC7  = () => scatter('chart7',  pts(byAtom(fv('filter7')), 'voltage','avgT'),                'Напряжение (В)',          'Средняя T (K)',              '7. Температура от напряжения',            COLORS.tempVsVoltage);
window.renderC8  = () => { const rows=byAtom(fv('filter8')); line('chart8', rows.map((_,i)=>`#${i+1}`),[{label:'T_min',data:rows.map(r=>r.minT||0),color:COLORS.tempRange[0]},{label:'T_avg',data:rows.map(r=>r.avgT||0),color:COLORS.tempRange[1]},{label:'T_max',data:rows.map(r=>r.maxT||0),color:COLORS.tempRange[2]}],'Симуляции','Температура (K)','8. Диапазон температур'); };
window.renderC9  = () => scatter('chart9',  pts(byAtom(fv('filter9')),  'pressure','avgT'),              'Давление (Па)',           'Средняя T (K)',              '9. Температура от давления',              COLORS.tempVsPressure);
window.renderC10 = () => scatter('chart10', pts(byAtom(fv('filter10')), 'currentDensity','avgT'),        'Плотность тока (А/м²)',   'Средняя T (K)',              '10. Температура от плотности тока',       COLORS.tempVsCurrent);
window.renderC11 = () => scatter('chart11', pts(byAtom(fv('filter11')), 'voltage','totalTransferredEnergy'), 'Напряжение (В)',      'Полная энергия (Дж)',        '11. Полная энергия от напряжения',        COLORS.totalEnergy);
window.renderC12 = () => scatter('chart12', pts(byAtom(fv('filter12')), 'voltage','avgTransferredPerAtom'),  'Напряжение (В)',      'Энергия на атом (Дж)',       '12. Энергия на атом от напряжения',       COLORS.energyPerAtom);
window.renderC13 = () => histChart('chart13', byAtom(fv('filter13')).map(r=>r.totalTransferredEnergy).filter(e=>e>0), '13. Распределение энергии', COLORS.energyDistrib);
window.renderC14 = () => scatter('chart14', pts(byAtom(fv('filter14')), 'avgT','totalTransferredEnergy'), 'Средняя T (K)',          'Полная энергия (Дж)',        '14. Энергия от температуры',              COLORS.energyVsTemp);
window.renderC15 = () => scatter('chart15', pts(byAtom(fv('filter15')), 'pressure','totalTransferredEnergy'), 'Давление (Па)',      'Полная энергия (Дж)',        '15. Энергия от давления',                 COLORS.energyVsPres);
window.renderC16 = () => scatter('chart16', pts(byAtom(fv('filter16')), 'avgT','diffusionCoefficient1'), 'Температура (K)',         'D₁ (м²/с)',                  '16. D₁ от температуры (Arrhenius)',       COLORS.diffusion1, true);
window.renderC17 = () => scatter('chart17', pts(byAtom(fv('filter17')), 'avgT','diffusionCoefficient2'), 'Температура (K)',         'D₂ (м²/с)',                  '17. D₂ от температуры (Arrhenius)',       COLORS.diffusion2, true);
window.renderC18 = () => { const r=byAtom(fv('filter18')); doublebar('chart18',r.map(x=>x.atomName),r.map(x=>x.diffusionCoefficient1||0),r.map(x=>x.diffusionCoefficient2||0),'Атомы','Коэффициент (м²/с)','18. Сравнение D₁ и D₂'); };
window.renderC19 = () => scatter('chart19', pts(byAtom(fv('filter19')), 'voltage','diffusionCoefficient1'), 'Напряжение (В)',       'D₁ (м²/с)',                  '19. Диффузия от напряжения',              COLORS.diffusionVsV, true);
window.renderC20 = () => { const r=byAtom(fv('filter20')); doublebar('chart20',r.map(x=>x.atomName),r.map(x=>x.diffusionCoefficient1||0),r.map(x=>x.diffusionCoefficient2||0),'Атомы','Коэффициент (м²/с)','20. D₁ vs D₂ после SLR'); };
window.renderC21 = () => scatter('chart21', pts(byAtom(fv('filter21')), 'totalTransferredEnergy','totalDamage'),  'Переданная энергия (Дж)', 'Повреждения (Дж)',    '21. Повреждения от энергии',              COLORS.damageVsEnergy);
window.renderC22 = () => scatter('chart22', pts(byAtom(fv('filter22')), 'totalTransferredEnergy','totalMomentum'),'Переданная энергия (Дж)', 'Импульс (кг·м/с)',   '22. Импульс от энергии',                  COLORS.momentumVsE);
window.renderC23 = () => scatter('chart23', pts(byAtom(fv('filter23')), 'totalMomentum','totalDisplacement'),    'Импульс (кг·м/с)',        'Смещение (м)',        '23. Смещение от импульса',                COLORS.displVsMom);
window.renderC24 = () => scatter('chart24', pts(byAtom(fv('filter24')), 'avgT','totalDamage'),                   'Средняя T (K)',            'Повреждения (Дж)',   '24. Повреждения от температуры',          COLORS.damageVsTemp);

console.log('[Charts] Loaded — 5 modules + export');