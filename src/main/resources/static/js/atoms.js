/**
 * ==============================================================
 * PlasmaLab Atoms Page Logic v3.0
 * Professional atoms database management
 * ==============================================================
 */

'use strict';

// ==============================================================
// Configuration
// ==============================================================

const ATOMS_CONFIG = {
    API_ENDPOINT: '/atoms',
    DEBOUNCE_DELAY: 300,
};

// ==============================================================
// State Management
// ==============================================================

const AtomsState = {
    atoms: [],
    filteredAtoms: [],
    isLoading: false,
    searchQuery: '',
};

// ==============================================================
// API Client for Atoms
// ==============================================================

const AtomsAPI = {
    /**
     * Get all atoms
     * @returns {Promise<Array>}
     */
    async getAll() {
        const response = await window.PlasmaAuth.apiRequest(
            ATOMS_CONFIG.API_ENDPOINT,
            null,
            true
        );

        if (!response.ok) {
            throw new Error(response.data?.message || 'Failed to fetch atoms');
        }

        return response.data?.data || [];
    },

    /**
     * Get atom by ID
     * @param {number} id - Atom ID
     * @returns {Promise<Object>}
     */
    async getById(id) {
        const response = await window.PlasmaAuth.apiRequest(
            `${ATOMS_CONFIG.API_ENDPOINT}/${id}`,
            null,
            true
        );

        if (!response.ok) {
            throw new Error(response.data?.message || 'Failed to fetch atom');
        }

        return response.data?.data;
    },

    /**
     * Create new atom
     * @param {Object} atomData - Atom data
     * @returns {Promise<Object>}
     */
    async create(atomData) {
        const response = await window.PlasmaAuth.apiRequest(
            ATOMS_CONFIG.API_ENDPOINT,
            atomData,
            true
        );

        if (!response.ok) {
            throw new Error(response.data?.message || 'Failed to create atom');
        }

        return response.data?.data;
    },

    /**
     * Delete atom
     * @param {number} id - Atom ID
     * @returns {Promise<boolean>}
     */
    async delete(id) {
        const response = await window.PlasmaAuth.apiRequest(
            `${ATOMS_CONFIG.API_ENDPOINT}/${id}`,
            { _method: 'DELETE' },
            true
        );

        return response.ok;
    },

    /**
     * Search atoms by symbol
     * @param {string} symbol - Search query
     * @returns {Promise<Array>}
     */
    async searchBySymbol(symbol) {
        const response = await window.PlasmaAuth.apiRequest(
            `${ATOMS_CONFIG.API_ENDPOINT}/symbol/${encodeURIComponent(symbol)}`,
            null,
            true
        );

        if (!response.ok) {
            if (response.status === 404) {
                return [];
            }
            throw new Error(response.data?.message || 'Search failed');
        }

        return response.data?.data || [];
    },
};

// ==============================================================
// UI Renderer
// ==============================================================

const AtomsUI = {
    /**
     * Render atoms grid
     * @param {Array} atoms - Array of atoms
     */
    renderAtoms(atoms) {
        const grid = document.getElementById('atomsGrid');
        if (!grid) return;

        if (atoms.length === 0) {
            grid.style.display = 'none';
            return;
        }

        grid.innerHTML = '';
        grid.style.display = 'grid';

        atoms.forEach((atom, index) => {
            const card = this._createAtomCard(atom, index);
            grid.appendChild(card);
        });
    },

    /**
     * Create atom card element
     * @private
     * @param {Object} atom - Atom data
     * @param {number} index - Card index for animation delay
     * @returns {HTMLElement}
     */
    _createAtomCard(atom, index) {
        const card = document.createElement('div');
        card.className = 'atom-card fade-in';
        card.style.animationDelay = `${index * 0.05}s`;
        card.dataset.atomId = atom.id;

        // Получаем данные из DTO
        const atomName = atom.atomName || 'Unknown';
        const fullName = atom.fullName || atomName;
        const mass = atom.mass || 0;
        const a = atom.a || 0;
        const debyeTemp = atom.debyeTemperature || 0;
        const valence = atom.valence;
        const structure = atom.structure || '';

        card.innerHTML = `
            <div class="atom-card-header">
                <div class="atom-symbol">${this._escapeHtml(atomName)}</div>
                <div class="atom-actions">
                    <button class="atom-btn delete" onclick="handleDeleteAtom(${atom.id})" 
                            aria-label="Удалить атом" title="Удалить">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="atom-card-body">
                <h3 title="${this._escapeHtml(fullName)}">${this._escapeHtml(fullName)}</h3>
                <div class="atom-properties">
                    <div class="atom-property">
                        <div class="property-label">
                            <i class="fas fa-weight-hanging"></i>
                            Масса
                        </div>
                        <div class="property-value">
                            ${this._formatMass(mass)}
                            <span class="property-unit">кг</span>
                        </div>
                    </div>
                    <div class="atom-property">
                        <div class="property-label">
                            <i class="fas fa-cube"></i>
                            Параметр решётки
                        </div>
                        <div class="property-value">
                            ${this._formatNumber(a)}
                            <span class="property-unit">Å</span>
                        </div>
                    </div>
                    <div class="atom-property">
                        <div class="property-label">
                            <i class="fas fa-thermometer-half"></i>
                            T Дебая
                        </div>
                        <div class="property-value">
                            ${this._formatNumber(debyeTemp)}
                            <span class="property-unit">К</span>
                        </div>
                    </div>
                    <div class="atom-property">
                        <div class="property-label">
                            <i class="fas fa-link"></i>
                            Валентность
                        </div>
                        <div class="property-value">
                            ${valence !== null && valence !== undefined ? valence : '—'}
                        </div>
                    </div>
                    ${structure ? `
                    <div class="atom-property">
                        <div class="property-label">
                            <i class="fas fa-shapes"></i>
                            Структура
                        </div>
                        <div class="property-value">
                            ${this._formatStructure(structure)}
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;

        return card;
    },

    /**
     * Update statistics
     * @param {Array} atoms - Array of atoms
     */
    updateStats(atoms) {
        const totalElement = document.getElementById('totalAtoms');
        const avgMassElement = document.getElementById('avgMass');
        const avgEnergyElement = document.getElementById('avgEnergy');

        if (!totalElement || !avgMassElement || !avgEnergyElement) return;

        const total = atoms.length;

        // Считаем среднюю массу
        const avgMass = total > 0
            ? atoms.reduce((sum, atom) => sum + (atom.mass || 0), 0) / total
            : 0;

        // Считаем средний параметр решётки
        const avgA = total > 0
            ? atoms.reduce((sum, atom) => sum + (atom.a || 0), 0) / total
            : 0;

        this._animateNumber(totalElement, total, 0);

        // Для массы используем научный формат
        if (avgMass > 0 && avgMass < 0.001) {
            avgMassElement.textContent = avgMass.toExponential(2);
        } else {
            this._animateNumber(avgMassElement, avgMass, 3);
        }

        // Для параметра решётки обычный формат
        this._animateNumber(avgEnergyElement, avgA, 3);
    },

    /**
     * Animate number counter
     * @private
     */
    _animateNumber(element, target, decimals = 0) {
        const duration = 1000;
        const start = 0;
        const increment = (target - start) / (duration / 16);
        let current = start;

        const animate = () => {
            current += increment;
            if ((increment > 0 && current < target) || (increment < 0 && current > target)) {
                element.textContent = current.toFixed(decimals);
                requestAnimationFrame(animate);
            } else {
                element.textContent = target.toFixed(decimals);
            }
        };

        animate();
    },

    /**
     * Show loading state
     */
    showLoading() {
        document.getElementById('loadingState').style.display = 'flex';
        document.getElementById('emptyState').style.display = 'none';
        document.getElementById('noResultsState').style.display = 'none';
        document.getElementById('atomsGrid').style.display = 'none';
    },

    /**
     * Show empty state
     */
    showEmpty() {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('emptyState').style.display = 'flex';
        document.getElementById('noResultsState').style.display = 'none';
        document.getElementById('atomsGrid').style.display = 'none';
    },

    /**
     * Show no results state
     * @param {string} query - Search query
     */
    showNoResults(query) {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('emptyState').style.display = 'none';
        document.getElementById('noResultsState').style.display = 'flex';
        document.getElementById('atomsGrid').style.display = 'none';

        const textElement = document.getElementById('noResultsText');
        if (textElement) {
            textElement.textContent = `Нет результатов для "${query}"`;
        }
    },

    /**
     * Hide all states
     */
    hideAllStates() {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('emptyState').style.display = 'none';
        document.getElementById('noResultsState').style.display = 'none';
    },

    /**
     * Format number for display
     * @private
     */
    _formatNumber(num) {
        if (num === null || num === undefined) return '—';
        return parseFloat(num).toFixed(3);
    },

    /**
     * Format mass (может быть очень малым числом)
     * @private
     */
    _formatMass(num) {
        if (num === null || num === undefined) return '—';

        // Если число очень маленькое, используем научный формат
        if (num > 0 && num < 0.00001) {
            return parseFloat(num).toExponential(2);
        }

        return parseFloat(num).toFixed(6);
    },

    /**
     * Format structure type
     * @private
     */
    _formatStructure(structure) {
        const structureNames = {
            'FCC': 'ГЦК',
            'BCC': 'ОЦК',
            'HCP': 'ГПУ',
            'DIAMOND': 'Алмазная'
        };
        return structureNames[structure] || structure;
    },

    /**
     * Escape HTML to prevent XSS
     * @private
     */
    _escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    },
};

// ==============================================================
// Modal Manager
// ==============================================================

const AtomModalManager = {
    /**
     * Show create atom modal
     */
    showCreate() {
        const modal = document.getElementById('createAtomModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';

            // Focus first input
            const firstInput = modal.querySelector('input');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    },

    /**
     * Hide create atom modal
     */
    hideCreate() {
        const modal = document.getElementById('createAtomModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';

            // Clear form and messages
            const form = document.getElementById('createAtomForm');
            if (form) {
                form.reset();
            }

            const msgElement = document.getElementById('createAtomMsg');
            if (msgElement) {
                msgElement.style.display = 'none';
                msgElement.textContent = '';
            }
        }
    },

    /**
     * Show message in create modal
     * @param {string} message - Message text
     * @param {string} type - Message type
     */
    showMessage(message, type = 'error') {
        const msgElement = document.getElementById('createAtomMsg');
        if (msgElement) {
            const colors = {
                error: '#ef4444',
                success: '#10b981',
                info: '#3b82f6',
            };

            msgElement.textContent = message;
            msgElement.style.color = colors[type] || colors.error;
            msgElement.style.display = 'block';
        }
    },
};

// ==============================================================
// Search Manager
// ==============================================================

const SearchManager = {
    debounceTimer: null,

    /**
     * Initialize search
     */
    init() {
        const searchInput = document.getElementById('searchInput');
        const searchClear = document.getElementById('searchClear');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        if (searchClear) {
            searchClear.addEventListener('click', () => {
                if (searchInput) {
                    searchInput.value = '';
                    this.handleSearch('');
                }
            });
        }
    },

    /**
     * Handle search with debouncing
     * @param {string} query - Search query
     */
    handleSearch(query) {
        clearTimeout(this.debounceTimer);

        const searchClear = document.getElementById('searchClear');
        if (searchClear) {
            searchClear.style.display = query ? 'flex' : 'none';
        }

        this.debounceTimer = setTimeout(() => {
            this.performSearch(query);
        }, ATOMS_CONFIG.DEBOUNCE_DELAY);
    },

    /**
     * Perform actual search
     * @param {string} query - Search query
     */
    performSearch(query) {
        AtomsState.searchQuery = query.trim().toLowerCase();

        if (!AtomsState.searchQuery) {
            // Show all atoms
            AtomsState.filteredAtoms = AtomsState.atoms;
        } else {
            // Filter atoms locally
            AtomsState.filteredAtoms = AtomsState.atoms.filter(atom => {
                const atomName = (atom.atomName || '').toLowerCase();
                const fullName = (atom.fullName || '').toLowerCase();

                return atomName.includes(AtomsState.searchQuery) ||
                    fullName.includes(AtomsState.searchQuery);
            });
        }

        this.updateUI();
    },

    /**
     * Update UI after search
     */
    updateUI() {
        if (AtomsState.filteredAtoms.length === 0) {
            if (AtomsState.searchQuery) {
                AtomsUI.showNoResults(AtomsState.searchQuery);
            } else {
                AtomsUI.showEmpty();
            }
        } else {
            AtomsUI.hideAllStates();
            AtomsUI.renderAtoms(AtomsState.filteredAtoms);
        }

        AtomsUI.updateStats(AtomsState.filteredAtoms);
    },
};

// ==============================================================
// Form Handler
// ==============================================================

const FormHandler = {
    /**
     * Initialize form handlers
     */
    init() {
        const createForm = document.getElementById('createAtomForm');
        if (createForm) {
            createForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCreate(createForm);
            });
        }
    },

    /**
     * Handle create atom form submission
     * @param {HTMLFormElement} form - Form element
     */
    async handleCreate(form) {
        const formData = new FormData(form);

        // Собираем данные согласно CreateAtomListDto
        const atomData = {
            atomName: formData.get('atomName')?.trim() || '',
            fullName: formData.get('fullName')?.trim() || '',
            mass: parseFloat(formData.get('mass')) || 0,
            a: parseFloat(formData.get('a')) || 0,
            debyeTemperature: parseFloat(formData.get('debyeTemperature')) || 0,
            valence: parseInt(formData.get('valence')) || 0,
            structure: formData.get('structure') || '',
        };

        // Validate
        const validation = this._validateAtomData(atomData);
        if (!validation.valid) {
            AtomModalManager.showMessage(validation.message, 'error');
            return;
        }

        try {
            AtomModalManager.showMessage('⏳ Создание атома...', 'info');

            const newAtom = await AtomsAPI.create(atomData);

            AtomModalManager.showMessage('✔ Атом создан успешно!', 'success');

            // Refresh atoms list
            setTimeout(() => {
                AtomModalManager.hideCreate();
                loadAtoms();
            }, 800);

        } catch (error) {
            console.error('[Atoms] Create error:', error);
            AtomModalManager.showMessage(error.message || 'Ошибка создания атома', 'error');
        }
    },

    /**
     * Validate atom data (согласно CreateAtomListDto)
     * @private
     */
    _validateAtomData(data) {
        // atomName: обязательно, 1-5 символов, ^[A-Z][a-z]?$
        if (!data.atomName || data.atomName.length < 1 || data.atomName.length > 5) {
            return { valid: false, message: 'Символ элемента: от 1 до 5 символов' };
        }
        if (!/^[A-Z][a-z]?$/.test(data.atomName)) {
            return { valid: false, message: 'Символ должен начинаться с заглавной буквы (не более 2 букв)' };
        }

        // fullName: обязательно, 2-50 символов
        if (!data.fullName || data.fullName.length < 2 || data.fullName.length > 50) {
            return { valid: false, message: 'Полное название: от 2 до 50 символов' };
        }

        // mass: обязательно, положительное, 1e-27 до 1e-24
        if (!data.mass || isNaN(data.mass) || data.mass <= 0) {
            return { valid: false, message: 'Масса должна быть положительным числом' };
        }
        if (data.mass < 1e-27 || data.mass > 1e-24) {
            return { valid: false, message: 'Масса должна быть в диапазоне 1e-27 до 1e-24 кг' };
        }

        // a: обязательно, положительное
        if (!data.a || isNaN(data.a) || data.a <= 0) {
            return { valid: false, message: 'Параметр решётки должен быть положительным' };
        }

        // debyeTemperature: обязательно, положительное, <= 1000
        if (!data.debyeTemperature || isNaN(data.debyeTemperature) || data.debyeTemperature <= 0) {
            return { valid: false, message: 'Температура Дебая должна быть положительной' };
        }
        if (data.debyeTemperature > 1000) {
            return { valid: false, message: 'Температура Дебая не может быть больше 1000 К' };
        }

        // valence: обязательно, 0-8
        if (data.valence === undefined || data.valence === null || !Number.isInteger(data.valence)) {
            return { valid: false, message: 'Валентность обязательна и должна быть целым числом' };
        }
        if (data.valence < 0 || data.valence > 8) {
            return { valid: false, message: 'Валентность должна быть от 0 до 8' };
        }

        // structure: обязательно
        if (!data.structure) {
            return { valid: false, message: 'Тип структуры обязателен' };
        }
        const validStructures = ['FCC', 'BCC', 'HCP', 'DIAMOND'];
        if (!validStructures.includes(data.structure)) {
            return { valid: false, message: 'Неверный тип структуры' };
        }

        return { valid: true };
    },
};

// ==============================================================
// Event Handlers
// ==============================================================

/**
 * Show create modal
 */
window.showCreateModal = () => {
    AtomModalManager.showCreate();
};

/**
 * Hide create modal
 */
window.hideCreateModal = () => {
    AtomModalManager.hideCreate();
};

/**
 * Handle delete atom
 * @param {number} id - Atom ID
 */
window.handleDeleteAtom = async (id) => {
    if (!confirm('Вы уверены, что хотите удалить этот атом?')) {
        return;
    }

    try {
        const success = await AtomsAPI.delete(id);

        if (success) {
            window.PlasmaAnimations?.ToastNotifications.show(
                'Атом удален успешно',
                'success'
            );

            // Remove from UI with animation
            const card = document.querySelector(`[data-atom-id="${id}"]`);
            if (card) {
                card.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => {
                    loadAtoms();
                }, 300);
            } else {
                loadAtoms();
            }
        } else {
            throw new Error('Не удалось удалить атом');
        }
    } catch (error) {
        console.error('[Atoms] Delete error:', error);
        window.PlasmaAnimations?.ToastNotifications.show(
            error.message || 'Ошибка удаления атома',
            'error'
        );
    }
};

// ==============================================================
// Main Functions
// ==============================================================

/**
 * Load all atoms
 */
async function loadAtoms() {
    AtomsState.isLoading = true;
    AtomsUI.showLoading();

    try {
        const atoms = await AtomsAPI.getAll();

        AtomsState.atoms = atoms;
        AtomsState.filteredAtoms = atoms;

        if (atoms.length === 0) {
            AtomsUI.showEmpty();
        } else {
            AtomsUI.hideAllStates();
            AtomsUI.renderAtoms(atoms);
            AtomsUI.updateStats(atoms);
        }

    } catch (error) {
        console.error('[Atoms] Load error:', error);
        AtomsUI.showEmpty();

        window.PlasmaAnimations?.ToastNotifications.show(
            'Ошибка загрузки атомов: ' + error.message,
            'error',
            5000
        );
    } finally {
        AtomsState.isLoading = false;
    }
}

// ==============================================================
// Initialization
// ==============================================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Atoms] Initializing page...');

    // Check authentication
    if (!window.PlasmaAuth || !window.PlasmaAuth.requireAuth()) {
        return;
    }

    // Verify token is still valid
    const isValid = await window.PlasmaAuth.verifyAuth();
    if (!isValid) {
        return;
    }

    // Initialize components
    SearchManager.init();
    FormHandler.init();

    // Setup modal close on overlay click
    const createModal = document.getElementById('createAtomModal');
    if (createModal) {
        createModal.addEventListener('click', (e) => {
            if (e.target === createModal) {
                AtomModalManager.hideCreate();
            }
        });
    }

    // Setup ESC key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            AtomModalManager.hideCreate();
        }
    });

    // Load atoms
    await loadAtoms();

    console.log('[Atoms] Initialization complete');
});

// Add fadeOut animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from {
            opacity: 1;
            transform: scale(1);
        }
        to {
            opacity: 0;
            transform: scale(0.9);
        }
    }
`;
document.head.appendChild(style);

console.log('[Atoms] v3.0 loaded');
