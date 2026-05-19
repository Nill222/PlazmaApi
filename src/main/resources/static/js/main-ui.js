/**
 * ==============================================================
 * PlasmaLab Main UI Logic v3.0
 * Clean, modular UI management
 * ==============================================================
 */

'use strict';

// ==============================================================
// Modal Manager
// ==============================================================

const ModalManager = {
    /**
     * Show authentication modal
     */
    show() {
        const overlay = document.getElementById('authOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            console.log('[UI] Auth modal opened');
        }
    },

    /**
     * Hide authentication modal
     */
    hide() {
        const overlay = document.getElementById('authOverlay');
        if (overlay) {
            overlay.style.display = 'none';
            document.body.style.overflow = '';
            console.log('[UI] Auth modal closed');
        }

        // Clear messages when closing modal
        if (window.PlasmaAuth?.clearMessages) {
            window.PlasmaAuth.clearMessages();
        }
    },
};

// ==============================================================
// Tab Manager
// ==============================================================

const TabManagerUI = {
    /**
     * Initialize tab switching
     */
    init() {
        const tabs = document.querySelectorAll('.auth-tab');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchTab(tab.dataset.tab);
            });
        });

        console.log('[UI] Tab manager initialized');
    },

    /**
     * Switch to a specific tab
     * @param {string} tabName - Tab identifier
     */
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.tab === tabName) {
                tab.classList.add('active');
            }
        });

        // Update form visibility
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
            if (form.dataset.form === tabName) {
                form.classList.add('active');
            }
        });

        // Clear messages when switching tabs
        if (window.PlasmaAuth?.clearMessages) {
            window.PlasmaAuth.clearMessages();
        }
    },
};

// ==============================================================
// Protected Links Manager
// ==============================================================

const ProtectedLinksManager = {
    /**
     * Pages that require authentication
     */
    protectedPages: [
        {
            href: 'atoms.html',
            message: 'Для доступа к модулю "Атомы" необходимо войти в систему',
        },
        {
            href: 'ions.html',
            message: 'Для доступа к модулю "Ионы" необходимо войти в систему',
        },
        {
            href: 'simulation.html',
            message: 'Для доступа к модулю "Методы" необходимо войти в систему',
        },
        {
            href: 'charts.html',
            message: 'Для доступа к модулю "Графики" необходимо войти в систему',
        },
    ],

    /**
     * Setup protection for authenticated pages
     */
    setup() {
        this.protectedPages.forEach(page => {
            const links = document.querySelectorAll(`a[href="${page.href}"]`);

            links.forEach(link => {
                link.addEventListener('click', (e) => {
                    const isAuthenticated = window.PlasmaAuth?.isAuthenticated() || false;

                    if (!isAuthenticated) {
                        e.preventDefault();

                        // Show message
                        if (window.PlasmaAuth?.showMessage) {
                            window.PlasmaAuth.showMessage(page.message, 'error');
                        } else {
                            alert(page.message);
                        }

                        // Open auth modal
                        ModalManager.show();
                    }
                });
            });
        });

        console.log('[UI] Protected links setup complete');
    },
};

// ==============================================================
// Event Handlers
// ==============================================================

const EventHandlers = {
    /**
     * Setup modal close handlers
     */
    setupModalClose() {
        const overlay = document.getElementById('authOverlay');

        if (overlay) {
            // Close on overlay click
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    ModalManager.hide();
                }
            });
        }

        // Close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const overlay = document.getElementById('authOverlay');
                if (overlay && overlay.style.display === 'flex') {
                    ModalManager.hide();
                }
            }
        });
    },

    /**
     * Setup mobile menu toggle
     */
    setupMobileMenu() {
        const toggle = document.getElementById('mobileMenuToggle');
        const nav = document.getElementById('mainNav');

        if (toggle && nav) {
            toggle.addEventListener('click', () => {
                nav.classList.toggle('active');
            });
        }
    },
};

// ==============================================================
// Initialization
// ==============================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('[MainUI] Initializing...');

    // Initialize components
    TabManagerUI.init();
    ProtectedLinksManager.setup();
    EventHandlers.setupModalClose();
    EventHandlers.setupMobileMenu();

    console.log('[MainUI] Initialization complete');
});

// ==============================================================
// Export to window
// ==============================================================

window.showAuthModal = () => ModalManager.show();
window.hideAuthModal = () => ModalManager.hide();

console.log('[MainUI] v3.0 loaded');
