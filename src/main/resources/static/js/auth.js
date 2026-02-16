// ==============================================================
// PlasmaLab Authentication Client v2.1 (FIXED)
// Fully compatible with Spring Boot + JWT backend
// ==============================================================

const API_ROOT = "/auth";
const TOKEN_COOKIE = "authToken";
const USERNAME_COOKIE = "username";
const USER_ID_COOKIE = "userId";
const USER_ROLE_COOKIE = "userRole";

// ==============================================================
// Cookie Manager
// ==============================================================

const Cookie = {
    set(name, value, days = 7) {
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 3600 * 1000);
        const secure = location.protocol === 'https:' ? '; Secure' : '';
        // Конвертируем value в строку для encodeURIComponent
        const stringValue = String(value);
        document.cookie = `${name}=${encodeURIComponent(stringValue)}; expires=${date.toUTCString()}; path=/; SameSite=Lax${secure}`;

        // Безопасное логирование
        const logValue = stringValue.length > 20 ? stringValue.substring(0, 20) + '...' : stringValue;
        console.log(`[Cookie] Set ${name}:`, logValue);
    },

    get(name) {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        const value = match ? decodeURIComponent(match[2]) : null;

        // Безопасное логирование
        if (value) {
            const logValue = value.length > 20 ? value.substring(0, 20) + '...' : value;
            console.log(`[Cookie] Get ${name}:`, logValue);
        } else {
            console.log(`[Cookie] Get ${name}: null`);
        }

        return value;
    },

    remove(name) {
        const secure = location.protocol === 'https:' ? '; Secure' : '';
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/; SameSite=Lax${secure}`;
        console.log(`[Cookie] Removed ${name}`);
    }
};

// ==============================================================
// UI Helpers
// ==============================================================

function showMessage(message, type = "error", targetId = null) {
    const colors = {
        error: "#ff6b6b",
        success: "#28a745",
        info: "#00aaff"
    };

    const target =
        (targetId && document.getElementById(targetId)) ||
        document.getElementById("login_msg") ||
        document.getElementById("signup_msg") ||
        document.getElementById("auth_msg");

    if (target) {
        target.textContent = message;
        target.style.color = colors[type] || colors.error;
        target.style.display = 'block';

        if (type !== 'error') {
            setTimeout(() => {
                target.style.display = 'none';
            }, 5000);
        }
        return;
    }

    console.warn('[Auth] Message target not found, using alert');
    alert(message);
}

function clearMessages() {
    ['login_msg', 'signup_msg', 'auth_msg'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = '';
            el.style.display = 'none';
        }
    });
}

function updateAuthUI() {
    console.log('[Auth] Updating UI...');
    const token = Cookie.get(TOKEN_COOKIE);
    const username = Cookie.get(USERNAME_COOKIE);

    const authButtons = document.querySelector('.auth-buttons');
    const userMenu = document.querySelector('.user-menu');
    const usernameEl = document.getElementById('usernameDisplay');

    console.log('[Auth] Token exists:', !!token, 'Username:', username);

    if (token && username) {
        if (authButtons) authButtons.style.display = "none";
        if (userMenu) userMenu.style.display = "flex";
        if (usernameEl) usernameEl.textContent = username;
        document.body.classList.add("logged-in");
        console.log('[Auth] UI updated: LOGGED IN');
    } else {
        if (authButtons) authButtons.style.display = "flex";
        if (userMenu) userMenu.style.display = "none";
        if (usernameEl) usernameEl.textContent = "";
        document.body.classList.remove("logged-in");
        console.log('[Auth] UI updated: LOGGED OUT');
    }
}

// ==============================================================
// API Helpers
// ==============================================================

async function apiRequest(url, body = null, useAuth = false) {
    const options = {
        method: body ? "POST" : "GET",
        headers: {
            "Content-Type": "application/json"
        }
    };

    if (useAuth) {
        const token = Cookie.get(TOKEN_COOKIE);
        if (token) {
            options.headers["Authorization"] = `Bearer ${token}`;
        }
    }

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const res = await fetch(url, options);
        const contentType = res.headers.get("content-type");

        let data;
        if (contentType && contentType.includes("application/json")) {
            data = await res.json();
        } else {
            const text = await res.text();
            try {
                data = JSON.parse(text);
            } catch {
                data = { message: text };
            }
        }

        // Автоматический логаут при 401 (НО НЕ ПЕРЕЗАГРУЖАЕМ)
        if (res.status === 401 && useAuth) {
            console.warn('[Auth] 401 Unauthorized - clearing cookies');
            Cookie.remove(TOKEN_COOKIE);
            Cookie.remove(USERNAME_COOKIE);
            Cookie.remove(USER_ID_COOKIE);
            Cookie.remove(USER_ROLE_COOKIE);
            updateAuthUI();
            throw new Error('Сессия истекла');
        }

        return { ok: res.ok, status: res.status, data };

    } catch (error) {
        console.error('[API Error]', error);
        return {
            ok: false,
            status: 0,
            data: { message: error.message || 'Ошибка сети' }
        };
    }
}

// ==============================================================
// Validation Helpers
// ==============================================================

function validateSignup(username, email, password) {
    // Username validation (5-50 chars)
    if (!username || username.length < 5 || username.length > 50) {
        return { valid: false, message: "Имя пользователя должно содержать от 5 до 50 символов" };
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        return { valid: false, message: "Некорректный формат email" };
    }
    if (email.length < 5 || email.length > 255) {
        return { valid: false, message: "Email должен содержать от 5 до 255 символов" };
    }

    // Password validation (8+ chars, минимум 1 цифра и 1 буква)
    if (!password || password.length < 8) {
        return { valid: false, message: "Пароль должен быть минимум 8 символов" };
    }
    if (password.length > 255) {
        return { valid: false, message: "Пароль не может превышать 255 символов" };
    }
    if (!/(?=.*[0-9])(?=.*[a-zA-Z])/.test(password)) {
        return { valid: false, message: "Пароль должен содержать минимум одну цифру и одну букву" };
    }

    return { valid: true };
}

function validateSignin(username, password) {
    // Username validation (5-50 chars)
    if (!username || username.length < 5 || username.length > 50) {
        return { valid: false, message: "Имя пользователя должно содержать от 5 до 50 символов" };
    }

    // Password validation (8-255 chars)
    if (!password || password.length < 8 || password.length > 255) {
        return { valid: false, message: "Пароль должен содержать от 8 до 255 символов" };
    }

    return { valid: true };
}

// ==============================================================
// Authentication Logic
// ==============================================================

async function signin() {
    clearMessages();

    const form = document.getElementById("loginForm");
    const username = form.username.value.trim();
    const password = form.password.value.trim();

    // Валидация
    const validation = validateSignin(username, password);
    if (!validation.valid) {
        return showMessage(validation.message, "error");
    }

    showMessage("⏳ Вход в систему...", "info");

    try {
        // API запрос
        const response = await apiRequest(`${API_ROOT}/signin`, { username, password });

        if (!response.ok) {
            const errorMsg = response.data?.message || "Неверное имя пользователя или пароль";
            return showMessage(errorMsg, "error");
        }

        // Извлекаем токен
        const token = response.data?.data;

        if (!token || typeof token !== 'string') {
            console.error('[Auth] Invalid token in response:', response.data);
            return showMessage("Ошибка: токен не получен", "error");
        }

        // Декодируем JWT
        let userData = null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userData = {
                id: payload.id,
                username: payload.sub,
                email: payload.email,
                role: payload.role
            };
            console.log('[Auth] JWT payload:', userData);
        } catch (e) {
            console.error('[Auth] JWT decode error:', e);
        }

        // Сохраняем cookies (конвертируем id в строку явно)
        Cookie.set(TOKEN_COOKIE, token, 7);
        Cookie.set(USERNAME_COOKIE, userData?.username || username, 7);
        if (userData?.id) Cookie.set(USER_ID_COOKIE, String(userData.id), 7); // ✅ String()
        if (userData?.role) Cookie.set(USER_ROLE_COOKIE, userData.role, 7);

        console.log('[Auth] ✓ Cookies saved');
        console.log('[Auth] All cookies:', document.cookie);

        // Очищаем форму
        form.reset();

        // Обновляем UI
        updateAuthUI();

        // Показываем успех
        showMessage("✔ Успешный вход!", "success");

        // Закрываем модалку
        setTimeout(() => {
            const overlay = document.getElementById('authOverlay');
            if (overlay) {
                overlay.style.display = 'none';
            }
            clearMessages();
        }, 800);

    } catch (error) {
        console.error('[Auth] Signin error:', error);
        showMessage("Ошибка при входе: " + error.message, "error");
    }
}
async function signup() {
    clearMessages();

    const form = document.getElementById("registerForm");
    const username = form.username.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value.trim();

    // Валидация
    const validation = validateSignup(username, email, password);
    if (!validation.valid) {
        return showMessage(validation.message, "error");
    }

    showMessage("⏳ Регистрация...", "info");

    // API запрос
    const response = await apiRequest(`${API_ROOT}/signup`, { username, email, password });

    if (!response.ok) {
        let errorMsg = "Ошибка регистрации";

        if (response.data?.message) {
            errorMsg = response.data.message;

            // Обрабатываем специфичные ошибки от бэкенда
            if (errorMsg.includes("Username already in use")) {
                errorMsg = "Это имя пользователя уже занято";
            } else if (errorMsg.includes("Email already in use")) {
                errorMsg = "Этот email уже используется";
            }
        }

        return showMessage(errorMsg, "error");
    }

    // Регистрация успешна
    showMessage("✔ Регистрация завершена! Теперь войдите в систему.", "success");

    form.reset();

    // Переключаем на вкладку логина
    setTimeout(() => {
        const loginTab = document.querySelector('.auth-tab[data-tab="login"]');
        if (loginTab) {
            loginTab.click();
        }
    }, 1200);
}

function logout(silent = false) {
    console.log('[Auth] Logout initiated, silent:', silent);

    // Очищаем все cookies
    Cookie.remove(TOKEN_COOKIE);
    Cookie.remove(USERNAME_COOKIE);
    Cookie.remove(USER_ID_COOKIE);
    Cookie.remove(USER_ROLE_COOKIE);

    if (!silent) {
        showMessage("✔ Вы вышли из системы", "success");
    }

    updateAuthUI();

    // УБИРАЕМ ПЕРЕЗАГРУЗКУ - просто редирект на главную
    if (!silent) {
        setTimeout(() => {
            const currentPath = window.location.pathname;
            if (currentPath !== '/' && currentPath !== '/index.html') {
                window.location.href = '/';
            }
        }, 500);
    }
}

// Проверка валидности токена через /auth/me
async function verifyAuth() {
    const token = Cookie.get(TOKEN_COOKIE);
    if (!token) {
        console.log('[Auth] No token found, skipping verification');
        return false;
    }

    console.log('[Auth] Verifying token...');
    const response = await apiRequest(`${API_ROOT}/me`, null, true);

    if (!response.ok) {
        console.warn('[Auth] Token verification failed, status:', response.status);
        Cookie.remove(TOKEN_COOKIE);
        Cookie.remove(USERNAME_COOKIE);
        Cookie.remove(USER_ID_COOKIE);
        Cookie.remove(USER_ROLE_COOKIE);
        updateAuthUI();
        return false;
    }

    console.log('[Auth] Token verified successfully');

    // Обновляем данные пользователя из ответа
    if (response.data?.data) {
        const user = response.data.data;
        Cookie.set(USERNAME_COOKIE, user.username, 7);
        if (user.id) Cookie.set(USER_ID_COOKIE, user.id, 7);
        if (user.role) Cookie.set(USER_ROLE_COOKIE, user.role, 7);
    }

    return true;
}

// Проверка роли пользователя
function hasRole(role) {
    const userRole = Cookie.get(USER_ROLE_COOKIE);
    return userRole === role;
}

function isAdmin() {
    return hasRole('ROLE_ADMIN');
}

// ==============================================================
// Protected Page Guard
// ==============================================================

function requireAuth() {
    const token = Cookie.get(TOKEN_COOKIE);
    if (!token) {
        console.warn('[Auth] Auth required but not logged in');
        showMessage("⚠ Необходима авторизация", "error");
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
        return false;
    }
    return true;
}

// ==============================================================
// Bootstrap
// ==============================================================

document.addEventListener("DOMContentLoaded", () => {
    console.log('[Auth] DOM loaded, initializing...');
    console.log('[Auth] Current cookies:', document.cookie);

    updateAuthUI();

    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    if (loginForm) {
        loginForm.addEventListener("submit", e => {
            e.preventDefault();
            signin();
        });
    }

    if (registerForm) {
        registerForm.addEventListener("submit", e => {
            e.preventDefault();
            signup();
        });
    }

    // ВАЖНО: НЕ проверяем токен автоматически при загрузке
    // Это может вызвать лишние запросы и проблемы
    // Проверка будет только при попытке доступа к защищенным ресурсам
});

// ==============================================================
// Public API
// ==============================================================

window.PlasmaAuth = {
    // Основные методы
    signin,
    signup,
    logout,
    verifyAuth,

    // Getters
    getToken: () => Cookie.get(TOKEN_COOKIE),
    getUsername: () => Cookie.get(USERNAME_COOKIE),
    getUserId: () => Cookie.get(USER_ID_COOKIE),
    getUserRole: () => Cookie.get(USER_ROLE_COOKIE),

    // Проверки
    isAuthenticated: () => !!Cookie.get(TOKEN_COOKIE),
    isAdmin,
    hasRole,
    requireAuth,

    // Утилиты
    apiRequest,
    showMessage,
    clearMessages
};

// Обратная совместимость (для inline onclick)
window.signin = signin;
window.signup = signup;
window.logout = logout;
window.getToken = () => Cookie.get(TOKEN_COOKIE);

console.log('[Auth] Script loaded, PlasmaAuth API ready');