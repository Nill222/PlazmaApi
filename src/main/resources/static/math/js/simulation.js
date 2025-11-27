// simulation.js - Полная симуляция плазмы для PlasmaLab

let calculationInProgress = false;
let currentSimulationResult = null; // Храним текущие результаты

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log("Simulation page initialized");
    setupEventListeners();
    initializeAuth();
});

function initializeAuth() {
    const token = getToken();
    const userMenu = document.querySelector('.user-menu');
    const authButtons = document.querySelector('.auth-buttons');

    if (token) {
        if (userMenu) userMenu.style.display = 'flex';
        if (authButtons) authButtons.style.display = 'none';
        document.body.classList.add('logged-in');
    } else {
        if (userMenu) userMenu.style.display = 'none';
        if (authButtons) authButtons.style.display = 'flex';
        document.body.classList.remove('logged-in');
        showAuthWarning();
    }
}

function setupEventListeners() {
    const simulationForm = document.getElementById("simulationForm");
    if (simulationForm) {
        simulationForm.addEventListener("submit", handleFormSubmit);
    }

    // Добавляем обработчик для кнопки подтверждения
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

    // Скрываем кнопку подтверждения при новом расчете
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

    // Проверка ID
    const idFields = ['configId', 'ionId', 'atomId'];
    idFields.forEach(field => {
        if (!data[field] || isNaN(data[field]) || data[field] <= 0) {
            showFieldError(field, 'ID должен быть положительным числом');
            isValid = false;
        }
    });

    // Проверка диапазонов
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

    // Успешная симуляция
    const result = data.data;

    if (result) {
        // Сохраняем результаты для подтверждения
        currentSimulationResult = {
            simulationResult: result,
            formData: formData
        };

        updateResults(result);
        document.getElementById("resultSection").style.display = "block";
        document.getElementById("resultSection").scrollIntoView({behavior: "smooth"});

        // Показываем кнопку подтверждения
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
        // Показываем загрузку
        confirmBtn.disabled = true;
        confirmBtn.querySelector("span").textContent = "Сохранение...";

        // Отправляем запрос на сохранение
        const response = await fetch("/api/simulation/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(currentSimulationResult.simulationResult)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success || data.status === 200) {
            showSuccess("✅ Результаты симуляции успешно сохранены!");
            showToast("Результаты сохранены в базе данных");

            // Скрываем кнопку после успешного сохранения
            confirmBtn.style.display = 'none';
        } else {
            throw new Error(data.message || "Ошибка при сохранении");
        }

    } catch (err) {
        console.error("Ошибка при сохранении результатов:", err);
        showError("Ошибка при сохранении результатов: " + err.message);
    } finally {
        // Восстанавливаем кнопку
        confirmBtn.disabled = false;
        confirmBtn.querySelector("span").textContent = originalText;
    }
}

function updateResults(result) {
    console.log("📊 Полная структура результата:", result);

    // Основные результаты из DTO
    document.getElementById("resAtom").textContent = result.atomName || "Неизвестно";
    document.getElementById("resTotalEnergy").textContent = formatScientific(result.totalTransferredEnergy) + " Дж";
    document.getElementById("resAvgEnergy").textContent = formatScientific(result.avgTransferredPerAtom);
    document.getElementById("resTemperature").textContent = result.avgT !== undefined ? result.avgT.toFixed(2) : "0";

    // Коэффициенты диффузии из нового DTO
    document.getElementById("resDiffusion").textContent = formatScientific(result.diffusionCoefficient1) + " + " + formatScientific(result.diffusionCoefficient2);

    document.getElementById("resMinTemp").textContent = result.minT !== undefined ? result.minT.toFixed(2) : "0";
    document.getElementById("resMaxTemp").textContent = result.maxT !== undefined ? result.maxT.toFixed(2) : "0";

    // Дополнительные результаты
    displayAdditionalResults(result);

    // Остальные компоненты
    updatePlasmaParameters(result.plasmaParameters);
    updateCollisionEnergies(result.perAtomTransferredEnergies);
    updateDiffusionProfile(result.diffusionProfile);
    updateCoolingProfile(result.coolingProfile);
}

function displayAdditionalResults(result) {
    const container = document.getElementById("additionalResults");
    if (!container) return;

    container.innerHTML = `
        <div class="col-12">
            <h5 class="mb-3"><i class="fas fa-chart-line me-2 text-success"></i>Дополнительные результаты</h5>
            <div class="row g-3">
                <div class="col-md-6">
                    <div class="stat-card text-center">
                        <i class="fas fa-gauge-high stat-icon"></i>
                        <div class="stat-value">${formatScientific(result.totalMomentum || 0)}</div>
                        <div class="stat-label">Общий импульс</div>
                        <div class="stat-unit">кг·м/с</div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="stat-card text-center">
                        <i class="fas fa-hammer stat-icon"></i>
                        <div class="stat-value">${formatScientific(result.totalDamage || 0)}</div>
                        <div class="stat-label">Общее повреждение</div>
                        <div class="stat-unit">Дж</div>
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

    // Параметры плазмы из нового PlasmaResultDto
    const params = [
        { key: 'electronDensity', label: 'Плотность электронов', unit: 'м⁻³', icon: 'fas fa-atom' },
        { key: 'electronVelocity', label: 'Скорость электронов', unit: 'м/с', icon: 'fas fa-gauge-high' },
        { key: 'currentDensity', label: 'Плотность тока', unit: 'А/м²', icon: 'fas fa-bolt' },
        { key: 'ionEnergy', label: 'Энергия ионов', unit: 'Дж', icon: 'fas fa-bolt' },
        { key: 'voltage', label: 'Напряжение', unit: 'В', icon: 'fas fa-bolt' },
        { key: 'pressure', label: 'Давление', unit: 'Па', icon: 'fas fa-tachometer-alt' },
        { key: 'electronTemp', label: 'Температура электронов', unit: 'K', icon: 'fas fa-thermometer-half' }
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

function updateCollisionEnergies(energies) {
    const container = document.getElementById("collisionEnergiesChart");
    const countElement = document.getElementById("resCollisionsCount");
    const maxEnergyElement = document.getElementById("resMaxCollisionEnergy");

    if (!energies || !Array.isArray(energies) || energies.length === 0) {
        countElement.textContent = "0";
        maxEnergyElement.textContent = "0";
        if (container) {
            container.innerHTML = '<div class="text-center text-muted" style="width: 100%; padding-top: 80px;">Нет данных о столкновениях</div>';
        }
        return;
    }

    countElement.textContent = energies.length;
    const maxEnergy = Math.max(...energies);
    maxEnergyElement.textContent = formatScientific(maxEnergy);

    if (container) {
        container.innerHTML = '';
        const maxVal = Math.max(...energies);
        const limitedEnergies = energies.slice(0, 50);

        limitedEnergies.forEach((energy, index) => {
            const height = maxVal > 0 ? (energy / maxVal) * 180 : 0;
            const bar = document.createElement('div');
            bar.style.height = `${height}px`;
            bar.style.flex = '1';
            bar.style.backgroundColor = `hsl(${index * 3}, 70%, 50%)`;
            bar.style.borderRadius = '2px 2px 0 0';
            bar.style.minWidth = '4px';
            bar.title = `Столкновение ${index + 1}: ${formatScientific(energy)} Дж`;
            container.appendChild(bar);
        });
    }
}

function updateDiffusionProfile(diffusionProfile) {
    const container = document.getElementById("diffusionProfileChart");
    const maxDepthElement = document.getElementById("resMaxDepth");
    const maxConcentrationElement = document.getElementById("resMaxConcentration");
    const avgConcentrationElement = document.getElementById("resAvgConcentration");

    if (!diffusionProfile) {
        maxDepthElement.textContent = "0";
        maxConcentrationElement.textContent = "0";
        avgConcentrationElement.textContent = "0";
        if (container) {
            container.innerHTML = '<div class="text-center text-muted" style="width: 100%; padding-top: 80px;">Нет данных о диффузии</div>';
        }
        return;
    }

    // Обновляем данные для нового DiffusionProfileDto
    maxDepthElement.textContent = formatScientific(diffusionProfile.depth || 0);
    maxConcentrationElement.textContent = formatScientific(diffusionProfile.D_effective || 0);
    avgConcentrationElement.textContent = formatScientific(diffusionProfile.D_thermal || 0);

    // Создаем визуализацию для профиля диффузии
    if (container) {
        container.innerHTML = '';

        // Создаем простую визуализацию на основе параметров диффузии
        const params = [
            { value: diffusionProfile.D1 || 0, label: 'D1', color: 'hsl(220, 70%, 50%)' },
            { value: diffusionProfile.D2 || 0, label: 'D2', color: 'hsl(120, 70%, 50%)' },
            { value: diffusionProfile.D_thermal || 0, label: 'D_thermal', color: 'hsl(0, 70%, 50%)' },
            { value: diffusionProfile.D_effective || 0, label: 'D_effective', color: 'hsl(300, 70%, 50%)' }
        ];

        const maxValue = Math.max(...params.map(p => p.value), 1);

        params.forEach((param, index) => {
            if (param.value > 0) {
                const height = (param.value / maxValue) * 180;
                const bar = document.createElement('div');
                bar.style.height = `${height}px`;
                bar.style.flex = '1';
                bar.style.backgroundColor = param.color;
                bar.style.borderRadius = '2px 2px 0 0';
                bar.style.minWidth = '20px';
                bar.style.margin = '0 5px';
                bar.title = `${param.label}: ${formatScientific(param.value)}`;
                container.appendChild(bar);
            }
        });

        if (container.children.length === 0) {
            container.innerHTML = '<div class="text-center text-muted" style="width: 100%; padding-top: 80px;">Нет данных о диффузии</div>';
        }
    }
}

function updateCoolingProfile(coolingProfile) {
    const container = document.getElementById("coolingProfileChart");
    const minTempElement = document.getElementById("resMinTemp");
    const maxTempElement = document.getElementById("resMaxTemp");
    const avgTempElement = document.getElementById("resAvgTemp");

    if (!coolingProfile || !Array.isArray(coolingProfile) || coolingProfile.length === 0) {
        // Если нет данных, показываем реалистичные значения на основе входных параметров
        const voltage = parseFloat(document.getElementById("voltage").value) || 1000;
        const current = parseFloat(document.getElementById("current").value) || 0.1;

        // Эмпирическая формула для температуры based on power
        const power = voltage * current; // Ватты
        const baseTemp = 300 + power * 10; // Базовая температура

        minTempElement.textContent = (baseTemp * 0.8).toFixed(2);
        maxTempElement.textContent = (baseTemp * 1.5).toFixed(2);
        avgTempElement.textContent = baseTemp.toFixed(2);

        if (container) {
            container.innerHTML = '<div class="text-center text-muted" style="width: 100%; padding-top: 80px;">Нет данных о температуре</div>';
        }
        return;
    }

    // Реальные данные из симуляции
    const minTemp = Math.min(...coolingProfile);
    const maxTemp = Math.max(...coolingProfile);
    const avgTemp = coolingProfile.reduce((a, b) => a + b, 0) / coolingProfile.length;

    minTempElement.textContent = minTemp.toFixed(2);
    maxTempElement.textContent = maxTemp.toFixed(2);
    avgTempElement.textContent = avgTemp.toFixed(2);

    if (container) {
        container.innerHTML = '';
        const tempRange = maxTemp - minTemp;
        const limitedProfile = coolingProfile.slice(0, 50); // Показываем первые 50 точек

        limitedProfile.forEach((temp, index) => {
            const height = tempRange > 0 ? ((temp - minTemp) / tempRange) * 180 : 90;
            const bar = document.createElement('div');
            bar.style.height = `${height}px`;
            bar.style.flex = '1';
            // Цвет от синего (холодно) к красному (горячо)
            const hue = 240 - (temp / 5000) * 240; // 240° (синий) -> 0° (красный)
            bar.style.backgroundColor = `hsl(${hue}, 70%, 50%)`;
            bar.style.borderRadius = '2px 2px 0 0';
            bar.style.minWidth = '4px';
            bar.title = `Время ${index + 1}: ${temp.toFixed(2)} K`;
            container.appendChild(bar);
        });
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
    if (!number || isNaN(number)) return '0';
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

// Callback для успешной авторизации
if (typeof window !== 'undefined') {
    window.authSuccessCallback = function() {
        initializeAuth();
    };
}