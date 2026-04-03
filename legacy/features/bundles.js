import { state, saveAll } from '../store.js';
import { svgPencil, iconTrash, iconX, iconShoppingBag } from '../constants.js';
import { openPopup, closePopup, enableDragScrolling, showToast } from '../utils.js';
import { createCollectionCardHTML, applyCardStyle } from '../components/card.js';

export function openBundleEditor(bundleId = null) {
    if (bundleId) {
        const existing = state.collections.find(v => v.id === bundleId);
        if (existing) {
            state.draftCollection = JSON.parse(JSON.stringify(existing));
        }
    } else {
        state.draftCollection = {
            id: 'bundle-' + Date.now(),
            name: '',
            items: []
        };
    }

    if (window.switchView) window.switchView('viewBundlesEditor');
    const input = document.getElementById('bundleNameInput');
    if (input) input.value = state.draftCollection.name;
    renderBundleSourceFilters();
    renderBundleSourceGrid();
    renderBundleDraftList();
}

export function deleteBundle(id) {
    if (!confirm('Möchtest du dieses Bundle wirklich löschen?')) return;
    state.collections = state.collections.filter(b => b.id !== id);
    saveAll();
    renderBundlesOverview();
    if (window.syncMonthlyBudget) window.syncMonthlyBudget();
    showToast('Bundle gelöscht');
}

window.deleteBundle = deleteBundle;
window.openBundleEditor = openBundleEditor;

export function toggleBundleBought(id) {
    const b = state.collections.find(x => x.id === id);
    if (!b) return;
    b.bought = !b.bought;
    b.purchaseDate = b.bought ? new Date().toISOString() : null;
    saveAll();
    renderBundlesOverview();
    if (window.renderAnalytics) window.renderAnalytics(); // Refresh analytics if active
    if (window.syncMonthlyBudget) window.syncMonthlyBudget();
    showToast(b.bought ? 'Bundle gekauft' : 'Bundle Status zurückgesetzt');
}
window.toggleBundleBought = toggleBundleBought;

export function renderBundleSourceFilters() {
    // 1. LEFT: Status Chips
    const statusContainer = document.getElementById('bundleStatusFilters');
    if (statusContainer) {
        if (state.collectionFilters.bought === undefined) state.collectionFilters.bought = false;
        if (state.collectionFilters.reduced === undefined) state.collectionFilters.reduced = false;

        statusContainer.innerHTML = `
            <button class="bundle-status-item ${state.collectionFilters.bought ? 'active' : ''}" onclick="window.setBundleFilter('bought', !state.collectionFilters.bought)">Gekauft</button>
            <button class="bundle-status-item ${state.collectionFilters.reduced ? 'active' : ''}" onclick="window.setBundleFilter('reduced', !state.collectionFilters.reduced)">Reduziert</button>
        `;
    }

    // 2. MIDDLE: Main Categories
    const catContainer = document.getElementById('bundleMainCats');
    if (catContainer) {
        let catHtml = `<button class="bundle-cat-item ${state.collectionFilters.cat === 'Alle' ? 'active' : ''}" onclick="window.setBundleFilter('cat', 'Alle')">Alle</button>`;
        state.categories.forEach(c => {
            catHtml += `<button class="bundle-cat-item ${state.collectionFilters.cat === c ? 'active' : ''}" onclick="window.setBundleFilter('cat', '${c}')">${c}</button>`;
        });
        catContainer.innerHTML = catHtml;
        enableDragScrolling(catContainer);
    }

    // 3. RIGHT: Sub Categories
    const subContainer = document.getElementById('bundleSubCats');
    if (subContainer) {
        let subHtml = '';
        const sectionRight = subContainer.closest('.header-row-bottom');

        if (state.collectionFilters.cat !== 'Alle') {
            const subs = state.subCats[state.collectionFilters.cat] || [];
            if (subs.length > 0) {
                if (sectionRight) sectionRight.classList.remove('empty');
                // Ensure array
                if (!Array.isArray(state.collectionFilters.sub)) {
                    state.collectionFilters.sub = ['Alle'];
                }
                const activeSubs = state.collectionFilters.sub;
                subHtml += `<button class="bundle-sub-item ${activeSubs.includes('Alle') ? 'active' : ''}" onclick="window.setBundleFilter('sub', 'Alle')">Alle</button>`;
                subs.forEach(s => {
                    subHtml += `<button class="bundle-sub-item ${activeSubs.includes(s) ? 'active' : ''}" onclick="window.setBundleFilter('sub', '${s}')">${s}</button>`;
                });
            } else {
                if (sectionRight) sectionRight.classList.add('empty');
            }
        } else {
            if (sectionRight) sectionRight.classList.add('empty');
        }
        subContainer.innerHTML = subHtml;
        enableDragScrolling(subContainer);
    }
}

export function setBundleFilter(type, val) {
    if (type === 'sub') {
        if (!Array.isArray(state.collectionFilters.sub)) {
            state.collectionFilters.sub = ['Alle'];
        }
        if (val === 'Alle') {
            state.collectionFilters.sub = ['Alle'];
        } else {
            // Toggle val in array
            if (state.collectionFilters.sub.includes(val)) {
                state.collectionFilters.sub = state.collectionFilters.sub.filter(x => x !== val);
            } else {
                state.collectionFilters.sub.push(val);
                // Remove 'Alle' if it was there
                state.collectionFilters.sub = state.collectionFilters.sub.filter(x => x !== 'Alle');
            }
            // If empty, reset to 'Alle'
            if (state.collectionFilters.sub.length === 0) {
                state.collectionFilters.sub = ['Alle'];
            }
        }
    } else {
        state.collectionFilters[type] = val;
        if (type === 'cat') state.collectionFilters.sub = ['Alle'];
    }
    renderBundleSourceFilters();
    renderBundleSourceGrid();
}

export function handleBundleSearch(q) {
    state.collectionSearch = q;
    renderBundleSourceGrid();
}

export function renderBundleSourceGrid() {
    const grid = document.getElementById('bundleSourceGrid');
    if (!grid) return;

    // 1. Start Fade Out
    grid.classList.add('grid-loading');
    grid.classList.remove('animate-render');

    // 2. Wait for fade out, then update content
    setTimeout(() => {
        if (!state.collectionFilters.sort) state.collectionFilters.sort = 'default';

        const q = (state.collectionSearch || '').toLowerCase();
        const cat = state.collectionFilters.cat || 'Alle';
        const subArr = Array.isArray(state.collectionFilters.sub) ? state.collectionFilters.sub : ['Alle'];
        const isBought = state.collectionFilters.bought;
        const isReduced = state.collectionFilters.reduced;
        const sortMode = state.collectionFilters.sort;

        let filtered = state.products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(q) || p.shop.toLowerCase().includes(q);
            const matchesCat = cat === 'Alle' || p.category === cat;
            const matchesSub = subArr.includes('Alle') || subArr.includes(p.subCategory);
            const matchesBought = !isBought || p.bought;
            const matchesReduced = !isReduced || (p.discount && p.discount > 0);

            return matchesSearch && matchesCat && matchesSub && matchesBought && matchesReduced;
        });

        // Apply Sorting
        filtered.sort((a, b) => {
            switch (sortMode) {
                case 'priceAsc': return a.price - b.price;
                case 'priceDesc': return b.price - a.price;
                case 'newest': return b.id - a.id; // Assuming ID correlates with time or dateAdded exists
                case 'oldest': return a.id - b.id;
                default: return (b.fav ? 1 : 0) - (a.fav ? 1 : 0); // Default: Favorites first
            }
        });

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="bundle-empty-state">
                    <div class="bundle-empty-icon">🔍</div>
                    <h3>Keine Produkte gefunden</h3>
                    <p>Versuche es mit einer anderen Filter-Kombination oder Suche.</p>
                </div>
            `;
            // Trigger Fade In for empty state too
            grid.classList.remove('grid-loading');
            void grid.offsetWidth;
            grid.classList.add('animate-render');
            return;
        }

        grid.innerHTML = filtered.map(p => {
            const imgUrl = (p.imgs && p.imgs.length) ? p.imgs[0] : (p.img || '');
            const imgsJson = JSON.stringify(p.imgs && p.imgs.length ? p.imgs : [imgUrl]).replace(/"/g, '&quot;');

            return `
            <div class="card compact-card" onclick="window.addToBundle('${p.id}')">
                <div class="card-img-container" onclick="window.handleCardImageClick('${p.id}', ${imgsJson}, event)">
                    <img src="${imgUrl}" class="card-img active">
                </div>
                <div class="card-body">
                    <div class="card-body-content">
                        <div class="card-info-left">
                            <div class="card-vendor">${p.shop}</div>
                            <div class="card-title-marquee">
                                <div class="marquee-content card-title">${p.name}</div>
                            </div>
                            <div class="card-price">${p.price.toFixed(2)}<span class="currency"> €</span></div>
                        </div>
                    </div>
                </div>
            </div>`;
        }).join('');

        if (state.settings.isGlassEnabled) {
            grid.querySelectorAll('.card').forEach(el => applyCardStyle(el));
        }

        // 3. Trigger Fade In
        grid.classList.remove('grid-loading');
        void grid.offsetWidth; // Trigger reflow
        grid.classList.add('animate-render');
    }, 150);
}

export function addToBundle(productId) {
    const p = state.products.find(x => x.id === productId);
    if (!p) return;

    const existing = state.draftCollection.items.find(i => i.id === productId);
    if (existing) {
        existing.qty++;
    } else {
        state.draftCollection.items.push({
            id: productId,
            name: p.name,
            price: p.price,
            img: (p.imgs && p.imgs.length) ? p.imgs[0] : (p.img || ''),
            shop: p.shop || '',
            qty: 1
        });
    }
    renderBundleDraftList();
}

export function removeFromBundle(productId) {
    state.draftCollection.items = state.draftCollection.items.filter(i => i.id !== productId);
    renderBundleDraftList();
}

export function updateBundleQty(productId, delta) {
    const item = state.draftCollection.items.find(i => i.id === productId);
    if (!item) return;

    item.qty += delta;
    if (item.qty <= 0) {
        removeFromBundle(productId);
    } else {
        renderBundleDraftList();
    }
}

export function renderBundleDraftList() {
    const list = document.getElementById('bundleDraftList');
    if (!list) return;

    let total = 0;
    list.innerHTML = state.draftCollection.items.map(item => {
        total += item.price * item.qty;
        return `
        <div class="draft-item">
            <img src="${item.img}" class="draft-img">
            <div class="draft-info">
                <div class="draft-name">${item.name}</div>
                <div class="draft-price">${(item.price * item.qty).toFixed(2)} € (${item.qty}x)</div>
            </div>
            <div class="draft-actions">
                <div class="qty-btn" onclick="window.updateBundleQty('${item.id}', -1)">-</div>
                <div class="qty-btn" onclick="window.updateBundleQty('${item.id}', 1)">+</div>
                <div class="qty-btn delete-item-btn" onclick="window.removeFromBundle('${item.id}')">${iconX}</div>
            </div>
        </div>`;
    }).join('');

    const totalEl = document.getElementById('bundleTotal');
    if (totalEl) totalEl.innerText = total.toFixed(2).replace('.', ',') + ' €';

    if (state.settings.isGlassEnabled) {
        list.querySelectorAll('.draft-item').forEach(el => applyCardStyle(el));
    }
}

export function saveBundle() {
    const name = document.getElementById('bundleNameInput').value.trim();
    if (!name) { showToast("Bitte gib einen Namen ein."); return; }
    if (state.draftCollection.items.length === 0) { showToast("Das Bundle ist noch leer."); return; }

    state.draftCollection.name = name;
    state.draftCollection.total = state.draftCollection.items.reduce((sum, i) => sum + (i.price * i.qty), 0);

    const idx = state.collections.findIndex(v => v.id === state.draftCollection.id);
    if (idx >= 0) state.collections[idx] = state.draftCollection;
    else state.collections.unshift(state.draftCollection);

    saveAll();
    if (window.syncMonthlyBudget) window.syncMonthlyBudget();
    if (window.switchView) window.switchView('bundles');
}

export function renderBundlesOverview() {
    const grid = document.getElementById('bundlesGrid');
    if (!grid) return;
    grid.innerHTML = '';
    grid.style.display = 'grid';

    if (!state.collections || state.collections.length === 0) {
        grid.innerHTML = `
            <div class="empty-state-container" style="grid-column: 1/-1;">
                <div class="empty-icon-circle">${iconShoppingBag}</div>
                <h3>Noch keine Bundles erstellt</h3>
                <p>Erstelle dein erstes Bundle um Produkte zu gruppieren.</p>
                <button class="main-btn" onclick="window.openBundleEditor()">Jetzt erstellen</button>
            </div>
        `;
        return;
    }

    grid.innerHTML = state.collections.map(b => {
        // Create high-fidelity cards
        const itemHtml = b.items.map(i => `
            <div class="bundle-mini-card" onclick="window.openViewModal('${i.id}')">
                ${(i.qty && i.qty > 1) ? `<div class="mini-card-qty-badge">${i.qty}x</div>` : ''}
                <div class="mini-card-img-container">
                    <div class="mini-card-img-box">
                        <img src="${i.img || ''}" alt="${i.name}">
                    </div>
                </div>
                <div class="mini-card-body">
                    <div class="mini-card-vendor">${i.shop || 'Privat'}</div>
                    <div class="mini-card-name">${i.name}</div>
                    <div class="mini-card-price">${i.price.toFixed(2)} €</div>
                </div>
            </div>`).join('');


        return `
        <div class="card bundle-overview-card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5px; position: relative; z-index: 10;">
                <div class="bundle-header-info">
                    <div class="bundle-title-marquee" data-title-sync="true">
                        <h2 class="bundle-title-text">
                            <span>${b.name || 'Unbenannt'}</span>
                        </h2>
                    </div>
                    <div style="opacity: 0.6; font-size: 14px; margin-top: 4px; font-weight: 500;">${b.items.length} Artikel • Bundle Kollektion</div>
                </div>
                <div class="bundle-price-action-box">
                    <div class="bundle-total-price">${b.total.toFixed(2)} €</div>
                    <div class="bundle-action-row">
                        <button class="main-btn glass-btn" onclick="window.openBundleEditor('${b.id}')">Bundle bearbeiten</button>
                        <button class="bundle-delete-btn" onclick="window.deleteBundle('${b.id}')">${iconTrash}</button>
                    </div>
                </div>
            </div>

            <div class="bundle-marquee-viewport" data-is-new="true">
                <div class="bundle-marquee-track">
                    ${itemHtml}
                </div>
            </div>
            
            <div class="bundle-footer-actions">
                 <button class="main-btn glass-btn ${b.bought ? 'btn-bought-active' : ''}" 
                        onclick="window.toggleBundleBought('${b.id}')"
                        style="${b.bought ? 'background: #27ae60; color: white; border-color: #27ae60;' : ''}">
                    ${b.bought ? 'Gekauft' : 'Kaufen'}
                </button>
            </div>
        </div>`;
    }).join('');

    if (state.settings.isGlassEnabled) {
        grid.querySelectorAll('.card').forEach(el => applyCardStyle(el));
    }

    // Trigger dynamic sync
    setTimeout(syncBundleMarquees, 0);
}

// Use ResizeObserver for more robust and performant dynamic tracking
let bundleResizeObserver = null;

export function syncBundleMarquees() {
    const viewports = document.querySelectorAll('.bundle-marquee-viewport[data-is-new="true"]');
    const titles = document.querySelectorAll('[data-title-sync="true"]');

    if (!bundleResizeObserver) {
        bundleResizeObserver = new ResizeObserver(entries => {
            entries.forEach(entry => {
                if (entry.target.classList.contains('bundle-marquee-viewport')) {
                    updateSingleBundleMarquee(entry.target);
                } else if (entry.target.classList.contains('bundle-title-marquee')) {
                    updateSingleTitleMarquee(entry.target);
                }
            });
        });
    }

    viewports.forEach(vp => {
        const track = vp.querySelector('.bundle-marquee-track');
        if (!track) return;
        if (!vp.dataset.originalHtml) vp.dataset.originalHtml = track.innerHTML;
        delete vp.dataset.isNew;
        bundleResizeObserver.observe(vp);
        initBundleInteractivity(vp);
        updateSingleBundleMarquee(vp);
    });

    titles.forEach(title => {
        title.removeAttribute('data-title-sync');
        bundleResizeObserver.observe(title);
        updateSingleTitleMarquee(title);
    });
}

function updateSingleTitleMarquee(container) {
    const h2 = container.querySelector('.bundle-title-text');
    const span = h2?.querySelector('span');
    if (!h2 || !span) return;

    const containerWidth = container.offsetWidth;
    const textWidth = span.getBoundingClientRect().width;

    if (textWidth > containerWidth + 2) {
        const dist = `-${(textWidth + 60).toFixed(2)}px`;
        // Guard: Only set property if it actually changed to prevent animation reset
        if (h2.style.getPropertyValue('--title-scroll-dist') !== dist) {
            h2.style.setProperty('--title-scroll-dist', dist);
        }
        if (!h2.classList.contains('animate-marquee')) {
            h2.classList.add('animate-marquee');
            h2.setAttribute('data-text', span.innerText);
        }
    } else {
        if (h2.classList.contains('animate-marquee')) {
            h2.classList.remove('animate-marquee');
            h2.removeAttribute('data-text');
            h2.style.removeProperty('--title-scroll-dist');
        }
    }
}

function updateSingleBundleMarquee(vp) {
    const track = vp.querySelector('.bundle-marquee-track');
    if (!track || !vp.dataset.originalHtml) return;

    // To measure correctly, we must revert to original state thoroughly
    track.classList.remove('animate-bundle-marquee');
    track.style.animation = '';
    track.style.animationDelay = '';
    track.style.animationPlayState = '';
    track.style.transform = '';
    track.style.transition = 'none';

    vp.classList.remove('has-marquee', 'is-static');
    track.innerHTML = vp.dataset.originalHtml;

    // Force a reflow to ensure the "static" state is measured
    void track.offsetWidth;

    const vpWidth = vp.offsetWidth;
    const trackWidth = track.scrollWidth;

    if (trackWidth > vpWidth + 5) {
        vp.classList.add('has-marquee');
        const scrollDist = trackWidth - vpWidth;
        vp.style.setProperty('--scroll-dist', `-${scrollDist}px`);
        track.classList.add('animate-bundle-marquee');
        track.style.transition = '';
    } else {
        vp.classList.add('is-static');
    }
}

function initBundleInteractivity(vp) {
    const track = vp.querySelector('.bundle-marquee-track');
    if (!track) return;

    let manualOffset = 0;
    const duration = 25; // Sync with CSS pendulum duration (25s)

    vp.addEventListener('mouseenter', () => {
        if (!vp.classList.contains('has-marquee')) return;
        const style = window.getComputedStyle(track);
        const matrix = new WebKitCSSMatrix(style.transform);
        manualOffset = matrix.m41;

        track.style.animation = 'none';
        track.style.transform = `translateX(${manualOffset}px)`;
        track.style.transition = 'transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)';
    });

    vp.addEventListener('wheel', (e) => {
        if (!vp.classList.contains('has-marquee')) return;
        e.preventDefault();

        const vpWidth = vp.offsetWidth;
        const trackWidth = track.scrollWidth;
        if (trackWidth <= 0) return;

        const delta = (e.deltaY || e.deltaX) * 0.35;
        manualOffset -= delta;

        const maxScroll = Math.max(0, trackWidth - vpWidth);
        if (manualOffset > 0) manualOffset = 0;
        if (manualOffset < -maxScroll) manualOffset = -maxScroll;

        track.style.transform = `translateX(${manualOffset}px)`;
        track.style.transition = 'transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)';
    }, { passive: false });

    vp.addEventListener('mouseleave', () => {
        if (!vp.classList.contains('has-marquee')) return;

        // 1. Capture exact visual position (including manual lag)
        const style = window.getComputedStyle(track);
        const matrix = new WebKitCSSMatrix(style.transform);
        const finalX = matrix.m41;

        const trackWidth = track.scrollWidth;
        const vpWidth = vp.offsetWidth;
        const scrollDist = trackWidth - vpWidth;

        if (scrollDist > 0) {
            // Calculate absolute progress relative to travel distance
            const progress = Math.min(1, Math.max(0, Math.abs(finalX) / scrollDist));

            // Map progress to the 'forward' phase (5% to 45% in keyframes)
            const animPercent = 5 + (progress * 40);
            const delay = -(animPercent / 100 * duration);

            // 2. Tear down manual overrides
            track.style.transition = 'none';
            track.style.transform = '';
            track.style.animation = 'none';

            // Force a reflow to reset style engine before restarting animation
            void track.offsetHeight;

            // 3. Apply linear animation with precise negative delay shorthand
            track.style.animation = `bundle-marquee-pendulum ${duration}s linear infinite ${delay.toFixed(4)}s`;
        }
    });
}


export function renderCollectionLibrary() {
    const grid = document.getElementById('libraryGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const outfits = state.products.filter(p => {
        try {
            const data = JSON.parse(p.note);
            return data && data.type === 'outfit';
        } catch (e) { return false; }
    });

    const addCard = document.createElement('div');
    addCard.className = 'collection-card ghost-card';
    addCard.onclick = () => { if (window.createNewOutfit) window.createNewOutfit(); };
    addCard.innerHTML = `<div class="ghost-icon">+</div><span class="ghost-text">Neue Zusammenstellung</span>`;
    grid.appendChild(addCard);

    outfits.forEach(o => {
        let noteData = {};
        try { noteData = JSON.parse(o.note); } catch (e) { }

        let itemImages = [];
        let totalPrice = 0;
        let itemCount = 0;

        if (noteData.elements && Array.isArray(noteData.elements)) {
            itemCount = noteData.elements.length;
            noteData.elements.forEach(el => {
                const prod = state.products.find(p => p.id === el.id);
                if (prod) {
                    itemImages.push(prod.img);
                    totalPrice += parseFloat(prod.price) || 0;
                }
            });
        }
        if (itemImages.length === 0 && o.img) itemImages.push(o.img);
        const collageImgs = itemImages.slice(0, 4);

        const card = document.createElement('div');
        card.className = 'collection-card';
        card.innerHTML = `
            <div class="card-header-collage grid-${Math.min(collageImgs.length, 4)}" onclick="window.loadOutfit('${o.id}')">
                ${collageImgs.map(src => `<img src="${src}" class="collage-img" loading="lazy">`).join('')}
            </div>
            <div class="card-body">
                <div class="card-title">${o.name}</div>
                <div class="card-meta">${itemCount} Artikel</div>
            </div>
            <div class="card-footer">
                <div class="card-price">${totalPrice.toFixed(2)} €</div>
                <div class="card-actions">
                    <button class="action-btn-icon" onclick="window.loadOutfit('${o.id}')">${svgPencil}</button>
                    <button class="action-btn-icon destructive" onclick="window.deleteProduct('${o.id}', event); window.renderCollectionLibrary();">${iconTrash}</button>
                </div>
            </div>`;
        grid.appendChild(card);
    });
}

export function loadOutfit(id) {
    const o = state.products.find(p => p.id === id);
    if (!o) return;
    try {
        const data = JSON.parse(o.note);
        if (data && data.elements) {
            state.collectionList = data.elements.map(e => e.id).filter(x => x);
            if (window.switchView) window.switchView('collection');
            if (window.renderCollectionPicker) window.renderCollectionPicker();
            if (window.renderCollectionListBuilder) window.renderCollectionListBuilder();
        }
    } catch (e) { console.error('Load Error', e); }
}
