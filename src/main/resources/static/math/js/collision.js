// collision.js - Моделирование столкновений для PlasmaLab

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log("Collision page initialized");
    initializeAnimation();
    setupEventListeners();
    initializeAuth();
});

// Инициализация авторизации
function initializeAuth() {
    const token = getToken();
    const userMenu = document.querySelector('.user-menu');
    const authButtons = document.querySelector('.auth-buttons');
    const usernameDisplay = document.getElementById('usernameDisplay');

    if (token) {
        // Пользователь авторизован
        if (userMenu) userMenu.style.display = 'flex';
        if (authButtons) authButtons.style.display = 'none';
        document.body.classList.add('logged-in');

        // Скрываем предупреждение об авторизации
        const alertBox = document.getElementById("alertBox");
        if (alertBox) {
            alertBox.classList.add("d-none");
        }
    } else {
        // Пользователь не авторизован
        if (userMenu) userMenu.style.display = 'none';
        if (authButtons) authButtons.style.display = 'flex';
        document.body.classList.remove('logged-in');

        // Показываем предупреждение об авторизации
        showAuthWarning();
    }
}

function setupEventListeners() {
    // Основной обработчик формы
    document.getElementById("collisionForm").addEventListener("submit", handleFormSubmit);

    // Валидация в реальном времени
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

    // Очистить ошибки
    document.querySelectorAll(".error-message").forEach(el => {
        el.textContent = "";
        el.style.display = "none";
    });
    document.querySelectorAll(".form-control").forEach(el => el.classList.remove("is-invalid"));

    const calculateBtn = document.getElementById("calculateBtn");
    const spinner = calculateBtn.querySelector(".loading-spinner");
    const buttonText = calculateBtn.querySelector("span");

    // Показать спиннер загрузки
    buttonText.textContent = "Расчёт...";
    spinner.style.display = "inline-block";
    calculateBtn.disabled = true;

    // Получаем значения из формы
    const E = parseFloat(document.getElementById("E").value);
    const mIon = parseFloat(document.getElementById("mIon").value);
    const mAtom = parseFloat(document.getElementById("mAtom").value);
    const angle = parseFloat(document.getElementById("angle").value);

    console.log("Получены значения:", { E, mIon, mAtom, angle });

    // Проверяем валидность данных
    if (isNaN(E) || isNaN(mIon) || isNaN(mAtom) || isNaN(angle)) {
        showError("Пожалуйста, заполните все поля корректными числами");
        resetButtonState(calculateBtn, buttonText, spinner);
        return;
    }

    // Проверяем ограничения бэкенда
    let hasErrors = false;

    if (E <= 0) {
        showFieldError("E", "Энергия должна быть положительной");
        hasErrors = true;
    } else if (E > 1e6) {
        showFieldError("E", "Энергия слишком велика, проверьте входные данные");
        hasErrors = true;
    }

    if (mIon <= 0) {
        showFieldError("mIon", "Масса иона должна быть положительной");
        hasErrors = true;
    } else if (mIon > 1e-20) {
        showFieldError("mIon", "Масса иона слишком велика для модели");
        hasErrors = true;
    }

    if (mAtom <= 0) {
        showFieldError("mAtom", "Масса атома должна быть положительной");
        hasErrors = true;
    } else if (mAtom > 1e-20) {
        showFieldError("mAtom", "Масса атома слишком велика для модели");
        hasErrors = true;
    }

    if (angle < 0 || angle > 180) {
        showFieldError("angle", "Угол должен быть в диапазоне от 0 до 180 градусов");
        hasErrors = true;
    }

    if (hasErrors) {
        resetButtonState(calculateBtn, buttonText, spinner);
        return;
    }

    const request = {
        E: E,
        mIon: mIon,
        mAtom: mAtom,
        angle: angle
    };

    console.log("Отправка запроса на /api/collision/simulate:", request);

    try {
        const headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        };

        // Добавляем токен авторизации
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch("/api/collision/simulate", {
            method: "POST",
            headers: headers,
            body: JSON.stringify(request)
        });

        console.log("Статус ответа:", res.status);

        // Если 401 - перенаправляем на авторизацию
        if (res.status === 401) {
            localStorage.removeItem('authToken');
            showAuthWarning();
            initializeAuth(); // Обновляем UI
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

            // Ошибка валидации полей от бэкенда
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
        const result = data.data;

        console.log("Успешный результат:", result);

        if (result && typeof result.transferredEnergy !== 'undefined' && typeof result.reflectionCoefficient !== 'undefined') {
            document.getElementById("outTransferred").textContent =
                result.transferredEnergy.toExponential(6);

            document.getElementById("outReflection").textContent =
                result.reflectionCoefficient.toFixed(6);

            document.getElementById("resultSection").style.display = "block";

            // Анимация столкновения
            animateCollision();

            // Плавная прокрутка к результатам
            document.getElementById("resultSection")
                .scrollIntoView({behavior: "smooth"});
        } else {
            throw new Error("Некорректный формат ответа от сервера");
        }

    } catch (err) {
        console.error("Ошибка при выполнении запроса:", err);
        showToast("Ошибка соединения с сервером: " + err.message);
    } finally {
        // Скрыть спиннер загрузки
        resetButtonState(calculateBtn, buttonText, spinner);
    }
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
    buttonText.textContent = "Рассчитать столкновение";
    spinner.style.display = "none";
    button.disabled = false;
}

function initializeAnimation() {
    const ion = document.getElementById('ionParticle');
    const atom = document.getElementById('atomParticle');

    if (ion && atom) {
        // Начальная позиция
        ion.style.left = '50px';
        ion.style.top = '100px';
        atom.style.left = '250px';
        atom.style.top = '100px';
    }
}

function animateCollision() {
    const ion = document.getElementById('ionParticle');
    const atom = document.getElementById('atomParticle');

    if (!ion || !atom) return;

    // Сброс анимации
    ion.style.transition = 'none';
    atom.style.transition = 'none';
    ion.style.transform = 'scale(1)';
    atom.style.transform = 'scale(1)';

    // Начальная позиция
    ion.style.left = '50px';
    atom.style.left = '250px';

    // Запуск анимации после небольшой задержки
    setTimeout(() => {
        // Анимация движения навстречу
        ion.style.transition = 'left 1s ease-in-out';
        atom.style.transition = 'left 1s ease-in-out';

        ion.style.left = '150px';
        atom.style.left = '150px';

        // Столкновение и отскок
        setTimeout(() => {
            ion.style.transition = 'left 0.5s ease-out, transform 0.3s ease-out';
            atom.style.transition = 'left 0.5s ease-out, transform 0.3s ease-out';

            ion.style.left = '50px';
            atom.style.left = '250px';
            ion.style.transform = 'scale(1.2)';
            atom.style.transform = 'scale(1.2)';

            setTimeout(() => {
                ion.style.transform = 'scale(1)';
                atom.style.transform = 'scale(1)';
            }, 300);
        }, 1000);
    }, 100);
}

function showToast(message) {
    // Используем функцию showMessage из auth.js если она доступна
    if (typeof showMessage === 'function') {
        showMessage(message, 'error');
    } else {
        // Fallback - создаем свой toast
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

        // Удаление toast из DOM после скрытия
        toast.addEventListener('hidden.bs.toast', () => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        });
    }
}

// Глобальные функции для работы с модальным окном
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

// Обновляем UI после успешной авторизации
if (typeof window !== 'undefined') {
    window.authSuccessCallback = function() {
        initializeAuth();
    };
}