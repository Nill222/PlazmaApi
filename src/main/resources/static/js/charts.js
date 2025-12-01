// charts.js - Графики для результатов симуляции

let plasmaChart = null;
let temperatureChart = null;
let allResults = [];


// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log("Charts page initialized");
    setupEventListeners();
    initializeAuth();

    // Обрабатываем Promise от loadAllResults
    loadAllResults().catch(err => {
        console.error("Ошибка в loadAllResults:", err);
    });
});

function initializeAuth() {
    const token = getToken();
    const userMenu = document.querySelector('.user-menu');
    const authButtons = document.querySelector('.auth-buttons');

    if (token) {
        if (userMenu) userMenu.style.display = 'flex';
        if (authButtons) authButtons.style.display = 'none';
        document.body.classList.add('logged-in');

        // Добавляем обработку Promise
        loadUserData().catch(err => {
            console.log("Ошибка при загрузке данных пользователя:", err);
        });
    } else {
        if (userMenu) userMenu.style.display = 'none';
        if (authButtons) authButtons.style.display = 'flex';
        document.body.classList.remove('logged-in');
        showAuthWarning();
    }
}

async function loadUserData() {
    try {
        const token = getToken();
        const response = await fetch("/auth/me", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.data) {
                document.getElementById("usernameDisplay").textContent = data.data.username;
            }
        }
    } catch (err) {
        console.log("Не удалось загрузить данные пользователя:", err);
    }
}

function setupEventListeners() {
    // График 1: Плазма параметры
    const plasmaChartType = document.getElementById('plasmaChartType');
    const atomFilter1 = document.getElementById('atomFilter1');

    if (plasmaChartType) {
        plasmaChartType.addEventListener('change', updatePlasmaChart);
    }
    if (atomFilter1) {
        atomFilter1.addEventListener('change', updatePlasmaChart);
    }

    // График 2: Температура
    const atomSelector = document.getElementById('atomSelector');
    const temperatureType = document.getElementById('temperatureType');
    const diffSelector = document.getElementById('diffSelector');

    if (atomSelector) {
        atomSelector.addEventListener('change', function() {
            toggleDiffusionSelector(); // Управляем видимостью
            updateTemperatureChart();
        });
    }
    if (temperatureType) {
        temperatureType.addEventListener('change', updateTemperatureChart);
    }
    if (diffSelector) {
        diffSelector.addEventListener('change', updateTemperatureChart);
    }
}

function toggleDiffusionSelector() {
    const selectedAtom = document.getElementById('atomSelector').value;
    const diffusionSelector = document.querySelector('.diffusion-selector');

    if (diffusionSelector) {
        if (selectedAtom === 'all') {
            // Показываем когда выбраны все атомы
            diffusionSelector.style.display = 'block';
        } else {
            // Скрываем когда выбран конкретный атом
            diffusionSelector.style.display = 'none';
        }
    }
}

function initializeInterface() {
    populateAtomFilters();
    toggleDiffusionSelector(); // Устанавливаем начальное состояние
}

function getToken() {
    return localStorage.getItem('authToken');
}

function showAuthWarning() {
    // Удаляем существующие уведомления, чтобы избежать дублирования
    const existingAlerts = document.querySelectorAll('.alert-warning');
    existingAlerts.forEach(alert => alert.remove());

    const alertBox = document.createElement("div");
    alertBox.className = "alert alert-warning alert-dismissible fade show m-4";
    alertBox.innerHTML = `
        <i class="fas fa-exclamation-triangle me-2"></i>
        Для просмотра графиков необходимо <a href="#" onclick="showAuthModal()" class="alert-link">войти в систему</a>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(alertBox, container.firstChild);
    }
}

// Загрузка всех результатов
async function loadAllResults() {
    const token = getToken();
    if (!token) {
        showAuthWarning();
        return;
    }

    try {
        const response = await fetch("/results/config", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            // Обрабатываем HTTP ошибки
            showError(`Ошибка сервера: ${response.status} ${response.statusText}`);
            return;
        }

        const data = await response.json();
        allResults = data.data || [];
        console.log(`Загружено ${allResults.length} результатов`);

        // Инициализируем интерфейс
        initializeInterface();

        // Строим начальные графики
        updatePlasmaChart();
        updateTemperatureChart();

    } catch (err) {
        // Обрабатываем сетевые ошибки и другие исключения
        console.error("Ошибка при загрузке результатов:", err);
        showError("Не удалось загрузить данные для графиков: " + err.message);
    }
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
        // ДОБАВЛЯЕМ ОПЦИЮ "Все атомы" для второго графика
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
    const chartType = document.getElementById('plasmaChartType').value;
    const atomFilter = document.getElementById('atomFilter1').value;

    // Фильтруем результаты
    let filteredResults = allResults;
    if (atomFilter !== 'all') {
        filteredResults = allResults.filter(result => {
            const atomName = result.atom?.atomName || result.atom?.name;
            return atomName === atomFilter;
        });
    }

    if (filteredResults.length === 0) {
        showError("Нет данных для построения графика с выбранными фильтрами");
        return;
    }

    const chartData = preparePlasmaChartData(chartType, filteredResults);
    renderPlasmaChart(chartData, chartType);
}

// Подготовка данных для графика плазмы
function preparePlasmaChartData(chartType, results) {
    const datasets = {};

    // разделяем по атомам
    results.forEach(result => {
        const atom = result.atom?.atomName || result.atom?.name || "Неизвестно";

        if (!datasets[atom]) {
            // Генерируем случайный цвет для каждого атома
            const color = generateColor(atom);
            datasets[atom] = {
                label: atom,
                data: [],
                borderColor: color,
                backgroundColor: color + '20',
                borderWidth: 2,
                tension: 0.3,
                fill: false,
                pointRadius: 4,
                pointHoverRadius: 6
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
        }

        // Добавляем только если значения валидны
        if (x !== undefined && y !== undefined && !isNaN(x) && !isNaN(y)) {
            datasets[atom].data.push({ x, y });
        }
    });

    // сортируем точки внутри каждой серии по X
    Object.values(datasets).forEach(ds => {
        ds.data.sort((a, b) => a.x - b.x);
    });

    return {
        datasets: Object.values(datasets)
    };
}

// Генерация цвета на основе строки
function generateColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    const colors = [
        '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6',
        '#1abc9c', '#d35400', '#c0392b', '#16a085', '#8e44ad'
    ];

    return colors[Math.abs(hash) % colors.length];
}

// Рендер графика плазмы
function renderPlasmaChart(chartData, chartType) {
    const ctx = document.getElementById('plasmaChart').getContext('2d');

    if (plasmaChart) plasmaChart.destroy();

    const titleMap = {
        'electronDensity-pressure': 'Зависимость плотности электронов от давления',
        'electronVelocity-voltage': 'Зависимость скорости электронов от напряжения',
        'currentDensity-voltage': 'Зависимость плотности тока от тока'
    };

    const xTitleMap = {
        'electronDensity-pressure': 'Давление (Па)',
        'electronVelocity-voltage': 'Напряжение (В)',
        'currentDensity-voltage': 'Напряжение (В)'
    };

    const yTitleMap = {
        'electronDensity-pressure': 'Плотность электронов (м⁻³)',
        'electronVelocity-voltage': 'Скорость электронов (м/с)',
        'currentDensity-voltage': 'Плотность тока (А/м²)'
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
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y;
                            const xValue = context.parsed.x;
                            return `${label}: ${formatScientific(value)} (x: ${formatScientific(xValue)})`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: xTitleMap[chartType]
                    }
                },
                y: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: yTitleMap[chartType]
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

// Обновление графика температуры
function updateTemperatureChart() {
    const selectedAtom = document.getElementById('atomSelector').value;
    const tempType = document.getElementById('temperatureType').value;
    const diffType = document.getElementById('diffSelector').value;

    // Фильтруем результаты
    let filteredResults = allResults;
    if (selectedAtom !== 'all') {
        filteredResults = allResults.filter(result => {
            const atomName = result.atom?.atomName || result.atom?.name;
            return atomName === selectedAtom;
        });
    }

    if (filteredResults.length === 0) {
        showError(`Нет данных для выбранного фильтра`);
        return;
    }

    const chartData = prepareChartData(filteredResults, selectedAtom, tempType, diffType);
    renderTemperatureChart(chartData, selectedAtom, tempType, diffType);
}

// Подготовка данных для графика
function prepareChartData(results, selectedAtom, tempType, diffType) {
    // Если выбран конкретный атом - строим график плотности электронов
    if (selectedAtom !== 'all') {
        return prepareElectronDensityData(results);
    }
    // Если выбраны все атомы - строим график температуры от диффузии
    else {
        return prepareTemperatureByDiffusionData(results, tempType, diffType);
    }
}

// Подготовка данных для плотности электронов (конкретный атом)
function prepareElectronDensityData(results) {
    const datasets = [{
        label: "Плотность электронов",
        data: [],
        borderColor: '#9b59b6',
        backgroundColor: '#9b59b620',
        borderWidth: 2,
        tension: 0.3,
        fill: false,
        pointRadius: 4,
        pointHoverRadius: 6
    }];

    // Сортируем результаты по какому-то параметру для красивого графика
    const sortedResults = results
        .filter(r => r.electronDensity !== undefined && r.electronDensity !== null && !isNaN(r.electronDensity))
        .sort((a, b) => (a.pressure || 0) - (b.pressure || 0));

    sortedResults.forEach((result, index) => {
        datasets[0].data.push({
            x: index, // Используем индекс как X, или можно использовать pressure/voltage
            y: result.electronDensity
        });
    });

    return { datasets };
}

// Подготовка данных для температуры от диффузии (все атомы)
function prepareTemperatureByDiffusionData(results, tempType, diffType) {
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
                fill: false,
                pointRadius: 4,
                pointHoverRadius: 6
            };
        }

        const diffValue = diffType === '1' ?
            (result.diffusionCoefficient1 !== undefined ? result.diffusionCoefficient1 : result.diffusionCoefficient) :
            result.diffusionCoefficient2;

        const tempValue = tempType === 'minT' ? result.minT :
            tempType === 'maxT' ? result.maxT :
                result.avgT;

        if (diffValue !== undefined && diffValue !== null &&
            tempValue !== undefined && tempValue !== null &&
            !isNaN(diffValue) && !isNaN(tempValue)) {
            datasets[atom].data.push({ y: diffValue, x: tempValue });
        }
    });

    // Сортируем точки внутри каждой серии
    Object.values(datasets).forEach(ds => {
        ds.data.sort((a, b) => a.x - b.x);
    });

    return { datasets: Object.values(datasets) };
}

// Рендер графика температуры
function renderTemperatureChart(chartData, selectedAtom, tempType, diffType) {
    const ctx = document.getElementById('temperatureChart').getContext('2d');

    if (temperatureChart) {
        temperatureChart.destroy();
    }

    let title, xTitle, yTitle;

    if (selectedAtom !== 'all') {
        // График для конкретного атома - плотность электронов
        title = `Плотность электронов для атома ${selectedAtom}`;
        xTitle = 'Измерения';
        yTitle = 'Плотность электронов (м⁻³)';
    } else {
        // График для всех атомов - температура от диффузии
        const tempNames = {
            avgT: "Средняя температура",
            minT: "Минимальная температура",
            maxT: "Максимальная температура"
        };
        const diffNames = {
            '1': "коэффициент диффузии D₁",
            '2': "коэффициент диффузии D₂"
        };
        title = `${tempNames[tempType]} от ${diffNames[diffType]}`;
        yTitle = diffNames[diffType] + ' (м²/с)';
        xTitle = 'Температура (K)';
    }

    document.getElementById('temperatureChartInfo').textContent = title;

    // Если нет данных
    if (chartData.datasets.length === 0 || chartData.datasets[0].data.length === 0) {
        ctx.font = "16px Arial";
        ctx.fillStyle = "#666";
        ctx.textAlign = "center";
        ctx.fillText("Нет данных для отображения", ctx.canvas.width / 2, ctx.canvas.height / 2);
        return;
    }

    temperatureChart = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: title,
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y;
                            const xValue = context.parsed.x;

                            if (selectedAtom !== 'all') {
                                return `${label}: ${formatScientific(value)} м⁻³`;
                            } else {
                                return `${label}: ${value.toFixed(2)} K (D: ${formatScientific(xValue)})`;
                            }
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    title: { display: true, text: xTitle }
                },
                y: {
                    type: 'linear',
                    title: { display: true, text: yTitle },
                    beginAtZero: true
                }
            }
        }
    });
}
// Вспомогательные функции
function formatScientific(number) {
    if (number === undefined || number === null || isNaN(number)) return '0';
    if (number === 0) return '0';
    if (Math.abs(number) < 0.001 || Math.abs(number) > 1000) {
        return Number(number).toExponential(3);
    }
    return Number(number).toPrecision(6);
}

function showError(message) {
    // Создаем временное уведомление
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3';
    alertDiv.style.zIndex = '1060';
    alertDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle me-2"></i>${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);

    // Автоматически удаляем через 5 секунд
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 5000);
}

// Глобальные функции
window.showAuthModal = function(tab = 'login') {
    const authModalElement = document.getElementById('authModal');
    if (!authModalElement) return;

    const authModal = new bootstrap.Modal(authModalElement);

    if (tab === 'register') {
        const registerTab = document.querySelector('[data-bs-target="#register"]');
        if (registerTab) {
            const tabInstance = new bootstrap.Tab(registerTab);
            tabInstance.show();
        }
    }

    authModal.show();
};

window.logout = function() {
    localStorage.removeItem('authToken');
    window.location.reload();
};

// Callback для успешной авторизации
if (typeof window !== 'undefined') {
    window.authSuccessCallback = function() {
        initializeAuth();
        loadAllResults();
    };
}