// diffusion.js - Моделирование диффузии для PlasmaLab

let concentrationChart = null;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log("Diffusion page initialized");
    setupEventListeners();
    initializeAuth();
    initializeChart();
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
    document.getElementById("diffusionForm").addEventListener("submit", handleFormSubmit);

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

function initializeChart() {
    const ctx = document.getElementById('concentrationChart').getContext('2d');
    concentrationChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Концентрация',
                data: [],
                borderColor: '#2c5aa0',
                backgroundColor: 'rgba(44, 90, 160, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Профиль концентрации по глубине'
                },
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Глубина (м)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Концентрация (моль/м³)'
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const token = getToken();
    if (!token) {
        showAuthWarning();
        return;
    }

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

    const D = parseFloat(document.getElementById("D").value);
    const c0 = parseFloat(document.getElementById("c0").value);
    const tMax = parseFloat(document.getElementById("tMax").value);
    const depth = parseFloat(document.getElementById("depth").value);
    const dx = parseFloat(document.getElementById("dx").value);
    const dt = parseFloat(document.getElementById("dt").value);

    console.log("Получены значения:", { D, c0, tMax, depth, dx, dt });

    if (isNaN(D) || isNaN(c0) || isNaN(tMax) || isNaN(depth) || isNaN(dx) || isNaN(dt)) {
        showError("Пожалуйста, заполните все поля корректными числами");
        resetButtonState(calculateBtn, buttonText, spinner);
        return;
    }

    let hasErrors = false;

    // Проверка ограничений согласно DTO
    if (D <= 0) {
        showFieldError("D", "Коэффициент диффузии должен быть положительным");
        hasErrors = true;
    } else if (D > 1e-2) {
        showFieldError("D", "Коэффициент диффузии слишком велик для модели");
        hasErrors = true;
    }

    if (c0 < 0) {
        showFieldError("c0", "Начальная концентрация не может быть отрицательной");
        hasErrors = true;
    } else if (c0 > 1e3) {
        showFieldError("c0", "Начальная концентрация слишком велика");
        hasErrors = true;
    }

    if (tMax <= 0) {
        showFieldError("tMax", "Максимальное время должно быть положительным");
        hasErrors = true;
    } else if (tMax > 1e6) {
        showFieldError("tMax", "Максимальное время слишком велико");
        hasErrors = true;
    }

    if (depth <= 0) {
        showFieldError("depth", "Глубина должна быть положительной");
        hasErrors = true;
    } else if (depth > 1e3) {
        showFieldError("depth", "Глубина слишком велика для модели");
        hasErrors = true;
    }

    if (dx <= 0) {
        showFieldError("dx", "Шаг по глубине должен быть положительным");
        hasErrors = true;
    }

    if (dt <= 0) {
        showFieldError("dt", "Шаг по времени должен быть положительным");
        hasErrors = true;
    }

    if (hasErrors) {
        resetButtonState(calculateBtn, buttonText, spinner);
        return;
    }

    const request = { D, c0, tMax, depth, dx, dt };

    console.log("Отправка запроса на /api/diffusion/calculate:", request);

    try {
        const headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        };

        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch("/api/diffusion/calculate", {
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
        const profile = data.data;

        if (profile && Array.isArray(profile.depths) && Array.isArray(profile.concentration)) {
            updateResultsTable(profile.depths, profile.concentration, c0);
            updateChart(profile.depths, profile.concentration);
            updateStatistics(profile.depths, profile.concentration, D, tMax);

            document.getElementById("resultSection").style.display = "block";
            document.getElementById("resultSection").scrollIntoView({behavior: "smooth"});
        } else {
            throw new Error("Некорректный формат ответа от сервера");
        }

    } catch (err) {
        console.error("Ошибка при выполнении запроса:", err);
        showToast("Ошибка соединения с сервером: " + err.message);
    } finally {
        resetButtonState(calculateBtn, buttonText, spinner);
    }
}

function updateResultsTable(depths, concentrations, c0) {
    const table = document.getElementById("resultsTable");
    table.innerHTML = "";

    const step = Math.max(1, Math.floor(depths.length / 50));

    for (let i = 0; i < depths.length; i += step) {
        const depth = depths[i];
        const concentration = concentrations[i];
        const relative = c0 > 0 ? (concentration / c0 * 100).toFixed(2) : "0.00";

        table.insertAdjacentHTML("beforeend", `
            <tr>
                <td>${depth.toExponential(4)}</td>
                <td>${concentration.toExponential(4)}</td>
                <td>${relative}%</td>
            </tr>
        `);
    }
}

function updateChart(depths, concentrations) {
    if (concentrationChart) {
        concentrationChart.data.labels = depths;
        concentrationChart.data.datasets[0].data = concentrations;
        concentrationChart.update();
    }
}

function updateStatistics(depths, concentrations, D, tMax) {
    const maxDepth = depths[depths.length - 1];

    // Находим глубину, где концентрация падает до 1% от начальной
    let penetrationDepth = maxDepth;
    for (let i = 0; i < concentrations.length; i++) {
        if (concentrations[i] < concentrations[0] * 0.01) {
            penetrationDepth = depths[i];
            break;
        }
    }

    const diffusionLength = Math.sqrt(D * tMax);

    document.getElementById("maxDepth").textContent = maxDepth.toExponential(3) + " м";
    document.getElementById("penetrationDepth").textContent = penetrationDepth.toExponential(3) + " м";
    document.getElementById("diffusionLength").textContent = diffusionLength.toExponential(3) + " м";
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
    buttonText.textContent = "Рассчитать профиль";
    spinner.style.display = "none";
    button.disabled = false;
}

function showToast(message) {
    if (typeof showMessage === 'function') {
        showMessage(message, 'error');
    } else {
        const toast = document.createElement("div");
        toast.className = "toast align-items-center text-white bg-danger border-0 position-fixed bottom-0 end-0 m-3";
        toast.setAttribute("role", "alert");
        toast.setAttribute("aria-live", "assertive");
        toast.setAttribute("aria-atomic", "true");

        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-exclamation-triangle me-2"></i>${message}
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