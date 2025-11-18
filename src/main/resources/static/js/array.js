// array.js - Управление атомами для PlasmaLab
const API_BASE = "/atoms";

// Глобальные переменные
let currentAtoms = [];

document.addEventListener("DOMContentLoaded", () => {
    initializePage();
});

// Инициализация страницы
function initializePage() {
    console.log("🔄 Инициализация страницы атомов...");

    // Проверяем авторизацию
    checkAuthAndUpdateUI();

    // Загружаем атомы при загрузке страницы
    loadAtoms();

    // Назначаем обработчики событий
    setupEventListeners();
}

// Проверка авторизации и обновление UI
function checkAuthAndUpdateUI() {
    const token = getToken();
    console.log("🔐 Токен в localStorage:", token ? "есть" : "нет");

    if (token) {
        // Показываем защищенные операции
        document.querySelectorAll('.protected-operation').forEach(el => {
            el.style.display = 'block';
        });
        // Показываем меню пользователя
        const userMenu = document.querySelector('.user-menu');
        const authButtons = document.querySelector('.auth-buttons');
        if (userMenu) userMenu.style.display = 'flex';
        if (authButtons) authButtons.style.display = 'none';
    } else {
        // Скрываем защищенные операции
        document.querySelectorAll('.protected-operation').forEach(el => {
            el.style.display = 'none';
        });
        // Показываем кнопки авторизации
        const userMenu = document.querySelector('.user-menu');
        const authButtons = document.querySelector('.auth-buttons');
        if (userMenu) userMenu.style.display = 'none';
        if (authButtons) authButtons.style.display = 'flex';
    }
}

// Назначение обработчиков событий
function setupEventListeners() {
    const loadAtomsBtn = document.getElementById("loadAtoms");
    const createForm = document.getElementById("createAtomForm");
    const searchBtn = document.getElementById("searchAtom");

    if (loadAtomsBtn) {
        loadAtomsBtn.addEventListener("click", loadAtoms);
    }

    if (createForm) {
        createForm.addEventListener("submit", handleCreateAtom);
    }

    if (searchBtn) {
        searchBtn.addEventListener("click", handleSearchAtom);
    }

    // Обработчик для поиска по Enter
    const searchInput = document.getElementById("searchSymbol");
    if (searchInput) {
        searchInput.addEventListener("keypress", (e) => {
            if (e.key === 'Enter') {
                handleSearchAtom();
            }
        });
    }
}

// Загрузка всех атомов
async function loadAtoms() {
    const atomTableContainer = document.getElementById("atomTableContainer");
    const loadAtomsBtn = document.getElementById("loadAtoms");
    const atomCount = document.getElementById("atomCount");

    try {
        // Показываем индикатор загрузки
        if (loadAtomsBtn) {
            loadAtomsBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Загрузка...';
            loadAtomsBtn.disabled = true;
        }

        if (atomTableContainer) {
            atomTableContainer.innerHTML = `
                <div class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Загрузка...</span>
                    </div>
                    <p class="mt-2 text-muted">Загрузка данных...</p>
                </div>
            `;
        }

        const response = await fetch(API_BASE);
        const result = await parseApiResponse(response);

        if (result.ok && result.body && result.body.data) {
            currentAtoms = result.body.data;
            renderAtomTable(currentAtoms);
            if (atomCount) {
                atomCount.textContent = currentAtoms.length;
            }
            showMessage(`✅ Загружено ${currentAtoms.length} атомов`, 'success');
        } else {
            throw new Error(result.body?.message || 'Ошибка загрузки данных');
        }
    } catch (error) {
        console.error('Ошибка загрузки атомов:', error);
        if (atomTableContainer) {
            atomTableContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Ошибка загрузки: ${error.message}
                </div>
            `;
        }
        showMessage('❌ Ошибка загрузки атомов', 'error');
    } finally {
        if (loadAtomsBtn) {
            loadAtomsBtn.innerHTML = '<i class="fas fa-sync-alt me-2"></i>Обновить список';
            loadAtomsBtn.disabled = false;
        }
    }
}

// Создание нового атома
async function handleCreateAtom(e) {
    e.preventDefault();

    if (!getToken()) {
        showMessage('Для создания атомов необходимо войти в систему', 'error');
        showAuthModal();
        return;
    }

    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    try {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Создание...';
        submitBtn.disabled = true;

        const atomData = {
            atomName: document.getElementById("atomName").value.trim(),
            fullName: document.getElementById("fullName").value.trim(),
            mass: parseFloat(document.getElementById("mass").value),
            a: parseFloat(document.getElementById("a").value),
            debyeTemperature: parseFloat(document.getElementById("debyeTemperature").value),
            valence: parseInt(document.getElementById("valence").value),
            structure: document.getElementById("structure").value
        };

        // Валидация данных
        if (!validateAtomData(atomData)) {
            return;
        }

        const response = await authFetch(API_BASE, {
            method: "POST",
            body: JSON.stringify(atomData)
        });

        const result = await parseApiResponse(response);

        if (result.ok) {
            showMessage("✅ " + (result.body?.message || "Атом успешно создан"), 'success');
            form.reset();
            // Обновляем таблицу
            loadAtoms();
        } else {
            const errorMsg = result.body?.message || 'Неизвестная ошибка';
            showMessage("❌ " + errorMsg, 'error');
        }
    } catch (error) {
        console.error('Ошибка создания атома:', error);
        showMessage('❌ Ошибка создания атома: ' + error.message, 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Поиск атома
async function handleSearchAtom() {
    const searchInput = document.getElementById("searchSymbol");
    const searchResult = document.getElementById("searchResult");
    const searchBtn = document.getElementById("searchAtom");

    if (!searchInput || !searchResult) return;

    const symbol = searchInput.value.trim();
    if (!symbol) {
        showMessage('Введите символ элемента для поиска', 'info');
        return;
    }

    try {
        if (searchBtn) {
            searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Поиск...';
            searchBtn.disabled = true;
        }

        const response = await fetch(`${API_BASE}/symbol/${encodeURIComponent(symbol)}`);
        const result = await parseApiResponse(response);

        if (result.ok && result.body && result.body.data) {
            renderSearchResult(result.body.data, symbol);
            showMessage(`🔍 Найдено ${result.body.data.length} атомов по запросу "${symbol}"`, 'success');
        } else {
            searchResult.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-search fa-2x mb-2"></i>
                    <p>${result.body?.message || 'Атомы не найдены'}</p>
                </div>
            `;
            showMessage(result.body?.message || 'Атомы не найдены', 'info');
        }
    } catch (error) {
        console.error('Ошибка поиска атома:', error);
        searchResult.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Ошибка поиска: ${error.message}
            </div>
        `;
    } finally {
        if (searchBtn) {
            searchBtn.innerHTML = '<i class="fas fa-search me-2"></i>Найти';
            searchBtn.disabled = false;
        }
    }
}

// Валидация данных атома
function validateAtomData(atomData) {
    if (!atomData.atomName || atomData.atomName.length > 10) {
        showMessage('Символ атома обязателен и не должен превышать 10 символов', 'error');
        return false;
    }
    if (!atomData.fullName || atomData.fullName.length > 100) {
        showMessage('Полное название обязательно и не должно превышать 100 символов', 'error');
        return false;
    }
    if (!atomData.mass || atomData.mass <= 0) {
        showMessage('Масса должна быть положительным числом', 'error');
        return false;
    }
    if (!atomData.a || atomData.a <= 0) {
        showMessage('Параметр решетки должен быть положительным числом', 'error');
        return false;
    }
    if (!atomData.valence || atomData.valence < 0) {
        showMessage('Валентность должна быть неотрицательным числом', 'error');
        return false;
    }
    if (!atomData.structure) {
        showMessage('Выберите кристаллическую структуру', 'error');
        return false;
    }
    return true;
}

// Рендер таблицы атомов
function renderAtomTable(atoms) {
    const atomTableContainer = document.getElementById("atomTableContainer");
    if (!atomTableContainer) return;

    if (!atoms || atoms.length === 0) {
        atomTableContainer.innerHTML = `
            <div class="text-center text-muted py-5">
                <i class="fas fa-inbox fa-3x mb-3"></i>
                <p>Нет данных для отображения</p>
            </div>
        `;
        return;
    }

    let html = `
        <div class="table-responsive">
            <table class="table table-hover align-middle">
                <thead class="table-primary">
                    <tr>
                        <th>ID</th>
                        <th>Символ</th>
                        <th>Полное название</th>
                        <th>Масса (кг)</th>
                        <th>Парам. решетки a (Å)</th>
                        <th>Темп. Дебая (K)</th>
                        <th>Валентность</th>
                        <th>Структура</th>
                        <th width="120" class="text-center">Действия</th>
                    </tr>
                </thead>
                <tbody>
    `;

    atoms.forEach(atom => {
        html += `
            <tr>
                <td><span class="badge bg-secondary">${atom.id}</span></td>
                <td><strong class="text-primary">${atom.atomName}</strong></td>
                <td>${atom.fullName}</td>
                <td>${formatScientific(atom.mass)}</td>
                <td>${atom.a}</td>
                <td>${atom.debyeTemperature}</td>
                <td><span class="badge bg-info">${atom.valence}</span></td>
                <td><span class="badge bg-light text-dark border">${atom.structure}</span></td>
                <td class="text-center">
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-danger btn-action" 
                                onclick="deleteAtom(${atom.id}, '${atom.atomName}')" 
                                title="Удалить атом"
                                ${!getToken() ? 'disabled' : ''}>
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>`;
    });

    html += `</tbody></table></div>`;
    atomTableContainer.innerHTML = html;
}

// Рендер результатов поиска
function renderSearchResult(atoms, searchTerm) {
    const searchResult = document.getElementById("searchResult");
    if (!searchResult) return;

    if (!atoms || atoms.length === 0) {
        searchResult.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-search fa-2x mb-2"></i>
                <p>Атомы с символом "${searchTerm}" не найдены</p>
            </div>
        `;
        return;
    }

    let html = `
        <div class="table-responsive">
            <table class="table table-sm table-hover">
                <thead class="table-info">
                    <tr>
                        <th>ID</th>
                        <th>Символ</th>
                        <th>Полное название</th>
                        <th>Масса (кг)</th>
                        <th>Структура</th>
                    </tr>
                </thead>
                <tbody>
    `;

    atoms.forEach(atom => {
        const isExactMatch = atom.atomName.toLowerCase() === searchTerm.toLowerCase();
        html += `
            <tr>
                <td><span class="badge bg-secondary">${atom.id}</span></td>
                <td>
                    <strong class="${isExactMatch ? 'text-success' : 'text-primary'}">
                        ${atom.atomName}
                    </strong>
                </td>
                <td>${atom.fullName}</td>
                <td>${formatScientific(atom.mass)}</td>
                <td><span class="badge bg-light text-dark border">${atom.structure}</span></td>
            </tr>`;
    });

    html += `</tbody></table></div>`;
    searchResult.innerHTML = html;
}

// Удаление атома
window.deleteAtom = async function(atomId, atomName) {
    if (!getToken()) {
        showMessage('Для удаления атомов необходимо войти в систему', 'error');
        showAuthModal();
        return;
    }

    if (!confirm(`Вы уверены, что хотите удалить атом "${atomName}" (ID: ${atomId})?`)) {
        return;
    }

    try {
        const response = await authFetch(`${API_BASE}/${atomId}`, {
            method: "DELETE"
        });

        const result = await parseApiResponse(response);

        if (result.ok) {
            showMessage(`✅ Атом "${atomName}" успешно удален`, 'success');
            // Обновляем таблицу
            loadAtoms();
        } else {
            showMessage(`❌ ${result.body?.message || 'Ошибка при удалении атома'}`, 'error');
        }
    } catch (error) {
        console.error('Ошибка удаления атома:', error);
        showMessage('❌ Ошибка удаления атома: ' + error.message, 'error');
    }
};

// Вспомогательные функции

// Форматирование научной нотации
function formatScientific(number) {
    if (!number || isNaN(number)) return '0';
    if (Math.abs(number) < 0.001 || Math.abs(number) > 1000) {
        return Number(number).toExponential(3);
    }
    return Number(number).toPrecision(6);
}

// Auth fetch с токеном
async function authFetch(url, options = {}) {
    const token = getToken();
    if (!token) {
        throw new Error('Требуется авторизация');
    }

    const defaultOptions = {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers
        }
    };

    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };

    const response = await fetch(url, mergedOptions);

    if (response.status === 401) {
        clearToken();
        checkAuthAndUpdateUI();
        throw new Error('Сессия истекла. Пожалуйста, войдите снова.');
    }

    return response;
}

// Парсинг ответа API (совместимость с вашим auth.js)
async function parseApiResponse(response) {
    const text = await response.text();
    try {
        const json = JSON.parse(text);
        return { ok: response.ok, status: response.status, body: json };
    } catch (e) {
        return { ok: response.ok, status: response.status, body: text };
    }
}

// Показ модального окна авторизации
function showAuthModal(tab = 'login') {
    const authModal = new bootstrap.Modal(document.getElementById('authModal'));

    if (tab === 'register') {
        const registerTab = document.querySelector('[data-bs-target="#register"]');
        if (registerTab) {
            const tabInstance = new bootstrap.Tab(registerTab);
            tabInstance.show();
        }
    }

    authModal.show();
}

// Реэкспорт функций из auth.js для глобального доступа
window.getToken = getToken;
window.clearToken = clearToken;
window.showAuthModal = showAuthModal;

// Инициализация при загрузке
console.log("✅ array.js загружен и готов к работе");