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
        showMessage("✔ Успешный вход", "success", uiTarget ? uiTarget.id : null);

        // Попытка валидации /auth/me если есть функция initializeAuth
        if (typeof initializeAuth === "function") {
            try {
                await initializeAuth();
            } catch (e) { console.warn("initializeAuth failed:", e); }
        }

        // перенаправим если есть
        setTimeout(() => {
            if (window.location.pathname.endsWith("/auth.html") || window.location.pathname.endsWith("/login.html") || window.location.pathname.endsWith("/signin.html")) {
                window.location.href = "/index.html";
            } else {
                location.reload();
            }
        }, 700);

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

        // Успех — показать сообщение
        showMessage("✔ Регистрация успешна. Пожалуйста, войдите.", "success", uiTarget ? uiTarget.id : null);

        // переключаем вкладку на логин если на странице есть табы (try)
        try {
            // старая страница: tabs are simple — trigger click on login tab if exists
            const loginTabBtn = document.querySelector(".tab[onclick*='switchTab']") || document.querySelector('[data-bs-target="#login"]') || document.querySelector('[data-bs-toggle="tab"][href="#signinTab"]');
            if (loginTabBtn) {
                if (typeof loginTabBtn.click === "function") loginTabBtn.click();
            }
        } catch (e) { /* ignore */ }

        return true;
    } catch (err) {
        console.error("Signup error:", err);
        showMessage("Ошибка соединения: " + (err.message || err), "error", uiTarget ? uiTarget.id : null);
        return false;
    }
}

/** Поддержка старого вызова onclick */
window.signin = signin;
window.signup = signup;

/** Авто-привязка форм (если используются формы, а не onclick) */
document.addEventListener("DOMContentLoaded", () => {
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

    /** Logout */
    function logout() {
        console.log("🚪 Logging out...");

        // Очищаем токен
        localStorage.removeItem('authToken');

        // Показываем сообщение
        showMessage("✔ Вы успешно вышли из системы", "success");

        // Обновляем UI
        const authButtons = document.querySelector('.auth-buttons');
        const userMenu = document.querySelector('.user-menu');
        const protectedOperations = document.querySelectorAll('.protected-operation');

        if (authButtons) authButtons.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
        if (protectedOperations) {
            protectedOperations.forEach(el => {
                el.style.display = 'none';
            });
        }

        // Убираем класс с body
        document.body.classList.remove('logged-in');

        // Обновляем страницу через секунду
        setTimeout(() => {
            location.reload();
        }, 1000);
    }

// Добавляем в глобальную область видимости
    window.logout = logout;
});
