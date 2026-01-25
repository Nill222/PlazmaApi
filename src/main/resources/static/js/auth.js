// js/auth.js
// Универсальный auth client для PlasmaLab
// Ключ токена в localStorage: "authToken"

const API_ROOT = "/auth";
const TOKEN_KEY = "authToken";

/** Вспомогалки UI **/
function showMessage(message, type = "error", targetId = null) {
    // type: "error" | "success" | "info"
    console.log("AUTH MSG:", type, message);
    const alertType = type === "error" ? "danger" : (type === "success" ? "success" : "info");

    // 1) если есть authAlert на странице (новая страница) — используем его
    const authAlert = document.getElementById("authAlert");
    if (authAlert) {
        authAlert.innerHTML = `<div class="alert alert-${alertType} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>`;
        authAlert.style.display = "block";
        return;
    }

    // 2) если есть блок с id targetId — пишем туда
    if (targetId) {
        const el = document.getElementById(targetId);
        if (el) {
            el.textContent = message;
            el.style.color = (type === "error") ? "#ff6b6b" : (type === "success" ? "#28a745" : "#00aaff");
            return;
        }
    }

    // 3) fallback — элемент #msg (старый шаблон)
    const msg = document.getElementById("msg") || document.getElementById("login_msg") || document.getElementById("signup_msg");
    if (msg) {
        msg.textContent = message;
        msg.style.color = (type === "error") ? "#ff6b6b" : (type === "success" ? "#28a745" : "#00aaff");
        return;
    }

    // 4) последний fallback — alert()
    alert(message);
}

/** Токен */
function saveToken(token) {
    if (!token) return;
    localStorage.setItem(TOKEN_KEY, token);
    console.log("Auth token saved, len:", token.length || 0);
}

function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
}

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

/** Общая обработка ответа ApiResponse */
async function parseApiResponse(response) {
    const text = await response.text();
    try {
        const json = JSON.parse(text);
        return { ok: response.ok, status: response.status, body: json };
    } catch (e) {
        // не JSON — вернуть raw text
        return { ok: response.ok, status: response.status, body: text };
    }
}

/** Простая функция обновления UI без запроса к /auth/me */
function updateAuthUI() {
    const token = getToken();
    const authButtons = document.querySelector('.auth-buttons');
    const userMenu = document.querySelector('.user-menu');
    const usernameEl = document.getElementById('usernameDisplay');

    if (token) {
        // Показываем меню пользователя
        if (authButtons) authButtons.style.display = 'none';
        if (userMenu) userMenu.style.display = 'flex';
        if (usernameEl) {
            // Получаем имя пользователя из localStorage
            const savedUsername = localStorage.getItem('lastUsername');
            if (savedUsername) {
                usernameEl.textContent = savedUsername;
            } else {
                usernameEl.textContent = 'User';
            }
        }

        // Добавляем класс для стилей если нужно
        document.body.classList.add('logged-in');
    } else {
        // Показываем кнопки входа
        if (authButtons) authButtons.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
        if (usernameEl) usernameEl.textContent = '';

        // Убираем класс
        document.body.classList.remove('logged-in');
    }
}

/** Signin */
async function signin() {
    // Нахождение полей по нескольким вариантам (чтобы поддерживать старую/новую страницу)
    const username = (document.getElementById("login_username") || {}).value || (document.querySelector("#loginForm input[name='username']") || {}).value;
    const password = (document.getElementById("login_password") || {}).value || (document.querySelector("#loginForm input[name='password']") || {}).value;

    const uiTarget = document.getElementById("login_msg") || document.getElementById("msg");

    if (!username || !password) {
        showMessage("Пожалуйста, заполните имя пользователя и пароль", "error", uiTarget ? uiTarget.id : null);
        return false;
    }

    // UI: показать прогресс
    showMessage("⏳ Авторизация...", "info", uiTarget ? uiTarget.id : null);

    try {
        const resp = await fetch(`${API_ROOT}/signin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const parsed = await parseApiResponse(resp);
        const b = parsed.body;

        if (!parsed.ok) {
            // попробуем извлечь понятное сообщение
            const msg = (b && (b.message || (Array.isArray(b.data) ? b.data.join(", ") : null))) || `Ошибка сервера (${parsed.status})`;
            showMessage("❌ " + msg, "error", uiTarget ? uiTarget.id : null);
            console.error("Signin failed:", parsed);
            return false;
        }

        // успешный ответ - предполагаем ApiResponse { data: token, message, status }
        let token = null;
        if (b) {
            if (typeof b === "string") token = b;
            else if (b.data && typeof b.data === "string") token = b.data;
            else if (b.token) token = b.token;
            else if (b.body && typeof b.body === "string") token = b.body;
        }

        if (!token) {
            showMessage("❌ Токен не получен от сервера", "error", uiTarget ? uiTarget.id : null);
            console.error("Signin: token missing, body=", b);
            return false;
        }

        saveToken(token);
        // Сохраняем имя пользователя для отображения
        localStorage.setItem('lastUsername', username);

        showMessage("✔ Успешный вход", "success", uiTarget ? uiTarget.id : null);

        // Закрываем модальное окно
        const authOverlay = document.getElementById('authOverlay');
        if (authOverlay) {
            authOverlay.style.display = 'none';
        }

        // Сбрасываем форму
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.reset();
        }

        // Обновляем UI авторизации
        updateAuthUI();

        return true;
    } catch (err) {
        console.error("Signin error:", err);
        showMessage("Ошибка соединения: " + (err.message || err), "error", uiTarget ? uiTarget.id : null);
        return false;
    }
}

/** Signup */
async function signup() {
    const username = (document.getElementById("reg_username") || {}).value || (document.querySelector("#registerForm input[name='username']") || {}).value;
    const email = (document.getElementById("reg_email") || {}).value || (document.querySelector("#registerForm input[name='email']") || {}).value;
    const password = (document.getElementById("reg_password") || {}).value || (document.querySelector("#registerForm input[name='password']") || {}).value;

    const uiTarget = document.getElementById("signup_msg") || document.getElementById("msg");

    if (!username || !email || !password) {
        showMessage("Пожалуйста, заполните все поля регистрации", "error", uiTarget ? uiTarget.id : null);
        return false;
    }

    showMessage("⏳ Регистрация...", "info", uiTarget ? uiTarget.id : null);

    try {
        const resp = await fetch(`${API_ROOT}/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password })
        });

        const parsed = await parseApiResponse(resp);
        const b = parsed.body;

        if (!parsed.ok) {
            // Если body.data — массив ошибок валидации, покажем их
            if (b && Array.isArray(b.data)) {
                const details = b.data.join("; ");
                showMessage(details || (b.message || `Ошибка (${parsed.status})`), "error", uiTarget ? uiTarget.id : null);
            } else {
                const msg = (b && b.message) ? b.message : `Ошибка регистрации (${parsed.status})`;
                showMessage("❌ " + msg, "error", uiTarget ? uiTarget.id : null);
            }
            console.error("Signup failed:", parsed);
            return false;
        }

        // Успех — показываем сообщение
        const successMsg = b?.message || "Регистрация успешна";
        showMessage("✔ " + successMsg + ". Пожалуйста, войдите.", "success", uiTarget ? uiTarget.id : null);

        // Закрываем модальное окно
        const authOverlay = document.getElementById('authOverlay');
        if (authOverlay) {
            authOverlay.style.display = 'none';
        }

        // Сбрасываем форму
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.reset();
        }

        // Переключаем на вкладку логина
        setTimeout(() => {
            if (authOverlay) {
                authOverlay.style.display = 'flex';
                // Активируем вкладку логина
                const loginTab = document.querySelector('.auth-tab[data-tab="login"]');
                const loginForm = document.querySelector('.auth-form[data-form="login"]');

                if (loginTab && loginForm) {
                    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
                    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));

                    loginTab.classList.add('active');
                    loginForm.classList.add('active');
                }
            }
        }, 1500);

        return true;
    } catch (err) {
        console.error("Signup error:", err);
        showMessage("Ошибка соединения: " + (err.message || err), "error", uiTarget ? uiTarget.id : null);
        return false;
    }
}

/** Logout */
function logout() {
    console.log("🚪 Logging out...");

    // Очищаем токен
    clearToken();

    // Очищаем имя пользователя
    localStorage.removeItem('lastUsername');

    // Показываем сообщение
    showMessage("✔ Вы успешно вышли из системы", "success");

    // Обновляем UI
    updateAuthUI();

    // Обновляем страницу через секунду
    setTimeout(() => {
        location.reload();
    }, 1000);
}

/** Авто-привязка форм и инициализация */
document.addEventListener("DOMContentLoaded", () => {
    // Привязка форм
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            signin();
        });
    }

    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", (e) => {
            e.preventDefault();
            signup();
        });
    }

    // Инициализация UI при загрузке страницы
    updateAuthUI();
});

/** Поддержка старого вызова onclick */
window.signin = signin;
window.signup = signup;
window.logout = logout;
window.getToken = getToken;
window.clearToken = clearToken;
window.updateAuthUI = updateAuthUI;