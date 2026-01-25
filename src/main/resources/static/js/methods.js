// methods.js - Управление методами моделирования для PlasmaLab

document.addEventListener("DOMContentLoaded", () => {
    console.log("🔄 Инициализация страницы методов...");
    initializePage();
});

function initializePage() {
    checkAuthAndUpdateUI();
    setupEventListeners();
    updateAccessMessage();
}

function checkAuthAndUpdateUI() {
    const token = getToken();

    if (token) {
        document.querySelectorAll('.locked').forEach(el => {
            el.innerHTML = '<i class="fas fa-spinner"></i> Загрузка...';
            el.disabled = true;
        });

        const accessMessage = document.getElementById('accessMessage');
        if (accessMessage) accessMessage.style.display = 'none';

        const userMenu = document.querySelector('.user-menu');
        const authButtons = document.querySelector('.auth-buttons');
        if (userMenu) userMenu.style.display = 'flex';
        if (authButtons) authButtons.style.display = 'none';
    } else {
        document.querySelectorAll('.locked').forEach(el => {
            el.innerHTML = '<i class="fas fa-lock"></i> Требуется вход';
            el.disabled = false;
        });

        const accessMessage = document.getElementById('accessMessage');
        if (accessMessage) accessMessage.style.display = 'block';

        const userMenu = document.querySelector('.user-menu');
        const authButtons = document.querySelector('.auth-buttons');
        if (userMenu) userMenu.style.display = 'none';
        if (authButtons) authButtons.style.display = 'flex';
    }
}

function setupEventListeners() {
    // Обработчик для кнопки симуляции
    const simulationBtn = document.getElementById('simulationBtn');
    if (simulationBtn) {
        simulationBtn.addEventListener('click', function(e) {
            if (!getToken()) {
                e.preventDefault();
                showMessage('Для доступа к симуляциям необходимо войти в систему', 'error');
                showAuthModal();
            }
        });
    }

    // Обработчики для заблокированных кнопок
    document.querySelectorAll('.locked').forEach(button => {
        button.addEventListener('click', function(e) {
            if (!getToken()) {
                e.preventDefault();
                showMessage('Для доступа к этому методу необходимо войти в систему', 'error');
                showAuthModal();
            } else {
                e.preventDefault();
                showMessage('Этот метод скоро будет доступен', 'info');
            }
        });
    });

    // Обработчик для кнопки входа в сообщении
    const accessBtn = document.querySelector('#accessMessage .btn');
    if (accessBtn) {
        accessBtn.addEventListener('click', function(e) {
            showAuthModal();
        });
    }
}

function updateAccessMessage() {
    const token = getToken();
    const accessMessage = document.getElementById('accessMessage');

    if (!accessMessage) return;

    if (token) {
        accessMessage.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <h3>Добро пожаловать!</h3>
            <p>
                Вы успешно вошли в систему. Теперь вам доступны все методы моделирования.
                Начните работу, выбрав интересующий метод.
            </p>
            <a href="#methods" class="btn btn-primary">
                <i class="fas fa-play-circle"></i> Начать моделирование
            </a>
        `;
    }
}

// Вспомогательные функции
function getToken() {
    return localStorage.getItem('authToken');
}

function showMessage(message, type = "error") {
    console.log("AUTH MSG:", type, message);

    const msgElement = document.getElementById('login_msg') || document.getElementById('signup_msg');
    if (msgElement) {
        msgElement.textContent = message;
        msgElement.style.color = type === "error" ? "#f87171" : (type === "success" ? "#34d399" : "#60a5fa");

        // Автоматически скрыть сообщение через 5 секунд
        setTimeout(() => {
            msgElement.textContent = '';
        }, 5000);
    } else {
        alert(message);
    }
}

function showAuthModal() {
    document.getElementById('authOverlay').style.display = 'flex';
}

window.showAuthModal = showAuthModal;
window.logout = logout;

console.log("✅ methods.js загружен");