// ==============================================================
// PlasmaLab Ions Management
// ==============================================================

const IONS_API = "/ions";

let allIons = [];
let filteredIons = [];

// ==============================================================
// Initialization
// ==============================================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Ions] Page loaded');

    // Проверяем авторизацию для кнопки создания
    updateCreateButton();

    // Загружаем ионы
    await loadIons();

    // Настраиваем поиск и фильтры
    setupSearch();
    setupFilters();
    setupCreateForm();
});

// ==============================================================
// Auth Check
// ==============================================================

function updateCreateButton() {
    const createBtn = document.getElementById('createIonBtn');
    const isAuth = window.PlasmaAuth?.isAuthenticated() || false;

    if (!isAuth && createBtn) {
        createBtn.onclick = () => {
            window.PlasmaAuth?.showMessage('Для создания иона необходимо войти в систему', 'error');
            showAuthModal();
        };
    }
}

// ==============================================================
// Load Ions
// ==============================================================

async function loadIons() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const ionsGrid = document.getElementById('ionsGrid');

    try {
        loadingState.style.display = 'flex';
        emptyState.style.display = 'none';
        ionsGrid.innerHTML = '';

        const response = await fetch(IONS_API);

        if (!response.ok) {
            throw new Error('Ошибка загрузки ионов');
        }

        const data = await response.json();
        allIons = data.data || [];
        filteredIons = [...allIons];

        console.log('[Ions] Loaded:', allIons.length);

        updateStats();
        renderIons();

    } catch (error) {
        console.error('[Ions] Load error:', error);
        window.PlasmaAuth?.showMessage('Ошибка загрузки ионов: ' + error.message, 'error');
        emptyState.style.display = 'flex';
    } finally {
        loadingState.style.display = 'none';
    }
}

// ==============================================================
// Statistics
// ==============================================================

function updateStats() {
    const totalEl = document.getElementById('totalIons');
    const positiveEl = document.getElementById('positiveCount');
    const negativeEl = document.getElementById('negativeCount');

    const positiveCount = allIons.filter(ion => ion.charge > 0).length;
    const negativeCount = allIons.filter(ion => ion.charge < 0).length;

    totalEl.textContent = allIons.length;
    positiveEl.textContent = positiveCount;
    negativeEl.textContent = negativeCount;

    // Анимация чисел
    animateValue(totalEl, 0, allIons.length, 500);
    animateValue(positiveEl, 0, positiveCount, 500);
    animateValue(negativeEl, 0, negativeCount, 500);
}

function animateValue(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = Math.round(current);
    }, 16);
}

// ==============================================================
// Render Ions
// ==============================================================

function renderIons() {
    const ionsGrid = document.getElementById('ionsGrid');
    const emptyState = document.getElementById('emptyState');

    if (filteredIons.length === 0) {
        ionsGrid.innerHTML = '';
        emptyState.style.display = 'flex';
        return;
    }

    emptyState.style.display = 'none';

    ionsGrid.innerHTML = filteredIons.map(ion => createIonCard(ion)).join('');
}

function createIonCard(ion) {
    const isAuth = window.PlasmaAuth?.isAuthenticated() || false;
    const chargeClass = ion.charge > 0 ? 'positive' : 'negative';
    const chargeSign = ion.charge > 0 ? '+' : '';

    return `
        <div class="ion-card" data-id="${ion.id}">
            <div class="ion-card-header">
                <div class="ion-symbol">
                    <div class="ion-icon ${chargeClass}">
                        <i class="fas fa-bolt"></i>
                    </div>
                    <div class="ion-name">
                        <h3>${ion.name}</h3>
                        <p>${ion.charge > 0 ? 'Катион' : 'Анион'}</p>
                    </div>
                </div>
                ${isAuth ? `
                <div class="ion-actions">
                    <button onclick="deleteIon(${ion.id})" title="Удалить" class="delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                ` : ''}
            </div>
            
            <div class="ion-properties">
                <div class="property">
                    <span class="property-label">Масса</span>
                    <span class="property-value">${formatScientific(ion.mass)} кг</span>
                </div>
                <div class="property">
                    <span class="property-label">Заряд</span>
                    <div class="charge-badge ${chargeClass}">
                        ${chargeSign}${ion.charge}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ==============================================================
// Helpers
// ==============================================================

function formatScientific(num) {
    if (!num) return 'N/A';
    return num.toExponential(2);
}

// ==============================================================
// Search & Filters
// ==============================================================

function setupSearch() {
    const searchInput = document.getElementById('searchInput');

    searchInput.addEventListener('input', (e) => {
        applyFilters();
    });
}

function setupFilters() {
    const chargeFilter = document.getElementById('chargeFilter');
    const sortBy = document.getElementById('sortBy');

    chargeFilter.addEventListener('change', applyFilters);
    sortBy.addEventListener('change', applyFilters);
}

function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const chargeFilter = document.getElementById('chargeFilter').value;
    const sortBy = document.getElementById('sortBy').value;

    // Фильтрация
    filteredIons = allIons.filter(ion => {
        const matchesSearch = ion.name.toLowerCase().includes(searchTerm);

        let matchesCharge = true;
        if (chargeFilter === 'positive') {
            matchesCharge = ion.charge > 0;
        } else if (chargeFilter === 'negative') {
            matchesCharge = ion.charge < 0;
        } else if (chargeFilter !== '') {
            matchesCharge = ion.charge === parseInt(chargeFilter);
        }

        return matchesSearch && matchesCharge;
    });

    // Сортировка
    filteredIons.sort((a, b) => {
        switch(sortBy) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'mass':
                return a.mass - b.mass;
            case 'charge':
                return a.charge - b.charge;
            default:
                return 0;
        }
    });

    renderIons();
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('chargeFilter').value = '';
    document.getElementById('sortBy').value = 'name';
    applyFilters();
}

// ==============================================================
// Create Ion
// ==============================================================

function showCreateModal() {
    if (!window.PlasmaAuth?.isAuthenticated()) {
        window.PlasmaAuth?.showMessage('Для создания иона необходимо войти в систему', 'error');
        showAuthModal();
        return;
    }

    document.getElementById('createIonModal').style.display = 'flex';
    document.getElementById('createIonForm').reset();
    clearFormMessage();
}

function hideCreateModal() {
    document.getElementById('createIonModal').style.display = 'none';
    clearFormMessage();
}

function setupCreateForm() {
    const form = document.getElementById('createIonForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await createIon();
    });

    // Закрытие по клику вне модалки
    document.getElementById('createIonModal').addEventListener('click', (e) => {
        if (e.target.id === 'createIonModal') {
            hideCreateModal();
        }
    });

    // Закрытие по ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('createIonModal');
            if (modal.style.display === 'flex') {
                hideCreateModal();
            }
        }
    });
}

async function createIon() {
    const form = document.getElementById('createIonForm');
    const formData = new FormData(form);

    const ionData = {
        name: formData.get('name'),
        mass: parseFloat(formData.get('mass')),
        charge: parseInt(formData.get('charge'))
    };

    console.log('[Ions] Creating:', ionData);
    showFormMessage('⏳ Создание иона...', 'info');

    try {
        const token = window.PlasmaAuth?.getToken();

        const response = await fetch(IONS_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(ionData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Ошибка создания иона');
        }

        showFormMessage('✔ Ион успешно создан!', 'success');

        // Перезагружаем список
        setTimeout(() => {
            hideCreateModal();
            loadIons();
        }, 1000);

    } catch (error) {
        console.error('[Ions] Create error:', error);
        showFormMessage('Ошибка: ' + error.message, 'error');
    }
}

// ==============================================================
// Delete Ion
// ==============================================================

async function deleteIon(id) {
    if (!window.PlasmaAuth?.isAuthenticated()) {
        window.PlasmaAuth?.showMessage('Для удаления иона необходимо войти в систему', 'error');
        return;
    }

    const ion = allIons.find(i => i.id === id);
    if (!ion) return;

    const confirmed = confirm(`Удалить ион "${ion.name}" (заряд: ${ion.charge})?`);
    if (!confirmed) return;

    try {
        const token = window.PlasmaAuth?.getToken();

        const response = await fetch(`${IONS_API}/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.message || 'Ошибка удаления');
        }

        window.PlasmaAuth?.showMessage('Ион успешно удален', 'success');

        // Перезагружаем список
        await loadIons();

    } catch (error) {
        console.error('[Ions] Delete error:', error);
        window.PlasmaAuth?.showMessage('Ошибка удаления: ' + error.message, 'error');
    }
}

// ==============================================================
// Form Messages
// ==============================================================

function showFormMessage(message, type = 'error') {
    const msgEl = document.getElementById('create_msg');
    const colors = {
        error: '#ff6b6b',
        success: '#28a745',
        info: '#00aaff'
    };

    msgEl.textContent = message;
    msgEl.style.color = colors[type];
    msgEl.style.display = 'block';
}

function clearFormMessage() {
    const msgEl = document.getElementById('create_msg');
    msgEl.textContent = '';
    msgEl.style.display = 'none';
}

// ==============================================================
// Export for inline use
// ==============================================================

window.showCreateModal = showCreateModal;
window.hideCreateModal = hideCreateModal;
window.deleteIon = deleteIon;
window.resetFilters = resetFilters;