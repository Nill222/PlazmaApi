// charts.js - Графики для результатов симуляции

let plasmaChart = null;
let temperatureChart = null;
let allResults = [];

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log("Charts page initialized");
    setupEventListeners();
    initializeAuth();
    loadAllResults();
});

function initializeAuth() {
    const token = getToken();
    const userMenu = document.querySelector('.user-menu');
    const authButtons = document.querySelector('.auth-buttons');

    if (token) {
        if (userMenu) userMenu.style.display = 'flex';
        if (authButtons) authButtons.style.display = 'none';
        document.body.classList.add('logged-in');
        loadUserData();
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

    if (atomSelector) {
        atomSelector.addEventListener('change', updateTemperatureChart);
    }
    if (temperatureType) {
        temperatureType.addEventListener('change', updateTemperatureChart);
    }
}

function getToken() {
    return localStorage.getItem('authToken');
}

function showAuthWarning() {
    const alertBox = document.createElement("div");
    alertBox.className = "alert alert-warning alert-dismissible fade show m-4";
    alertBox.innerHTML = `
        <i class="fas fa-exclamation-triangle me-2"></i>
        Для просмотра графиков необходимо <a href="#" onclick="showAuthModal()" class="alert-link">войти в систему</a>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.querySelector('.container').prepend(alertBox);
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

        if (response.ok) {
            const data = await response.json();
            allResults = data.data || [];
            console.log(`Загружено ${allResults.length} результатов`);

            // Инициализируем интерфейс
            initializeInterface();

            // Строим начальные графики
            updatePlasmaChart();
            updateTemperatureChart();
        } else {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (err) {
        console.error("Ошибка при загрузке результатов:", err);
        showError("Не удалось загрузить данные для графиков: " + err.message);
    }
}

// Инициализация интерфейса
function initializeInterface() {
    populateAtomFilters();
}

// Заполнение фильтров атомов
function populateAtomFilters() {
    const uniqueAtoms = [...new Set(allResults.map(result =>
        result.atom?.atomName || 'Неизвестно'
    ))];

    const atomFilter1 = document.getElementById('atomFilter1');
    const atomSelector = document.getElementById('atomSelector');

    // Очищаем существующие опции (кроме первой)
    if (atomFilter1) {
        atomFilter1.innerHTML = '<option value="all">Все атомы</option>';
        uniqueAtoms.forEach(atom => {
            atomFilter1.innerHTML += `<option value="${atom}">${atom}</option>`;
        });
    }

    if (atomSelector) {
        atomSelector.innerHTML = '<option value="">Выберите атом...</option>';
        uniqueAtoms.forEach(atom => {
            atomSelector.innerHTML += `<option value="${atom}">${atom}</option>`;
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
        filteredResults = allResults.filter(result =>
            result.atom?.atomName === atomFilter
        );
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
        const atom = result.atom?.atomName || "Неизвестно";

        if (!datasets[atom]) {
            datasets[atom] = {
                label: atom,
                data: [],
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

            case 'currentDensity-current':
                x = result.current;
                y = result.currentDensity;
                break;
        }

        datasets[atom].data.push({ x, y });
    });

    // сортируем точки внутри каждой серии
    Object.values(datasets).forEach(ds => {
        ds.data.sort((a, b) => a.x - b.x);
    });

    return {
        datasets: Object.values(datasets)
    };
}

// Рендер графика плазмы
function renderPlasmaChart(chartData, chartType) {
    const ctx = document.getElementById('plasmaChart').getContext('2d');

    if (plasmaChart) plasmaChart.destroy();

    const titleMap = {
        'electronDensity-pressure': 'Зависимость плотности электронов от давления',
        'electronVelocity-voltage': 'Зависимость скорости электронов от напряжения',
        'currentDensity-current': 'Зависимость плотности тока от тока'
    };

    const xTitleMap = {
        'electronDensity-pressure': 'Давление (Па)',
        'electronVelocity-voltage': 'Напряжение (В)',
        'currentDensity-current': 'Ток (А)'
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
                        label: ctx => {
                            return `${ctx.dataset.label}: ${formatScientific(ctx.parsed.y)}`;
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
                    title: {
                        display: true,
                        text: chartData.datasets[0].label
                    }
                }
            }
        }
    });
}




// Обновление графика температуры
function updateTemperatureChart() {
    const selectedAtom = document.getElementById('atomSelector').value;
    const tempType = document.getElementById('temperatureType').value;

    if (!selectedAtom) {
        // Очищаем график если атом не выбран
        if (temperatureChart) {
            temperatureChart.destroy();
            temperatureChart = null;
        }
        document.getElementById('temperatureChartInfo').textContent = 'Выберите атом для построения графика';
        return;
    }

    // Фильтруем результаты по выбранному атому
    const atomResults = allResults.filter(result =>
        result.atom?.atomName === selectedAtom
    );

    if (atomResults.length === 0) {
        showError(`Нет данных для атома ${selectedAtom}`);
        return;
    }

    const chartData = prepareTemperatureChartData(atomResults, tempType);
    renderTemperatureChart(chartData, selectedAtom, tempType);
}

// Подготовка данных для графика температуры
function prepareTemperatureChartData(results, tempType) {
    // Сортируем по дате создания
    results.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const data = {
        labels: results.map((_, index) => `Измерение ${index + 1}`),
        datasets: [{
            label: '',
            data: [],
            borderColor: '#dc3545',
            backgroundColor: 'rgba(220, 53, 69, 0.1)',
            borderWidth: 2,
            fill: true
        }]
    };

    results.forEach(result => {
        let temperature = 0;
        switch (tempType) {
            case 'avgT':
                temperature = result.avgT;
                data.datasets[0].label = 'Средняя температура (K)';
                break;
            case 'minT':
                temperature = result.minT;
                data.datasets[0].label = 'Минимальная температура (K)';
                break;
            case 'maxT':
                temperature = result.maxT;
                data.datasets[0].label = 'Максимальная температура (K)';
                break;
        }
        data.datasets[0].data.push(temperature);
    });

    return data;
}

// Рендер графика температуры
function renderTemperatureChart(chartData, atom, tempType) {
    const ctx = document.getElementById('temperatureChart').getContext('2d');

    // Уничтожаем предыдущий график
    if (temperatureChart) {
        temperatureChart.destroy();
    }

    let title = '';
    switch (tempType) {
        case 'avgT':
            title = `Средняя температура для атома ${atom}`;
            break;
        case 'minT':
            title = `Минимальная температура для атома ${atom}`;
            break;
        case 'maxT':
            title = `Максимальная температура для атома ${atom}`;
            break;
    }

    // Обновляем информацию о графике
    document.getElementById('temperatureChartInfo').textContent = title;

    temperatureChart = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: title,
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Температура (K)'
                    }
                }
            }
        }
    });
}

// Вспомогательные функции
function formatScientific(number) {
    if (number === undefined || number === null || isNaN(number)) return '0';
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