/**
 * ==============================================================
 * PlasmaLab Animations v3.0
 * Advanced animations and visual effects
 * ==============================================================
 */

'use strict';

// ==============================================================
// Particle Background (optional enhancement)
// ==============================================================

const ParticleBackground = {
    canvas: null,
    ctx: null,
    particles: [],
    animationId: null,

    /**
     * Initialize particle background
     */
    init() {
        // Only run on home page
        if (!document.querySelector('.hero')) {
            return;
        }

        this._createCanvas();
        this._createParticles();
        this._animate();
    },

    /**
     * Create canvas element
     * @private
     */
    _createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.opacity = '0.3';

        const hero = document.querySelector('.hero');
        if (hero) {
            hero.appendChild(this.canvas);
            this._resizeCanvas();
            window.addEventListener('resize', () => this._resizeCanvas());
        }

        this.ctx = this.canvas.getContext('2d');
    },

    /**
     * Resize canvas to match container
     * @private
     */
    _resizeCanvas() {
        const hero = document.querySelector('.hero');
        if (hero && this.canvas) {
            this.canvas.width = hero.offsetWidth;
            this.canvas.height = hero.offsetHeight;
        }
    },

    /**
     * Create particles
     * @private
     */
    _createParticles() {
        const particleCount = 50;

        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                radius: Math.random() * 2 + 1,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                opacity: Math.random() * 0.5 + 0.2,
            });
        }
    },

    /**
     * Animate particles
     * @private
     */
    _animate() {
        if (!this.ctx || !this.canvas) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles.forEach(particle => {
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;

            // Wrap around edges
            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;

            // Draw particle
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(99, 102, 241, ${particle.opacity})`;
            this.ctx.fill();
        });

        this.animationId = requestAnimationFrame(() => this._animate());
    },

    /**
     * Stop animation
     */
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    },
};

// ==============================================================
// Parallax Scroll Effect
// ==============================================================

const ParallaxScroll = {
    /**
     * Setup parallax scrolling
     */
    setup() {
        const parallaxElements = document.querySelectorAll('[data-parallax]');

        if (parallaxElements.length === 0) {
            return;
        }

        window.addEventListener('scroll', () => {
            this._updateParallax(parallaxElements);
        });
    },

    /**
     * Update parallax positions
     * @private
     * @param {NodeList} elements
     */
    _updateParallax(elements) {
        const scrolled = window.pageYOffset;

        elements.forEach(element => {
            const speed = parseFloat(element.dataset.parallax) || 0.5;
            const yPos = -(scrolled * speed);
            element.style.transform = `translateY(${yPos}px)`;
        });
    },
};

// ==============================================================
// Typewriter Effect
// ==============================================================

const TypewriterEffect = {
    /**
     * Create typewriter effect on element
     * @param {string} selector - Element selector
     * @param {string} text - Text to type
     * @param {number} speed - Typing speed in ms
     */
    type(selector, text, speed = 50) {
        const element = document.querySelector(selector);
        if (!element) return;

        element.textContent = '';
        let index = 0;

        const typeChar = () => {
            if (index < text.length) {
                element.textContent += text.charAt(index);
                index++;
                setTimeout(typeChar, speed);
            }
        };

        typeChar();
    },
};

// ==============================================================
// Number Counter Animation
// ==============================================================

const NumberCounter = {
    /**
     * Animate number counting
     * @param {string} selector - Element selector
     * @param {number} end - End number
     * @param {number} duration - Animation duration in ms
     */
    count(selector, end, duration = 2000) {
        const element = document.querySelector(selector);
        if (!element) return;

        const start = 0;
        const increment = end / (duration / 16); // 60fps
        let current = start;

        const updateCount = () => {
            current += increment;

            if (current < end) {
                element.textContent = Math.floor(current);
                requestAnimationFrame(updateCount);
            } else {
                element.textContent = end;
            }
        };

        updateCount();
    },

    /**
     * Setup auto-counting on scroll
     */
    setupAutoCount() {
        const counters = document.querySelectorAll('[data-count]');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.dataset.counted) {
                    const end = parseInt(entry.target.dataset.count);
                    const duration = parseInt(entry.target.dataset.duration) || 2000;

                    this.count(`[data-count="${end}"]`, end, duration);
                    entry.target.dataset.counted = 'true';
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(counter => observer.observe(counter));
    },
};

// ==============================================================
// Loading Animation
// ==============================================================

const LoadingAnimation = {
    /**
     * Show loading overlay
     */
    show() {
        const loader = document.createElement('div');
        loader.id = 'loadingOverlay';
        loader.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255, 255, 255, 0.95);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            ">
                <div style="text-align: center;">
                    <div class="spinner"></div>
                    <p style="margin-top: 1rem; color: #6b7280;">Загрузка...</p>
                </div>
            </div>
        `;
        document.body.appendChild(loader);
    },

    /**
     * Hide loading overlay
     */
    hide() {
        const loader = document.getElementById('loadingOverlay');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.remove(), 300);
        }
    },
};

// ==============================================================
// Toast Notifications
// ==============================================================

const ToastNotifications = {
    /**
     * Show toast notification
     * @param {string} message - Toast message
     * @param {string} type - Toast type: 'success', 'error', 'info'
     * @param {number} duration - Display duration in ms
     */
    show(message, type = 'info', duration = 3000) {
        const toast = this._createToast(message, type);
        document.body.appendChild(toast);

        // Trigger animation
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease forwards';
        }, 10);

        // Auto remove
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    /**
     * Create toast element
     * @private
     */
    _createToast(message, type) {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            info: '#3b82f6',
        };

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            info: 'fa-info-circle',
        };

        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 2rem;
            right: 2rem;
            background: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            border-left: 4px solid ${colors[type]};
            z-index: 10000;
            min-width: 300px;
            transform: translateX(400px);
        `;

        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <i class="fas ${icons[type]}" style="color: ${colors[type]}; font-size: 1.25rem;"></i>
                <span style="color: #111827; font-weight: 500;">${message}</span>
            </div>
        `;

        return toast;
    },
};

// ==============================================================
// Scroll Progress Bar
// ==============================================================

const ScrollProgressBar = {
    /**
     * Initialize scroll progress bar
     */
    init() {
        const progressBar = document.createElement('div');
        progressBar.id = 'scrollProgress';
        progressBar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            height: 3px;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            z-index: 9999;
            transition: width 0.1s ease;
        `;
        document.body.appendChild(progressBar);

        window.addEventListener('scroll', () => {
            this._updateProgress(progressBar);
        });
    },

    /**
     * Update progress bar width
     * @private
     */
    _updateProgress(bar) {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        const scrollPercent = (scrollTop / (documentHeight - windowHeight)) * 100;
        bar.style.width = `${scrollPercent}%`;
    },
};

// ==============================================================
// Initialization
// ==============================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('[Animations] Initializing...');

    // Optional: Enable particle background (can be heavy on performance)
    // ParticleBackground.init();

    // Setup parallax scrolling
    ParallaxScroll.setup();

    // Setup number counters
    NumberCounter.setupAutoCount();

    // Initialize scroll progress bar
    ScrollProgressBar.init();

    console.log('[Animations] Initialization complete');
});

// ==============================================================
// Export to window
// ==============================================================

window.PlasmaAnimations = {
    ParticleBackground,
    TypewriterEffect,
    NumberCounter,
    LoadingAnimation,
    ToastNotifications,
};

console.log('[Animations] v3.0 loaded');
