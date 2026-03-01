// ==============================================================
// PlasmaLab Atoms Management
// ==============================================================

const ATOMS_API = "/atoms";

let allAtoms = [];
let filteredAtoms = [];

// ==============================================================
// Initialization
// ==============================================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Atoms] Page loaded');

    // Проверяем авторизацию для кнопки создания
    updateCreateButton();

    // Загружаем атомы
    await loadAtoms();

    // Настраиваем поиск и фильтры
    setupSearch();
    setupFilters();
    setupCreateForm();
});

// ==============================================================
// Auth Check
// ==============================================================

function updateCreateButton() {
    const createBtn = document.getElementById('createAtomBtn');
    const isAuth = window.PlasmaAuth?.isAuthenticated() || false;

    if (!isAuth && createBtn) {
        createBtn.onclick = () => {
            window.PlasmaAuth?.showMessage('Для создания атома необходимо войти в систему', 'error');
            showAuthModal();
        };
    }
}

// ==============================================================
// Load Atoms
// ==============================================================

async function loadAtoms() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const atomsGrid = document.getElementById('atomsGrid');

    try {
        loadingState.style.display = 'flex';
        emptyState.style.display = 'none';
        atomsGrid.innerHTML = '';

        const response = await fetch(ATOMS_API);

        if (!response.ok) {
            throw new Error('Ошибка загрузки атомов');
        }

        const data = await response.json();
        allAtoms = data.data || [];
        filteredAtoms = [...allAtoms];

        console.log('[Atoms] Loaded:', allAtoms.length);

        renderAtoms();

    } catch (error) {
        console.error('[Atoms] Load error:', error);
        window.PlasmaAuth?.showMessage('Ошибка загрузки атомов: ' + error.message, 'error');
        emptyState.style.display = 'flex';
    } finally {
        loadingState.style.display = 'none';
    }
}

// ==============================================================
// Render Atoms
// ==============================================================

function renderAtoms() {
    const atomsGrid = document.getElementById('atomsGrid');
    const emptyState = document.getElementById('emptyState');

    if (filteredAtoms.length === 0) {
        atomsGrid.innerHTML = '';
        emptyState.style.display = 'flex';
        return;
    }

    emptyState.style.display = 'none';

    atomsGrid.innerHTML = filteredAtoms.map(atom => createAtomCard(atom)).join('');
}

function createAtomCard(atom) {
    const isAuth = window.PlasmaAuth?.isAuthenticated() || false;

    return `
        <div class="atom-card" data-id="${atom.id}">
            <div class="atom-card-header">
                <div class="atom-symbol">
                    <div class="atom-icon">${atom.atomName}</div>
                    <div class="atom-name">
                        <h3>${atom.atomName}</h3>
                        <p>${atom.fullName}</p>
                    </div>
                </div>
                ${isAuth ? `
                <div class="atom-actions">
                    <button onclick="deleteAtom(${atom.id})" title="Удалить" class="delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                ` : ''}
            </div>
            
            <div class="atom-properties">
                <div class="property">
                    <span class="property-label">Масса</span>
                    <span class="property-value">${formatScientific(atom.mass)} кг</span>
                </div>
                <div class="property">
                    <span class="property-label">Решетка</span>
                    <span class="property-value">${atom.a} Å</span>
                </div>
                <div class="property">
                    <span class="property-label">T Дебая</span>
                    <span class="property-value">${atom.debyeTemperature} K</span>
                </div>
                <div class="property">
                    <span class="property-label">Валентность</span>
                    <span class="property-value highlight">${atom.valence}</span>
                </div>
            </div>
            
            <div class="structure-badge ${atom.structure}">
                <i class="fas fa-cube"></i>
                ${getStructureName(atom.structure)}
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

function getStructureName(structure) {
    const names = {
        'SC': 'Simple Cubic',
        'BCC': 'Body-Centered Cubic',
        'FCC': 'Face-Centered Cubic',
        'HCP': 'Hexagonal Close-Packed'
    };
    return names[structure] || structure;
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
    const structureFilter = document.getElementById('structureFilter');
    const sortBy = document.getElementById('sortBy');

    structureFilter.addEventListener('change', applyFilters);
    sortBy.addEventListener('change', applyFilters);
}

function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const structure = document.getElementById('structureFilter').value;
    const sortBy = document.getElementById('sortBy').value;

    // Фильтрация
    filteredAtoms = allAtoms.filter(atom => {
        const matchesSearch =
            atom.atomName.toLowerCase().includes(searchTerm) ||
            atom.fullName.toLowerCase().includes(searchTerm);

        const matchesStructure = !structure || atom.structure === structure;

        return matchesSearch && matchesStructure;
    });

    // Сортировка
    filteredAtoms.sort((a, b) => {
        switch(sortBy) {
            case 'name':
                return a.atomName.localeCompare(b.atomName);
            case 'mass':
                return a.mass - b.mass;
            case 'valence':
                return a.valence - b.valence;
            default:
                return 0;
        }
    });

    renderAtoms();
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('structureFilter').value = '';
    document.getElementById('sortBy').value = 'name';
    applyFilters();
}

// ==============================================================
// Create Atom
// ==============================================================

function showCreateModal() {
    if (!window.PlasmaAuth?.isAuthenticated()) {
        window.PlasmaAuth?.showMessage('Для создания атома необходимо войти в систему', 'error');
        showAuthModal();
        return;
    }

    document.getElementById('createAtomModal').style.display = 'flex';
    document.getElementById('createAtomForm').reset();
    clearFormMessage();
}

function hideCreateModal() {
    document.getElementById('createAtomModal').style.display = 'none';
    clearFormMessage();
}

function setupCreateForm() {
    const form = document.getElementById('createAtomForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await createAtom();
    });

    // Закрытие по клику вне модалки
    document.getElementById('createAtomModal').addEventListener('click', (e) => {
        if (e.target.id === 'createAtomModal') {
            hideCreateModal();
        }
    });

    // Закрытие по ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('createAtomModal');
            if (modal.style.display === 'flex') {
                hideCreateModal();
            }
        }
    });
}

async function createAtom() {
    const form = document.getElementById('createAtomForm');
    const formData = new FormData(form);

    const atomData = {
        atomName: formData.get('atomName'),
        fullName: formData.get('fullName'),
        mass: parseFloat(formData.get('mass')),
        a: parseFloat(formData.get('a')),
        debyeTemperature: parseFloat(formData.get('debyeTemperature')),
        valence: parseInt(formData.get('valence')),
        structure: formData.get('structure')
    };

    console.log('[Atoms] Creating:', atomData);
    showFormMessage('⏳ Создание атома...', 'info');

    try {
        const token = window.PlasmaAuth?.getToken();

        const response = await fetch(ATOMS_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(atomData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Ошибка создания атома');
        }

        showFormMessage('✔ Атом успешно создан!', 'success');

        // Перезагружаем список
        setTimeout(() => {
            hideCreateModal();
            loadAtoms();
        }, 1000);

    } catch (error) {
        console.error('[Atoms] Create error:', error);
        showFormMessage('Ошибка: ' + error.message, 'error');
    }
}

// ==============================================================
// Delete Atom
// ==============================================================

async function deleteAtom(id) {
    if (!window.PlasmaAuth?.isAuthenticated()) {
        window.PlasmaAuth?.showMessage('Для удаления атома необходимо войти в систему', 'error');
        return;
    }

    const atom = allAtoms.find(a => a.id === id);
    if (!atom) return;

    const confirmed = confirm(`Удалить атом "${atom.atomName}" (${atom.fullName})?`);
    if (!confirmed) return;

    try {
        const token = window.PlasmaAuth?.getToken();

        const response = await fetch(`${ATOMS_API}/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.message || 'Ошибка удаления');
        }

        window.PlasmaAuth?.showMessage('Атом успешно удален', 'success');

        // Перезагружаем список
        await loadAtoms();

    } catch (error) {
        console.error('[Atoms] Delete error:', error);
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
window.deleteAtom = deleteAtom;
window.resetFilters = resetFilters;