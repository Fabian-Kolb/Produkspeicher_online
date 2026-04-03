import { state, saveAll } from '../store.js';
import { svgGear, iconTrash } from '../constants.js';
import { updateMarquees } from '../utils.js';

export function updateNavGlider(btn) {
    const glider = document.getElementById('navGlider');
    if (!glider || !btn) return;

    glider.style.width = btn.offsetWidth + 'px';
    glider.style.left = btn.offsetLeft + 'px';
    glider.style.opacity = '1';
}

export function switchView(view) {
    const oldView = state.currentView;
    if (view !== 'collection') state.previousView = oldView;
    state.currentView = view;

    const viewIndices = { 'websites': 0, 'products': 1, 'saved': 2, 'bundles': 3, 'analytics': 4, 'deals': 5 };
    const oldIdx = viewIndices[oldView] !== undefined ? viewIndices[oldView] : 1;
    const newIdx = viewIndices[view] !== undefined ? viewIndices[view] : 1;

    const showPill = ['products', 'saved'].includes(view);
    const showSharedFilters = ['products', 'saved'].includes(view);

    const btnMap = {
        'websites': 'btnDashboard',
        'products': 'btnKatalog',
        'saved': 'btnFavoriten',
        'bundles': 'btnBundles',
        'viewBundlesEditor': 'btnBundles',
        'analytics': 'btnBudget',
        'deals': 'btnDeals'
    };

    ['btnDashboard', 'btnKatalog', 'btnFavoriten', 'btnBudget', 'btnDeals', 'btnBundles'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active');
    });

    const activeBtnId = btnMap[view];
    if (activeBtnId) {
        const el = document.getElementById(activeBtnId);
        if (el) {
            el.classList.add('active');
            updateNavGlider(el);
        }
    }

    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active', 'anim-right', 'anim-left', 'anim-up'));

    const secNav = document.getElementById('secondaryNav');
    const sharedFilters = document.getElementById('sharedFilterSection');

    if (sharedFilters) {
        if (showSharedFilters) {
            sharedFilters.classList.remove('pill-exit');
            sharedFilters.classList.add('visible');
        } else {
            sharedFilters.classList.remove('visible');
            sharedFilters.classList.add('pill-exit');
        }
    }

    if (showPill) {
        secNav.classList.remove('pill-exit');
        secNav.classList.add('visible');
        if (!secNav.classList.contains('active-pill') || !['products', 'saved'].includes(oldView)) {
            secNav.classList.add('active-pill');
        }
    } else {
        secNav.classList.remove('visible');
        secNav.classList.remove('active-pill');
        secNav.classList.add('pill-exit');
    }

    if (view === 'websites') {
        if (window.renderWebsites) window.renderWebsites();
        if (window.renderWebsiteFilters) window.renderWebsiteFilters();
    }
    else if (view === 'bundles') { if (window.renderBundlesOverview) window.renderBundlesOverview(); }
    else if (view === 'viewBundlesEditor') { }
    else {
        renderNav();
        if (window.renderSubFilters) window.renderSubFilters();
        if (view === 'products') { if (window.renderProducts) window.renderProducts(); }
        if (view === 'saved') {
            if (window.renderSavedItems) window.renderSavedItems();
        }
        if (view === 'analytics') {
            if (window.renderAnalytics) window.renderAnalytics();
        }
        if (view === 'deals') {
            if (window.renderDeals) window.renderDeals();
        }
    }

    const targetId = (view === 'analytics') ? 'viewAnalytics' :
        (view === 'deals') ? 'viewDeals' :
            (view === 'bundles') ? 'viewBundles' :
                (view === 'viewBundlesEditor') ? 'viewBundlesEditor' :
                    'view' + view.charAt(0).toUpperCase() + view.slice(1);
    const target = document.getElementById(targetId);
    if (target) {
        target.classList.add('active');
        let anim = 'anim-up';
        if (newIdx > oldIdx) anim = 'anim-right';
        else if (newIdx < oldIdx) anim = 'anim-left';
        target.classList.add(anim);
    }
    updateMarquees();
}

export function renderNav() {
    const container = document.getElementById('secondaryNavPill');
    if (!container) return;

    const savedScrollElement = container.querySelector('.nav-scroll-area');
    const savedScrollLeft = savedScrollElement ? savedScrollElement.scrollLeft : 0;

    const isCollection = (state.currentView === 'collection');

    let actionBtn = '';
    if (isCollection) {
        actionBtn = `<button class="cat-action-btn" onclick="window.openCollectionMode()">
            <span class="btn-text-spacer">Zusammenstellung</span>
            <span class="btn-text-visible">Zusammenstellung</span>
        </button>`;
    } else {
        const isActive = state.mainCat === 'Hinzufügen' ? 'active' : '';
        actionBtn = `<button class="cat-action-btn ${isActive}" onclick="window.switchView('products'); window.switchMainCategory('Hinzufügen', this, -2)">
            <span class="btn-text-spacer">Hinzufügen</span>
            <span class="btn-text-visible">Hinzufügen</span>
        </button>`;
    }

    const editable = state.isEditingCats ? 'editable' : '';
    let catsHtml = `<button class="cat-link ${state.mainCat === 'Alle' ? 'active' : ''} ${editable}" onclick="window.switchMainCategory('Alle', this, -1)">
        <span class="btn-text-spacer" style="padding:0 15px;">Alle</span>
        <span class="btn-text-visible">Alle</span>
    </button>`;
    state.categories.forEach((c, idx) => {
        const active = state.mainCat === c ? 'active' : '';
        const shaking = state.isDeleteModeCats ? 'shaking' : '';
        const editable = state.isEditingCats ? 'editable' : '';
        let events = '';
        if (state.isEditingCats) {
            events = `draggable="true" 
                ondragstart="window.handleCatDragStart(event, '${c}')" 
                ondragover="window.handleCatDragOver(event)" 
                ondragenter="window.handleCatDragEnter(event)" 
                ondragleave="window.handleCatDragLeave(event)" 
                ondrop="window.handleCatDrop(event, '${c}')" 
                ondragend="window.handleCatDragEnd(event)"`;
        }
        const clickAction = state.isDeleteModeCats ? `window.deleteCategory('${c}', event)` : `window.switchMainCategory('${c}', this, ${idx})`;
        catsHtml += `<button class="cat-link ${active} ${shaking} ${editable}" ${events} onclick="${clickAction}">
            <span class="btn-text-spacer">${c}</span>
            <span class="btn-text-visible">${c}</span>
        </button>`;
    });

    const gearActive = state.isEditingCats ? 'active' : '';
    const panelShow = state.isEditingCats ? 'show' : '';
    const trashActive = state.isDeleteModeCats ? 'active' : '';

    let topRow = container.querySelector('.nav-top-row');
    let bottomPanel = container.querySelector('.nav-bottom-panel');

    if (!topRow || !bottomPanel) {
        container.innerHTML = `
            <div class="nav-top-row" style="overflow:visible;"></div>
            <div class="nav-bottom-panel"></div>
        `;
        topRow = container.querySelector('.nav-top-row');
        bottomPanel = container.querySelector('.nav-bottom-panel');
    }

    // --- REFACTORED NAV RENDERING ---
    // Check if structure exists in topRow
    let scrollArea = topRow.querySelector('.nav-scroll-area');
    let gearBtn = topRow.querySelector('.nav-tools-btn');

    if (!scrollArea || !gearBtn) {
        // Create Initial Structure
        topRow.innerHTML = `
            ${actionBtn}
            <div class="nav-separator"></div>
            <div class="nav-scroll-area"></div>
            <div class="nav-separator"></div>
            <button class="nav-tools-btn">${svgGear}</button>
        `;
        scrollArea = topRow.querySelector('.nav-scroll-area');
        gearBtn = topRow.querySelector('.nav-tools-btn');
    } else {
        // Update Action Btn (it changes state)
        // Ideally we target it specifically, but replacing the first button is safe here if structure is stable
        const oldBtn = topRow.querySelector('.cat-action-btn');
        if (oldBtn) oldBtn.outerHTML = actionBtn;
    }

    // Update Content
    if (scrollArea) scrollArea.innerHTML = catsHtml;

    // Update Gear State
    if (gearBtn) {
        gearBtn.onclick = (e) => window.toggleCatEdit(e); // Ensure handler
        if (state.isEditingCats) gearBtn.classList.add('active');
        else gearBtn.classList.remove('active');
    }

    // Update Bottom Panel Content & State
    // Only set innerHTML if empty or we want to ensure handlers are fresh? 
    // Actually, innerHTML is fine for panel contents if it doesn't close the panel itself.
    // BUT the panel closing issue is because the PANEL ITSELF was being re-created.
    // topRow and bottomPanel are STABLE now.

    bottomPanel.className = `nav-bottom-panel ${panelShow}`;

    // Check if panel specific content is there
    if (!bottomPanel.querySelector('.cat-input')) {
        bottomPanel.innerHTML = `
            <button class="nav-tools-btn share-btn" onclick="window.toggleCatDelete(event)">${iconTrash}</button>
            <input type="text" id="newCatInput" class="cat-input" placeholder="Neue Kategorie" onkeydown="if(event.key==='Enter') window.addNewCategory(event)">
            <button class="cat-confirm-btn" onclick="window.addNewCategory(event)">+</button>
        `;
    }

    // Update Trash State
    const trashBtn = bottomPanel.querySelector('.share-btn');
    if (trashBtn) {
        if (state.isDeleteModeCats) trashBtn.classList.add('active');
        else trashBtn.classList.remove('active');
    }

    if (state.isEditingCats) container.classList.add('editing-mode');
    else container.classList.remove('editing-mode');

    // Scroll Area restoration (variable scrollArea is already defined above)
    if (scrollArea) {
        if (typeof savedScrollLeft !== 'undefined') {
            scrollArea.scrollLeft = savedScrollLeft;
        }
    }
}

let lastCatIndex = 0;
export function switchMainCategory(cat, btn, idx = -1) {
    if (state.mainCat === cat && cat !== 'Alle' && cat !== 'Hinzufügen') {
        switchMainCategory('Alle', null, -1);
        return;
    }
    const dir = (idx > lastCatIndex) ? 'anim-right' : 'anim-left';
    lastCatIndex = idx;

    state.mainCat = cat;
    state.selectedSubCats = [];

    const navPill = document.getElementById('secondaryNavPill');
    if (navPill) {
        const actBtn = navPill.querySelector('.cat-action-btn');
        if (actBtn) {
            if (cat === 'Hinzufügen') actBtn.classList.add('active');
            else actBtn.classList.remove('active');
        }
        const links = navPill.querySelectorAll('.cat-link');
        links.forEach(l => {
            const visibleSpan = l.querySelector('.btn-text-visible');
            const txt = visibleSpan ? visibleSpan.innerText.trim() : l.innerText.trim();
            if (txt === cat) l.classList.add('active');
            else l.classList.remove('active');
        });
    }

    if (window.renderSubFilters) window.renderSubFilters();

    const containerId = state.currentView === 'saved' ? 'savedContentWrapper' : 'productsContentWrapper';
    const container = document.getElementById(containerId);

    if (container) {
        container.classList.remove('anim-left', 'anim-right', 'anim-up');
        void container.offsetWidth;
        if (cat !== 'Hinzufügen') container.classList.add(dir);
    }

    if (state.currentView === 'saved') { if (window.renderSavedItems) window.renderSavedItems(); }
    else { if (window.renderProducts) window.renderProducts(); }
}

export function handleRouteChange() {
    const hash = window.location.hash.substring(1);
    if (!hash) return;

    const [path, query] = hash.split('?');
    const params = new URLSearchParams(query);

    if (path === 'products/add') {
        const initialUrl = params.get('initialUrl');
        navigateToAddPage(initialUrl);
    }
}

export function navigateToAddPage(initialUrl = '') {
    switchView('products');
    switchMainCategory('Hinzufügen', null, -2);
    setTimeout(() => {
        const quickInp = document.getElementById('quickLinkInput');
        if (quickInp) {
            if (initialUrl) quickInp.value = decodeURIComponent(initialUrl);
            quickInp.focus();
        }
    }, 100);
}

export function navigateToCreatePage() {
    const searchVal = document.getElementById('searchInput')?.value || '';
    const isUrl = searchVal.startsWith('http') || searchVal.includes('.');
    const urlParam = isUrl ? `?initialUrl=${encodeURIComponent(searchVal)}` : '';
    window.location.hash = `products/add${urlParam}`;
}

export function toggleCatEdit(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    state.isEditingCats = !state.isEditingCats;
    if (!state.isEditingCats) state.isDeleteModeCats = false;

    // Force instant update of category classes only
    const container = document.getElementById('secondaryNavPill');
    if (container) {
        const links = container.querySelectorAll('.cat-link');
        links.forEach(l => {
            if (state.isEditingCats) l.classList.add('editable');
            else l.classList.remove('editable');
        });
        if (state.isEditingCats) container.classList.add('editing-mode');
        else container.classList.remove('editing-mode');

        // Also update gear instantly
        const gear = container.querySelector('.nav-tools-btn');
        if (gear) {
            if (state.isEditingCats) gear.classList.add('active');
            else gear.classList.remove('active');
        }
    }

    renderNav();
}

export function toggleCatDelete(e) { if (e) e.stopPropagation(); state.isDeleteModeCats = !state.isDeleteModeCats; renderNav(); }
export function closeCatEdit() { if (state.isEditingCats) { state.isEditingCats = false; state.isDeleteModeCats = false; renderNav(); } }

export function addNewCategory(e) {
    if (e) e.stopPropagation();
    const v = document.getElementById('newCatInput').value.trim();
    if (v && !state.categories.includes(v)) {
        state.categories.push(v);
        state.subCats[v] = [];
        saveAll();
        renderNav();
    }
}

export function deleteCategory(c, e) {
    if (e) e.stopPropagation();
    state.categories = state.categories.filter(x => x !== c);
    delete state.subCats[c];
    if (state.mainCat === c) state.mainCat = 'Alle';
    saveAll();
    renderNav();
    if (window.renderProducts) window.renderProducts();
}

// --- Drag & Drop Handlers for Main Categories ---
window.handleCatDragStart = (e, c) => {
    e.dataTransfer.setData('text/plain', c);
    e.currentTarget.classList.add('dragging');
    state.draggedCat = c;
};

window.handleCatDragOver = (e) => {
    e.preventDefault();
};

window.handleCatDragEnter = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
};

window.handleCatDragLeave = (e) => {
    e.currentTarget.classList.remove('drag-over');
};

window.handleCatDrop = (e, targetC) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const draggedC = e.dataTransfer.getData('text/plain');
    if (draggedC === targetC) return;

    const fromIdx = state.categories.indexOf(draggedC);
    const toIdx = state.categories.indexOf(targetC);

    if (fromIdx !== -1 && toIdx !== -1) {
        state.categories.splice(fromIdx, 1);
        state.categories.splice(toIdx, 0, draggedC);
        saveAll();
        renderNav();
    }
};

window.handleCatDragEnd = (e) => {
    e.currentTarget.classList.remove('dragging');
    document.querySelectorAll('.cat-link').forEach(el => el.classList.remove('drag-over'));
};
