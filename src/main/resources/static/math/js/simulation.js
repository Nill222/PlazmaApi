// simulation.js - Полная симуляция плазмы для PlasmaLab (без графиков)

let calculationInProgress = false;
let currentSimulationResult = null;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log("Simulation page initialized");
    setupEventListeners();
    initializeAuth();
    loadHistoricalResults();
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
    const simulationForm = document.getElementById("simulationForm");
    if (simulationForm) {
        simulationForm.addEventListener("submit", handleFormSubmit);
    }

    const confirmBtn = document.getElementById("confirmSimulationBtn");
    if (confirmBtn) {
        confirmBtn.addEventListener("click", handleConfirmResults);
    }

    // Валидация в реальном времени
    document.querySelectorAll('.form-control[type="number"]').forEach(input => {
        input.addEventListener('input', function() {
            if (this.value.includes(',')) {
                this.value = this.value.replace(',', '.');
            }
            clearFieldError(this.id);
        });
    });
}

async function loadHistoricalResults() {
    const token = getToken();
    if (!token) return;

    try {
        const response = await fetch("/results/config", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log(`Загружено ${data.data?.length || 0} исторических результатов`);
        }
    } catch (err) {
        console.log("Не удалось загрузить исторические результаты:", err);
    }
}

function clearFieldError(fieldId) {
    const errorEl = document.getElementById(`error-${fieldId}`);
    const inputEl = document.getElementById(fieldId);
    if (errorEl) {
        errorEl.textContent = "";
        errorEl.style.display = "none";
        inputEl.classList.remove("is-invalid");
    }
}

function getToken() {
    return localStorage.getItem('authToken');
}

function showAuthWarning() {
    const alertBox = document.getElementById("alertBox");
    if (alertBox) {
        alertBox.className = "alert alert-custom alert-warning";
        alertBox.innerHTML = `
            <i class="fas fa-exclamation-triangle me-2"></i>
            Для выполнения симуляций необходимо <a href="#" onclick="showAuthModal()" class="alert-link">войти в систему</a>
        `;
        alertBox.classList.remove("d-none");
    }
}

function showError(message) {
    const alertBox = document.getElementById("alertBox");
    if (alertBox) {
        alertBox.className = "alert alert-custom alert-danger";
        alertBox.innerHTML = `
            <i class="fas fa-exclamation-triangle me-2"></i>${message}
        `;
        alertBox.classList.remove("d-none");
    }
}

function showSuccess(message) {
    const alertBox = document.getElementById("alertBox");
    if (alertBox) {
        alertBox.className = "alert alert-custom alert-success";
        alertBox.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>${message}
        `;
        alertBox.classList.remove("d-none");
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();

    if (calculationInProgress) {
        showToast('Симуляция уже выполняется...');
        return;
    }

    const token = getToken();
    if (!token) {
        showAuthWarning();
        return;
    }

    // Очистка ошибок
    document.querySelectorAll(".error-message").forEach(el => {
        el.textContent = "";
        el.style.display = "none";
    });
    document.querySelectorAll(".form-control").forEach(el => el.classList.remove("is-invalid"));

    const runBtn = document.getElementById("runSimulationBtn");
    const spinner = runBtn.querySelector(".loading-spinner");
    const buttonText = runBtn.querySelector("span");
    const progressBar = document.getElementById('calculationProgress');
    const confirmBtn = document.getElementById("confirmSimulationBtn");

    calculationInProgress = true;
    buttonText.textContent = "Выполнение симуляции...";
    spinner.style.display = "inline-block";
    runBtn.disabled = true;

    if (confirmBtn) {
        confirmBtn.style.display = 'none';
    }

    if (progressBar) {
        progressBar.style.display = 'block';
        progressBar.querySelector('.progress-bar').style.width = '0%';
    }

    try {
        const formData = getFormData();

        if (!validateFormData(formData)) {
            resetCalculationState(runBtn, buttonText, spinner, progressBar);
            return;
        }

        const request = buildSimulationRequest(formData);
        console.log("Отправка запроса на /api/simulation/run:", request);

        const response = await fetch("/api/simulation/run", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(request)
        });

        await handleApiResponse(response, formData);

    } catch (err) {
        console.error("Ошибка при выполнении запроса:", err);
        showError("Ошибка соединения с сервером: " + err.message);
    } finally {
        resetCalculationState(runBtn, buttonText, spinner, progressBar);
    }
}

function getFormData() {
    return {
        configId: parseInt(document.getElementById("configId").value),
        ionId: parseInt(document.getElementById("ionId").value),
        atomId: parseInt(document.getElementById("atomId").value),
        voltage: parseFloat(document.getElementById("voltage").value),
        current: parseFloat(document.getElementById("current").value),
        pressure: parseFloat(document.getElementById("pressure").value),
        electronTemperature: parseFloat(document.getElementById("electronTemperature").value),
        chamberWidth: parseFloat(document.getElementById("chamberWidth").value),
        chamberDepth: parseFloat(document.getElementById("chamberDepth").value),
        exposureTime: parseFloat(document.getElementById("exposureTime").value),
        angle: parseFloat(document.getElementById("angle").value)
    };
}

function validateFormData(data) {
    let isValid = true;

    const idFields = ['configId', 'ionId', 'atomId'];
    idFields.forEach(field => {
        if (!data[field] || isNaN(data[field]) || data[field] <= 0) {
            showFieldError(field, 'ID должен быть положительным числом');
            isValid = false;
        }
    });

    const ranges = {
        voltage: { min: 200, max: 3500, unit: 'В' },
        current: { min: 0.01, max: 0.3, unit: 'А' },
        pressure: { min: 0.01, max: 100, unit: 'Па' },
        electronTemperature: { min: 0, max: 5000, unit: 'K' },
        exposureTime: { min: 300, max: 7200, unit: 'с' },
        chamberWidth: { min: 0.01, max: 1.0, unit: 'м' },
        chamberDepth: { min: 0.01, max: 0.5, unit: 'м' },
        angle: { min: 0, max: 90, unit: '°' }
    };

    Object.keys(ranges).forEach(field => {
        const range = ranges[field];
        if (isNaN(data[field]) || data[field] < range.min || data[field] > range.max) {
            showFieldError(field, `Значение должно быть в диапазоне ${range.min} - ${range.max} ${range.unit}`);
            isValid = false;
        }
    });

    return isValid;
}

function buildSimulationRequest(formData) {
    return {
        configId: formData.configId,
        ionId: formData.ionId,
        atomId: formData.atomId,
        voltage: formData.voltage,
        current: formData.current,
        pressure: formData.pressure,
        electronTemperature: formData.electronTemperature,
        chamberWidth: formData.chamberWidth,
        chamberDepth: formData.chamberDepth,
        exposureTime: formData.exposureTime,
        angle: formData.angle
    };
}

async function handleApiResponse(response, formData) {
    console.log("Статус ответа:", response.status);

    if (response.status === 401) {
        localStorage.removeItem('authToken');
        showAuthWarning();
        initializeAuth();
        return;
    }

    const data = await response.json();
    console.log("Полный ответ от сервера:", data);

    if (!response.ok) {
        console.error("Ошибка от сервера:", data);

        if (data.message === "Ошибка валидации" && Array.isArray(data.data)) {
            data.data.forEach(err => {
                console.log("Ошибка валидации:", err);
                const [field, msg] = err.split(": ");
                if (field && msg) {
                    showFieldError(field.trim(), msg.trim());
                }
            });
        } else {
            const errorMessage = data.message || `HTTP error! status: ${response.status}`;
            showError(errorMessage);
        }

        document.getElementById("resultSection").style.display = "none";
        return;
    }

    const result = data.data;

    if (result) {
        currentSimulationResult = result;
        updateResults(result);
        document.getElementById("resultSection").style.display = "block";
        document.getElementById("resultSection").scrollIntoView({behavior: "smooth"});

        const confirmBtn = document.getElementById("confirmSimulationBtn");
        if (confirmBtn) {
            confirmBtn.style.display = 'block';
        }

        showToast("✅ Полная симуляция успешно завершена!");
    } else {
        throw new Error("Некорректный формат ответа от сервера");
    }
}

async function handleConfirmResults() {
    if (!currentSimulationResult) {
        showError("Нет результатов для подтверждения");
        return;
    }

    const token = getToken();
    if (!token) {
        showAuthWarning();
        return;
    }

    const confirmBtn = document.getElementById("confirmSimulationBtn");
    const originalText = confirmBtn.querySelector("span").textContent;

    try {
        confirmBtn.disabled = true;
        confirmBtn.querySelector("span").textContent = "Сохранение...";

        const simulationResultDto = {
            atomId: currentSimulationResult.atomId,
            configId: currentSimulationResult.configId,
            ionId: currentSimulationResult.ionId,
            atomName: currentSimulationResult.atomName,
            s: currentSimulationResult.s || "",
            totalTransferredEnergy: currentSimulationResult.totalTransferredEnergy || 0,
            avgTransferredPerAtom: currentSimulationResult.avgTransferredPerAtom || 0,
            avgT: currentSimulationResult.avgT || 0,
            minT: currentSimulationResult.minT || 0,
            maxT: currentSimulationResult.maxT || 0,
            diffusionCoefficient1: currentSimulationResult.diffusionCoefficient1 || 0,
            diffusionCoefficient2: currentSimulationResult.diffusionCoefficient2 || 0,
            plasmaParameters: currentSimulationResult.plasmaParameters || {},
            perAtomTransferredEnergies: currentSimulationResult.perAtomTransferredEnergies || [],
            diffusionProfile: currentSimulationResult.diffusionProfile || {},
            coolingProfile: currentSimulationResult.coolingProfile || [],
            totalMomentum: currentSimulationResult.totalMomentum || 0,
            totalDamage: currentSimulationResult.totalDamage || 0,
            totalDisplacement: currentSimulationResult.totalDisplacement || 0,
            current: currentSimulationResult.current || 0
        };

        console.log("Отправка SimulationResultDto на сохранение:", simulationResultDto);

        const response = await fetch("/api/simulation/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(simulationResultDto)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Ответ от сервера при сохранении:", data);

        if (data.success || data.status === 200) {
            showSuccess("✅ Результаты симуляции успешно сохранены в базу данных!");
            showToast("Результаты сохранены в таблице Result");

            // Скрываем кнопку после успешного сохранения
            confirmBtn.style.display = 'none';

            // Обновляем исторические результаты
            loadHistoricalResults();
        } else {
            throw new Error(data.message || "Ошибка при сохранении");
        }

    } catch (err) {
        console.error("Ошибка при сохранении результатов:", err);
        showError("Ошибка при сохранении результатов: " + err.message);
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.querySelector("span").textContent = originalText;
    }
}

function updateResults(result) {
    console.log("📊 Полная структура результата:", result);

    // Основные результаты из SimulationResultDto
    document.getElementById("resAtom").textContent = result.atomName || "Неизвестно";
    document.getElementById("resTotalEnergy").textContent = formatScientific(result.totalTransferredEnergy) + " Дж";
    document.getElementById("resAvgEnergy").textContent = formatScientific(result.avgTransferredPerAtom);
    document.getElementById("resTemperature").textContent = result.avgT !== undefined ? result.avgT.toFixed(2) + " K" : "0 K";

    // Коэффициенты диффузии
    document.getElementById("resDiffusion").textContent = formatScientific(result.diffusionCoefficient1) + " + " + formatScientific(result.diffusionCoefficient2);

    // Температурные значения
    document.getElementById("resMinTemp").textContent = result.minT !== undefined ? result.minT.toFixed(2) + " K" : "0 K";
    document.getElementById("resMaxTemp").textContent = result.maxT !== undefined ? result.maxT.toFixed(2) + " K" : "0 K";
    document.getElementById("resAvgTemp").textContent = result.avgT !== undefined ? result.avgT.toFixed(2) + " K" : "0 K";

    // Статистика столкновений
    const collisionsCount = result.perAtomTransferredEnergies ? result.perAtomTransferredEnergies.length : 0;
    const maxCollisionEnergy = result.perAtomTransferredEnergies ?
        Math.max(...result.perAtomTransferredEnergies) : 0;

    document.getElementById("resCollisionsCount").textContent = collisionsCount;
    document.getElementById("resMaxCollisionEnergy").textContent = formatScientific(maxCollisionEnergy);

    // Остальные компоненты
    displayAdditionalResults(result);
    updatePlasmaParameters(result.plasmaParameters);

    // Обновляем числовые значения для диффузии
    document.getElementById("resMaxDepth").textContent = formatScientific(result.diffusionProfile?.depth || 0);
    document.getElementById("resMaxConcentration").textContent = formatScientific(result.diffusionProfile?.D_effective || 0);
    document.getElementById("resAvgConcentration").textContent = formatScientific(result.diffusionProfile?.D_thermal || 0);
}

function displayAdditionalResults(result) {
    const container = document.getElementById("additionalResults");
    if (!container) return;

    container.innerHTML = `
        <div class="col-12">
            <h5 class="mb-3"><i class="fas fa-chart-line me-2 text-success"></i>Дополнительные результаты</h5>
            <div class="row g-3">
                <div class="col-md-4">
                    <div class="stat-card text-center">
                        <i class="fas fa-gauge-high stat-icon"></i>
                        <div class="stat-value">${formatScientific(result.totalMomentum || 0)}</div>
                        <div class="stat-label">Общий импульс</div>
                        <div class="stat-unit">кг·м/с</div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="stat-card text-center">
                        <i class="fas fa-hammer stat-icon"></i>
                        <div class="stat-value">${formatScientific(result.totalDamage || 0)}</div>
                        <div class="stat-label">Общее повреждение</div>
                        <div class="stat-unit">Дж</div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="stat-card text-center">
                        <i class="fas fa-arrows-up-down stat-icon"></i>
                        <div class="stat-value">${formatScientific(result.totalDisplacement || 0)}</div>
                        <div class="stat-label">Общее смещение</div>
                        <div class="stat-unit">м</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function updatePlasmaParameters(plasmaParams) {
    const container = document.getElementById("plasmaParams");
    if (!plasmaParams || !container) return;

    container.innerHTML = '';

    // Обновляем параметры согласно PlasmaResultDto структуре
    const params = [
        { key: 'electronDensity', label: 'Плотность электронов', unit: 'м⁻³', icon: 'fas fa-atom' },
        { key: 'ionDensity', label: 'Плотность ионов', unit: 'м⁻³', icon: 'fas fa-bolt' },
        { key: 'electronTemperature', label: 'Температура электронов', unit: 'K', icon: 'fas fa-thermometer-half' },
        { key: 'ionTemperature', label: 'Температура ионов', unit: 'K', icon: 'fas fa-thermometer-half' },
        { key: 'plasmaPotential', label: 'Потенциал плазмы', unit: 'В', icon: 'fas fa-bolt' },
        { key: 'debyeLength', label: 'Длина Дебая', unit: 'м', icon: 'fas fa-ruler' },
        { key: 'plasmaFrequency', label: 'Плазменная частота', unit: 'Гц', icon: 'fas fa-wave-square' }
    ];

    let hasData = false;

    params.forEach(param => {
        if (plasmaParams[param.key] !== undefined && plasmaParams[param.key] !== null) {
            const value = formatScientific(plasmaParams[param.key]);
            container.innerHTML += `
                <div class="col-md-6 col-lg-4">
                    <div class="stat-card text-center">
                        <i class="${param.icon} stat-icon"></i>
                        <div class="stat-value">${value}</div>
                        <div class="stat-label">${param.label}</div>
                        <div class="stat-unit">${param.unit}</div>
                    </div>
                </div>
            `;
            hasData = true;
        }
    });

    if (!hasData) {
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info text-center">
                    <i class="fas fa-info-circle me-2"></i>
                    Параметры плазмы не рассчитаны
                </div>
            </div>
        `;
    }
}

function resetCalculationState(button, buttonText, spinner, progressBar) {
    calculationInProgress = false;
    buttonText.textContent = "Запустить симуляцию";
    spinner.style.display = "none";
    button.disabled = false;

    if (progressBar) {
        setTimeout(() => {
            progressBar.style.display = 'none';
        }, 1000);
    }
}

// Вспомогательные функции
function formatScientific(number) {
    if (number === undefined || number === null || isNaN(number)) return '0';
    if (Math.abs(number) < 0.001 || Math.abs(number) > 1000) {
        return Number(number).toExponential(3);
    }
    return Number(number).toPrecision(6);
}

function showFieldError(fieldId, message) {
    const errorEl = document.getElementById(`error-${fieldId}`);
    const inputEl = document.getElementById(fieldId);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = "block";
    }
    if (inputEl) {
        inputEl.classList.add("is-invalid");
    }
}

function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast align-items-center text-white bg-success border-0 position-fixed bottom-0 end-0 m-3";
    toast.setAttribute("role", "alert");
    toast.setAttribute("aria-live", "assertive");
    toast.setAttribute("aria-atomic", "true");

    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas fa-check-circle me-2"></i>${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;

    document.body.appendChild(toast);
    const toastInstance = new bootstrap.Toast(toast, {delay: 5000});
    toastInstance.show();

    toast.addEventListener('hidden.bs.toast', () => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    });
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
    };
}
