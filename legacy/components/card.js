import { state, saveData } from '../store.js';
import { iconShoppingBag, iconBookmark, iconHeart, iconTrash, iconEdit, iconStar } from '../constants.js';
import { hexToRgba, updateMarquees, openPopup, escapeHtml } from '../utils.js';

export function renderEmptyState(containerId, isSearch = false, navigateToCreatePage) {
    const grid = document.getElementById(containerId);
    if (!grid) return;

    grid.innerHTML = '';

    const title = isSearch ? 'Keine Produkte gefunden' : 'Hier ist es noch leer';
    const subtext = isSearch ? 'Versuche es mit anderen Suchbegriffen oder setze die Filter zurück.' : 'Du hast noch keine Produkte in dieser Kategorie oder Filterung.';
    const btnLabel = isSearch ? 'Suche löschen' : 'Produkt hinzufügen';
    const btnAction = isSearch ? 'window.clearSearch()' : "window.navigateToCreatePage()";

    const html = `
    <div class="empty-state-container">
        <div class="empty-state-icon-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" width="60" height="60">
                <path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
        </div>
        <div class="empty-state-title">${title}</div>
        <div class="empty-state-text">${subtext}</div>
        <button class="btn-empty-state" onclick="${btnAction}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            ${btnLabel}
        </button>
    </div>`;

    grid.style.display = 'block';
    grid.innerHTML = html;
}

export function renderProductCard(p, container) {
    const rVal = p.rating || 0;
    const imgs = p.imgs && p.imgs.length > 0 ? p.imgs : (p.img ? [p.img] : []);
    const hasSlideshow = imgs.length > 1 ? 'has-slideshow' : '';

    const imgHtml = imgs.length > 0
        ? imgs.map((url, idx) => `<img src="${url}" class="card-img ${idx === 0 ? 'active' : ''}">`).join('')
        : `<div class="no-image-placeholder">Kein Bild</div>`;

    // Security: Escape user inputs
    const safeName = escapeHtml(p.name);
    const safeShop = escapeHtml(p.shop);

    const html = `
    <div class="card ${p.bought ? 'bought-item' : ''}" id="card-${p.id}" onmouseleave="window.toggleCardMenu('${p.id}', null, false)">
        <div class="card-img-container ${hasSlideshow}" onclick="window.handleCardImageClick('${p.id}', ${JSON.stringify(imgs).replace(/"/g, '&quot;')}, event)">
            ${imgHtml}
            <div class="card-menu-layer" onclick="event.stopPropagation()">
                <button class="btn-menu-trigger" onclick="window.toggleCardMenu('${p.id}', event)" title="Optionen">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                </button>
                <div class="card-actions-overlay" id="actions-${p.id}">
                    <div class="btn-action-pill" onclick="window.openEditModal('${p.id}', event)" title="Bearbeiten">${iconEdit}</div>
                    <div class="btn-action-pill" onclick="window.deleteProduct('${p.id}', event)" title="Löschen">${iconTrash}</div>
                </div>
            </div>
        </div>
        <div class="card-body" onclick="window.openViewModal('${p.id}')">
            <div class="card-body-content">
                <div class="card-info-left">
                    <div class="card-vendor">${safeShop}</div>
                    <div class="card-title-marquee">
                        <div class="marquee-content card-title" data-text="${safeName}">${safeName}</div>
                    </div>
                    <div class="card-price">${p.price.toFixed(2)}<span class="currency"> €</span></div>
                </div>
                <div class="card-status-right" onclick="event.stopPropagation()">
                    <button class="btn-status btn-bought ${p.bought ? 'active' : ''}" onclick="window.toggleBought('${p.id}', event)" title="Gekauft">${iconShoppingBag}</button>
                    <button class="btn-status btn-wishlist ${p.inWishlist ? 'active' : ''}" onclick="window.toggleWishlist('${p.id}', event)" title="Merken">${iconBookmark}</button>
                    <button class="btn-status btn-delete" onclick="window.deleteProduct('${p.id}', event)" title="Löschen">${iconTrash}</button>
                </div>
            </div>
            
            <div class="card-footer-spacer"></div>

            <div class="card-footer-unified" onclick="event.stopPropagation()">
                <input type="range" class="card-rating-slider" min="0" max="10" step="0.5" value="${rVal}" 
                    oninput="window.updateRatingVisual('${p.id}', this.value, this)" 
                    onchange="window.updateRatingSave('${p.id}', this.value)">
                <div class="rating-value" id="rnum-${p.id}">${parseFloat(rVal).toFixed(1)} / 10</div>
            </div>
        </div>
    </div>`;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html.trim();
    const cardEl = tempDiv.firstChild;

    container.appendChild(cardEl);

    if (typeof applyCardStyle === 'function') {
        applyCardStyle(cardEl);
    }
}

export function createCollectionCardHTML(p) {
    const imgs = p.imgs && p.imgs.length > 0 ? p.imgs : (p.img ? [p.img] : []);
    const hasSlideshow = imgs.length > 1 ? 'has-slideshow' : '';
    const imgHtml = imgs.length > 0
        ? imgs.map((url, idx) => `<img src="${url}" class="card-img ${idx === 0 ? 'active' : ''}">`).join('')
        : `<div class="card-no-img">Kein Bild</div>`;

    const safeName = escapeHtml(p.name || '');
    const safeShop = escapeHtml(p.shop || '');

    return `
    <div class="card collection-card" onclick="window.toggleCollectionItem(${p.id})">
        <div class="card-img-container ${hasSlideshow}">${imgHtml}</div>
        <div class="card-body">
            <div class="marquee-container"><div class="marquee-content card-shop">${safeShop}</div></div>
            <div class="marquee-container" style="font-weight:600;"><div class="marquee-content card-name">${safeName}</div></div>
            <div class="card-price">${p.price ? p.price.toFixed(2) + ' €' : ''}</div>
        </div>
    </div>`;
}

export function applyCardStyle(el) {
    if (!el) return;
    const { isGlassEnabled, activeThemeId } = state.settings;

    el.style.background = '';
    el.style.borderColor = '';
    el.style.backdropFilter = '';
    el.style.webkitBackdropFilter = '';
    el.style.boxShadow = '';

    if (isGlassEnabled) {
        const isDark = document.body.classList.contains('dark-mode');
        if (isDark) {
            el.style.background = 'rgba(255, 255, 255, 0.05)';
            el.style.border = '1px solid rgba(255, 255, 255, 0.1)';
            el.style.boxShadow = 'inset 0 2px 0 0 rgba(255, 255, 255, 0.2), 0 10px 40px rgba(0, 0, 0, 0.3)';
        } else {
            el.style.background = 'rgba(255, 255, 255, 0.3)';
            el.style.border = '1px solid rgba(255, 255, 255, 0.2)';
            el.style.boxShadow = 'inset 0 2px 0 0 rgba(255, 255, 255, 0.5), 0 10px 40px rgba(0, 0, 0, 0.1)';
        }

        el.style.backdropFilter = 'blur(40px) saturate(180%)';
        el.style.webkitBackdropFilter = 'blur(40px) saturate(180%)';
        el.style.borderRadius = '32px';
        el.style.transition = 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
    } else {
        if (activeThemeId !== 'default' && activeThemeId !== 'dark') {
            el.style.background = 'var(--card-bg)';
            el.style.border = '1px solid var(--input-border)';
            el.style.boxShadow = 'none';
        } else {
            el.style.background = 'var(--card-bg)';
            el.style.border = '1px solid var(--input-border)';
            el.style.backdropFilter = 'none';
            el.style.webkitBackdropFilter = 'none';
            el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
        }
    }
}

export function handleCardImageClick(id, imgs, e) {
    if (e.target.closest('.btn-menu-trigger') || e.target.closest('.card-actions-overlay')) return;
    window.openLightbox(imgs, 0);
}

export function toggleCardMenu(id, e, forceState) {
    if (e) e.stopPropagation();
    const actions = document.getElementById('actions-' + id);
    if (!actions) return;
    if (forceState !== undefined) {
        if (forceState) actions.classList.add('open');
        else actions.classList.remove('open');
    } else {
        actions.classList.toggle('open');
    }
}
