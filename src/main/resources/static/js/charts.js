let allResults = [];
let atomsMap = new Map();
let ionsMap = new Map();
let charts = {};

Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.color = '#94a3b8';

const COLORS = {
    // Plasma Physics
    electronDensity: '#5eead4',
    electronVelocity: '#818cf8',
    currentDensity: '#f472b6',
    ionEnergy: '#34d399',
    electronTemp: '#60a5fa',

    // Thermal
    thermalization: '#a78bfa',
    tempVsVoltage: '#f87171',
    tempRange: ['#3b82f6', '#f59e0b', '#ef4444'],
    tempVsPressure: '#22d3ee',
    tempVsCurrent: '#d946ef',

    // Energy
    totalEnergy: '#10b981',
    energyPerAtom: '#8b5cf6',
    energyDistribution: '#ec4899',
    energyVsTemp: '#14b8a6',
    energyVsPressure: '#f59e0b',

    // Diffusion
    diffusion1: '#5eead4',
    diffusion2: '#818cf8',
    diffusionComparison: '#a78bfa',
    diffusionVsVoltage: '#34d399',

    // Damage & Mechanics
    damageVsEnergy: '#ef4444',
    momentumVsEnergy: '#22c55e',
    displacementVsMomentum: '#a855f7',
    damageVsTemp: '#fb923c'
};

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

        const atomsData = await atomsRes.json().catch(() => ({ data: [] }));
        const ionsData = await ionsRes.json().catch(() => ({ data: [] }));
        const resultsData = await resultsRes.json().catch(() => ({ data: [] }));

        const atoms = atomsData.data || [];
        const ions = ionsData.data || [];
        const results = resultsData.data || [];

        // Create maps for quick lookup
        atoms.forEach(atom => atom?.id && atomsMap.set(atom.id, atom));
        ions.forEach(ion => ion?.id && ionsMap.set(ion.id, ion));

        // Enrich results with atom/ion data
        allResults = results.map(r => enrichResult(r));

        // Load missing data if needed
        if (atomsMap.size === 0 && results.length > 0) await loadMissingAtoms(results);
        if (ionsMap.size === 0 && results.length > 0) await loadMissingIons(results);

        // Re-enrich after loading missing data
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

    // Get atom from map
    let atom = null;
    if (r.atomId && atomsMap.has(r.atomId)) {
        atom = atomsMap.get(r.atomId);
    } else if (r.atom?.id) {
        atom = r.atom;
        atomsMap.set(r.atom.id, atom);
    }

    // Get ion from map
    let ion = null;
    if (r.ionId && ionsMap.has(r.ionId)) {
        ion = ionsMap.get(r.ionId);
    } else if (r.ion?.id) {
        ion = r.ion;
        ionsMap.set(r.ion.id, ion);
    }

    const plasmaParams = extractPlasmaParams(r);

    return {
        ...r,
        atomId: r.atomId || r.atom?.id,
        atomName: atom?.atomName || atom?.name || atom?.symbol || 'Unknown',
        atomFullName: atom?.fullName || '',
        ionId: r.ionId || r.ion?.id,
        ionName: ion?.name || 'Unknown',
        ionCharge: ion?.charge || 0,

        // Plasma parameters
        ...plasmaParams,

        // Energy parameters
        totalTransferredEnergy: r.totalTransferredEnergy || 0,
        avgTransferredPerAtom: r.avgTransferredPerAtom || 0,

        // Temperature parameters
        avgT: r.avgT || 0,
        minT: r.minT || 0,
        maxT: r.maxT || 0,

        // Diffusion
        diffusionCoefficient1: r.diffusionCoefficient1 || 0,
        diffusionCoefficient2: r.diffusionCoefficient2 || 0,

        // Additional physics
        depths: r.depths || 0,
        concentration: r.concentration || 0,
        dThermal: r.dThermal || 0,
        totalMomentum: r.totalMomentum || 0,
        totalDamage: r.totalDamage || 0,
        totalDisplacement: r.totalDisplacement || 0,

        createdAt: r.createdAt || new Date().toISOString()
    };
}

function extractPlasmaParams(r) {
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

async function loadMissingAtoms(results) {
    const atomIds = [...new Set(results.map(r => r.atomId).filter(id => id))];
    for (const id of atomIds) {
        if (!atomsMap.has(id)) {
            try {
                const res = await fetch(`/atoms/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.data) atomsMap.set(id, data.data);
                }
            } catch (e) {
                console.warn(`[Charts] Failed to load atom ${id}:`, e);
            }
        }
    }
}

async function loadMissingIons(results) {
    const ionIds = [...new Set(results.map(r => r.ionId).filter(id => id))];
    for (const id of ionIds) {
        if (!ionsMap.has(id)) {
            try {
                const res = await fetch(`/ions/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.data) ionsMap.set(id, data.data);
                }
            } catch (e) {
                console.warn(`[Charts] Failed to load ion ${id}:`, e);
            }
        }
    }
}

function updateStats() {
    const totalEl = document.getElementById('totalSimulations');
    const atomsEl = document.getElementById('uniqueAtoms');
    const ionsEl = document.getElementById('uniqueIons');

    if (totalEl) totalEl.textContent = allResults.length;

    if (atomsEl) {
        const atoms = new Set(allResults.map(r => r.atomName).filter(n => n !== 'Unknown'));
        atomsEl.textContent = atoms.size || allResults.length;
    }

    if (ionsEl) {
        const ions = new Set(allResults.map(r => r.ionName).filter(n => n !== 'Unknown'));
        ionsEl.textContent = ions.size || allResults.length;
    }
}

function populateFilters() {
    // Получаем уникальные имена атомов (для фильтров 6-24)
    const atomNames = [...new Set(allResults.map(r => r.atomName).filter(n => n !== 'Unknown'))];

    // Получаем уникальные имена ионов (для фильтров 1-5 - плазма)
    const ionNames = [...new Set(allResults.map(r => r.ionName).filter(n => n !== 'Unknown'))];

    if (atomNames.length === 0) {
        const atomIds = [...new Set(allResults.map(r => r.atomId).filter(id => id))];
        atomNames.push(...atomIds.map(id => `Атом ${id}`));
    }

    if (ionNames.length === 0) {
        const ionIds = [...new Set(allResults.map(r => r.ionId).filter(id => id))];
        ionNames.push(...ionIds.map(id => `Ион ${id}`));
    }

    if (atomNames.length === 0) atomNames.push('Все результаты');
    if (ionNames.length === 0) ionNames.push('Все результаты');

    // Фильтры 1-5: плазма (по ионам)
    const plasmaFilters = ['filter1', 'filter2', 'filter3', 'filter4', 'filter5'];
    plasmaFilters.forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.innerHTML = '<option value="all">Все ионы</option>';
            ionNames.forEach(name => {
                const opt = document.createElement('option');
                opt.value = name;
                opt.textContent = name;
                select.appendChild(opt);
            });
            select.removeEventListener('change', renderAllCharts);
            select.addEventListener('change', renderAllCharts);
        }
    });

    // Фильтры 6-24: остальные графики (по атомам)
    const otherFilters = Array.from({ length: 24 }, (_, i) => `filter${i + 6}`).filter(id => {
        const el = document.getElementById(id);
        return el !== null && !plasmaFilters.includes(id);
    });

    otherFilters.forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.innerHTML = '<option value="all">Все атомы</option>';
            atomNames.forEach(name => {
                const opt = document.createElement('option');
                opt.value = name;
                opt.textContent = name;
                select.appendChild(opt);
            });
            select.removeEventListener('change', renderAllCharts);
            select.addEventListener('change', renderAllCharts);
        }
    });
}

// Фильтрация по АТОМАМ (для остальных графиков)
function filterByAtom(atomName) {
    if (atomName === 'all' || !atomName) return allResults;

    return allResults.filter(r => {
        if (r.atomName === atomName) return true;
        const atomIdMatch = atomName.match(/Атом (\d+)/);
        if (atomIdMatch && r.atomId === parseInt(atomIdMatch[1])) return true;
        return false;
    });
}

// Фильтрация по ИОНАМ (для плазменных графиков 1-5)
function filterByIon(ionName) {
    if (ionName === 'all' || !ionName) return allResults;

    return allResults.filter(r => {
        if (r.ionName === ionName) return true;
        const ionIdMatch = ionName.match(/Ион (\d+)/);
        if (ionIdMatch && r.ionId === parseInt(ionIdMatch[1])) return true;
        return false;
    });
}

function createScatterChart(canvasId, data, xLabel, yLabel, title, color, logY = false) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (charts[canvasId]) charts[canvasId].destroy();

    if (!data?.length) {
        createEmptyChart(ctx, canvasId, title, xLabel, yLabel);
        return;
    }

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
                tension: 0.2,
                fill: false
            }]
        },
        options: getChartOptions(xLabel, yLabel, title, color, logY)
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
                    position: 'top'
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 41, 0.95)',
                    titleColor: '#5eead4',
                    bodyColor: '#e2e8f0'
                }
            },
            scales: getAxisConfig(xLabel, yLabel)
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
        options: getBarOptions(xLabel, yLabel, title)
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
                    backgroundColor: COLORS.diffusion1 + '80',
                    borderColor: COLORS.diffusion1,
                    borderWidth: 2,
                    borderRadius: 4,
                    barPercentage: 0.7,
                    categoryPercentage: 0.8
                },
                {
                    label: 'D₂',
                    data: data2,
                    backgroundColor: COLORS.diffusion2 + '80',
                    borderColor: COLORS.diffusion2,
                    borderWidth: 2,
                    borderRadius: 4,
                    barPercentage: 0.7,
                    categoryPercentage: 0.8
                }
            ]
        },
        options: getDoubleBarOptions(xLabel, yLabel, title)
    });
}

function createEmptyChart(ctx, canvasId, title, xLabel, yLabel) {
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
            scales: getAxisConfig(xLabel, yLabel)
        }
    });
}

function getChartOptions(xLabel, yLabel, title, color, logY) {
    return {
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
                        return `${xLabel}: ${formatNumber(context.parsed.x)}, ${yLabel}: ${formatNumber(context.parsed.y)}`;
                    }
                }
            }
        },
        scales: {
            x: getAxisConfig(xLabel, yLabel).x,
            y: {
                ...getAxisConfig(xLabel, yLabel).y,
                type: logY ? 'logarithmic' : 'linear'
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
    };
}

function getAxisConfig(xLabel, yLabel) {
    return {
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
                callback: (v) => formatNumber(v)
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
            ticks: {
                color: '#94a3b8',
                callback: (v) => formatNumber(v)
            }
        }
    };
}

function getBarOptions(xLabel, yLabel, title) {
    return {
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
    };
}

function getDoubleBarOptions(xLabel, yLabel, title) {
    return {
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
    };
}

function formatNumber(num) {
    if (Math.abs(num) < 0.001 || Math.abs(num) > 1000) {
        return num.toExponential(1);
    }
    return num.toPrecision(3);
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
        labels.push(`${formatNumber(start)} - ${formatNumber(end)}`);

        data.forEach(val => {
            if (val >= start && (i === bins - 1 ? val <= end : val < end)) {
                counts[i]++;
            }
        });
    }

    return { labels, data: counts };
}

function renderAllCharts() {
    // Plasma Physics (5 charts) - фильтрация по ИОНАМ
    renderChart1();  // Electron Density vs Pressure
    renderChart2();  // Electron Velocity vs Voltage
    renderChart3();  // Current Density vs Voltage
    renderChart4();  // Ion Energy vs Voltage
    renderChart5();  // Electron Temperature vs Voltage

    // Thermal (5 charts) - фильтрация по АТОМАМ
    renderChart6();  // Avg Temp vs Transferred Energy
    renderChart7();  // Avg Temp vs Voltage
    renderChart8();  // Temperature Range
    renderChart9();  // Avg Temp vs Pressure
    renderChart10(); // Avg Temp vs Current Density

    // Energy (5 charts) - фильтрация по АТОМАМ
    renderChart11(); // Total Energy vs Voltage
    renderChart12(); // Energy per Atom vs Voltage
    renderChart13(); // Energy Distribution
    renderChart14(); // Energy vs Temperature
    renderChart15(); // Energy vs Pressure

    // Diffusion (5 charts) - фильтрация по АТОМАМ
    renderChart16(); // D1 vs Temperature
    renderChart17(); // D2 vs Temperature
    renderChart18(); // D1 vs D2 Comparison
    renderChart19(); // Diffusion vs Voltage
    renderChart20(); // D1 vs D2 with Regression

    // Damage & Mechanics (4 charts) - фильтрация по АТОМАМ
    renderChart21(); // Damage vs Energy
    renderChart22(); // Momentum vs Energy
    renderChart23(); // Displacement vs Momentum
    renderChart24(); // Damage vs Temperature
}

// ==============================================================
// Plasma Physics Charts (1-5) - ФИЛЬТРАЦИЯ ПО ИОНАМ
// ==============================================================

function renderChart1() {
    const filter = document.getElementById('filter1')?.value || 'all';
    const data = filterByIon(filter)
        .filter(r => r.pressure > 0 && r.electronDensity > 0)
        .map(r => ({x: r.pressure, y: r.electronDensity}));

    createScatterChart('chart1', data, 'Давление (Па)', 'Плотность электронов (м⁻³)',
        'Плотность электронов от давления', COLORS.electronDensity);
}

function renderChart2() {
    const filter = document.getElementById('filter2')?.value || 'all';
    const data = filterByIon(filter)
        .filter(r => r.voltage > 0 && r.electronVelocity > 0)
        .map(r => ({x: r.voltage, y: r.electronVelocity}));

    createScatterChart('chart2', data, 'Напряжение (В)', 'Скорость электронов (м/с)',
        'Скорость электронов от напряжения', COLORS.electronVelocity);
}

function renderChart3() {
    const filter = document.getElementById('filter3')?.value || 'all';
    const data = filterByIon(filter)
        .filter(r => r.voltage > 0 && r.currentDensity > 0)
        .map(r => ({x: r.voltage, y: r.currentDensity}));

    createScatterChart('chart3', data, 'Напряжение (В)', 'Плотность тока (А/м²)',
        'ВАХ: Плотность тока от напряжения', COLORS.currentDensity);
}

function renderChart4() {
    const filter = document.getElementById('filter4')?.value || 'all';
    const data = filterByIon(filter)
        .filter(r => r.voltage > 0 && r.ionEnergy > 0)
        .map(r => ({x: r.voltage, y: r.ionEnergy}));

    createScatterChart('chart4', data, 'Напряжение (В)', 'Энергия ионов (Дж)',
        'Энергия ионов от напряжения', COLORS.ionEnergy);
}

function renderChart5() {
    const filter = document.getElementById('filter5')?.value || 'all';
    const data = filterByIon(filter)
        .filter(r => r.voltage > 0 && r.electronTemperature > 0)
        .map(r => ({x: r.voltage, y: r.electronTemperature}));

    createScatterChart('chart5', data, 'Напряжение (В)', 'T электронов (K)',
        'Температура электронов от напряжения', COLORS.electronTemp);
}

// ==============================================================
// Thermal Charts (6-10) - ФИЛЬТРАЦИЯ ПО АТОМАМ
// ==============================================================

function renderChart6() {
    const filter = document.getElementById('filter6')?.value || 'all';
    const data = filterByAtom(filter)
        .filter(r => r.totalTransferredEnergy > 0 && r.avgT > 0)
        .map(r => ({x: r.totalTransferredEnergy, y: r.avgT}));

    createScatterChart('chart6', data, 'Переданная энергия (Дж)', 'Средняя T (K)',
        'Термализация: T от энергии', COLORS.thermalization);
}

function renderChart7() {
    const filter = document.getElementById('filter7')?.value || 'all';
    const data = filterByAtom(filter)
        .filter(r => r.voltage > 0 && r.avgT > 0)
        .map(r => ({x: r.voltage, y: r.avgT}));

    createScatterChart('chart7', data, 'Напряжение (В)', 'Средняя T (K)',
        'Температура от напряжения', COLORS.tempVsVoltage);
}

function renderChart8() {
    const filter = document.getElementById('filter8')?.value || 'all';
    const filtered = filterByAtom(filter);

    const labels = filtered.map((_, i) => `#${i+1}`);
    const minT = filtered.map(r => r.minT || 0);
    const avgT = filtered.map(r => r.avgT || 0);
    const maxT = filtered.map(r => r.maxT || 0);

    createLineChart('chart8', labels, [
        {label: 'T_min', data: minT, color: COLORS.tempRange[0]},
        {label: 'T_avg', data: avgT, color: COLORS.tempRange[1]},
        {label: 'T_max', data: maxT, color: COLORS.tempRange[2]}
    ], 'Симуляции', 'Температура (K)', 'Диапазон температур');
}

function renderChart9() {
    const filter = document.getElementById('filter9')?.value || 'all';
    const data = filterByAtom(filter)
        .filter(r => r.pressure > 0 && r.avgT > 0)
        .map(r => ({x: r.pressure, y: r.avgT}));

    createScatterChart('chart9', data, 'Давление (Па)', 'Средняя T (K)',
        'Температура от давления', COLORS.tempVsPressure);
}

function renderChart10() {
    const filter = document.getElementById('filter10')?.value || 'all';
    const data = filterByAtom(filter)
        .filter(r => r.currentDensity > 0 && r.avgT > 0)
        .map(r => ({x: r.currentDensity, y: r.avgT}));

    createScatterChart('chart10', data, 'Плотность тока (А/м²)', 'Средняя T (K)',
        'Температура от плотности тока', COLORS.tempVsCurrent);
}

// ==============================================================
// Energy Charts (11-15) - ФИЛЬТРАЦИЯ ПО АТОМАМ
// ==============================================================

function renderChart11() {
    const filter = document.getElementById('filter11')?.value || 'all';
    const data = filterByAtom(filter)
        .filter(r => r.voltage > 0 && r.totalTransferredEnergy > 0)
        .map(r => ({x: r.voltage, y: r.totalTransferredEnergy}));

    createScatterChart('chart11', data, 'Напряжение (В)', 'Полная энергия (Дж)',
        'Полная энергия от напряжения', COLORS.totalEnergy);
}

function renderChart12() {
    const filter = document.getElementById('filter12')?.value || 'all';
    const data = filterByAtom(filter)
        .filter(r => r.voltage > 0 && r.avgTransferredPerAtom > 0)
        .map(r => ({x: r.voltage, y: r.avgTransferredPerAtom}));

    createScatterChart('chart12', data, 'Напряжение (В)', 'Энергия на атом (Дж)',
        'Энергия на атом от напряжения', COLORS.energyPerAtom);
}

function renderChart13() {
    const filter = document.getElementById('filter13')?.value || 'all';
    const energies = filterByAtom(filter)
        .map(r => r.totalTransferredEnergy)
        .filter(e => e > 0);

    if (energies.length === 0) return;

    const histogram = createHistogram(energies, 10);
    createBarChart('chart13', histogram.labels, histogram.data,
        'Энергия (Дж)', 'Частота', 'Распределение энергии', COLORS.energyDistribution);
}

function renderChart14() {
    const filter = document.getElementById('filter14')?.value || 'all';
    const data = filterByAtom(filter)
        .filter(r => r.avgT > 0 && r.totalTransferredEnergy > 0)
        .map(r => ({x: r.avgT, y: r.totalTransferredEnergy}));

    createScatterChart('chart14', data, 'Средняя T (K)', 'Полная энергия (Дж)',
        'Энергия от температуры', COLORS.energyVsTemp);
}

function renderChart15() {
    const filter = document.getElementById('filter15')?.value || 'all';
    const data = filterByAtom(filter)
        .filter(r => r.pressure > 0 && r.totalTransferredEnergy > 0)
        .map(r => ({x: r.pressure, y: r.totalTransferredEnergy}));

    createScatterChart('chart15', data, 'Давление (Па)', 'Полная энергия (Дж)',
        'Энергия от давления', COLORS.energyVsPressure);
}

// ==============================================================
// Diffusion Charts (16-20) - ФИЛЬТРАЦИЯ ПО АТОМАМ
// ==============================================================

function renderChart16() {
    const filter = document.getElementById('filter16')?.value || 'all';
    const data = filterByAtom(filter)
        .filter(r => r.avgT > 0 && r.diffusionCoefficient1 > 0)
        .map(r => ({x: r.avgT, y: r.diffusionCoefficient1}));

    createScatterChart('chart16', data, 'Температура (K)', 'D₁ (м²/с)',
        'D₁ от температуры (Arrhenius)', COLORS.diffusion1, true);
}

function renderChart17() {
    const filter = document.getElementById('filter17')?.value || 'all';
    const data = filterByAtom(filter)
        .filter(r => r.avgT > 0 && r.diffusionCoefficient2 > 0)
        .map(r => ({x: r.avgT, y: r.diffusionCoefficient2}));

    createScatterChart('chart17', data, 'Температура (K)', 'D₂ (м²/с)',
        'D₂ от температуры (Arrhenius)', COLORS.diffusion2, true);
}

function renderChart18() {
    const filter = document.getElementById('filter18')?.value || 'all';
    const filtered = filterByAtom(filter);

    const labels = filtered.map(r => r.atomName);
    const d1 = filtered.map(r => r.diffusionCoefficient1 || 0);
    const d2 = filtered.map(r => r.diffusionCoefficient2 || 0);

    createDoubleBarChart('chart18', labels, d1, d2,
        'Атомы', 'Коэффициент (м²/с)', 'Сравнение D₁ и D₂');
}

function renderChart19() {
    const filter = document.getElementById('filter19')?.value || 'all';
    const data = filterByAtom(filter)
        .filter(r => r.voltage > 0 && r.diffusionCoefficient1 > 0)
        .map(r => ({x: r.voltage, y: r.diffusionCoefficient1}));

    createScatterChart('chart19', data, 'Напряжение (В)', 'D₁ (м²/с)',
        'Диффузия от напряжения', COLORS.diffusionVsVoltage, true);
}

function renderChart20() {
    const filter = document.getElementById('filter20')?.value || 'all';
    const filtered = filterByAtom(filter);

    const labels = filtered.map(r => r.atomName);
    const d1 = filtered.map(r => r.diffusionCoefficient1 || 0);
    const d2 = filtered.map(r => r.diffusionCoefficient2 || 0);

    createDoubleBarChart('chart20', labels, d1, d2,
        'Атомы', 'Коэффициент (м²/с)', 'Сравнение D₁ и D₂');
}

// ==============================================================
// Damage & Mechanics Charts (21-24) - ФИЛЬТРАЦИЯ ПО АТОМАМ
// ==============================================================

function renderChart21() {
    const filter = document.getElementById('filter21')?.value || 'all';
    const data = filterByAtom(filter)
        .filter(r => r.totalTransferredEnergy > 0 && r.totalDamage > 0)
        .map(r => ({x: r.totalTransferredEnergy, y: r.totalDamage}));

    createScatterChart('chart21', data, 'Переданная энергия (Дж)', 'Повреждения (Дж)',
        'Повреждения от энергии', COLORS.damageVsEnergy);
}

function renderChart22() {
    const filter = document.getElementById('filter22')?.value || 'all';
    const data = filterByAtom(filter)
        .filter(r => r.totalTransferredEnergy > 0 && r.totalMomentum > 0)
        .map(r => ({x: r.totalTransferredEnergy, y: r.totalMomentum}));

    createScatterChart('chart22', data, 'Переданная энергия (Дж)', 'Импульс (кг·м/с)',
        'Импульс от энергии', COLORS.momentumVsEnergy);
}

function renderChart23() {
    const filter = document.getElementById('filter23')?.value || 'all';
    const data = filterByAtom(filter)
        .filter(r => r.totalMomentum > 0 && r.totalDisplacement > 0)
        .map(r => ({x: r.totalMomentum, y: r.totalDisplacement}));

    createScatterChart('chart23', data, 'Импульс (кг·м/с)', 'Смещение (м)',
        'Смещение от импульса', COLORS.displacementVsMomentum);
}

function renderChart24() {
    const filter = document.getElementById('filter24')?.value || 'all';
    const data = filterByAtom(filter)
        .filter(r => r.avgT > 0 && r.totalDamage > 0)
        .map(r => ({x: r.avgT, y: r.totalDamage}));

    createScatterChart('chart24', data, 'Средняя T (K)', 'Повреждения (Дж)',
        'Повреждения от температуры', COLORS.damageVsTemp);
}

console.log('[Charts] Complete visualization suite loaded');