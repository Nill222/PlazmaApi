// plasma.js - Расчёт параметров плазмы для PlasmaLab

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log("Plasma page initialized");
    setupEventListeners();
    initializeAuth();
});

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
    document.getElementById("plasmaForm").addEventListener("submit", handleFormSubmit);

    document.querySelectorAll('.form-control').forEach(input => {
        input.addEventListener('input', function() {
            const errorEl = document.getElementById(`error-${this.id}`);
            if (errorEl) {
                errorEl.textContent = "";
                errorEl.style.display = "none";
                this.classList.remove("is-invalid");
            }
        });
    });
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
            Для выполнения расчётов необходимо <a href="#" onclick="showAuthModal()" class="alert-link">войти в систему</a>
        `;
        alertBox.classList.remove("d-none");
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();

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

    const calculateBtn = document.getElementById("calculateBtn");
    const spinner = calculateBtn.querySelector(".loading-spinner");
    const buttonText = calculateBtn.querySelector("span");

    buttonText.textContent = "Расчёт...";
    spinner.style.display = "inline-block";
    calculateBtn.disabled = true;

    const voltage = parseFloat(document.getElementById("voltage").value);
    const pressure = parseFloat(document.getElementById("pressure").value);
    const temperature = parseFloat(document.getElementById("temperature").value);

    console.log("Получены значения:", { voltage, pressure, temperature });

    // Проверка валидности
    if (isNaN(voltage) || isNaN(pressure) || isNaN(temperature)) {
        showError("Пожалуйста, заполните все поля корректными числами");
        resetButtonState(calculateBtn, buttonText, spinner);
        return;
    }

    let hasErrors = false;

    // Проверка ограничений согласно DTO
    if (voltage <= 0) {
        showFieldError("voltage", "Напряжение должно быть положительным");
        hasErrors = true;
    } else if (voltage > 1e6) {
        showFieldError("voltage", "Напряжение слишком велико");
        hasErrors = true;
    }

    if (pressure <= 0) {
        showFieldError("pressure", "Давление должно быть положительным");
        hasErrors = true;
    } else if (pressure > 1e5) {
        showFieldError("pressure", "Давление слишком велико");
        hasErrors = true;
    }

    if (temperature <= 0) {
        showFieldError("temperature", "Температура должна быть положительной");
        hasErrors = true;
    } else if (temperature > 1e5) {
        showFieldError("temperature", "Температура слишком высока");
        hasErrors = true;
    }

    if (hasErrors) {
        resetButtonState(calculateBtn, buttonText, spinner);
        return;
    }

    const request = {
        voltage: voltage,
        pressure: pressure,
        temperature: temperature
    };

    console.log("Отправка запроса на /api/plasma/calculate:", request);

    try {
        const headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        };

        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch("/api/plasma/calculate", {
            method: "POST",
            headers: headers,
            body: JSON.stringify(request)
        });

        console.log("Статус ответа:", res.status);

        if (res.status === 401) {
            localStorage.removeItem('authToken');
            showAuthWarning();
            initializeAuth();
            resetButtonState(calculateBtn, buttonText, spinner);
            return;
        }

        const data = await res.json();
        console.log("Полный ответ от сервера:", data);

        const alertBox = document.getElementById("alertBox");
        if (alertBox) {
            alertBox.className = "alert alert-custom d-none";
            alertBox.innerText = "";
        }

        if (!res.ok) {
            console.error("Ошибка от сервера:", data);

            if (data.message === "Ошибка валидации" && Array.isArray(data.data)) {
                data.data.forEach(err => {
                    console.log("Ошибка валидации:", err);
                    const [field, msg] = err.split(": ");
                    const errorEl = document.getElementById(`error-${field}`);
                    const inputEl = document.getElementById(field);
                    if (errorEl) {
                        errorEl.textContent = msg;
                        errorEl.style.display = "block";
                    }
                    if (inputEl) {
                        inputEl.classList.add("is-invalid");
                    }
                });
            } else {
                const errorMessage = data.message || `HTTP error! status: ${res.status}`;
                showError(errorMessage);
                console.error("Ошибка расчёта:", errorMessage);
            }

            document.getElementById("resultSection").style.display = "none";
            resetButtonState(calculateBtn, buttonText, spinner);
            return;
        }

        // Успешный расчёт
        const plasma = data.data;

        if (plasma) {
            updateResults(plasma);
            document.getElementById("resultSection").style.display = "block";
            document.getElementById("resultSection").scrollIntoView({behavior: "smooth"});

            showToast("✅ Параметры плазмы успешно рассчитаны!");
        } else {
            throw new Error("Некорректный формат ответа от сервера");
        }

    } catch (err) {
        console.error("Ошибка при выполнении запроса:", err);
        showError("Ошибка соединения с сервером: " + err.message);
    } finally {
        resetButtonState(calculateBtn, buttonText, spinner);
    }
}

function updateResults(plasma) {
    // Основные параметры
    document.getElementById("resVoltage").textContent = plasma.voltage.toFixed(2) + " В";
    document.getElementById("resPressure").textContent = plasma.pressure.toExponential(4) + " Па";
    document.getElementById("resTemperature").textContent = plasma.temperature.toFixed(2) + " K";

    // Расчетные параметры
    document.getElementById("resElectronDensity").textContent = plasma.electronDensity.toExponential(4);
    document.getElementById("resElectronVelocity").textContent = plasma.electronVelocity.toExponential(4);
    document.getElementById("resCurrentDensity").textContent = plasma.currentDensity.toExponential(4);
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
        alertBox.innerText = message;
        alertBox.classList.remove("d-none");
    }
}

function resetButtonState(button, buttonText, spinner) {
    buttonText.textContent = "Рассчитать параметры";
    spinner.style.display = "none";
    button.disabled = false;
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
        const toastInstance = new bootstrap.Toast(toast, {delay: 3000});
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