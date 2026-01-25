// auth-ui.js
async function initializeAuth() {
    const token =
        (typeof getToken === 'function' && getToken()) ||
        localStorage.getItem('authToken');


    const authButtons = document.querySelector('.auth-buttons');
    const userMenu = document.querySelector('.user-menu');
    const usernameEl = document.getElementById('usernameDisplay');

    // Гость
    if (!token) {
        if (authButtons) authButtons.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
        if (usernameEl) usernameEl.textContent = '';
        return;
    }

    try {
        // Проверяем токен с сервером
        const resp = await fetch('/auth/me', {
            headers: {
                Authorization: 'Bearer ' + token
            }
        });

        if (!resp.ok) throw new Error('unauthorized');

        const result = await resp.json();

        const username = result?.data?.username ||
            result?.username ||
            result?.data ||
            localStorage.getItem('lastUsername') ||
            'User';

        if (authButtons) authButtons.style.display = 'none';
        if (userMenu) userMenu.style.display = 'flex';
        if (usernameEl) usernameEl.textContent = username;

    } catch (e) {
        console.warn('Auth invalid:', e);
        // Очищаем невалидный токен
        if (clearToken) clearToken();
        localStorage.removeItem('authToken');
        localStorage.removeItem('lastUsername');

        if (authButtons) authButtons.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
        if (usernameEl) usernameEl.textContent = '';
    }
}

function updateAuthUI() {
    const token = localStorage.getItem('authToken');
    const username = localStorage.getItem('username');

    const guest = document.querySelector('.auth-buttons');
    const user  = document.querySelector('.user-menu');
    const name  = document.getElementById('usernameDisplay');

    if (token && username) {
        guest.style.display = 'none';
        user.style.display = 'flex';
        name.textContent = username;
    } else {
        guest.style.display = 'flex';
        user.style.display = 'none';
        if (name) name.textContent = '';
    }
}


// Экспортируем функции
window.initializeAuth = initializeAuth;
window.updateAuthUI = updateAuthUI;

// Запускаем при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
});