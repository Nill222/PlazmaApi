/**
 * ==============================================================
 * PlasmaLab Ions Page Logic v3.0
 * Professional ions database management
 * ==============================================================
 */

'use strict';

// ==============================================================
// Configuration
// ==============================================================

const IONS_CONFIG = {
    API_ENDPOINT: '/ions',
    DEBOUNCE_DELAY: 300,
};

// ==============================================================
// State Management
// ==============================================================

const IonsState = {
    ions: [],
    filteredIons: [],
    isLoading: false,
    searchQuery: '',
    chargeFilter: 'all', // 'all', 'positive', 'negative'
};

// ==============================================================
// API Client for Ions
// ==============================================================

const IonsAPI = {
    /**
     * Get all ions
     * @returns {Promise<Array>}
     */
    async getAll() {
        const response = await window.PlasmaAuth.apiRequest(
            IONS_CONFIG.API_ENDPOINT,
            null,
            true
        );

        if (!response.ok) {
            throw new Error(response.data?.message || 'Failed to fetch ions');
        }

        return response.data?.data || [];
    },

    /**
     * Get ion by ID
     * @param {number} id - Ion ID
     * @returns {Promise<Object>}
     */
    async getById(id) {
        const response = await window.PlasmaAuth.apiRequest(
            `${IONS_CONFIG.API_ENDPOINT}/${id}`,
            null,
            true
        );

        if (!response.ok) {
            throw new Error(response.data?.message || 'Failed to fetch ion');
        }

        return response.data?.data;
    },

    /**
     * Create new ion
     * @param {Object} ionData - Ion data
     * @returns {Promise<Object>}
     */
    async create(ionData) {
        const response = await window.PlasmaAuth.apiRequest(
            IONS_CONFIG.API_ENDPOINT,
            ionData,
            true
        );

        if (!response.ok) {
            throw new Error(response.data?.message || 'Failed to create ion');
        }

        return response.data?.data;
    },

    /**
     * Delete ion
     * @param {number} id - Ion ID
     * @returns {Promise<boolean>}
     */
    async delete(id) {
        const response = await window.PlasmaAuth.apiRequest(
            `${IONS_CONFIG.API_ENDPOINT}/${id}`,
            { _method: 'DELETE' },
            true
        );

        return response.ok;
    },
};

// ==============================================================
// UI Renderer
// ==============================================================

const IonsUI = {
    /**
     * Render ions grid
     * @param {Array} ions - Array of ions
     */
    renderIons(ions) {
        const grid = document.getElementById('ionsGrid');
        if (!grid) return;

        if (ions.length === 0) {
            grid.style.display = 'none';
            return;
        }

        grid.innerHTML = '';
        grid.style.display = 'grid';

        ions.forEach((ion, index) => {
            const card = this._createIonCard(ion, index);
            grid.appendChild(card);
        });
    },

    /**
     * Create ion card element
     * @private
     * @param {Object} ion - Ion data
     * @param {number} index - Card index for animation delay
     * @returns {HTMLElement}
     */
    _createIonCard(ion, index) {
        const card = document.createElement('div');
        const chargeClass = ion.charge > 0 ? 'positive' : (ion.charge < 0 ? 'negative' : '');
        card.className = `ion-card ${chargeClass} fade-in`;
        card.style.animationDelay = `${index * 0.05}s`;
        card.dataset.ionId = ion.id;

        const chargeBadge = this._formatCharge(ion.charge);

        card.innerHTML = `
            <div class="ion-card-header">
                <div class="ion-symbol">
                    <div class="ion-name">${this._escapeHtml(ion.name)}</div>
                    <div class="ion-charge-badge ${chargeClass}">${chargeBadge}</div>
                </div>
                <div class="ion-actions">
                    <button class="ion-btn delete" onclick="handleDeleteIon(${ion.id})" 
                            aria-label="Удалить ион" title="Удалить">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="ion-card-body">
                <div class="ion-property">
                    <div class="property-label">
                        <i class="fas fa-weight-hanging"></i>
                        Масса
                    </div>
                    <div class="property-value">
                        ${this._formatMass(ion.mass)}
                        <span class="property-unit">кг</span>
                    </div>
                </div>
                <div class="ion-property">
                    <div class="property-label">
                        <i class="fas fa-bolt"></i>
                        Заряд
                    </div>
                    <div class="property-value">
                        ${this._formatChargeText(ion.charge)}
                    </div>
                </div>
            </div>
        `;

        return card;
    },

    /**
     * Update statistics
     * @param {Array} ions - Array of ions
     */
    updateStats(ions) {
        const totalElement = document.getElementById('totalIons');
        const positiveElement = document.getElementById('positiveIons');
        const negativeElement = document.getElementById('negativeIons');
        const avgMassElement = document.getElementById('avgMass');

        if (!totalElement || !positiveElement || !negativeElement || !avgMassElement) return;

        const total = ions.length;
        const positive = ions.filter(ion => ion.charge > 0).length;
        const negative = ions.filter(ion => ion.charge < 0).length;
        const avgMass = total > 0
            ? ions.reduce((sum, ion) => sum + (ion.mass || 0), 0) / total
            : 0;

        this._animateNumber(totalElement, total, 0);
        this._animateNumber(positiveElement, positive, 0);
        this._animateNumber(negativeElement, negative, 0);

        if (avgMass > 0 && avgMass < 0.001) {
            avgMassElement.textContent = avgMass.toExponential(2);
        } else {
            this._animateNumber(avgMassElement, avgMass, 3);
        }
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
        document.getElementById('ionsGrid').style.display = 'none';
    },

    /**
     * Show empty state
     */
    showEmpty() {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('emptyState').style.display = 'flex';
        document.getElementById('noResultsState').style.display = 'none';
        document.getElementById('ionsGrid').style.display = 'none';
    },

    /**
     * Show no results state
     * @param {string} message - Message to display
     */
    showNoResults(message) {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('emptyState').style.display = 'none';
        document.getElementById('noResultsState').style.display = 'flex';
        document.getElementById('ionsGrid').style.display = 'none';

        const textElement = document.getElementById('noResultsText');
        if (textElement) {
            textElement.textContent = message;
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
     * Format charge for badge
     * @private
     */
    _formatCharge(charge) {
        if (charge === 0) return '0';
        const sign = charge > 0 ? '+' : '−';
        const abs = Math.abs(charge);
        return abs === 1 ? sign : `${sign}${abs}`;
    },

    /**
     * Format charge as text
     * @private
     */
    _formatChargeText(charge) {
        if (charge === 0) return 'Нейтральный';
        const sign = charge > 0 ? '+' : '';
        return `${sign}${charge} e`;
    },

    /**
     * Format mass
     * @private
     */
    _formatMass(num) {
        if (num === null || num === undefined) return '—';

        if (num > 0 && num < 0.00001) {
            return parseFloat(num).toExponential(2);
        }

        return parseFloat(num).toFixed(6);
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

const IonModalManager = {
    /**
     * Show create ion modal
     */
    showCreate() {
        const modal = document.getElementById('createIonModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';

            const firstInput = modal.querySelector('input');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    },

    /**
     * Hide create ion modal
     */
    hideCreate() {
        const modal = document.getElementById('createIonModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';

            const form = document.getElementById('createIonForm');
            if (form) {
                form.reset();
            }

            const msgElement = document.getElementById('createIonMsg');
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
        const msgElement = document.getElementById('createIonMsg');
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
// Search & Filter Manager
// ==============================================================

const SearchFilterManager = {
    debounceTimer: null,

    /**
     * Initialize search and filter
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
            IonsState.searchQuery = query.trim().toLowerCase();
            this.applyFilters();
        }, IONS_CONFIG.DEBOUNCE_DELAY);
    },

    /**
     * Apply search and charge filters
     */
    applyFilters() {
        let filtered = IonsState.ions;

        // Фильтр по заряду
        if (IonsState.chargeFilter === 'positive') {
            filtered = filtered.filter(ion => ion.charge > 0);
        } else if (IonsState.chargeFilter === 'negative') {
            filtered = filtered.filter(ion => ion.charge < 0);
        }

        // Поиск по названию
        if (IonsState.searchQuery) {
            filtered = filtered.filter(ion => {
                const name = (ion.name || '').toLowerCase();
                return name.includes(IonsState.searchQuery);
            });
        }

        IonsState.filteredIons = filtered;
        this.updateUI();
    },

    /**
     * Update UI after filtering
     */
    updateUI() {
        if (IonsState.filteredIons.length === 0) {
            let message = 'Попробуйте изменить критерии поиска';

            if (IonsState.searchQuery && IonsState.chargeFilter !== 'all') {
                message = `Нет ${IonsState.chargeFilter === 'positive' ? 'положительных' : 'отрицательных'} ионов с названием "${IonsState.searchQuery}"`;
            } else if (IonsState.searchQuery) {
                message = `Нет результатов для "${IonsState.searchQuery}"`;
            } else if (IonsState.chargeFilter !== 'all') {
                message = `Нет ${IonsState.chargeFilter === 'positive' ? 'положительных' : 'отрицательных'} ионов`;
            }

            if (IonsState.ions.length === 0) {
                IonsUI.showEmpty();
            } else {
                IonsUI.showNoResults(message);
            }
        } else {
            IonsUI.hideAllStates();
            IonsUI.renderIons(IonsState.filteredIons);
        }

        IonsUI.updateStats(IonsState.filteredIons);
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
        const createForm = document.getElementById('createIonForm');
        if (createForm) {
            createForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCreate(createForm);
            });
        }
    },

    /**
     * Handle create ion form submission
     * @param {HTMLFormElement} form - Form element
     */
    async handleCreate(form) {
        const formData = new FormData(form);

        const ionData = {
            name: formData.get('name')?.trim() || '',
            mass: parseFloat(formData.get('mass')) || 0,
            charge: parseInt(formData.get('charge')) || 0,
        };

        // Validate
        const validation = this._validateIonData(ionData);
        if (!validation.valid) {
            IonModalManager.showMessage(validation.message, 'error');
            return;
        }

        try {
            IonModalManager.showMessage('⏳ Создание иона...', 'info');

            const newIon = await IonsAPI.create(ionData);

            IonModalManager.showMessage('✔ Ион создан успешно!', 'success');

            setTimeout(() => {
                IonModalManager.hideCreate();
                loadIons();
            }, 800);

        } catch (error) {
            console.error('[Ions] Create error:', error);
            IonModalManager.showMessage(error.message || 'Ошибка создания иона', 'error');
        }
    },

    /**
     * Validate ion data (согласно CreateIonDTO)
     * @private
     */
    _validateIonData(data) {
        // name: 2-25 символов, ^[A-Z][a-z0-9A-Z]*$
        if (!data.name || data.name.length < 2 || data.name.length > 25) {
            return { valid: false, message: 'Название: от 2 до 25 символов' };
        }
        if (!/^[A-Z][a-z0-9A-Z]*$/.test(data.name)) {
            return { valid: false, message: 'Название должно начинаться с заглавной буквы (буквы и цифры)' };
        }

        // mass: 1e-30 до 1e-23
        if (!data.mass || isNaN(data.mass) || data.mass <= 0) {
            return { valid: false, message: 'Масса должна быть положительным числом' };
        }
        if (data.mass < 1e-30 || data.mass > 1e-23) {
            return { valid: false, message: 'Масса должна быть в диапазоне 1e-30 до 1e-23 кг' };
        }

        // charge: -3 до 3
        if (data.charge === undefined || data.charge === null || !Number.isInteger(data.charge)) {
            return { valid: false, message: 'Заряд обязателен и должен быть целым числом' };
        }
        if (data.charge < -3 || data.charge > 3) {
            return { valid: false, message: 'Заряд должен быть от -3 до +3' };
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
    IonModalManager.showCreate();
};

/**
 * Hide create modal
 */
window.hideCreateModal = () => {
    IonModalManager.hideCreate();
};

/**
 * Filter ions by charge
 * @param {string} filter - Filter type: 'all', 'positive', 'negative'
 */
window.filterIons = (filter) => {
    IonsState.chargeFilter = filter;

    // Update button states
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        }
    });

    SearchFilterManager.applyFilters();
};

/**
 * Handle delete ion
 * @param {number} id - Ion ID
 */
window.handleDeleteIon = async (id) => {
    if (!confirm('Вы уверены, что хотите удалить этот ион?')) {
        return;
    }

    try {
        const success = await IonsAPI.delete(id);

        if (success) {
            window.PlasmaAnimations?.ToastNotifications.show(
                'Ион удален успешно',
                'success'
            );

            const card = document.querySelector(`[data-ion-id="${id}"]`);
            if (card) {
                card.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => {
                    loadIons();
                }, 300);
            } else {
                loadIons();
            }
        } else {
            throw new Error('Не удалось удалить ион');
        }
    } catch (error) {
        console.error('[Ions] Delete error:', error);
        window.PlasmaAnimations?.ToastNotifications.show(
            error.message || 'Ошибка удаления иона',
            'error'
        );
    }
};

// ==============================================================
// Main Functions
// ==============================================================

/**
 * Load all ions
 */
async function loadIons() {
    IonsState.isLoading = true;
    IonsUI.showLoading();

    try {
        const ions = await IonsAPI.getAll();

        IonsState.ions = ions;
        SearchFilterManager.applyFilters();

    } catch (error) {
        console.error('[Ions] Load error:', error);
        IonsUI.showEmpty();

        window.PlasmaAnimations?.ToastNotifications.show(
            'Ошибка загрузки ионов: ' + error.message,
            'error',
            5000
        );
    } finally {
        IonsState.isLoading = false;
    }
}

// ==============================================================
// Initialization
// ==============================================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Ions] Initializing page...');

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
    SearchFilterManager.init();
    FormHandler.init();

    // Setup modal close on overlay click
    const createModal = document.getElementById('createIonModal');
    if (createModal) {
        createModal.addEventListener('click', (e) => {
            if (e.target === createModal) {
                IonModalManager.hideCreate();
            }
        });
    }

    // Setup ESC key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            IonModalManager.hideCreate();
        }
    });

    // Load ions
    await loadIons();

    console.log('[Ions] Initialization complete');
});

console.log('[Ions] v3.0 loaded');
