/**
 * ==============================================================
 * PlasmaLab Main Page Logic v3.0
 * Navigation highlighting and smooth scrolling
 * ==============================================================
 */

'use strict';

// ==============================================================
// Navigation Manager
// ==============================================================

const NavigationManager = {
    /**
     * Update active navigation link based on current page
     */
    updateActiveLink() {
        const currentPage = this._getCurrentPage();
        const navLinks = document.querySelectorAll('.nav-link');

        navLinks.forEach(link => {
            const href = link.getAttribute('href');

            if (this._isActiveLink(href, currentPage)) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    },

    /**
     * Get current page name
     * @private
     * @returns {string}
     */
    _getCurrentPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop() || 'index.html';
        return page === '' || page === '/' ? 'index.html' : page;
    },

    /**
     * Check if link is active
     * @private
     * @param {string} href - Link href
     * @param {string} currentPage - Current page name
     * @returns {boolean}
     */
    _isActiveLink(href, currentPage) {
        return href === currentPage ||
            (currentPage === '' && href === 'index.html') ||
            (currentPage === '/' && href === 'index.html');
    },
};

// ==============================================================
// Smooth Scroll Manager
// ==============================================================

const SmoothScrollManager = {
    /**
     * Setup smooth scrolling for anchor links
     */
    setup() {
        const anchorLinks = document.querySelectorAll('a[href^="#"]');

        anchorLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');

                // Don't prevent default for empty anchors
                if (href === '#' || href === '#!') {
                    return;
                }

                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    this._scrollToElement(target);
                }
            });
        });
    },

    /**
     * Scroll to element smoothly
     * @private
     * @param {HTMLElement} element - Target element
     */
    _scrollToElement(element) {
        const headerOffset = 80; // Height of fixed header
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth',
        });
    },
};

// ==============================================================
// Scroll Animations Manager
// ==============================================================

const ScrollAnimationsManager = {
    /**
     * Setup scroll-based animations
     */
    setup() {
        this._observeElements();
    },

    /**
     * Create intersection observer for animations
     * @private
     */
    _observeElements() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px',
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('aos-animate');
                }
            });
        }, observerOptions);

        // Observe all elements with data-aos attribute
        const elements = document.querySelectorAll('[data-aos]');
        elements.forEach(element => {
            observer.observe(element);
        });
    },
};

// ==============================================================
// Card Animations Manager
// ==============================================================

const CardAnimationsManager = {
    /**
     * Setup card hover animations
     */
    setup() {
        const cards = document.querySelectorAll('.module-card');

        cards.forEach(card => {
            // Add initial styles for animation
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        });

        // Observe cards for entrance animation
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px',
        });

        cards.forEach(card => observer.observe(card));
    },
};

// ==============================================================
// Performance Optimization
// ==============================================================

const PerformanceOptimizer = {
    /**
     * Lazy load images
     */
    lazyLoadImages() {
        const images = document.querySelectorAll('img[data-src]');

        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    },

    /**
     * Preload critical resources
     */
    preloadResources() {
        // Preload fonts
        const fonts = [
            'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap',
        ];

        fonts.forEach(href => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'style';
            link.href = href;
            document.head.appendChild(link);
        });
    },
};

// ==============================================================
// Accessibility Enhancements
// ==============================================================

const AccessibilityManager = {
    /**
     * Setup keyboard navigation
     */
    setupKeyboardNav() {
        // Tab trap in modal
        const modal = document.querySelector('.auth-modal');
        if (modal) {
            const focusableElements = modal.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );

            if (focusableElements.length > 0) {
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                modal.addEventListener('keydown', (e) => {
                    if (e.key === 'Tab') {
                        if (e.shiftKey && document.activeElement === firstElement) {
                            e.preventDefault();
                            lastElement.focus();
                        } else if (!e.shiftKey && document.activeElement === lastElement) {
                            e.preventDefault();
                            firstElement.focus();
                        }
                    }
                });
            }
        }
    },

    /**
     * Add ARIA labels
     */
    setupAriaLabels() {
        // Add aria-label to buttons without text
        const buttons = document.querySelectorAll('button:not([aria-label])');
        buttons.forEach(button => {
            const icon = button.querySelector('i');
            if (icon && !button.textContent.trim()) {
                button.setAttribute('aria-label', this._getAriaLabelFromIcon(icon));
            }
        });
    },

    /**
     * Get aria label from icon class
     * @private
     * @param {HTMLElement} icon
     * @returns {string}
     */
    _getAriaLabelFromIcon(icon) {
        const classes = icon.className;

        if (classes.includes('fa-times')) return 'Закрыть';
        if (classes.includes('fa-sign-in')) return 'Войти';
        if (classes.includes('fa-sign-out')) return 'Выйти';
        if (classes.includes('fa-user')) return 'Пользователь';
        if (classes.includes('fa-bars')) return 'Меню';

        return 'Кнопка';
    },
};

// ==============================================================
// Initialization
// ==============================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('[Main] Initializing...');

    // Update navigation
    NavigationManager.updateActiveLink();

    // Setup smooth scrolling
    SmoothScrollManager.setup();

    // Setup animations
    ScrollAnimationsManager.setup();
    CardAnimationsManager.setup();

    // Performance optimizations
    PerformanceOptimizer.lazyLoadImages();
    PerformanceOptimizer.preloadResources();

    // Accessibility
    AccessibilityManager.setupKeyboardNav();
    AccessibilityManager.setupAriaLabels();

    console.log('[Main] Initialization complete');
});

// ==============================================================
// Window load event
// ==============================================================

window.addEventListener('load', () => {
    console.log('[Main] Page fully loaded');
});

console.log('[Main] v3.0 loaded');
