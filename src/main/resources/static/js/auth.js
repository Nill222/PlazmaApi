// ==============================================================
// PlasmaLab Authentication Client v2.2
// ==============================================================

const API_ROOT       = "/auth";
const TOKEN_COOKIE   = "authToken";
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
        document.cookie = `${name}=${encodeURIComponent(String(value))}; expires=${date.toUTCString()}; path=/; SameSite=Lax${secure}`;
    },
    get(name) {
        const m = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return m ? decodeURIComponent(m[2]) : null;
    },
    remove(name) {
        const secure = location.protocol === 'https:' ? '; Secure' : '';
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/; SameSite=Lax${secure}`;
    },
};

// ==============================================================
// UI Helpers
// ==============================================================

function showMessage(message, type = 'error', targetId = null) {
    const colors = { error: '#ff6b6b', success: '#28a745', info: '#00aaff' };
    const el =
        (targetId && document.getElementById(targetId)) ||
        document.getElementById('login_msg') ||
        document.getElementById('signup_msg') ||
        document.getElementById('auth_msg');

    if (el) {
        el.textContent    = message;
        el.style.color    = colors[type] || colors.error;
        el.style.display  = 'block';
        if (type !== 'error') setTimeout(() => { el.style.display = 'none'; }, 5000);
    } else {
        alert(message);
    }
}

function clearMessages() {
    ['login_msg', 'signup_msg', 'auth_msg'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.textContent = ''; el.style.display = 'none'; }
    });
}

function updateAuthUI(authenticated) {
    // authenticated может быть true/false или undefined (тогда смотрим на cookie)
    const loggedIn = authenticated !== undefined ? authenticated : !!Cookie.get(TOKEN_COOKIE);

    const authButtons  = document.querySelector('.auth-buttons');
    const userMenu     = document.querySelector('.user-menu');
    const usernameEl   = document.getElementById('usernameDisplay');

    if (loggedIn) {
        authButtons?.setAttribute('style', 'display:none');
        userMenu?.setAttribute('style', 'display:flex');
        if (usernameEl) usernameEl.textContent = Cookie.get(USERNAME_COOKIE) || '';
        document.body.classList.add('logged-in');
    } else {
        authButtons?.setAttribute('style', 'display:flex');
        userMenu?.setAttribute('style', 'display:none');
        if (usernameEl) usernameEl.textContent = '';
        document.body.classList.remove('logged-in');
    }
}

function clearSession() {
    Cookie.remove(TOKEN_COOKIE);
    Cookie.remove(USERNAME_COOKIE);
    Cookie.remove(USER_ID_COOKIE);
    Cookie.remove(USER_ROLE_COOKIE);
}

// ==============================================================
// API Helper
// ==============================================================

async function apiRequest(url, body = null, useAuth = false) {
    const options = {
        method: body ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json' },
    };
    if (useAuth) {
        const token = Cookie.get(TOKEN_COOKIE);
        if (token) options.headers['Authorization'] = `Bearer ${token}`;
    }
    if (body) options.body = JSON.stringify(body);

    try {
        const res  = await fetch(url, options);
        const ct   = res.headers.get('content-type') || '';
        const data = ct.includes('application/json')
            ? await res.json()
            : await res.text().then(t => { try { return JSON.parse(t); } catch { return { message: t }; } });

        if (res.status === 401 && useAuth) {
            console.warn('[Auth] 401 — clearing session');
            clearSession();
            updateAuthUI(false);
            throw new Error('Сессия истекла');
        }

        return { ok: res.ok, status: res.status, data };
    } catch (err) {
        console.error('[API]', err);
        return { ok: false, status: 0, data: { message: err.message || 'Ошибка сети' } };
    }
}

// ==============================================================
// Token verification (silent — без сообщений пользователю)
// ==============================================================

async function verifyToken() {
    const token = Cookie.get(TOKEN_COOKIE);
    if (!token) return false;

    try {
        // Декодируем exp из JWT без запроса — быстрая локальная проверка
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expMs   = payload.exp * 1000;

        if (Date.now() >= expMs) {
            // Токен уже истёк локально — не тратим запрос
            console.log('[Auth] Token expired locally, clearing session');
            clearSession();
            return false;
        }

        // Если до истечения < 5 минут — проверяем на сервере (можно расширить до refresh)
        const msLeft = expMs - Date.now();
        if (msLeft < 5 * 60 * 1000) {
            console.log('[Auth] Token expires soon, verifying with server...');
            const res = await apiRequest(`${API_ROOT}/me`, null, true);
            if (!res.ok) { clearSession(); return false; }
        }

        return true;

    } catch (e) {
        // Не смогли декодировать — проверяем через сервер
        console.warn('[Auth] JWT decode failed, falling back to /me check');
        const res = await apiRequest(`${API_ROOT}/me`, null, true);
        if (!res.ok) { clearSession(); return false; }
        return true;
    }
}

// Полная серверная проверка (используется явно, например при входе на защищённую страницу)
async function verifyAuth() {
    const token = Cookie.get(TOKEN_COOKIE);
    if (!token) return false;

    const res = await apiRequest(`${API_ROOT}/me`, null, true);
    if (!res.ok) { clearSession(); updateAuthUI(false); return false; }

    if (res.data?.data) {
        const u = res.data.data;
        Cookie.set(USERNAME_COOKIE, u.username, 7);
        if (u.id)   Cookie.set(USER_ID_COOKIE,   String(u.id), 7);
        if (u.role) Cookie.set(USER_ROLE_COOKIE,  u.role, 7);
    }
    return true;
}

// ==============================================================
// Validation
// ==============================================================

function validateSignup(username, email, password) {
    if (!username || username.length < 5 || username.length > 50)
        return { valid: false, message: 'Имя пользователя: от 5 до 50 символов' };
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255)
        return { valid: false, message: 'Некорректный email' };
    if (!password || password.length < 8 || password.length > 255)
        return { valid: false, message: 'Пароль: минимум 8 символов' };
    if (!/(?=.*[0-9])(?=.*[a-zA-Z])/.test(password))
        return { valid: false, message: 'Пароль должен содержать минимум одну цифру и одну букву' };
    return { valid: true };
}

function validateSignin(username, password) {
    if (!username || username.length < 5 || username.length > 50)
        return { valid: false, message: 'Имя пользователя: от 5 до 50 символов' };
    if (!password || password.length < 8 || password.length > 255)
        return { valid: false, message: 'Пароль: от 8 до 255 символов' };
    return { valid: true };
}

// ==============================================================
// Auth actions
// ==============================================================

async function signin() {
    clearMessages();
    const form     = document.getElementById('loginForm');
    const username = form.username.value.trim();
    const password = form.password.value.trim();

    const v = validateSignin(username, password);
    if (!v.valid) return showMessage(v.message, 'error');

    showMessage('⏳ Вход в систему...', 'info');

    const res = await apiRequest(`${API_ROOT}/signin`, { username, password });
    if (!res.ok) return showMessage(res.data?.message || 'Неверное имя или пароль', 'error');

    const token = res.data?.data;
    if (!token || typeof token !== 'string') return showMessage('Ошибка: токен не получен', 'error');

    let userData = null;
    try {
        const p = JSON.parse(atob(token.split('.')[1]));
        userData = { id: p.id, username: p.sub, email: p.email, role: p.role };
    } catch { /* игнорируем */ }

    Cookie.set(TOKEN_COOKIE,    token, 7);
    Cookie.set(USERNAME_COOKIE, userData?.username || username, 7);
    if (userData?.id)   Cookie.set(USER_ID_COOKIE,   String(userData.id), 7);
    if (userData?.role) Cookie.set(USER_ROLE_COOKIE,  userData.role, 7);

    form.reset();
    updateAuthUI(true);
    showMessage('✔ Успешный вход!', 'success');

    setTimeout(() => {
        document.getElementById('authOverlay').style.display = 'none';
        clearMessages();
    }, 800);
}

async function signup() {
    clearMessages();
    const form     = document.getElementById('registerForm');
    const username = form.username.value.trim();
    const email    = form.email.value.trim();
    const password = form.password.value.trim();

    const v = validateSignup(username, email, password);
    if (!v.valid) return showMessage(v.message, 'error');

    showMessage('⏳ Регистрация...', 'info');

    const res = await apiRequest(`${API_ROOT}/signup`, { username, email, password });
    if (!res.ok) {
        let msg = res.data?.message || 'Ошибка регистрации';
        if (msg.includes('Username already'))  msg = 'Это имя пользователя уже занято';
        if (msg.includes('Email already'))     msg = 'Этот email уже используется';
        return showMessage(msg, 'error');
    }

    showMessage('✔ Регистрация завершена! Теперь войдите.', 'success');
    form.reset();
    setTimeout(() => document.querySelector('.auth-tab[data-tab="login"]')?.click(), 1200);
}

function logout(silent = false) {
    clearSession();
    if (!silent) showMessage('✔ Вы вышли из системы', 'success');
    updateAuthUI(false);
    if (!silent) {
        setTimeout(() => {
            const p = window.location.pathname;
            if (p !== '/' && p !== '/index.html') window.location.href = '/';
        }, 500);
    }
}

function requireAuth() {
    if (!Cookie.get(TOKEN_COOKIE)) {
        showMessage('⚠ Необходима авторизация', 'error');
        setTimeout(() => { window.location.href = '/'; }, 1000);
        return false;
    }
    return true;
}

// ==============================================================
// Bootstrap — ключевая правка: тихая проверка токена при загрузке
// ==============================================================

document.addEventListener('DOMContentLoaded', async () => {
    const hasToken = !!Cookie.get(TOKEN_COOKIE);

    if (hasToken) {
        // Сначала рисуем UI "по cookie" — страница не мигает
        updateAuthUI(true);

        // Тихо проверяем токен в фоне
        const valid = await verifyToken();
        if (!valid) {
            // Токен протух — обновляем UI без перезагрузки
            updateAuthUI(false);
            console.log('[Auth] Session expired, switched to logged-out state');
        }
        // Если valid — ничего не делаем, UI уже верный
    } else {
        updateAuthUI(false);
    }

    // Формы
    document.getElementById('loginForm')   ?.addEventListener('submit', e => { e.preventDefault(); signin(); });
    document.getElementById('registerForm')?.addEventListener('submit', e => { e.preventDefault(); signup(); });
});

// ==============================================================
// Public API
// ==============================================================

window.PlasmaAuth = {
    signin, signup, logout, verifyAuth,
    getToken:        () => Cookie.get(TOKEN_COOKIE),
    getUsername:     () => Cookie.get(USERNAME_COOKIE),
    getUserId:       () => Cookie.get(USER_ID_COOKIE),
    getUserRole:     () => Cookie.get(USER_ROLE_COOKIE),
    isAuthenticated: () => !!Cookie.get(TOKEN_COOKIE),
    isAdmin:         () => Cookie.get(USER_ROLE_COOKIE) === 'ROLE_ADMIN',
    hasRole:         role => Cookie.get(USER_ROLE_COOKIE) === role,
    requireAuth, apiRequest, showMessage, clearMessages,
};

// обратная совместимость
window.signin  = signin;
window.signup  = signup;
window.logout  = logout;
window.getToken = () => Cookie.get(TOKEN_COOKIE);

console.log('[Auth] v2.2 loaded');