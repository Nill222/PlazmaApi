// chain.js - Управление ионами для PlasmaLab
const API_BASE = "/ions";
let currentIons = [];

document.addEventListener("DOMContentLoaded", () => {
    initializePage();
});

function initializePage() {
    console.log("🔄 Инициализация страницы ионов...");
    checkAuthAndUpdateUI();
    setupEventListeners();
    loadIons(); // Автоматическая загрузка при открытии
}

function checkAuthAndUpdateUI() {
    const token = getToken();

    if (token) {
        document.querySelectorAll('.protected-operation').forEach(el => {
            el.style.display = 'block';
        });
        const userMenu = document.querySelector('.user-menu');
        const authButtons = document.querySelector('.auth-buttons');
        if (userMenu) userMenu.style.display = 'flex';
        if (authButtons) authButtons.style.display = 'none';
    } else {
        document.querySelectorAll('.protected-operation').forEach(el => {
            el.style.display = 'none';
        });
        const userMenu = document.querySelector('.user-menu');
        const authButtons = document.querySelector('.auth-buttons');
        if (userMenu) userMenu.style.display = 'none';
        if (authButtons) authButtons.style.display = 'flex';
    }
}

function setupEventListeners() {
    const loadIonsBtn = document.getElementById("loadIons");
    const createForm = document.getElementById("createIonForm");
    const searchBtn = document.getElementById("searchIon");
    const deleteBtn = document.getElementById("deleteIon");

    if (loadIonsBtn) {
        loadIonsBtn.addEventListener("click", loadIons);
    }

    if (createForm) {
        createForm.addEventListener("submit", handleCreateIon);
    }

    if (searchBtn) {
        searchBtn.addEventListener("click", handleSearchIon);
    }

    if (deleteBtn) {
        deleteBtn.addEventListener("click", handleDeleteIonById);
    }

    const searchInput = document.getElementById("searchIonId");
    if (searchInput) {
        searchInput.addEventListener("keypress", (e) => {
            if (e.key === 'Enter') {
                handleSearchIon();
            }
        });
    }

    const deleteInput = document.getElementById("deleteIonId");
    if (deleteInput) {
        deleteInput.addEventListener("keypress", (e) => {
            if (e.key === 'Enter') {
                handleDeleteIonById();
            }
        });
    }
}

async function loadIons() {
    const ionTableContainer = document.getElementById("ionTableContainer");
    const loadIonsBtn = document.getElementById("loadIons");
    const ionCount = document.getElementById("ionCount");

    try {
        if (loadIonsBtn) {
            loadIonsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Загрузка...';
            loadIonsBtn.disabled = true;
        }

        const response = await fetch(API_BASE);
        const result = await parseApiResponse(response);

        if (result.ok && result.body && result.body.data) {
            currentIons = result.body.data;
            renderIonTable(currentIons);
            if (ionCount) {
                ionCount.textContent = currentIons.length;
            }
            showMessage("✅ Ионы успешно загружены", "success");
        } else {
            throw new Error(result.body?.message || 'Ошибка загрузки данных');
        }
    } catch (error) {
        console.error('Ошибка загрузки ионов:', error);
        if (ionTableContainer) {
            ionTableContainer.innerHTML = `
                <div class="alert alert-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    Ошибка загрузки: ${error.message}
                </div>
            `;
        }
        showMessage("❌ Ошибка загрузки ионов", "error");
    } finally {
        if (loadIonsBtn) {
            loadIonsBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Обновить список';
            loadIonsBtn.disabled = false;
        }
    }
}

async function handleCreateIon(e) {
    e.preventDefault();

    if (!getToken()) {
        showMessage('Для создания ионов необходимо войти в систему', 'error');
        showAuthModal();
        return;
    }

    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    try {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Создание...';
        submitBtn.disabled = true;

        const ionData = {
            name: document.getElementById("ionName").value.trim(),
            mass: parseFloat(document.getElementById("mass").value),
            charge: parseInt(document.getElementById("charge").value)
        };

        if (!validateIonData(ionData)) {
            return;
        }

        const response = await authFetch(API_BASE, {
            method: "POST",
            body: JSON.stringify(ionData)
        });

        const result = await parseApiResponse(response);

        if (result.ok) {
            showMessage("✅ " + (result.body?.message || "Ион успешно создан"), 'success');
            form.reset();
            loadIons();
        } else {
            const errorMsg = result.body?.message || 'Неизвестная ошибка';
            showMessage("❌ " + errorMsg, 'error');
        }
    } catch (error) {
        console.error('Ошибка создания иона:', error);
        showMessage('❌ Ошибка создания иона: ' + error.message, 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

async function handleSearchIon() {
    const searchInput = document.getElementById("searchIonId");
    const searchResult = document.getElementById("searchResult");
    const searchBtn = document.getElementById("searchIon");

    if (!searchInput || !searchResult) return;

    const ionId = searchInput.value.trim();
    if (!ionId) {
        showMessage('Введите ID иона для поиска', 'info');
        return;
    }

    try {
        if (searchBtn) {
            searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Поиск...';
            searchBtn.disabled = true;
        }

        const response = await fetch(`${API_BASE}/${ionId}`);
        const result = await parseApiResponse(response);

        if (result.ok && result.body && result.body.data) {
            renderSearchResult([result.body.data]);
            showMessage(`🔍 Найден ион с ID: ${ionId}`, 'success');
        } else {
            searchResult.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-search fa-2x"></i>
                    <p>${result.body?.message || 'Ион не найден'}</p>
                </div>
            `;
            showMessage(result.body?.message || 'Ион не найден', 'info');
        }
    } catch (error) {
        console.error('Ошибка поиска иона:', error);
        searchResult.innerHTML = `
            <div class="alert alert-error">
                <i class="fas fa-exclamation-triangle"></i>
                Ошибка поиска: ${error.message}
            </div>
        `;
    } finally {
        if (searchBtn) {
            searchBtn.innerHTML = '<i class="fas fa-search"></i> Найти';
            searchBtn.disabled = false;
        }
    }
}

async function handleDeleteIonById() {
    const deleteInput = document.getElementById("deleteIonId");
    const deleteBtn = document.getElementById("deleteIon");

    if (!deleteInput) return;

    const ionId = deleteInput.value.trim();
    if (!ionId) {
        showMessage('Введите ID иона для удаления', 'info');
        return;
    }

    if (!getToken()) {
        showMessage('Для удаления ионов необходимо войти в систему', 'error');
        showAuthModal();
        return;
    }

    if (!confirm(`Удалить ион с ID ${ionId}?`)) {
        return;
    }

    try {
        if (deleteBtn) {
            deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Удаление...';
            deleteBtn.disabled = true;
        }

        const response = await authFetch(`${API_BASE}/${ionId}`, {
            method: "DELETE"
        });

        const result = await parseApiResponse(response);

        if (result.ok) {
            showMessage(`✅ ${result.body?.message || 'Ион успешно удален'}`, 'success');
            deleteInput.value = '';
            loadIons();
        } else {
            showMessage(`❌ ${result.body?.message || 'Ошибка при удалении иона'}`, 'error');
        }
    } catch (error) {
        console.error('Ошибка удаления иона:', error);
        showMessage('❌ Ошибка удаления иона: ' + error.message, 'error');
    } finally {
        if (deleteBtn) {
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Удалить ион';
            deleteBtn.disabled = false;
        }
    }
}

function validateIonData(ionData) {
    if (!ionData.name || ionData.name.length > 50) {
        showMessage('Название иона обязательно и не должно превышать 50 символов', 'error');
        return false;
    }
    if (!ionData.mass || ionData.mass <= 0) {
        showMessage('Масса должна быть положительным числом', 'error');
        return false;
    }
    if (ionData.charge === undefined || ionData.charge === null) {
        showMessage('Заряд обязателен', 'error');
        return false;
    }
    return true;
}

function renderIonTable(ions) {
    const ionTableContainer = document.getElementById("ionTableContainer");
    if (!ionTableContainer) return;

    if (!ions || ions.length === 0) {
        ionTableContainer.innerHTML = `
            <div class="text-center text-muted py-5">
                <i class="fas fa-inbox fa-2x"></i>
                <p>Нет данных для отображения</p>
            </div>
        `;
        return;
    }

    let html = `
        <div class="table-container">
            <table class="table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Название</th>
                        <th>Масса (кг)</th>
                        <th>Заряд (e)</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
    `;

    ions.forEach(ion => {
        const chargeClass = getChargeClass(ion.charge);
        html += `
            <tr>
                <td><span class="badge badge-secondary">${ion.id}</span></td>
                <td><strong class="text-primary">${ion.name}</strong></td>
                <td>${formatScientific(ion.mass)}</td>
                <td><span class="${chargeClass}">${formatCharge(ion.charge)}</span></td>
                <td>
                    <button class="btn btn-danger btn-sm" 
                            onclick="deleteIonFromTable(${ion.id}, '${ion.name}')" 
                            title="Удалить ион"
                            ${!getToken() ? 'disabled' : ''}>
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>`;
    });

    html += `</tbody></table></div>`;
    ionTableContainer.innerHTML = html;
}

function renderSearchResult(ions) {
    const searchResult = document.getElementById("searchResult");
    if (!searchResult) return;

    if (!ions || ions.length === 0) {
        searchResult.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-search fa-2x"></i>
                <p>Ионы не найдены</p>
            </div>
        `;
        return;
    }

    let html = `
        <div class="table-container">
            <table class="table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Название</th>
                        <th>Масса (кг)</th>
                        <th>Заряд (e)</th>
                    </tr>
                </thead>
                <tbody>
    `;

    ions.forEach(ion => {
        const chargeClass = getChargeClass(ion.charge);
        html += `
            <tr>
                <td><span class="badge badge-secondary">${ion.id}</span></td>
                <td><strong class="text-primary">${ion.name}</strong></td>
                <td>${formatScientific(ion.mass)}</td>
                <td><span class="${chargeClass}">${formatCharge(ion.charge)}</span></td>
            </tr>`;
    });

    html += `</tbody></table></div>`;
    searchResult.innerHTML = html;
}

function getChargeClass(charge) {
    if (charge > 0) return 'charge-positive';
    if (charge < 0) return 'charge-negative';
    return 'charge-neutral';
}

function formatCharge(charge) {
    if (charge > 0) return `+${charge}`;
    if (charge < 0) return `${charge}`;
    return '0';
}

window.deleteIonFromTable = async function(ionId, ionName) {
    if (!getToken()) {
        showMessage('Для удаления ионов необходимо войти в систему', 'error');
        showAuthModal();
        return;
    }

    if (!confirm(`Удалить ион "${ionName}" (ID: ${ionId})?`)) {
        return;
    }

    try {
        const response = await authFetch(`${API_BASE}/${ionId}`, {
            method: "DELETE"
        });

        const result = await parseApiResponse(response);

        if (result.ok) {
            showMessage(`✅ Ион "${ionName}" удален`, 'success');
            loadIons();
        } else {
            showMessage(`❌ ${result.body?.message || 'Ошибка при удалении'}`, 'error');
        }
    } catch (error) {
        console.error('Ошибка удаления иона:', error);
        showMessage('❌ Ошибка удаления иона: ' + error.message, 'error');
    }
};

function formatScientific(number) {
    if (!number || isNaN(number)) return '0';
    if (Math.abs(number) < 0.001 || Math.abs(number) > 1000) {
        return Number(number).toExponential(3);
    }
    return Number(number).toPrecision(6);
}

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

async function parseApiResponse(response) {
    const text = await response.text();
    try {
        const json = JSON.parse(text);
        return { ok: response.ok, status: response.status, body: json };
    } catch (e) {
        return { ok: response.ok, status: response.status, body: text };
    }
}

function showAuthModal(tab = 'login') {
    document.getElementById('authOverlay').style.display = 'flex';

    if (tab === 'register') {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));

        const registerTab = document.querySelector('.auth-tab[data-tab="register"]');
        const registerForm = document.querySelector('.auth-form[data-form="register"]');

        if (registerTab && registerForm) {
            registerTab.classList.add('active');
            registerForm.classList.add('active');
        }
    }
}

window.getToken = getToken;
window.clearToken = clearToken;
window.showAuthModal = showAuthModal;

console.log("✅ chain.js загружен");