import { state } from './store.js';

/**
 * Escapes HTML characters to prevent XSS attacks.
 * @param {string} str - The raw string to escape.
 * @returns {string} The escaped string safe for innerHTML.
 */
export function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Debounces a function to limit how often it executes.
 * @param {Function} func - The function to debounce.
 * @param {number} delay - The delay in milliseconds.
 * @returns {Function} The debounced function.
 */
export function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

/**
 * Updates the marquee animations for text that overflows its container.
 */
export function updateMarquees() {
    const containers = document.querySelectorAll('.marquee-container');
    containers.forEach(container => {
        const content = container.querySelector('.marquee-content');
        if (!content) return;

        if (!content.dataset.text) content.dataset.text = content.innerText;
        const text = content.dataset.text;

        content.classList.remove('animate-marquee');
        content.innerHTML = escapeHtml(text); // Apply XSS protection here as well

        const containerWidth = container.offsetWidth;
        const contentWidth = content.scrollWidth;

        if (contentWidth > containerWidth) {
            content.classList.add('animate-marquee');
        }
    });
}

/**
 * Converts a Hex color to RGBA.
 * @param {string} hex - The hex color code.
 * @param {number} alpha - The opacity (0-1).
 * @returns {string} The RGBA color string.
 */
export function hexToRgba(hex, alpha) {
    let c;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        if (c.length == 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + alpha + ')';
    }
    return hex;
}

/**
 * Triggers a confetti explosion at the specified coordinates.
 * @param {number} x - The X coordinate.
 * @param {number} y - The Y coordinate.
 */
export function fireConfetti(x, y) {
    const colors = ['#e74c3c', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6'];
    const c = document.body;
    for (let i = 0; i < 40; i++) {
        const p = document.createElement('div');
        p.className = 'confetti';
        c.appendChild(p);
        const angle = Math.random() * Math.PI * 2;
        p.style.left = x + 'px';
        p.style.top = y + 'px';
        p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        p.animate([
            { transform: `translate(0, 0)`, opacity: 1 },
            { transform: `translate(${Math.cos(angle) * 150}px, ${Math.sin(angle) * 150 + 150}px) rotate(${Math.random() * 360}deg)`, opacity: 0 }
        ], { duration: 1000 }).onfinish = () => p.remove();
    }
}

/**
 * Initializes the theme based on local storage settings.
 */
export function initThemeHydration() {
    const saved = localStorage.getItem('ls_settings_final');
    if (saved) {
        try {
            const settings = JSON.parse(saved);
            if (settings.theme === 'dark') {
                document.documentElement.classList.add('dark');
                document.body.classList.add('dark-mode');
            }

        } catch (e) { }
    }
}

/**
 * Lightens or darkens a color.
 * @param {string} color - The hex color.
 * @param {number} percent - The percentage to shade (positive for lighter, negative for darker).
 * @returns {string} The shaded hex color.
 */
export function shadeColor(color, percent) {
    var R = parseInt(color.substring(1, 3), 16);
    var G = parseInt(color.substring(3, 5), 16);
    var B = parseInt(color.substring(5, 7), 16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = (R < 255) ? R : 255;
    G = (G < 255) ? G : 255;
    B = (B < 255) ? B : 255;

    var RR = ((R.toString(16).length == 1) ? "0" + R.toString(16) : R.toString(16));
    var GG = ((G.toString(16).length == 1) ? "0" + G.toString(16) : G.toString(16));
    var BB = ((B.toString(16).length == 1) ? "0" + B.toString(16) : B.toString(16));

    return "#" + RR + GG + BB;
}

export function startGlobalSlideshowTimer() {
    setInterval(() => {
        document.querySelectorAll('.card-img-container.has-slideshow').forEach(container => {
            const imgs = Array.from(container.querySelectorAll('.card-img'));
            if (imgs.length <= 1) return;

            let activeIdx = imgs.findIndex(img => img.classList.contains('active'));
            if (activeIdx === -1) activeIdx = 0;

            // Calculate next index
            const nextIdx = (activeIdx + 1) % imgs.length;

            // Robustly update classes
            imgs.forEach((img, idx) => {
                if (idx === nextIdx) {
                    img.classList.add('active');
                } else {
                    img.classList.remove('active');
                }
            });
        });
    }, 4000);
}

export function generateDemoData() {
    if (typeof window.DEMO_PRODUCTS !== 'undefined') {
        return JSON.parse(JSON.stringify(window.DEMO_PRODUCTS));
    }
    return [];
}

export function openPopup(id, applyGlobalTheme) {
    const el = document.getElementById(id);
    if (el) {
        if (typeof applyGlobalTheme === 'function') applyGlobalTheme();
        el.style.display = 'flex';
        document.body.classList.add('bundle-marquee-paused');
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                el.classList.add('open');
            });
        });
    }
}

export function closePopup(id) {
    const el = document.getElementById(id);
    if (el) {
        el.classList.remove('open');
        document.body.classList.remove('bundle-marquee-paused');
        setTimeout(() => el.style.display = 'none', 300);
    }
}

export function openLightbox(imgs, idx) {
    if (!imgs || !imgs[0]) return;
    const ol = document.getElementById('lightboxOverlay');
    if (ol) ol.classList.add('open');
    const img = document.getElementById('lightboxImg');
    if (img) img.src = imgs[0];
}

export function closeLightbox() {
    const ol = document.getElementById('lightboxOverlay');
    if (ol) ol.classList.remove('open');
}

export function navigateLightbox(dir) {
    // defined but empty in original script
}

export function enableDragScrolling(ele) {
    if (!ele) return;

    let isDown = false;
    let startX;
    let scrollLeft;

    // Prevent attaching multiple times if called repeatedly (basic check)
    if (ele.dataset.dragEnabled === 'true') return;
    ele.dataset.dragEnabled = 'true';

    ele.style.cursor = 'grab';
    ele.style.scrollBehavior = 'smooth';

    ele.addEventListener('mousedown', (e) => {
        isDown = true;
        ele.style.scrollBehavior = 'auto'; // Disable smooth scroll for direct drag feedback
        ele.classList.add('active-drag');
        ele.style.cursor = 'grabbing';
        startX = e.pageX - ele.offsetLeft;
        scrollLeft = ele.scrollLeft;
    });

    ele.addEventListener('mouseleave', () => {
        isDown = false;
        ele.style.scrollBehavior = 'smooth';
        ele.classList.remove('active-drag');
        ele.style.cursor = 'grab';
    });

    ele.addEventListener('mouseup', () => {
        isDown = false;
        ele.style.scrollBehavior = 'smooth';
        ele.classList.remove('active-drag');
        ele.style.cursor = 'grab';
    });

    ele.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - ele.offsetLeft;
        const walk = (x - startX) * 2; // Scroll-fast
        ele.scrollLeft = scrollLeft - walk;
    });

    // --- ADDED: Support for Mouse Wheel Scrolling (Vertical to Horizontal) ---
    ele.addEventListener('wheel', (e) => {
        if (e.deltaY !== 0) {
            e.preventDefault();
            // Programmatic scroll benefits from scroll-behavior: smooth
            ele.scrollLeft += (e.deltaY * 1.5);
        }
    });
}
/**
 * Shows a temporary toast notification.
 * @param {string} msg - The message to display.
 */
export function showToast(msg) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast-item';
    toast.innerText = msg;

    container.appendChild(toast);

    // Matches CSS animation time (3s total)
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Global Modal Helpers
window.openConfirmModal = function (title, msg, onConfirm) {
    const m = document.getElementById('confirmModal');
    if (!m) return;
    document.getElementById('confirmTitle').innerText = title;
    document.getElementById('confirmMessage').innerText = msg;

    // Set up confirm action
    const btn = document.getElementById('btnConfirmAction');
    // Remove old listeners to prevent stacking
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.onclick = () => {
        onConfirm();
        closePopup('confirmModal');
    };

    openPopup('confirmModal');
};

