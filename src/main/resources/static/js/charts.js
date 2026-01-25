// charts.js - Графики для результатов симуляции PlasmaLab

let plasmaChart = null;
let temperatureChart = null;
let allResults = [];

// Инициализация при загрузке страницы
document.addEventListener("DOMContentLoaded", () => {
    console.log("📊 Инициализация графиков...");
    initializePage();
});

function initializePage() {
    checkAuthAndUpdateUI();
    setupEventListeners();
    loadAllResults();
}

function checkAuthAndUpdateUI() {
    const token = getToken();

    const userMenu = document.querySelector('.user-menu');
    const authButtons = document.querySelector('.auth-buttons');

    if (token) {
        if (userMenu) userMenu.style.display = 'flex';
        if (authButtons) authButtons.style.display = 'none';

        hideAuthWarning();
        loadUsername();
    } else {
        if (userMenu) userMenu.style.display = 'none';
        if (authButtons) authButtons.style.display = 'flex';

        showAuthWarning();
    }
}

async function loadUsername() {
    try {
        const token = getToken();
        const response = await fetch("/auth/me", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.data?.username) {
                document.getElementById("usernameDisplay").textContent = data.data.username;
            }
        }
    } catch (err) {
        console.log("Не удалось загрузить имя пользователя:", err);
    }
}

function setupEventListeners() {
    // Плазменный график
    const plasmaChartType = document.getElementById('plasmaChartType');
    const atomFilter1 = document.getElementById('atomFilter1');

    if (plasmaChartType) plasmaChartType.addEventListener('change', updatePlasmaChart);
    if (atomFilter1) atomFilter1.addEventListener('change', updatePlasmaChart);

    // Температурный график
    const atomSelector = document.getElementById('atomSelector');
    const temperatureType = document.getElementById('temperatureType');
    const diffSelector = document.getElementById('diffSelector');

    if (atomSelector) atomSelector.addEventListener('change', updateTemperatureChart);
    if (temperatureType) temperatureType.addEventListener('change', updateTemperatureChart);
    if (diffSelector) diffSelector.addEventListener('change', updateTemperatureChart);
}

function showAuthWarning() {
    if (document.getElementById('auth-warning')) return;

    const warning = document.createElement('div');
    warning.id = 'auth-warning';
    warning.className = 'alert alert-error';
    warning.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        Для просмотра графиков необходимо 
        <a href="#" onclick="showAuthModal()" style="color: var(--primary); text-decoration: underline;">
            войти в систему
        </a>
    `;

    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(warning, container.firstChild);
    }
}

// Загрузка всех результатов
async function loadAllResults() {
    const token = getToken();
    if (!token) return;

    try {
        const response = await fetch("/results/config", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) {
            showError(`Ошибка сервера: ${response.status}`);
            return;
        }

        const data = await response.json();
        allResults = data.data || [];
        console.log(`✅ Загружено ${allResults.length} результатов`);

        // Инициализируем интерфейс
        populateAtomFilters();
        updatePlasmaChart();
        updateTemperatureChart();

    } catch (err) {
        console.error("Ошибка при загрузке результатов:", err);
        showError("Не удалось загрузить данные для графиков");
    }
}

function hideAuthWarning() {
    const warning = document.getElementById('auth-warning');
    if (warning) warning.remove();
}


// Заполнение фильтров атомов
function populateAtomFilters() {
    const uniqueAtoms = [...new Set(allResults.map(result =>
        result.atom?.atomName || result.atom?.name || 'Неизвестно'
    ).filter(name => name && name !== 'Неизвестно'))];

    const atomFilter1 = document.getElementById('atomFilter1');
    const atomSelector = document.getElementById('atomSelector');

    // Очищаем существующие опции (кроме первой)
    if (atomFilter1) {
        atomFilter1.innerHTML = '<option value="all">Все атомы</option>';
        uniqueAtoms.forEach(atom => {
            if (atom && atom !== 'null') {
                atomFilter1.innerHTML += `<option value="${atom}">${atom}</option>`;
            }
        });
    }

    if (atomSelector) {
        atomSelector.innerHTML = '<option value="all">Все атомы</option>';
        uniqueAtoms.forEach(atom => {
            if (atom && atom !== 'null') {
                atomSelector.innerHTML += `<option value="${atom}">${atom}</option>`;
            }
        });
    }
}

// Обновление графика параметров плазмы
function updatePlasmaChart() {
    const empty = document.getElementById('plasmaEmpty');
    empty.hidden = true;

    const chartType = document.getElementById('plasmaChartType').value;
    const atomFilter = document.getElementById('atomFilter1').value;

    let filteredResults = allResults;
    if (atomFilter !== 'all') {
        filteredResults = allResults.filter(r =>
            (r.atom?.atomName || r.atom?.name) === atomFilter
        );
    }

    if (filteredResults.length === 0) {
        if (plasmaChart) plasmaChart.destroy();
        empty.hidden = false;
        return;
    }

    const chartData = preparePlasmaChartData(chartType, filteredResults);
    renderPlasmaChart(chartData, chartType);
}

// Подготовка данных для графика плазмы
function preparePlasmaChartData(chartType, results) {
    const datasets = {};

    // Группируем по атомам
    results.forEach(result => {
        const atom = result.atom?.atomName || result.atom?.name || "Неизвестно";

        if (!datasets[atom]) {
            const color = generateColor(atom);
            datasets[atom] = {
                label: atom,
                data: [],
                borderColor: color,
                backgroundColor: color + '20',
                borderWidth: 2,
                tension: 0.3,
                fill: false
            };
        }

        let x, y;

        switch (chartType) {
            case 'electronDensity-pressure':
                x = result.pressure;
                y = result.electronDensity;
                break;
            case 'electronVelocity-voltage':
                x = result.voltage;
                y = result.electronVelocity;
                break;
            case 'currentDensity-voltage':
                x = result.voltage;
                y = result.currentDensity;
                break;
            case 'ionEnergyEffective-voltage':
                x = result.voltage;
                y = result.ionEnergy;
                break;
        }

        if (x !== undefined && y !== undefined && !isNaN(x) && !isNaN(y)) {
            datasets[atom].data.push({ x, y });
        }
    });

    // Сортируем точки по X
    Object.values(datasets).forEach(ds => {
        ds.data.sort((a, b) => a.x - b.x);
    });

    return { datasets: Object.values(datasets) };
}

// Обновление графика температуры
function updateTemperatureChart() {
    const empty = document.getElementById('temperatureEmpty');
    empty.hidden = true;

    const selectedAtom = document.getElementById('atomSelector').value;
    const tempType = document.getElementById('temperatureType').value;
    const diffType = document.getElementById('diffSelector').value;

    let filteredResults = allResults;
    if (selectedAtom !== 'all') {
        filteredResults = allResults.filter(r =>
            (r.atom?.atomName || r.atom?.name) === selectedAtom
        );
    }

    if (filteredResults.length === 0) {
        if (temperatureChart) temperatureChart.destroy();
        empty.hidden = false;
        return;
    }

    const chartData = prepareTemperatureChartData(
        filteredResults,
        selectedAtom,
        tempType,
        diffType
    );

    renderTemperatureChart(chartData, selectedAtom, tempType, diffType);
}

// Подготовка данных для графика температуры
function prepareTemperatureChartData(results, selectedAtom, tempType, diffType) {
    const datasets = {};

    // Группируем по атомам
    results.forEach(result => {
        const atom = selectedAtom !== 'all' ? selectedAtom : (result.atom?.atomName || result.atom?.name || "Неизвестно");

        if (!datasets[atom]) {
            const color = generateColor(atom);
            datasets[atom] = {
                label: atom,
                data: [],
                borderColor: color,
                backgroundColor: color + '20',
                borderWidth: 2,
                tension: 0.3,
                fill: false
            };
        }

        let x, y;

        if (selectedAtom !== 'all') {
            // График плотности электронов для конкретного атома
            x = result.pressure || result.voltage || 0;
            y = result.electronDensity;
        } else {
            // График температуры от диффузии для всех атомов
            const diffValue = diffType === '1' ?
                (result.diffusionCoefficient1 || result.diffusionCoefficient || 0) :
                (result.diffusionCoefficient2 || 0);

            const tempValue = tempType === 'minT' ? result.minT :
                tempType === 'maxT' ? result.maxT :
                    result.avgT || 0;

            x = tempValue;
            y = diffValue;
        }

        if (x !== undefined && y !== undefined && !isNaN(x) && !isNaN(y)) {
            datasets[atom].data.push({ x, y });
        }
    });

    // Сортируем точки по X
    Object.values(datasets).forEach(ds => {
        ds.data.sort((a, b) => a.x - b.x);
    });

    return { datasets: Object.values(datasets) };
}

// Рендер графика плазмы
function renderPlasmaChart(chartData, chartType) {
    const ctx = document.getElementById('plasmaChart');
    if (!ctx) return;

    if (plasmaChart) plasmaChart.destroy();

    const titleMap = {
        'electronDensity-pressure': 'Плотность электронов от давления',
        'electronVelocity-voltage': 'Скорость электронов от напряжения',
        'currentDensity-voltage': 'Плотность тока от напряжения',
        'ionEnergyEffective-voltage': 'Энергия ионов от напряжения'
    };

    const xTitleMap = {
        'electronDensity-pressure': 'Давление (Па)',
        'electronVelocity-voltage': 'Напряжение (В)',
        'currentDensity-voltage': 'Напряжение (В)',
        'ionEnergyEffective-voltage': 'Напряжение (В)'
    };

    const yTitleMap = {
        'electronDensity-pressure': 'Плотность электронов (м⁻³)',
        'electronVelocity-voltage': 'Скорость электронов (м/с)',
        'currentDensity-voltage': 'Плотность тока (А/м²)',
        'ionEnergyEffective-voltage': 'Энергия ионов (Дж)'
    };

    document.getElementById('plasmaChartInfo').textContent = titleMap[chartType];

    plasmaChart = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: titleMap[chartType],
                    color: 'var(--text-main)',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    labels: { color: 'var(--text-muted)' }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: xTitleMap[chartType],
                        color: 'var(--text-muted)'
                    },
                    grid: { color: 'rgba(94, 234, 212, 0.1)' },
                    ticks: { color: 'var(--text-muted)' }
                },
                y: {
                    title: {
                        display: true,
                        text: yTitleMap[chartType],
                        color: 'var(--text-muted)'
                    },
                    grid: { color: 'rgba(94, 234, 212, 0.1)' },
                    ticks: { color: 'var(--text-muted)' },
                    beginAtZero: true
                }
            }
        }
    });
}

// Рендер графика температуры
function renderTemperatureChart(chartData, selectedAtom, tempType, diffType) {
    const ctx = document.getElementById('temperatureChart');
    if (!ctx) return;

    if (temperatureChart) temperatureChart.destroy();

    let title, xTitle, yTitle;

    if (selectedAtom !== 'all') {
        title = `Плотность электронов для ${selectedAtom}`;
        xTitle = 'Давление/Напряжение';
        yTitle = 'Плотность электронов (м⁻³)';
    } else {
        const tempNames = { avgT: "Средняя", minT: "Минимальная", maxT: "Максимальная" };
        const diffNames = { '1': "D₁", '2': "D₂" };
        title = `${tempNames[tempType]} температура от ${diffNames[diffType]}`;
        xTitle = 'Температура (K)';
        yTitle = `Коэффициент диффузии ${diffNames[diffType]} (м²/с)`;
    }

    document.getElementById('temperatureChartInfo').textContent = title;

    temperatureChart = new Chart(ctx, {
        type: selectedAtom !== 'all' ? 'bar' : 'line',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: title,
                    color: 'var(--text-main)',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    labels: { color: 'var(--text-muted)' }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: xTitle,
                        color: 'var(--text-muted)'
                    },
                    grid: { color: 'rgba(94, 234, 212, 0.1)' },
                    ticks: { color: 'var(--text-muted)' }
                },
                y: {
                    title: {
                        display: true,
                        text: yTitle,
                        color: 'var(--text-muted)'
                    },
                    grid: { color: 'rgba(94, 234, 212, 0.1)' },
                    ticks: { color: 'var(--text-muted)' },
                    beginAtZero: true
                }
            }
        }
    });
}

// Вспомогательные функции
function generateColor(str) {
    const colors = [
        '#5eead4', '#818cf8', '#f472b6', '#34d399', '#fbbf24',
        '#60a5fa', '#a78bfa', '#f87171', '#22d3ee', '#d946ef'
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

function formatScientific(number) {
    if (number === undefined || number === null || isNaN(number)) return '0';
    if (Math.abs(number) < 0.001 || Math.abs(number) > 1000) {
        return number.toExponential(3);
    }
    return number.toPrecision(6);
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-error';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        ${message}
    `;

    const container = document.querySelector('.container');
    if (container) {
        container.appendChild(errorDiv);

        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
}

function getToken() {
    return localStorage.getItem('authToken');
}

// Глобальные функции
window.showAuthModal = function() {
    const authOverlay = document.getElementById('authOverlay');
    if (authOverlay) authOverlay.style.display = 'flex';
};

window.logout = function() {
    localStorage.removeItem('authToken');
    window.location.reload();
};

// Callback для успешной авторизации
window.authSuccessCallback = function() {
    checkAuthAndUpdateUI();
    loadAllResults();
};

console.log("✅ charts.js загружен");