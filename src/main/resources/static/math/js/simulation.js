// simulation.js - Полная симуляция плазмы для PlasmaLab

let calculationInProgress = false;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log("Simulation page initialized");
    setupEventListeners();
    initializeAuth();
    setupProgressIndicator();
});

function setupProgressIndicator() {
    const progressHTML = `
        <div class="progress mt-3" id="calculationProgress" style="display: none; height: 20px;">
            <div class="progress-bar progress-bar-striped progress-bar-animated" 
                 role="progressbar" style="width: 0%"></div>
        </div>
    `;
    const cardBody = document.querySelector('.calculation-card .card-body');
    if (cardBody && !document.getElementById('calculationProgress')) {
        cardBody.insertAdjacentHTML('beforeend', progressHTML);
    }
}

// Инициализация авторизации
function initializeAuth() {
    const token = getToken();
    const userMenu = document.querySelector('.user-menu');
    const authButtons = document.querySelector('.auth-buttons');

    if (token) {
        if (userMenu) userMenu.style.display = 'flex';
        if (authButtons) authButtons.style.display = 'none';
        document.body.classList.add('logged-in');

        const alertBox = document.getElementById("alertBox");
        if (alertBox) {
            alertBox.classList.add("d-none");
        }
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

    // Валидация в реальном времени - проверка запятых
    document.querySelectorAll('.form-control[type="number"]').forEach(input => {
        input.addEventListener('input', function() {
            // Заменяем запятые на точки
            if (this.value.includes(',')) {
                this.value = this.value.replace(',', '.');
            }
            clearFieldError(this.id);
        });

        input.addEventListener('change', function() {
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

function showInfo(message) {
    const alertBox = document.getElementById("alertBox");
    if (alertBox) {
        alertBox.className = "alert alert-custom alert-info";
        alertBox.innerHTML = `
            <i class="fas fa-info-circle me-2"></i>${message}
        `;
        alertBox.classList.remove("d-none");

        setTimeout(() => {
            alertBox.classList.add("d-none");
        }, 5000);
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

    calculationInProgress = true;
    buttonText.textContent = "Выполнение симуляции...";
    spinner.style.display = "inline-block";
    runBtn.disabled = true;

    if (progressBar) {
        progressBar.style.display = 'block';
        progressBar.querySelector('.progress-bar').style.width = '0%';
    }

    try {
        // Получение значений формы
        const formData = getFormData();

        // Валидация данных
        if (!validateFormData(formData)) {
            resetCalculationState(runBtn, buttonText, spinner, progressBar);
            return;
        }

        // Подготовка запроса
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

        await handleApiResponse(response);

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
        exposureTime: parseFloat(document.getElementById("exposureTime").value)
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
        chamberDepth: { min: 0.01, max: 0.5, unit: 'м' }
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
        exposureTime: formData.exposureTime
    };
}

async function handleApiResponse(response) {
    console.log("Статус ответа:", response.status);

    if (response.status === 401) {
        localStorage.removeItem('authToken');
        showAuthWarning();
        initializeAuth();
        return;
    }

    const data = await response.json();
    console.log("Полный ответ от сервера:", data);

    const alertBox = document.getElementById("alertBox");
    if (alertBox) {
        alertBox.className = "alert alert-custom d-none";
        alertBox.innerText = "";
    }

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
            console.error("Ошибка симуляции:", errorMessage);
        }

        document.getElementById("resultSection").style.display = "none";
        return;
    }

    // Успешная симуляция
    const result = data.data;
    const progressBar = document.getElementById('calculationProgress');

    if (progressBar) {
        progressBar.querySelector('.progress-bar').style.width = '100%';
    }

    if (result) {
        updateResults(result);
        document.getElementById("resultSection").style.display = "block";
        document.getElementById("resultSection").scrollIntoView({behavior: "smooth"});

        showToast("✅ Полная симуляция успешно завершена!");
    } else {
        throw new Error("Некорректный формат ответа от сервера");
    }
}

function updateResults(result) {
    // Базовые результаты - исправленная версия для текущей структуры DTO
    document.getElementById("resAtom").textContent = result.atomName || "Неизвестно";

    // Проблема: в текущем DTO после atomName идет String s, затем totalTransferredEnergy
    // Если бэкенд возвращает данные в неправильном порядке, нужно проверить структуру
    console.log("Полная структура результата:", result);

    // Временное решение - проверяем все возможные варианты имен полей
    const totalEnergy = result.totalTransferredEnergy !== undefined ? result.totalTransferredEnergy :
        result.totalEnergy !== undefined ? result.totalEnergy : 0;

    const avgEnergy = result.avgTransferredPerAtom !== undefined ? result.avgTransferredPerAtom :
        result.avgEnergy !== undefined ? result.avgEnergy :
            result.averageEnergy !== undefined ? result.averageEnergy : 0;

    document.getElementById("resTotalEnergy").textContent = formatScientific(totalEnergy) + " Дж";
    document.getElementById("resAvgEnergy").textContent = formatScientific(avgEnergy);
    document.getElementById("resTemperature").textContent = result.estimatedTemperature !== undefined ? result.estimatedTemperature.toFixed(2) : "0";
    document.getElementById("resDiffusion").textContent = result.diffusionCoefficient !== undefined ? formatScientific(result.diffusionCoefficient) : "0";

    // Остальные функции остаются без изменений
    updatePlasmaParameters(result.plasmaParameters);
    updateCollisionEnergies(result.perAtomTransferredEnergies);
    updateDiffusionProfile(result.diffusionProfile);
    updateCoolingProfile(result.coolingProfile);
}
function updatePlasmaParameters(plasmaParams) {
    const container = document.getElementById("plasmaParams");
    if (!plasmaParams || !container) return;

    container.innerHTML = '';

    const params = [
        { key: 'electronDensity', label: 'Плотность электронов', unit: 'м⁻³', icon: 'fas fa-atom' },
        { key: 'electronVelocity', label: 'Скорость электронов', unit: 'м/с', icon: 'fas fa-gauge-high' },
        { key: 'currentDensity', label: 'Плотность тока', unit: 'А/м²', icon: 'fas fa-bolt' },
        { key: 'ionEnergy', label: 'Энергия ионов', unit: 'Дж', icon: 'fas fa-bolt' },
        { key: 'voltage', label: 'Напряжение', unit: 'В', icon: 'fas fa-bolt' },
        { key: 'pressure', label: 'Давление', unit: 'Па', icon: 'fas fa-tachometer-alt' },
        { key: 'electronTemp', label: 'Температура электронов', unit: 'K', icon: 'fas fa-thermometer-half' }
    ];

    params.forEach(param => {
        if (plasmaParams[param.key] !== undefined && plasmaParams[param.key] !== null) {
            const value = formatScientific(plasmaParams[param.key]);
            container.innerHTML += `
                <div class="col-md-4">
                    <div class="stat-card text-center">
                        <i class="${param.icon} stat-icon"></i>
                        <div class="stat-value">${value}</div>
                        <div class="stat-label">${param.label}</div>
                        <div class="stat-unit">${param.unit}</div>
                    </div>
                </div>
            `;
        }
    });

    // Если нет параметров плазмы, показываем сообщение
    if (container.innerHTML === '') {
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

    // Обновляем статистику
    countElement.textContent = energies.length;
    const maxEnergy = Math.max(...energies);
    maxEnergyElement.textContent = formatScientific(maxEnergy);

    // Создаем простую визуализацию
    if (container) {
        container.innerHTML = '';
        const maxVal = Math.max(...energies);
        const limitedEnergies = energies.slice(0, 50); // Ограничиваем для визуализации

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

        if (energies.length > 50) {
            const info = document.createElement('div');
            info.style.position = 'absolute';
            info.style.bottom = '5px';
            info.style.right = '10px';
            info.style.fontSize = '12px';
            info.style.color = '#666';
            info.textContent = `Показано 50 из ${energies.length}`;
            container.style.position = 'relative';
            container.appendChild(info);
        }
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

    // Извлекаем данные из DiffusionProfileDto
    const depths = diffusionProfile.depths || [];
    const concentrations = diffusionProfile.concentration || []; // Обратите внимание: concentration (без s)

    if (depths.length > 0 && concentrations.length > 0 && depths.length === concentrations.length) {
        const maxDepth = Math.max(...depths);
        const maxConcentration = Math.max(...concentrations);
        const avgConcentration = concentrations.reduce((a, b) => a + b, 0) / concentrations.length;

        maxDepthElement.textContent = formatScientific(maxDepth);
        maxConcentrationElement.textContent = formatScientific(maxConcentration);
        avgConcentrationElement.textContent = formatScientific(avgConcentration);

        // Создаем визуализацию профиля диффузии
        if (container) {
            container.innerHTML = '';
            const maxConc = Math.max(...concentrations);
            const limitedData = depths.map((depth, index) => ({
                depth,
                concentration: concentrations[index]
            })).slice(0, 50);

            limitedData.forEach((data, index) => {
                const height = maxConc > 0 ? (data.concentration / maxConc) * 180 : 0;
                const bar = document.createElement('div');
                bar.style.height = `${height}px`;
                bar.style.flex = '1';
                bar.style.backgroundColor = `hsl(220, 70%, ${50 + (index / limitedData.length) * 20}%)`;
                bar.style.borderRadius = '2px 2px 0 0';
                bar.style.minWidth = '4px';
                bar.title = `Глубина: ${formatScientific(data.depth)} м, Концентрация: ${formatScientific(data.concentration)}`;
                container.appendChild(bar);
            });

            if (depths.length > 50) {
                const info = document.createElement('div');
                info.style.position = 'absolute';
                info.style.bottom = '5px';
                info.style.right = '10px';
                info.style.fontSize = '12px';
                info.style.color = '#666';
                info.textContent = `Показано 50 из ${depths.length}`;
                container.style.position = 'relative';
                container.appendChild(info);
            }
        }
    } else {
        maxDepthElement.textContent = "0";
        maxConcentrationElement.textContent = "0";
        avgConcentrationElement.textContent = "0";
        if (container) {
            container.innerHTML = '<div class="text-center text-muted" style="width: 100%; padding-top: 80px;">Некорректные данные диффузии</div>';
        }
    }
}

function updateCoolingProfile(coolingProfile) {
    const container = document.getElementById("coolingProfileChart");
    const minTempElement = document.getElementById("resMinTemp");
    const maxTempElement = document.getElementById("resMaxTemp");

    if (!coolingProfile || !Array.isArray(coolingProfile) || coolingProfile.length === 0) {
        minTempElement.textContent = "0";
        maxTempElement.textContent = "0";
        if (container) {
            container.innerHTML = '<div class="text-center text-muted" style="width: 100%; padding-top: 80px;">Нет данных об охлаждении</div>';
        }
        return;
    }

    const minTemp = Math.min(...coolingProfile);
    const maxTemp = Math.max(...coolingProfile);

    minTempElement.textContent = minTemp.toFixed(2);
    maxTempElement.textContent = maxTemp.toFixed(2);

    // Создаем визуализацию профиля охлаждения
    if (container) {
        container.innerHTML = '';
        const tempRange = maxTemp - minTemp;
        const limitedProfile = coolingProfile.slice(0, 50);

        limitedProfile.forEach((temp, index) => {
            const height = tempRange > 0 ? ((temp - minTemp) / tempRange) * 180 : 90;
            const bar = document.createElement('div');
            bar.style.height = `${height}px`;
            bar.style.flex = '1';
            // От синего (холодно) к красному (горячо)
            const hue = 240 - (index / limitedProfile.length) * 120;
            bar.style.backgroundColor = `hsl(${hue}, 70%, 50%)`;
            bar.style.borderRadius = '2px 2px 0 0';
            bar.style.minWidth = '4px';
            bar.title = `Время ${index + 1}: ${temp.toFixed(2)} K`;
            container.appendChild(bar);
        });

        if (coolingProfile.length > 50) {
            const info = document.createElement('div');
            info.style.position = 'absolute';
            info.style.bottom = '5px';
            info.style.right = '10px';
            info.style.fontSize = '12px';
            info.style.color = '#666';
            info.textContent = `Показано 50 из ${coolingProfile.length}`;
            container.style.position = 'relative';
            container.appendChild(info);
        }
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

function showToast(message) {
    if (typeof showMessage === 'function') {
        showMessage(message, 'success');
    } else {
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