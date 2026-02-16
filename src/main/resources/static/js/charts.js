let allResults = [];
let atomsMap = new Map();
let ionsMap = new Map();
let charts = {};

Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.color = '#94a3b8';

document.addEventListener('DOMContentLoaded', () => {
    console.log('[Charts] Initializing complete visualization suite...');
    checkAuth();
});

function checkAuth() {
    const isAuth = window.PlasmaAuth?.isAuthenticated() || false;

    const authGate = document.getElementById('authGate');
    const workspace = document.getElementById('chartsWorkspace');

    if (authGate) authGate.style.display = isAuth ? 'none' : 'flex';
    if (workspace) workspace.style.display = isAuth ? 'block' : 'none';

    if (isAuth) {
        loadAllData();
    }
}

async function loadAllData() {
    try {
        const token = window.PlasmaAuth?.getToken();
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        const [atomsRes, ionsRes, resultsRes] = await Promise.all([
            fetch('/atoms'),
            fetch('/ions'),
            fetch('/results/config', { headers })
        ]);

        // Проверяем статусы ответов
        if (!atomsRes.ok) console.error('[Charts] Atoms response not OK:', atomsRes.status);
        if (!ionsRes.ok) console.error('[Charts] Ions response not OK:', ionsRes.status);
        if (!resultsRes.ok) console.error('[Charts] Results response not OK:', resultsRes.status);

        const atomsData = await atomsRes.json().catch(() => ({ data: [] }));
        const ionsData = await ionsRes.json().catch(() => ({ data: [] }));
        const resultsData = await resultsRes.json().catch(() => ({ data: [] }));

        console.log('[Charts] Raw data:', {
            atoms: atomsData,
            ions: ionsData,
            results: resultsData
        });

        const atoms = atomsData.data || [];
        const ions = ionsData.data || [];
        const results = resultsData.data || [];

        console.log('[Charts] Parsed data:', {
            atomsCount: atoms.length,
            ionsCount: ions.length,
            resultsCount: results.length
        });

        // Создаем мапы для быстрого поиска
        atoms.forEach(atom => {
            if (atom && atom.id) {
                atomsMap.set(atom.id, atom);
            }
        });

        ions.forEach(ion => {
            if (ion && ion.id) {
                ionsMap.set(ion.id, ion);
            }
        });

        console.log('[Charts] Maps created:', {
            atomsMapSize: atomsMap.size,
            ionsMapSize: ionsMap.size
        });

        // Обогащаем результаты данными из атомов и ионов
        allResults = results.map(r => enrichResult(r));

        console.log('[Charts] Enriched results:', {
            count: allResults.length,
            sample: allResults[0]
        });

        // Если нет атомов в мапе, пробуем загрузить отдельно по ID из результатов
        if (atomsMap.size === 0 && results.length > 0) {
            await loadMissingAtoms(results);
        }

        // Если нет ионов в мапе, пробуем загрузить отдельно по ID из результатов
        if (ionsMap.size === 0 && results.length > 0) {
            await loadMissingIons(results);
        }

        allResults = results.map(r => enrichResult(r));

        updateStats();
        populateFilters();
        renderAllCharts();

    } catch (e) {
        console.error('[Charts] Load error:', e);
        window.PlasmaAuth?.showMessage('Ошибка загрузки: ' + e.message, 'error');
    }
}

function enrichResult(r) {
    if (!r) return r;

    // Получаем атом из мапы
    let atom = null;
    if (r.atomId && atomsMap.has(r.atomId)) {
        atom = atomsMap.get(r.atomId);
    } else if (r.atom && r.atom.id) {
        atom = r.atom;
        atomsMap.set(r.atom.id, atom);
    }

    // Получаем ион из мапы
    let ion = null;
    if (r.ionId && ionsMap.has(r.ionId)) {
        ion = ionsMap.get(r.ionId);
    } else if (r.ion && r.ion.id) {
        ion = r.ion;
        ionsMap.set(r.ion.id, ion);
    }

    // Извлекаем параметры плазмы (если они есть в ResultDTO)
    const plasmaParams = extractPlasmaParams(r);

    return {
        ...r,
        atomId: r.atomId || r.atom?.id,
        atomName: atom?.atomName || atom?.name || atom?.symbol || 'Unknown',
        atomFullName: atom?.fullName || '',
        ionId: r.ionId || r.ion?.id,
        ionName: ion?.name || 'Unknown',
        ionCharge: ion?.charge || 0,

        // Параметры плазмы
        voltage: plasmaParams.voltage,
        pressure: plasmaParams.pressure,
        electronDensity: plasmaParams.electronDensity,
        electronVelocity: plasmaParams.electronVelocity,
        electronTemperature: plasmaParams.electronTemperature,
        currentDensity: plasmaParams.currentDensity,
        ionEnergy: plasmaParams.ionEnergy,

        // Энергетические параметры
        totalTransferredEnergy: r.totalTransferredEnergy || 0,
        avgTransferredPerAtom: r.avgTransferredPerAtom || 0,

        // Температурные параметры
        avgT: r.avgT || 0,
        minT: r.minT || 0,
        maxT: r.maxT || 0,

        // Диффузия
        diffusionCoefficient1: r.diffusionCoefficient1 || 0,
        diffusionCoefficient2: r.diffusionCoefficient2 || 0,

        // Дополнительная физика
        depths: r.depths || 0,
        concentration: r.concentration || 0,
        dThermal: r.dThermal || 0,
        totalMomentum: r.totalMomentum || 0,
        totalDamage: r.totalDamage || 0,
        totalDisplacement: r.totalDisplacement || 0,

        createdAt: r.createdAt || new Date().toISOString()
    };
}

// Функция для извлечения параметров плазмы из ResultDTO
function extractPlasmaParams(r) {
    // Параметры плазмы могут быть либо прямыми полями, либо вложенными
    return {
        voltage: r.voltage || 0,
        pressure: r.pressure || 0,
        electronDensity: r.electronDensity || 0,
        electronVelocity: r.electronVelocity || 0,
        electronTemperature: r.electronTemperature || r.electronTemp || 0,
        currentDensity: r.currentDensity || 0,
        ionEnergy: r.ionEnergy || r.totalTransferredEnergy || 0
    };
}

// Загрузка недостающих атомов
async function loadMissingAtoms(results) {
    const atomIds = [...new Set(results.map(r => r.atomId).filter(id => id))];

    for (const id of atomIds) {
        if (!atomsMap.has(id)) {
            try {
                const res = await fetch(`/atoms/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.data) {
                        atomsMap.set(id, data.data);
                    }
                }
            } catch (e) {
                console.warn(`[Charts] Failed to load atom ${id}:`, e);
            }
        }
    }
}

// Загрузка недостающих ионов
async function loadMissingIons(results) {
    const ionIds = [...new Set(results.map(r => r.ionId).filter(id => id))];

    for (const id of ionIds) {
        if (!ionsMap.has(id)) {
            try {
                const res = await fetch(`/ions/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.data) {
                        ionsMap.set(id, data.data);
                    }
                }
            } catch (e) {
                console.warn(`[Charts] Failed to load ion ${id}:`, e);
            }
        }
    }
}

// ==============================================================
// Statistics
// ==============================================================

function updateStats() {
    const totalEl = document.getElementById('totalSimulations');
    const atomsEl = document.getElementById('uniqueAtoms');
    const ionsEl = document.getElementById('uniqueIons');

    if (totalEl) totalEl.textContent = allResults.length;

    if (atomsEl) {
        const atoms = new Set(allResults.map(r => r.atomName).filter(n => n !== 'Unknown'));
        atomsEl.textContent = atoms.size || allResults.length; // Fallback к количеству результатов
    }

    if (ionsEl) {
        const ions = new Set(allResults.map(r => r.ionName).filter(n => n !== 'Unknown'));
        ionsEl.textContent = ions.size || allResults.length; // Fallback к количеству результатов
    }
}

// ==============================================================
// Populate Filters
// ==============================================================

function populateFilters() {
    // Получаем уникальные имена атомов из результатов
    const atomNames = [...new Set(allResults.map(r => r.atomName).filter(n => n !== 'Unknown'))];

    // Если нет имен, используем ID
    if (atomNames.length === 0) {
        const atomIds = [...new Set(allResults.map(r => r.atomId).filter(id => id))];
        atomNames.push(...atomIds.map(id => `Атом ${id}`));
    }

    // Если все еще нет, добавляем заглушку
    if (atomNames.length === 0) {
        atomNames.push('Все результаты');
    }

    console.log('[Charts] Populating filters with atoms:', atomNames);

    const filterIds = Array.from({ length: 25 }, (_, i) => `filter${i + 1}`);

    filterIds.forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            // Очищаем существующие опции кроме "Все"
            select.innerHTML = '<option value="all">Все</option>';

            atomNames.forEach(name => {
                const opt = document.createElement('option');
                opt.value = name;
                opt.textContent = name;
                select.appendChild(opt);
            });

            // Убираем старый обработчик и добавляем новый
            select.removeEventListener('change', renderAllCharts);
            select.addEventListener('change', renderAllCharts);
        }
    });
}

// ==============================================================
// Filter Data
// ==============================================================

function filterData(atomName) {
    if (atomName === 'all' || !atomName) return allResults;

    return allResults.filter(r => {
        // Сравниваем по имени атома
        if (r.atomName === atomName) return true;

        // Если имя не совпадает, пробуем сравнить по ID
        const atomIdMatch = atomName.match(/Атом (\d+)/);
        if (atomIdMatch && r.atomId === parseInt(atomIdMatch[1])) return true;

        return false;
    });
}

// ==============================================================
// Render All 25 Charts
// ==============================================================


function renderAllCharts() {
    // PLASMA PHYSICS (5 charts)
    renderChart1(); // Electron Density vs Pressure
    renderChart2(); // Electron Velocity vs Voltage
    renderChart3(); // Current Density vs Voltage
    renderChart4(); // Ion Energy vs Voltage
    renderChart5(); // Ion Flux vs Pressure

    // THERMAL (5 charts)
    renderChart6(); // Avg Temp vs Transferred Energy
    renderChart7(); // Avg Temp vs Voltage
    renderChart8(); // Temp Range (Min/Avg/Max)
    renderChart9(); // Avg Temp vs Pressure
    renderChart10(); // Avg Temp vs Current Density

    // ENERGY (5 charts)
    renderChart11(); // Total Energy vs Voltage
    renderChart12(); // Avg Energy per Atom vs Voltage
    renderChart13(); // Total Energy Distribution
    renderChart14(); // Energy vs Temperature
    renderChart15(); // Energy vs Pressure

    // DIFFUSION (5 charts)
    renderChart16(); // D1 vs Temperature (Arrhenius)
    renderChart17(); // D2 vs Temperature (Arrhenius)
    renderChart18(); // D1 vs D2 Comparison
    renderChart19(); // Diffusion vs Voltage

    // DAMAGE & MECHANICS (4 charts)
    renderChart20(); // Total Damage vs Energy
    renderChart21(); // Total Momentum vs Energy
    renderChart22(); // Total Displacement vs Momentum
    renderChart23(); // Damage vs Temperature
}

// ==============================================================
// PLASMA PHYSICS CHARTS (1-6)
// ==============================================================

// 1. Electron Density vs Pressure (n_e ~ P)
function renderChart1() {
    const filter = document.getElementById('filter1')?.value || 'all';
    const data = filterData(filter)
        .filter(r => r.pressure > 0 && r.electronDensity > 0)
        .map(r => ({x: r.pressure, y: r.electronDensity}));

    createScatterChart('chart1', data, 'Давление (Па)', 'Плотность электронов (м⁻³)',
        'Плотность электронов от давления', '#5eead4');
}

// 2. Electron Velocity vs Voltage
function renderChart2() {
    const filter = document.getElementById('filter2')?.value || 'all';
    const data = filterData(filter)
        .filter(r => r.voltage > 0 && r.electronVelocity > 0)
        .map(r => ({x: r.voltage, y: r.electronVelocity}));

    createScatterChart('chart2', data, 'Напряжение (В)', 'Скорость электронов (м/с)',
        'Скорость электронов от напряжения', '#818cf8');
}

// 3. Current Density vs Voltage (I-V characteristic)
function renderChart3() {
    const filter = document.getElementById('filter3')?.value || 'all';
    const data = filterData(filter)
        .filter(r => r.voltage > 0 && r.currentDensity > 0)
        .map(r => ({x: r.voltage, y: r.currentDensity}));

    createScatterChart('chart3', data, 'Напряжение (В)', 'Плотность тока (А/м²)',
        'ВАХ: Плотность тока от напряжения', '#f472b6');
}

// 4. Ion Energy vs Voltage (E = q·V)
function renderChart4() {
    const filter = document.getElementById('filter4')?.value || 'all';
    const data = filterData(filter)
        .filter(r => r.voltage > 0 && r.ionEnergy > 0)
        .map(r => ({x: r.voltage, y: r.ionEnergy}));

    createScatterChart('chart4', data, 'Напряжение (В)', 'Энергия ионов (Дж)',
        'Энергия ионов от напряжения', '#34d399');
}

// 5. Electron Temperature vs Voltage
function renderChart5() {
    const filter = document.getElementById('filter5')?.value || 'all';
    const data = filterData(filter)
        .filter(r => r.voltage > 0 && r.electronTemperature > 0)
        .map(r => ({x: r.voltage, y: r.electronTemperature}));

    createScatterChart('chart5', data, 'Напряжение (В)', 'T электронов (K)',
        'Температура электронов от напряжения', '#60a5fa');
}

// ==============================================================
// THERMAL CHARTS (6-10)
// ==============================================================

// 7. Avg Temp vs Transferred Energy (Thermalization)
function renderChart6() {
    const filter = document.getElementById('filter6')?.value || 'all';
    const data = filterData(filter)
        .filter(r => r.totalTransferredEnergy > 0 && r.avgT > 0)
        .map(r => ({x: r.totalTransferredEnergy, y: r.avgT}));

    createScatterChart('chart6', data, 'Переданная энергия (Дж)', 'Средняя T (K)',
        'Термализация: T от энергии', '#a78bfa');
}

// 8. Avg Temp vs Voltage
function renderChart7() {
    const filter = document.getElementById('filter7')?.value || 'all';
    const data = filterData(filter)
        .filter(r => r.voltage > 0 && r.avgT > 0)
        .map(r => ({x: r.voltage, y: r.avgT}));

    createScatterChart('chart7', data, 'Напряжение (В)', 'Средняя T (K)',
        'Температура от напряжения', '#f87171');
}

// 9. Temperature Range (Min/Avg/Max)
function renderChart8() {
    const filter = document.getElementById('filter8')?.value || 'all';
    const filtered = filterData(filter);

    const labels = filtered.map((_, i) => `#${i+1}`);
    const minT = filtered.map(r => r.minT || 0);
    const avgT = filtered.map(r => r.avgT || 0);
    const maxT = filtered.map(r => r.maxT || 0);

    createLineChart('chart8', labels, [
        {label: 'T_min', data: minT, color: '#3b82f6'},
        {label: 'T_avg', data: avgT, color: '#f59e0b'},
        {label: 'T_max', data: maxT, color: '#ef4444'}
    ], 'Симуляции', 'Температура (K)', 'Диапазон температур');
}

// 10. Avg Temp vs Pressure
function renderChart9() {
    const filter = document.getElementById('filter9')?.value || 'all';
    const data = filterData(filter)
        .filter(r => r.pressure > 0 && r.avgT > 0)
        .map(r => ({x: r.pressure, y: r.avgT}));

    createScatterChart('chart9', data, 'Давление (Па)', 'Средняя T (K)',
        'Температура от давления', '#22d3ee');
}

// 11. Avg Temp vs Current Density
function renderChart10() {
    const filter = document.getElementById('filter10')?.value || 'all';
    const data = filterData(filter)
        .filter(r => r.currentDensity > 0 && r.avgT > 0)
        .map(r => ({x: r.currentDensity, y: r.avgT}));

    createScatterChart('chart10', data, 'Плотность тока (А/м²)', 'Средняя T (K)',
        'Температура от плотности тока', '#d946ef');
}

// ==============================================================
// ENERGY CHARTS (12-16)
// ==============================================================

// 12. Total Energy vs Voltage
function renderChart11() {
    const filter = document.getElementById('filter11')?.value || 'all';
    const data = filterData(filter)
        .filter(r => r.voltage > 0 && r.totalTransferredEnergy > 0)
        .map(r => ({x: r.voltage, y: r.totalTransferredEnergy}));

    createScatterChart('chart11', data, 'Напряжение (В)', 'Полная энергия (Дж)',
        'Полная энергия от напряжения', '#10b981');
}

// 13. Avg Energy per Atom vs Voltage
function renderChart12() {
    const filter = document.getElementById('filter12')?.value || 'all';
    const data = filterData(filter)
        .filter(r => r.voltage > 0 && r.avgTransferredPerAtom > 0)
        .map(r => ({x: r.voltage, y: r.avgTransferredPerAtom}));

    createScatterChart('chart12', data, 'Напряжение (В)', 'Энергия на атом (Дж)',
        'Энергия на атом от напряжения', '#8b5cf6');
}

// 14. Total Energy Distribution (Histogram)
function renderChart13() {
    const filter = document.getElementById('filter13')?.value || 'all';
    const energies = filterData(filter)
        .map(r => r.totalTransferredEnergy)
        .filter(e => e > 0);

    if (energies.length === 0) return;

    const histogram = createHistogram(energies, 10);
    createBarChart('chart13', histogram.labels, histogram.data,
        'Энергия (Дж)', 'Частота', 'Распределение энергии', '#ec4899');
}

// 15. Energy vs Temperature
function renderChart14() {
    const filter = document.getElementById('filter14')?.value || 'all';
    const data = filterData(filter)
        .filter(r => r.avgT > 0 && r.totalTransferredEnergy > 0)
        .map(r => ({x: r.avgT, y: r.totalTransferredEnergy}));

    createScatterChart('chart14', data, 'Средняя T (K)', 'Полная энергия (Дж)',
        'Энергия от температуры', '#14b8a6');
}

// 16. Energy vs Pressure
function renderChart15() {
    const filter = document.getElementById('filter15')?.value || 'all';
    const data = filterData(filter)
        .filter(r => r.pressure > 0 && r.totalTransferredEnergy > 0)
        .map(r => ({x: r.pressure, y: r.totalTransferredEnergy}));

    createScatterChart('chart15', data, 'Давление (Па)', 'Полная энергия (Дж)',
        'Энергия от давления', '#f59e0b');
}

// ==============================================================
// DIFFUSION CHARTS (17-21) - Arrhenius Equation
// ==============================================================

// 17. D1 vs Temperature (Arrhenius: D = D0·exp(-Q/RT))
function renderChart16() {
    const filter = document.getElementById('filter16')?.value || 'all';
    const data = filterData(filter)
        .filter(r => r.avgT > 0 && r.diffusionCoefficient1 > 0)
        .map(r => ({x: r.avgT, y: r.diffusionCoefficient1}));

    createScatterChart('chart16', data, 'Температура (K)', 'D₁ (м²/с)',
        'D₁ от температуры (Arrhenius)', '#5eead4', true);
}

// 18. D2 vs Temperature (Arrhenius)
function renderChart17() {
    const filter = document.getElementById('filter17')?.value || 'all';
    const data = filterData(filter)
        .filter(r => r.avgT > 0 && r.diffusionCoefficient2 > 0)
        .map(r => ({x: r.avgT, y: r.diffusionCoefficient2}));

    createScatterChart('chart17', data, 'Температура (K)', 'D₂ (м²/с)',
        'D₂ от температуры (Arrhenius)', '#818cf8', true);
}

// 19. D1 vs D2 Comparison
function renderChart18() {
    const filter = document.getElementById('filter18')?.value || 'all';
    const filtered = filterData(filter);

    const labels = filtered.map(r => r.atomName);
    const d1 = filtered.map(r => r.diffusionCoefficient1 || 0);
    const d2 = filtered.map(r => r.diffusionCoefficient2 || 0);

    createDoubleBarChart('chart18', labels, d1, d2,
        'Атомы', 'Коэффициент (м²/с)', 'Сравнение D₁ и D₂');
}

// 21. Diffusion vs Voltage
function renderChart19() {
    const filter = document.getElementById('filter19')?.value || 'all';
    const data = filterData(filter)
        .filter(r => r.voltage > 0 && r.diffusionCoefficient1 > 0)
        .map(r => ({x: r.voltage, y: r.diffusionCoefficient1}));

    createScatterChart('chart19', data, 'Напряжение (В)', 'D₁ (м²/с)',
        'Диффузия от напряжения', '#34d399', true);
}

// ==============================================================
// DAMAGE & MECHANICS CHARTS (22-25)
// ==============================================================

// 22. Total Damage vs Energy
function renderChart20() {
    const filter = document.getElementById('filter20')?.value || 'all';
    const data = filterData(filter)
        .filter(r => r.totalTransferredEnergy > 0 && r.totalDamage > 0)
        .map(r => ({x: r.totalTransferredEnergy, y: r.totalDamage}));

    createScatterChart('chart20', data, 'Переданная энергия (Дж)', 'Повреждения (Дж)',
        'Повреждения от энергии', '#ef4444');
}

// 23. Total Momentum vs Energy
function renderChart21() {
    const filter = document.getElementById('filter21')?.value || 'all';
    const data = filterData(filter)
        .filter(r => r.totalTransferredEnergy > 0 && r.totalMomentum > 0)
        .map(r => ({x: r.totalTransferredEnergy, y: r.totalMomentum}));

    createScatterChart('chart21', data, 'Переданная энергия (Дж)', 'Импульс (кг·м/с)',
        'Импульс от энергии', '#22c55e');
}

// 24. Total Displacement vs Momentum
function renderChart22() {
    const filter = document.getElementById('filter22')?.value || 'all';
    const data = filterData(filter)
        .filter(r => r.totalMomentum > 0 && r.totalDisplacement > 0)
        .map(r => ({x: r.totalMomentum, y: r.totalDisplacement}));

    createScatterChart('chart22', data, 'Импульс (кг·м/с)', 'Смещение (м)',
        'Смещение от импульса', '#a855f7');
}

// 25. Damage vs Temperature
function renderChart23() {
    const filter = document.getElementById('filter23')?.value || 'all';
    const data = filterData(filter)
        .filter(r => r.avgT > 0 && r.totalDamage > 0)
        .map(r => ({x: r.avgT, y: r.totalDamage}));

    createScatterChart('chart23', data, 'Средняя T (K)', 'Повреждения (Дж)',
        'Повреждения от температуры', '#fb923c');
}

// ==============================================================
// Helper Functions
// ==============================================================

function createScatterChart(canvasId, data, xLabel, yLabel, title, color, logY = false) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (charts[canvasId]) charts[canvasId].destroy();

    if (!data || data.length === 0) {
        charts[canvasId] = new Chart(ctx, {
            type: 'scatter',
            data: { datasets: [{ data: [] }] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: title,
                        color: '#e2e8f0',
                        font: { size: 14, weight: 'bold' }
                    },
                    legend: { display: false },
                    annotation: {
                        annotations: {
                            text: {
                                type: 'label',
                                content: ['Нет данных для отображения'],
                                position: { x: '50%', y: '50%' },
                                color: '#94a3b8',
                                font: { size: 14 }
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: xLabel, color: '#e2e8f0' },
                        grid: { color: 'rgba(94, 234, 212, 0.1)' },
                        ticks: { color: '#94a3b8' }
                    },
                    y: {
                        title: { display: true, text: yLabel, color: '#e2e8f0' },
                        grid: { color: 'rgba(94, 234, 212, 0.1)' },
                        ticks: { color: '#94a3b8' }
                    }
                }
            }
        });
        return;
    }

    // Сортируем данные по x для правильного отображения линии
    const sortedData = [...data].sort((a, b) => a.x - b.x);

    charts[canvasId] = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: title,
                data: sortedData,
                backgroundColor: color + '80',
                borderColor: color,
                borderWidth: 2.5,
                pointRadius: 5,
                pointHoverRadius: 8,
                pointHoverBackgroundColor: color,
                pointHoverBorderColor: '#ffffff',
                pointHoverBorderWidth: 2,
                showLine: true,
                tension: 0.2, // Уменьшаем tension для более реалистичных линий
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: title,
                    color: '#e2e8f0',
                    font: { size: 14, weight: 'bold' }
                },
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 41, 0.95)',
                    titleColor: '#5eead4',
                    bodyColor: '#e2e8f0',
                    borderColor: color,
                    borderWidth: 1,
                    callbacks: {
                        label: (context) => {
                            return `${xLabel}: ${context.parsed.x.toExponential(3)}, ${yLabel}: ${context.parsed.y.toExponential(3)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: xLabel,
                        color: '#e2e8f0',
                        font: { size: 12, weight: '500' }
                    },
                    grid: { color: 'rgba(94, 234, 212, 0.1)' },
                    ticks: {
                        color: '#94a3b8',
                        callback: (v) => {
                            if (Math.abs(v) < 0.001 || Math.abs(v) > 1000) {
                                return v.toExponential(1);
                            }
                            return v.toPrecision(3);
                        }
                    }
                },
                y: {
                    type: logY ? 'logarithmic' : 'linear',
                    title: {
                        display: true,
                        text: yLabel,
                        color: '#e2e8f0',
                        font: { size: 12, weight: '500' }
                    },
                    grid: { color: 'rgba(94, 234, 212, 0.1)' },
                    ticks: {
                        color: '#94a3b8',
                        callback: (v) => {
                            if (Math.abs(v) < 0.001 || Math.abs(v) > 1000) {
                                return v.toExponential(1);
                            }
                            return v.toPrecision(3);
                        }
                    }
                }
            },
            elements: {
                line: {
                    borderWidth: 2.5,
                    backgroundColor: color + '20'
                },
                point: {
                    backgroundColor: color,
                    borderColor: '#ffffff',
                    borderWidth: 1,
                    radius: 5,
                    hoverRadius: 8
                }
            }
        }
    });
}

function createLineChart(canvasId, labels, datasets, xLabel, yLabel, title) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (charts[canvasId]) charts[canvasId].destroy();

    const chartDatasets = datasets.map(ds => ({
        label: ds.label,
        data: ds.data,
        borderColor: ds.color,
        backgroundColor: ds.color + '20',
        borderWidth: 3,
        tension: 0.3,
        fill: false,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBackgroundColor: ds.color,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2
    }));

    charts[canvasId] = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets: chartDatasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: title,
                    color: '#e2e8f0',
                    font: { size: 14, weight: 'bold' }
                },
                legend: {
                    labels: {
                        color: '#e2e8f0',
                        font: { size: 11 },
                        usePointStyle: true,
                        pointStyle: 'circle'
                    },
                    position: 'top',
                    align: 'center'
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 41, 0.95)',
                    titleColor: '#5eead4',
                    bodyColor: '#e2e8f0'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: xLabel,
                        color: '#e2e8f0',
                        font: { size: 12, weight: '500' }
                    },
                    grid: { color: 'rgba(94, 234, 212, 0.1)' },
                    ticks: {
                        color: '#94a3b8',
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: yLabel,
                        color: '#e2e8f0',
                        font: { size: 12, weight: '500' }
                    },
                    grid: { color: 'rgba(94, 234, 212, 0.1)' },
                    ticks: { color: '#94a3b8' },
                    beginAtZero: true
                }
            }
        }
    });
}

function createBarChart(canvasId, labels, data, xLabel, yLabel, title, color) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (charts[canvasId]) charts[canvasId].destroy();

    charts[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: title,
                data: data,
                backgroundColor: color + '80',
                borderColor: color,
                borderWidth: 2,
                borderRadius: 4,
                barPercentage: 0.7,
                categoryPercentage: 0.8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: title,
                    color: '#e2e8f0',
                    font: { size: 14, weight: 'bold' }
                },
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 41, 0.95)',
                    titleColor: '#5eead4',
                    bodyColor: '#e2e8f0'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: xLabel,
                        color: '#e2e8f0',
                        font: { size: 12, weight: '500' }
                    },
                    grid: { display: false },
                    ticks: {
                        color: '#94a3b8',
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: yLabel,
                        color: '#e2e8f0',
                        font: { size: 12, weight: '500' }
                    },
                    grid: { color: 'rgba(94, 234, 212, 0.1)' },
                    ticks: { color: '#94a3b8' },
                    beginAtZero: true
                }
            }
        }
    });
}

function createDoubleBarChart(canvasId, labels, data1, data2, xLabel, yLabel, title) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (charts[canvasId]) charts[canvasId].destroy();

    charts[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'D₁',
                    data: data1,
                    backgroundColor: '#5eead480',
                    borderColor: '#5eead4',
                    borderWidth: 2,
                    borderRadius: 4,
                    barPercentage: 0.7,
                    categoryPercentage: 0.8
                },
                {
                    label: 'D₂',
                    data: data2,
                    backgroundColor: '#818cf880',
                    borderColor: '#818cf8',
                    borderWidth: 2,
                    borderRadius: 4,
                    barPercentage: 0.7,
                    categoryPercentage: 0.8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: title,
                    color: '#e2e8f0',
                    font: { size: 14, weight: 'bold' }
                },
                legend: {
                    labels: {
                        color: '#e2e8f0',
                        font: { size: 11 },
                        usePointStyle: true,
                        pointStyle: 'rect'
                    },
                    position: 'top'
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 41, 0.95)',
                    titleColor: '#5eead4',
                    bodyColor: '#e2e8f0'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: xLabel,
                        color: '#e2e8f0',
                        font: { size: 12, weight: '500' }
                    },
                    grid: { display: false },
                    ticks: {
                        color: '#94a3b8',
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: yLabel,
                        color: '#e2e8f0',
                        font: { size: 12, weight: '500' }
                    },
                    grid: { color: 'rgba(94, 234, 212, 0.1)' },
                    ticks: { color: '#94a3b8' },
                    beginAtZero: true
                }
            }
        }
    });
}

function createHistogram(data, bins) {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const binSize = (max - min) / bins;

    const counts = Array(bins).fill(0);
    const labels = [];

    for (let i = 0; i < bins; i++) {
        const start = min + i * binSize;
        const end = start + binSize;
        labels.push(`${start.toExponential(1)} - ${end.toExponential(1)}`);

        data.forEach(val => {
            if (val >= start && (i === bins - 1 ? val <= end : val < end)) {
                counts[i]++;
            }
        });
    }

    return { labels, data: counts };
}

console.log('[Charts] Complete visualization suite loaded');