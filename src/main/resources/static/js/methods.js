// methods.js - Управление методами моделирования для PlasmaLab

// Инициализация страницы методов
document.addEventListener("DOMContentLoaded", function() {
    console.log("🔄 Инициализация страницы методов...");

    // Инициализация авторизации
    initializeAuthMethods();

    // Настройка обработчиков событий
    setupMethodEventListeners();

    // Плавная прокрутка
    setupSmoothScrolling();
});

// Инициализация авторизации
function initializeAuthMethods() {
    // Используем функцию из auth.js если она есть
    if (typeof initializeAuth === 'function') {
        initializeAuth();
    } else {
        // Fallback - ручная проверка
        updateAuthUI();
    }
}

// Обновление UI авторизации
function updateAuthUI() {
    const token = getToken();
    const userMenu = document.querySelector('.user-menu');
    const authButtons = document.querySelector('.auth-buttons');
    const usernameDisplay = document.getElementById('usernameDisplay');

    if (token) {
        // Пользователь авторизован
        if (userMenu) userMenu.style.display = 'flex';
        if (authButtons) authButtons.style.display = 'none';
        document.body.classList.add('logged-in');

        // Обновляем имя пользователя
        if (usernameDisplay) {
            // Пытаемся получить имя пользователя из токена или других источников
            const userData = getUserDataFromToken();
            usernameDisplay.textContent = userData || 'Пользователь';
        }
    } else {
        // Пользователь не авторизован
        if (userMenu) userMenu.style.display = 'none';
        if (authButtons) authButtons.style.display = 'flex';
        document.body.classList.remove('logged-in');
    }
}

// Получение данных пользователя из токена
function getUserDataFromToken() {
    try {
        const token = getToken();
        if (!token) return null;

        // Простая попытка извлечь username из токена (если он там есть)
        // В реальном приложении нужно декодировать JWT или делать запрос к API
        const userData = localStorage.getItem('userData');
        if (userData) {
            const parsed = JSON.parse(userData);
            return parsed.username || null;
        }

        return null;
    } catch (e) {
        console.warn('Ошибка получения данных пользователя:', e);
        return null;
    }
}

// Настройка обработчиков событий
function setupMethodEventListeners() {
    // Обработчики для кнопок методов
    document.querySelectorAll('.btn-method').forEach(button => {
        button.addEventListener('click', function(e) {
            if (!getToken()) {
                e.preventDefault();
                showAuthMessage('Для доступа к методам моделирования необходимо войти в систему', 'error');
                showAuthModal();
            }
        });
    });

    // Обработчики для форм в модальном окне
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleLoginForm(this);
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleRegisterForm(this);
        });
    }
}

// Обработка формы логина
async function handleLoginForm(form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    try {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Вход...';
        submitBtn.disabled = true;

        // Используем функцию из auth.js
        if (typeof signin === 'function') {
            const success = await signin();
            if (success) {
                // Закрываем модальное окно
                const authModal = bootstrap.Modal.getInstance(document.getElementById('authModal'));
                if (authModal) authModal.hide();

                // Обновляем UI
                updateAuthUI();
            }
        } else {
            // Fallback - базовая реализация
            await handleLoginFallback(form);
        }
    } catch (error) {
        console.error('Ошибка входа:', error);
        showAuthMessage('Ошибка входа: ' + error.message, 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Обработка формы регистрации
async function handleRegisterForm(form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    try {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Регистрация...';
        submitBtn.disabled = true;

        // Используем функцию из auth.js
        if (typeof signup === 'function') {
            const success = await signup();
            if (success) {
                // После успешной регистрации переключаем на вкладку входа
                setTimeout(() => {
                    const loginTab = document.querySelector('[data-bs-target="#login"]');
                    if (loginTab) {
                        const tabInstance = new bootstrap.Tab(loginTab);
                        tabInstance.show();
                    }
                }, 1000);
            }
        } else {
            // Fallback - базовая реализация
            await handleRegisterFallback(form);
        }
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        showAuthMessage('Ошибка регистрации: ' + error.message, 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Fallback реализация логина (если signin не доступен)
async function handleLoginFallback(form) {
    const formData = new FormData(form);
    const data = {
        username: formData.get('username'),
        password: formData.get('password')
    };

    const response = await fetch('/auth/signin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    });

    const result = await response.json();

    if (response.ok) {
        saveToken(result.token || result.data);
        showAuthMessage('Успешный вход!', 'success');

        // Закрываем модальное окно
        const authModal = bootstrap.Modal.getInstance(document.getElementById('authModal'));
        if (authModal) authModal.hide();

        // Обновляем UI
        updateAuthUI();
    } else {
        throw new Error(result.message || 'Ошибка авторизации');
    }
}

// Fallback реализация регистрации (если signup не доступен)
async function handleRegisterFallback(form) {
    const formData = new FormData(form);
    const data = {
        username: formData.get('username'),
        email: formData.get('email'),
        password: formData.get('password')
    };

    const response = await fetch('/auth/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    });

    const result = await response.json();

    if (response.ok) {
        showAuthMessage('Регистрация успешна! Теперь вы можете войти.', 'success');

        // Переключаем на вкладку входа
        const loginTab = document.querySelector('[data-bs-target="#login"]');
        if (loginTab) {
            const tabInstance = new bootstrap.Tab(loginTab);
            tabInstance.show();
        }

        form.reset();
    } else {
        throw new Error(result.message || 'Ошибка регистрации');
    }
}

// Настройка плавной прокрутки
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

// Показать сообщение авторизации
function showAuthMessage(message, type = 'error') {
    // Используем функцию из auth.js если она есть
    if (typeof showMessage === 'function') {
        showMessage(message, type);
    } else {
        // Fallback - простой alert
        const alertType = type === 'error' ? 'danger' : (type === 'success' ? 'success' : 'info');
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${alertType} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(alertDiv);

        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 5000);
    }
}

// Показать модальное окно авторизации
function showAuthModal(tab = 'login') {
    const authModalElement = document.getElementById('authModal');
    if (!authModalElement) return;

    const authModal = new bootstrap.Modal(authModalElement);

    if (tab === 'register') {
        const registerTab = document.querySelector('[data-bs-target="#register"]');
        if (registerTab) {
            const tabInstance = new bootstrap.Tab(registerTab);
            tabInstance.show();
        }
    } else {
        const loginTab = document.querySelector('[data-bs-target="#login"]');
        if (loginTab) {
            const tabInstance = new bootstrap.Tab(loginTab);
            tabInstance.show();
        }
    }

    authModal.show();
}

// Получение токена
function getToken() {
    // Используем функцию из auth.js если она есть
    if (typeof getToken === 'function' && getToken !== window.getToken) {
        return getToken();
    }
    return localStorage.getItem('authToken');
}

// Сохранение токена
function saveToken(token) {
    // Используем функцию из auth.js если она есть
    if (typeof saveToken === 'function' && saveToken !== window.saveToken) {
        return saveToken(token);
    }
    localStorage.setItem('authToken', token);
}

// Очистка токена
function clearToken() {
    // Используем функцию из auth.js если она есть
    if (typeof clearToken === 'function' && clearToken !== window.clearToken) {
        return clearToken();
    }
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
}

// Выход из системы
function logout() {
    // Используем функцию из auth.js если она есть
    if (typeof logout === 'function' && logout !== window.logout) {
        return logout();
    }

    console.log("🚪 Выход из системы...");
    clearToken();

    // Показываем сообщение
    showAuthMessage("✔ Вы успешно вышли из системы", "success");

    // Обновляем UI
    updateAuthUI();

    // Обновляем страницу через секунду
    setTimeout(() => {
        location.reload();
    }, 1000);
}

// Экспорт функций в глобальную область видимости
window.showAuthModal = showAuthModal;
window.logout = logout;
window.getToken = getToken;
window.clearToken = clearToken;

console.log("✅ methods.js загружен и готов к работе");