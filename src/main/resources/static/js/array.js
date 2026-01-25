// array.js - Управление атомами для PlasmaLab
const API_BASE = "/atoms";
let currentAtoms = [];

document.addEventListener("DOMContentLoaded", () => {
    initializePage();
});

function initializePage() {
    console.log("🔄 Инициализация страницы атомов...");
    checkAuthAndUpdateUI();
    setupEventListeners();
    loadAtoms(); // Автоматическая загрузка при открытии
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

    const searchInput = document.getElementById("searchSymbol");
    if (searchInput) {
        searchInput.addEventListener("keypress", (e) => {
            if (e.key === 'Enter') {
                handleSearchAtom();
            }
        });
    }
}

async function loadAtoms() {
    const atomTableContainer = document.getElementById("atomTableContainer");
    const loadAtomsBtn = document.getElementById("loadAtoms");
    const atomCount = document.getElementById("atomCount");

    try {
        if (loadAtomsBtn) {
            loadAtomsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Загрузка...';
            loadAtomsBtn.disabled = true;
        }

        const response = await fetch(API_BASE);
        const result = await parseApiResponse(response);

        if (result.ok && result.body && result.body.data) {
            currentAtoms = result.body.data;
            renderAtomTable(currentAtoms);
            if (atomCount) {
                atomCount.textContent = currentAtoms.length;
            }

        } else {
            throw new Error(result.body?.message || 'Ошибка загрузки данных');
        }
    } catch (error) {
        console.error('Ошибка загрузки атомов:', error);
        if (atomTableContainer) {
            atomTableContainer.innerHTML = `
                <div class="alert alert-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    Ошибка загрузки: ${error.message}
                </div>
            `;
        }
        showMessage("❌ Ошибка загрузки атомов", "error");
    } finally {
        if (loadAtomsBtn) {
            loadAtomsBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Обновить список';
            loadAtomsBtn.disabled = false;
        }
    }
}

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
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Создание...';
        submitBtn.disabled = true;

        const atomData = {
            atomName: document.getElementById("atomName").value.trim(),
            fullName: document.getElementById("fullName").value.trim(),
            mass: parseFloat(document.getElementById("mass").value),
            a: parseFloat(document.getElementById("a").value),
            debyeTemperature: parseFloat(document.getElementById("debyeTemperature").value),
            valence: parseInt(document.getElementById("valence").value),
            structure: document.getElementById("structure").value,
            notes: "Создан через веб-интерфейс"
        };

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
            document.getElementById("structure").selectedIndex = 0;
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
            searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Поиск...';
            searchBtn.disabled = true;
        }

        const response = await fetch(`${API_BASE}/symbol/${encodeURIComponent(symbol)}`);
        const result = await parseApiResponse(response);

        if (result.ok && result.body && result.body.data) {
            renderSearchResult(result.body.data, symbol);
            showMessage(`🔍 Найдено ${result.body.data.length} атомов`, 'success');
        } else {
            searchResult.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-search fa-2x"></i>
                    <p>${result.body?.message || 'Атомы не найдены'}</p>
                </div>
            `;
            showMessage(result.body?.message || 'Атомы не найдены', 'info');
        }
    } catch (error) {
        console.error('Ошибка поиска атома:', error);
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

function validateAtomData(atomData) {
    if (!atomData.atomName || atomData.atomName.length > 20) {
        showMessage('Символ атома обязателен и не должен превышать 20 символов', 'error');
        return false;
    }
    if (!atomData.fullName || atomData.fullName.length > 50) {
        showMessage('Полное название обязательно и не должно превышать 50 символов', 'error');
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

function renderAtomTable(atoms) {
    const atomTableContainer = document.getElementById("atomTableContainer");
    if (!atomTableContainer) return;

    if (!atoms || atoms.length === 0) {
        atomTableContainer.innerHTML = `
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
                        <th>Символ</th>
                        <th>Полное название</th>
                        <th>Масса (кг)</th>
                        <th>Парам. a (Å)</th>
                        <th>Темп. Дебая (K)</th>
                        <th>Валентность</th>
                        <th>Структура</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
    `;

    atoms.forEach(atom => {
        html += `
            <tr>
                <td><span class="badge badge-secondary">${atom.id}</span></td>
                <td><strong class="text-primary">${atom.atomName}</strong></td>
                <td>${atom.fullName}</td>
                <td>${formatScientific(atom.mass)}</td>
                <td>${atom.a}</td>
                <td>${atom.debyeTemperature}</td>
                <td><span class="badge badge-info">${atom.valence}</span></td>
                <td><span class="badge badge-primary">${formatStructure(atom.structure)}</span></td>
                <td>
                    <button class="btn btn-danger btn-sm" 
                            onclick="deleteAtom(${atom.id}, '${atom.atomName}')" 
                            title="Удалить атом"
                            ${!getToken() ? 'disabled' : ''}>
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>`;
    });

    html += `</tbody></table></div>`;
    atomTableContainer.innerHTML = html;
}

function renderSearchResult(atoms, searchTerm) {
    const searchResult = document.getElementById("searchResult");
    if (!searchResult) return;

    if (!atoms || atoms.length === 0) {
        searchResult.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-search fa-2x"></i>
                <p>Атомы с символом "${searchTerm}" не найдены</p>
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
                <td><span class="badge badge-secondary">${atom.id}</span></td>
                <td>
                    <strong class="${isExactMatch ? 'text-success' : 'text-primary'}">
                        ${atom.atomName}
                    </strong>
                </td>
                <td>${atom.fullName}</td>
                <td>${formatScientific(atom.mass)}</td>
                <td><span class="badge badge-primary">${formatStructure(atom.structure)}</span></td>
            </tr>`;
    });

    html += `</tbody></table></div>`;
    searchResult.innerHTML = html;
}

function formatStructure(structure) {
    const structureMap = {
        'SC': 'SC',
        'BCC': 'BCC',
        'FCC': 'FCC',
        'HCP': 'HCP'
    };
    return structureMap[structure] || structure;
}

window.deleteAtom = async function(atomId, atomName) {
    if (!getToken()) {
        showMessage('Для удаления атомов необходимо войти в систему', 'error');
        showAuthModal();
        return;
    }

    if (!confirm(`Удалить атом "${atomName}" (ID: ${atomId})?`)) {
        return;
    }

    try {
        const response = await authFetch(`${API_BASE}/${atomId}`, {
            method: "DELETE"
        });

        const result = await parseApiResponse(response);

        if (result.ok) {
            showMessage(`✅ Атом "${atomName}" удален`, 'success');
            loadAtoms();
        } else {
            showMessage(`❌ ${result.body?.message || 'Ошибка при удалении'}`, 'error');
        }
    } catch (error) {
        console.error('Ошибка удаления атома:', error);
        showMessage('❌ Ошибка удаления атома: ' + error.message, 'error');
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
