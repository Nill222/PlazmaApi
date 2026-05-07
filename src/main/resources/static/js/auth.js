/**
 * ==============================================================
 * PlasmaLab Authentication Client v3.0
 * Clean, modern authentication system with proper error handling
 * ==============================================================
 */

'use strict';

// ==============================================================
// Configuration
// ==============================================================

const CONFIG = {
    API_ROOT: '/auth',
    COOKIES: {
        TOKEN: 'authToken',
        USERNAME: 'username',
        USER_ID: 'userId',
        USER_ROLE: 'userRole',
    },
    COOKIE_EXPIRY_DAYS: 7,
};

// ==============================================================
// Cookie Manager
// ==============================================================

const CookieManager = {
    /**
     * Set a cookie
     * @param {string} name - Cookie name
     * @param {string} value - Cookie value
     * @param {number} days - Expiration in days
     */
    set(name, value, days = CONFIG.COOKIE_EXPIRY_DAYS) {
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);

        const secure = location.protocol === 'https:' ? '; Secure' : '';
        const cookie = `${name}=${encodeURIComponent(String(value))}; expires=${date.toUTCString()}; path=/; SameSite=Lax${secure}`;

        document.cookie = cookie;
    },

    /**
     * Get a cookie value
     * @param {string} name - Cookie name
     * @returns {string|null} Cookie value or null
     */
    get(name) {
        const regex = new RegExp(`(^| )${name}=([^;]+)`);
        const match = document.cookie.match(regex);
        return match ? decodeURIComponent(match[2]) : null;
    },

    /**
     * Remove a cookie
     * @param {string} name - Cookie name
     */
    remove(name) {
        const secure = location.protocol === 'https:' ? '; Secure' : '';
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/; SameSite=Lax${secure}`;
    },
};

// ==============================================================
// UI Message System
// ==============================================================

const UIMessages = {
    /**
     * Show a message to the user
     * @param {string} message - Message text
     * @param {string} type - Message type: 'error', 'success', 'info'
     * @param {string|null} targetId - Specific element ID to show message in
     */
    show(message, type = 'error', targetId = null) {
        const colors = {
            error: '#ef4444',
            success: '#10b981',
            info: '#3b82f6',
        };

        const element = this._getMessageElement(targetId);

        if (element) {
            element.textContent = message;
            element.style.color = colors[type] || colors.error;
            element.style.display = 'block';

            // Auto-hide success and info messages after 5 seconds
            if (type !== 'error') {
                setTimeout(() => {
                    element.style.display = 'none';
                }, 5000);
            }
        } else {
            // Fallback to alert
            alert(message);
        }
    },

    /**
     * Clear all messages
     */
    clear() {
        const messageIds = ['login_msg', 'signup_msg', 'auth_msg'];

        messageIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = '';
                element.style.display = 'none';
            }
        });
    },

    /**
     * Get the appropriate message element
     * @private
     */
    _getMessageElement(targetId) {
        if (targetId) {
            return document.getElementById(targetId);
        }

        // Try to find the first visible message element
        const messageIds = ['login_msg', 'signup_msg', 'auth_msg'];
        for (const id of messageIds) {
            const element = document.getElementById(id);
            if (element) {
                return element;
            }
        }

        return null;
    },
};

// ==============================================================
// Authentication UI Manager
// ==============================================================

const AuthUI = {
    /**
     * Update UI based on authentication state
     * @param {boolean} isAuthenticated - User authentication status
     */
    update(isAuthenticated) {
        const authButtons = document.querySelector('.auth-buttons');
        const userMenu = document.querySelector('.user-menu');
        const usernameDisplay = document.getElementById('usernameDisplay');

        if (isAuthenticated) {
            // User is logged in
            if (authButtons) authButtons.style.display = 'none';
            if (userMenu) userMenu.style.display = 'flex';

            const username = CookieManager.get(CONFIG.COOKIES.USERNAME);
            if (usernameDisplay && username) {
                usernameDisplay.textContent = username;
            }

            document.body.classList.add('logged-in');
        } else {
            // User is logged out
            if (authButtons) authButtons.style.display = 'flex';
            if (userMenu) userMenu.style.display = 'none';

            if (usernameDisplay) {
                usernameDisplay.textContent = '';
            }

            document.body.classList.remove('logged-in');
        }
    },
};

// ==============================================================
// Session Manager
// ==============================================================

const SessionManager = {
    /**
     * Clear all session data
     */
    clear() {
        Object.values(CONFIG.COOKIES).forEach(cookieName => {
            CookieManager.remove(cookieName);
        });
    },

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
        return !!CookieManager.get(CONFIG.COOKIES.TOKEN);
    },

    /**
     * Get current username
     * @returns {string|null}
     */
    getUsername() {
        return CookieManager.get(CONFIG.COOKIES.USERNAME);
    },

    /**
     * Get current user ID
     * @returns {string|null}
     */
    getUserId() {
        return CookieManager.get(CONFIG.COOKIES.USER_ID);
    },

    /**
     * Get current user role
     * @returns {string|null}
     */
    getUserRole() {
        return CookieManager.get(CONFIG.COOKIES.USER_ROLE);
    },

    /**
     * Get auth token
     * @returns {string|null}
     */
    getToken() {
        return CookieManager.get(CONFIG.COOKIES.TOKEN);
    },
};

// ==============================================================
// API Client
// ==============================================================

const APIClient = {
    /**
     * Make an API request
     * @param {string} url - API endpoint
     * @param {Object|null} body - Request body
     * @param {boolean} useAuth - Include authentication header
     * @returns {Promise<{ok: boolean, status: number, data: any}>}
     */
    async request(url, body = null, useAuth = false) {
        const options = {
            method: body ? 'POST' : 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        };

        // Add authentication header if needed
        if (useAuth) {
            const token = SessionManager.getToken();
            if (token) {
                options.headers['Authorization'] = `Bearer ${token}`;
            }
        }

        // Add request body
        if (body) {
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(url, options);
            const contentType = response.headers.get('content-type') || '';

            let data;
            if (contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                try {
                    data = JSON.parse(text);
                } catch {
                    data = { message: text };
                }
            }

            // Handle 401 Unauthorized
            if (response.status === 401 && useAuth) {
                console.warn('[Auth] 401 Unauthorized - clearing session');
                SessionManager.clear();
                AuthUI.update(false);
            }

            return {
                ok: response.ok,
                status: response.status,
                data,
            };
        } catch (error) {
            console.error('[API Error]', error);
            return {
                ok: false,
                status: 0,
                data: { message: error.message || 'Network error' },
            };
        }
    },
};

// ==============================================================
// Validation
// ==============================================================

const Validator = {
    /**
     * Validate signup form data
     * @param {string} username
     * @param {string} email
     * @param {string} password
     * @returns {{valid: boolean, message?: string}}
     */
    validateSignup(username, email, password) {
        if (!username || username.length < 5 || username.length > 50) {
            return {
                valid: false,
                message: 'Имя пользователя должно содержать от 5 до 50 символов',
            };
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email) || email.length > 255) {
            return {
                valid: false,
                message: 'Некорректный email адрес',
            };
        }

        if (!password || password.length < 8 || password.length > 255) {
            return {
                valid: false,
                message: 'Пароль должен содержать минимум 8 символов',
            };
        }

        const passwordRegex = /(?=.*[0-9])(?=.*[a-zA-Z])/;
        if (!passwordRegex.test(password)) {
            return {
                valid: false,
                message: 'Пароль должен содержать минимум одну цифру и одну букву',
            };
        }

        return { valid: true };
    },

    /**
     * Validate signin form data
     * @param {string} username
     * @param {string} password
     * @returns {{valid: boolean, message?: string}}
     */
    validateSignin(username, password) {
        if (!username || username.length < 5 || username.length > 50) {
            return {
                valid: false,
                message: 'Имя пользователя должно содержать от 5 до 50 символов',
            };
        }

        if (!password || password.length < 8 || password.length > 255) {
            return {
                valid: false,
                message: 'Пароль должен содержать от 8 до 255 символов',
            };
        }

        return { valid: true };
    },
};

// ==============================================================
// Token Manager
// ==============================================================

const TokenManager = {
    /**
     * Verify token validity (client-side check)
     * @returns {Promise<boolean>}
     */
    async verify() {
        const token = SessionManager.getToken();
        if (!token) {
            return false;
        }

        try {
            // Decode JWT payload
            const payload = this._decodeJWT(token);
            if (!payload) {
                return await this._verifyWithServer();
            }

            const expiryMs = payload.exp * 1000;
            const now = Date.now();

            // Token has expired
            if (now >= expiryMs) {
                console.log('[Auth] Token expired locally, clearing session');
                SessionManager.clear();
                return false;
            }

            // Token expires soon (< 5 minutes), verify with server
            const timeLeft = expiryMs - now;
            if (timeLeft < 5 * 60 * 1000) {
                console.log('[Auth] Token expires soon, verifying with server...');
                return await this._verifyWithServer();
            }

            return true;
        } catch (error) {
            console.warn('[Auth] JWT decode failed, falling back to server verification', error);
            return await this._verifyWithServer();
        }
    },

    /**
     * Verify token with server
     * @private
     * @returns {Promise<boolean>}
     */
    async _verifyWithServer() {
        const response = await APIClient.request(`${CONFIG.API_ROOT}/me`, null, true);

        if (!response.ok) {
            SessionManager.clear();
            AuthUI.update(false);
            return false;
        }

        // Update user data from server response
        if (response.data?.data) {
            const userData = response.data.data;
            CookieManager.set(CONFIG.COOKIES.USERNAME, userData.username);
            if (userData.id) {
                CookieManager.set(CONFIG.COOKIES.USER_ID, String(userData.id));
            }
            if (userData.role) {
                CookieManager.set(CONFIG.COOKIES.USER_ROLE, userData.role);
            }
        }

        return true;
    },

    /**
     * Decode JWT payload
     * @private
     * @param {string} token
     * @returns {Object|null}
     */
    _decodeJWT(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                return null;
            }
            const payload = JSON.parse(atob(parts[1]));
            return payload;
        } catch {
            return null;
        }
    },
};

// ==============================================================
// Authentication Actions
// ==============================================================

const Auth = {
    /**
     * Sign in user
     * @returns {Promise<void>}
     */
    async signin() {
        UIMessages.clear();

        const form = document.getElementById('loginForm');
        const username = form.username.value.trim();
        const password = form.password.value.trim();

        // Validate input
        const validation = Validator.validateSignin(username, password);
        if (!validation.valid) {
            UIMessages.show(validation.message, 'error');
            return;
        }

        UIMessages.show('⏳ Вход в систему...', 'info');

        // Make API request
        const response = await APIClient.request(`${CONFIG.API_ROOT}/signin`, {
            username,
            password,
        });

        if (!response.ok) {
            const message = response.data?.message || 'Неверное имя пользователя или пароль';
            UIMessages.show(message, 'error');
            return;
        }

        // Get token from response
        const token = response.data?.data;
        if (!token || typeof token !== 'string') {
            UIMessages.show('Ошибка: токен не получен', 'error');
            return;
        }

        // Extract user data from JWT
        let userData = null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userData = {
                id: payload.id,
                username: payload.sub,
                email: payload.email,
                role: payload.role,
            };
        } catch (error) {
            console.warn('[Auth] Could not decode JWT payload', error);
        }

        // Store authentication data
        CookieManager.set(CONFIG.COOKIES.TOKEN, token);
        CookieManager.set(CONFIG.COOKIES.USERNAME, userData?.username || username);
        if (userData?.id) {
            CookieManager.set(CONFIG.COOKIES.USER_ID, String(userData.id));
        }
        if (userData?.role) {
            CookieManager.set(CONFIG.COOKIES.USER_ROLE, userData.role);
        }

        // Update UI
        form.reset();
        AuthUI.update(true);
        UIMessages.show('✔ Успешный вход!', 'success');

        // Close modal after delay
        setTimeout(() => {
            const authOverlay = document.getElementById('authOverlay');
            if (authOverlay) {
                authOverlay.style.display = 'none';
            }
            UIMessages.clear();
        }, 800);
    },

    /**
     * Sign up user
     * @returns {Promise<void>}
     */
    async signup() {
        UIMessages.clear();

        const form = document.getElementById('registerForm');
        const username = form.username.value.trim();
        const email = form.email.value.trim();
        const password = form.password.value.trim();

        // Validate input
        const validation = Validator.validateSignup(username, email, password);
        if (!validation.valid) {
            UIMessages.show(validation.message, 'error');
            return;
        }

        UIMessages.show('⏳ Регистрация...', 'info');

        // Make API request
        const response = await APIClient.request(`${CONFIG.API_ROOT}/signup`, {
            username,
            email,
            password,
        });

        if (!response.ok) {
            let message = response.data?.message || 'Ошибка регистрации';

            // Localize common errors
            if (message.includes('Username already')) {
                message = 'Это имя пользователя уже занято';
            } else if (message.includes('Email already')) {
                message = 'Этот email уже используется';
            }

            UIMessages.show(message, 'error');
            return;
        }

        UIMessages.show('✔ Регистрация завершена! Теперь войдите.', 'success');
        form.reset();

        // Switch to login tab
        setTimeout(() => {
            const loginTab = document.querySelector('.auth-tab[data-tab="login"]');
            if (loginTab) {
                loginTab.click();
            }
        }, 1200);
    },

    /**
     * Log out user
     * @param {boolean} silent - Don't show messages or redirect
     */
    logout(silent = false) {
        SessionManager.clear();
        AuthUI.update(false);

        if (!silent) {
            UIMessages.show('✔ Вы вышли из системы', 'success');

            setTimeout(() => {
                const currentPath = window.location.pathname;
                if (currentPath !== '/' && currentPath !== '/index.html') {
                    window.location.href = '/';
                }
            }, 500);
        }
    },

    /**
     * Require authentication (redirect if not authenticated)
     * @returns {boolean}
     */
    requireAuth() {
        if (!SessionManager.isAuthenticated()) {
            UIMessages.show('⚠ Необходима авторизация', 'error');
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
            return false;
        }
        return true;
    },
};

// ==============================================================
// Bootstrap & Initialization
// ==============================================================

document.addEventListener('DOMContentLoaded', async () => {
    const hasToken = SessionManager.isAuthenticated();

    if (hasToken) {
        // Show UI as logged in immediately (prevents flash)
        AuthUI.update(true);

        // Verify token in background
        const isValid = await TokenManager.verify();
        if (!isValid) {
            // Token is invalid, update UI
            AuthUI.update(false);
            console.log('[Auth] Session expired, switched to logged-out state');
        }
    } else {
        AuthUI.update(false);
    }

    // Setup form handlers
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            Auth.signin();
        });
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            Auth.signup();
        });
    }

    console.log('[Auth] v3.0 initialized');
});

// ==============================================================
// Public API
// ==============================================================

window.PlasmaAuth = {
    // Actions
    signin: () => Auth.signin(),
    signup: () => Auth.signup(),
    logout: (silent = false) => Auth.logout(silent),
    requireAuth: () => Auth.requireAuth(),
    verifyAuth: () => TokenManager.verify(),

    // Session info
    getToken: () => SessionManager.getToken(),
    getUsername: () => SessionManager.getUsername(),
    getUserId: () => SessionManager.getUserId(),
    getUserRole: () => SessionManager.getUserRole(),
    isAuthenticated: () => SessionManager.isAuthenticated(),

    // Role checking
    isAdmin: () => SessionManager.getUserRole() === 'ROLE_ADMIN',
    hasRole: (role) => SessionManager.getUserRole() === role,

    // Utilities
    apiRequest: (url, body, useAuth) => APIClient.request(url, body, useAuth),
    showMessage: (msg, type, target) => UIMessages.show(msg, type, target),
    clearMessages: () => UIMessages.clear(),
};

// Backward compatibility
window.signin = () => Auth.signin();
window.signup = () => Auth.signup();
window.logout = (silent) => Auth.logout(silent);
window.getToken = () => SessionManager.getToken();

console.log('[PlasmaAuth] v3.0 loaded');
