// ==============================================================
// PlasmaLab Main UI Logic
// ==============================================================

// Функции для модального окна
function showAuthModal() {
    const overlay = document.getElementById('authOverlay');
    if (overlay) {
        overlay.style.display = 'flex';
        console.log('[UI] Auth modal opened');
    }
}

function hideAuthModal() {
    const overlay = document.getElementById('authOverlay');
    if (overlay) {
        overlay.style.display = 'none';
        console.log('[UI] Auth modal closed');
    }
    // Очищаем сообщения при закрытии
    if (window.PlasmaAuth?.clearMessages) {
        window.PlasmaAuth.clearMessages();
    }
}

// Экспортируем в window СРАЗУ (не ждём DOMContentLoaded)
window.showAuthModal = showAuthModal;
window.hideAuthModal = hideAuthModal;

// ==============================================================
// Инициализация UI
// ==============================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('[MainUI] Initializing...');

    // Переключение вкладок в модальном окне
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));

            tab.classList.add('active');
            const targetForm = document.querySelector(`.auth-form[data-form="${tab.dataset.tab}"]`);
            if (targetForm) {
                targetForm.classList.add('active');
            }

            // Очищаем сообщения при переключении вкладок
            if (window.PlasmaAuth?.clearMessages) {
                window.PlasmaAuth.clearMessages();
            }
        });
    });

    // Закрытие модального окна при клике вне его
    const authOverlay = document.getElementById('authOverlay');
    if (authOverlay) {
        authOverlay.addEventListener('click', (e) => {
            if (e.target === authOverlay) {
                hideAuthModal();
            }
        });
    }

    // Закрытие по ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const overlay = document.getElementById('authOverlay');
            if (overlay && overlay.style.display === 'flex') {
                hideAuthModal();
            }
        }
    });

    // Защита ссылок на закрытые страницы
    setupProtectedLinks();

    console.log('[MainUI] Initialization complete');
});

// ==============================================================
// Защита защищенных страниц
// ==============================================================

function setupProtectedLinks() {
    const protectedPages = [
        {
            href: 'methods.html',
            message: 'Для доступа к методам моделирования необходимо войти в систему'
        },
        {
            href: 'charts.html',
            message: 'Для просмотра графиков необходимо войти в систему'
        }
    ];

    protectedPages.forEach(page => {
        const links = document.querySelectorAll(`a[href="${page.href}"]`);

        links.forEach(link => {
            link.addEventListener('click', function(e) {
                const isAuth = window.PlasmaAuth?.isAuthenticated() || false;

                if (!isAuth) {
                    e.preventDefault();

                    if (window.PlasmaAuth?.showMessage) {
                        window.PlasmaAuth.showMessage(page.message, 'error');
                    } else {
                        alert(page.message);
                    }

                    showAuthModal();
                }
            });
        });
    });

    console.log('[MainUI] Protected links setup complete');
}