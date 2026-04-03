import { state, loadData, saveData, saveAll, isDemoMode, setDemoMode, realDataCache, setRealDataCache, realCatsCache, setRealCatsCache, realSubCatsCache, setRealSubCatsCache } from './store.js';
import { debounce, updateMarquees, startGlobalSlideshowTimer, generateDemoData, initThemeHydration, openPopup, closePopup, openLightbox, closeLightbox, navigateLightbox } from './utils.js';
import { svgGear, iconTrash } from './constants.js';
import { renderProductCard, renderEmptyState, handleCardImageClick, toggleCardMenu } from './components/card.js';
import { switchView, renderNav, updateNavGlider, switchMainCategory, handleRouteChange, navigateToAddPage, navigateToCreatePage, toggleCatEdit, toggleCatDelete, closeCatEdit, addNewCategory, deleteCategory } from './features/navigation.js';
import { renderAnalytics, renderChart, syncMonthlyBudget, setAnalyticsFilter, showRichTooltip, hideRichTooltip, renderTransactions, triggerBudgetEdit, finalizeBudgetEdit } from './features/analytics.js';
import { renderProducts, renderSavedItems, saveProduct, openEditModal, deleteProduct, toggleFavorite, toggleBought, toggleWishlist, updateRatingSave, updateRatingVisual, calculateTotal, openModal, openModalWithLink, renderModalSubCats, renderChipContainer, fetchProductData, renderDeals, openViewModal, addImageFromUrlInput, handleImageUpload, setMainImg, toggleStatusFilter, MapsToReduced } from './features/products.js';
import { renderWebsites, renderWebsiteFilters, filterWebsites, toggleWebEdit, toggleWebDelete, addNewWebCat, deleteWebCat, openAddWebsiteModal, confirmAddWebsite } from './features/websites.js';
import { applyGlobalTheme, loadTheme, toggleTheme, applyBaseMode, syncThemeUI, renderThemeManager, openThemeCreator, saveTheme, updateThemeState, openThemeManagerWrapper, updateThemeCreatorTab, applyPreset, closeThemeCreator, deleteCustomTheme } from './features/theme.js';
import { openBundleEditor, renderBundleSourceFilters, renderBundleSourceGrid, addToBundle, removeFromBundle, updateBundleQty, renderBundleDraftList, saveBundle, renderBundlesOverview, renderCollectionLibrary, loadOutfit, setBundleFilter, handleBundleSearch, syncBundleMarquees } from './features/bundles.js';

// Expose to window for inline event handlers
window.state = state;
window.switchView = switchView;
window.renderNav = renderNav;
window.switchMainCategory = switchMainCategory;
window.renderProducts = renderProducts;
window.renderSavedItems = renderSavedItems;
window.renderWebsites = renderWebsites;
window.renderAnalytics = renderAnalytics;
window.syncMonthlyBudget = syncMonthlyBudget;
window.renderDeals = renderDeals;
window.renderBundlesOverview = renderBundlesOverview;
window.openModal = openModal;
window.openEditModal = openEditModal;
window.deleteProduct = deleteProduct;
window.toggleFavorite = toggleFavorite;
window.toggleBought = toggleBought;
window.toggleWishlist = toggleWishlist;
window.updateRatingSave = updateRatingSave;
window.updateRatingVisual = updateRatingVisual;
window.handleCardImageClick = handleCardImageClick;
window.toggleCardMenu = toggleCardMenu;
window.openViewModal = openViewModal;
window.toggleSubEdit = (e) => {
    if (e) e.stopPropagation();
    state.isEditingSubs = !state.isEditingSubs;
    if (!state.isEditingSubs) state.isDeleteModeSubs = false;

    // Force instant update of sub-chips only
    const c = document.getElementById('sharedSubFilterContainer');
    if (c) {
        const chips = c.querySelectorAll('.filter-chip');
        chips.forEach(el => {
            if (state.isEditingSubs) el.classList.add('editable');
            else el.classList.remove('editable');
        });

        const subTools = c.querySelector('.sub-filter-tools');
        if (subTools) {
            const toolBtn = subTools.querySelector('.nav-tools-btn.gear-icon-btn');
            const panel = subTools.querySelector('.sub-filter-panel');
            if (toolBtn) {
                if (state.isEditingSubs) toolBtn.classList.add('active');
                else toolBtn.classList.remove('active');
            }
            if (panel) {
                if (state.isEditingSubs) panel.classList.add('show');
                else panel.classList.remove('show');
            }
        }
    }

    window.renderSubFilters();
};

window.toggleSubDelete = (e) => {
    if (e) e.stopPropagation();
    state.isDeleteModeSubs = !state.isDeleteModeSubs;
    window.renderSubFilters();
};

window.addNewSubCat = () => {
    const v = document.getElementById('newSubInput').value.trim();
    if (v && state.subCats[state.mainCat] && !state.subCats[state.mainCat].includes(v)) {
        state.subCats[state.mainCat].push(v);
        saveAll();
        window.renderSubFilters();
    }
};

window.deleteSubCat = (s, e) => {
    if (e) e.stopPropagation();
    if (state.subCats[state.mainCat]) {
        state.subCats[state.mainCat] = state.subCats[state.mainCat].filter(x => x !== s);
        saveAll();
        window.renderSubFilters();
        if (window.renderProducts) window.renderProducts();
    }
};
window.applyGlobalTheme = applyGlobalTheme;
window.applyBaseMode = applyBaseMode;
window.loadTheme = loadTheme;
window.openThemeCreator = openThemeCreator;
window.closeThemeCreator = closeThemeCreator;
window.saveTheme = saveTheme;
window.updateThemeState = updateThemeState;
window.updateThemeCreatorTab = updateThemeCreatorTab;
window.deleteCustomTheme = deleteCustomTheme;
window.applyPreset = applyPreset;
window.toggleCatEdit = toggleCatEdit;
window.toggleCatDelete = toggleCatDelete;
window.addNewCategory = addNewCategory;
window.deleteCategory = deleteCategory;
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.closePopup = closePopup;
window.openPopup = openPopup;
window.openBundleEditor = openBundleEditor;
window.saveBundle = saveBundle;
window.saveProduct = saveProduct;
window.openThemeManager = openThemeManagerWrapper;
window.toggleStatusFilter = toggleStatusFilter;
window.MapsToReduced = MapsToReduced;
window.addNewWebCat = addNewWebCat;
window.toggleWebEdit = toggleWebEdit;
window.toggleWebDelete = toggleWebDelete;
window.navigateLightbox = navigateLightbox;
window.addImageFromUrlInput = addImageFromUrlInput;
window.handleImageUpload = handleImageUpload;
window.setMainImg = setMainImg;
window.setBundleFilter = setBundleFilter;
window.handleBundleSearch = handleBundleSearch;
window.addToBundle = addToBundle;
window.removeFromBundle = removeFromBundle;
window.updateBundleQty = updateBundleQty;
window.syncBundleMarquees = syncBundleMarquees;
window.openModalWithLink = openModalWithLink;
window.openAddWebsiteModal = openAddWebsiteModal;
window.confirmAddWebsite = confirmAddWebsite;
window.confirmAddWebsite = confirmAddWebsite;
window.filterWebsites = filterWebsites;
window.toggleWebEdit = toggleWebEdit;
window.toggleWebDelete = toggleWebDelete;
window.addNewWebCat = addNewWebCat;
window.addNewWebCat = addNewWebCat;
window.deleteWebCat = deleteWebCat;
window.toggleTheme = toggleTheme; // Fix for dark mode toggle
window.toggleSubFilter = (s) => {
    if (s === 'Alle') state.selectedSubCats = [];
    else {
        if (state.selectedSubCats.includes(s)) state.selectedSubCats = state.selectedSubCats.filter(x => x !== s);
        else state.selectedSubCats.push(s);
    }
    window.renderSubFilters();
    if (state.currentView === 'saved') renderSavedItems();
    else renderProducts();
};

window.applyGridMode = () => {
    const isSingle = state.settings.mobileGrid === 'single';
    if (isSingle) {
        document.body.classList.add('mobile-grid-single');
        document.getElementById('iconGridSingle').style.display = 'block';
        document.getElementById('iconGridMulti').style.display = 'none';
    } else {
        document.body.classList.remove('mobile-grid-single');
        document.getElementById('iconGridSingle').style.display = 'none';
        document.getElementById('iconGridMulti').style.display = 'block';
    }
};

window.toggleMobileGridMode = () => {
    // Default is multi if undefined
    if (state.settings.mobileGrid === 'single') {
        state.settings.mobileGrid = 'multi';
    } else {
        state.settings.mobileGrid = 'single';
    }
    saveAll();
    window.applyGridMode();
};

window.handleSubDragStart = (e, s) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', s);
    e.currentTarget.classList.add('dragging');
};

window.handleSubDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('drag-over');
    return false;
};

window.handleSubDragEnter = (e) => {
    e.currentTarget.classList.add('drag-over');
};

window.handleSubDragLeave = (e) => {
    e.currentTarget.classList.remove('drag-over');
};

window.handleSubDrop = (e, targetSub) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');

    const draggedSub = e.dataTransfer.getData('text/plain');
    if (draggedSub === targetSub) return;

    const subs = state.subCats[state.mainCat] || [];
    const fromIdx = subs.indexOf(draggedSub);
    const toIdx = subs.indexOf(targetSub);

    if (fromIdx !== -1 && toIdx !== -1) {
        subs.splice(fromIdx, 1);
        subs.splice(toIdx, 0, draggedSub);
        state.subCats[state.mainCat] = subs;
        saveAll();
        window.renderSubFilters();
    }
    return false;
};

window.handleSubDragEnd = (e) => {
    e.currentTarget.classList.remove('dragging');
    document.querySelectorAll('.filter-chip').forEach(el => el.classList.remove('drag-over'));
};

window.renderSubFilters = () => {
    const c = document.getElementById('sharedSubFilterContainer');
    if (!c) return;

    // Hide if no valid category
    if (state.mainCat === 'Hinzufügen' || state.mainCat === 'Alle') {
        c.innerHTML = '';
        return;
    }

    const subs = state.subCats[state.mainCat] || [];
    const toolsClass = state.isEditingSubs ? 'show' : '';

    let container = c.querySelector('.sub-filter-container');
    let subTools = c.querySelector('.sub-filter-tools');

    if (!container || !subTools) {
        c.innerHTML = `
            <div class="sub-filter-container"></div>
            <div class="sub-filter-tools"></div>
        `;
        container = c.querySelector('.sub-filter-container');
        subTools = c.querySelector('.sub-filter-tools');
    }

    const edit = state.isEditingSubs ? 'editable' : '';
    let chipsHtml = `<div class="filter-chip ${state.selectedSubCats.length === 0 ? 'active' : ''} ${edit}" onclick="window.toggleSubFilter('Alle')">Alle</div>`;

    subs.forEach(s => {
        const act = state.selectedSubCats.includes(s) ? 'active' : '';
        const shk = state.isDeleteModeSubs ? 'shaking' : '';
        const edit = state.isEditingSubs ? 'editable' : '';

        let dragAttrs = '';
        if (state.isEditingSubs) {
            dragAttrs = `draggable="true" 
                         ondragstart="window.handleSubDragStart(event, '${s}')" 
                         ondragover="window.handleSubDragOver(event)" 
                         ondragenter="window.handleSubDragEnter(event)" 
                         ondragleave="window.handleSubDragLeave(event)" 
                         ondrop="window.handleSubDrop(event, '${s}')"
                         ondragend="window.handleSubDragEnd(event)"`;
        }

        const clk = state.isDeleteModeSubs ? `window.deleteSubCat('${s}', event)` : `window.toggleSubFilter('${s}')`;
        // Ensure editable class is present and dragAttrs are applied
        chipsHtml += `<div class="filter-chip ${act} ${shk} ${edit}" ${dragAttrs} onclick="${clk}">${s}</div>`;
    });
    container.innerHTML = chipsHtml;

    // --- REFACTORED TOOLS RENDERING ---
    // Instead of overwriting innerHTML, we check if elements exist and update them.
    // This prevents the "flash" and state loss.

    let toolBtn = subTools.querySelector('.nav-tools-btn.gear-icon-btn'); // specific class
    let panel = subTools.querySelector('.sub-filter-panel');

    // Create structure ONLY if missing
    if (!toolBtn || !panel) {
        subTools.innerHTML = `
            <button class="nav-tools-btn gear-icon-btn" onclick="window.toggleSubEdit(event)">${svgGear}</button>
            <div class="sub-filter-panel">
                <button class="nav-tools-btn share-btn" onclick="window.toggleSubDelete(event)">${iconTrash}</button>
                <input type="text" id="newSubInput" class="cat-input" placeholder="Neue Kategorie" onkeydown="if(event.key==='Enter') window.addNewSubCat()">
                <button class="cat-confirm-btn" onclick="window.addNewSubCat()">+</button>
            </div>
        `;
        // Re-select after creation
        toolBtn = subTools.querySelector('.nav-tools-btn.gear-icon-btn');
        panel = subTools.querySelector('.sub-filter-panel');
    }

    // Now just update classes
    if (toolBtn) {
        if (state.isEditingSubs) toolBtn.classList.add('active');
        else toolBtn.classList.remove('active');
    }

    if (panel) {
        if (state.isEditingSubs) panel.classList.add('show');
        else panel.classList.remove('show');

        // Update trash button state inside panel
        const trashBtn = panel.querySelector('.share-btn');
        if (trashBtn) {
            if (state.isDeleteModeSubs) trashBtn.classList.add('active');
            else trashBtn.classList.remove('active');
        }
    }
};

window.toggleDemoMode = () => {
    const isDemo = isDemoMode;
    if (isDemo) {
        setDemoMode(false);
        loadData();
        localStorage.removeItem('app_demo_mode_active');
        document.body.classList.remove('demo-mode-active');
    } else {
        setDemoMode(true);
        setRealDataCache(JSON.parse(JSON.stringify(state.products)));
        setRealCatsCache(JSON.parse(JSON.stringify(state.categories)));
        setRealSubCatsCache(JSON.parse(JSON.stringify(state.subCats)));

        state.products = generateDemoData();
        if (window.DEMO_CATEGORIES) state.categories = JSON.parse(JSON.stringify(window.DEMO_CATEGORIES));
        if (window.DEMO_SUBCATS) state.subCats = JSON.parse(JSON.stringify(window.DEMO_SUBCATS));

        localStorage.setItem('app_demo_mode_active', 'true');
        document.body.classList.add('demo-mode-active');
    }
    state.mainCat = 'Alle';
    renderNav();
    renderProducts();
    renderWebsites();
    renderAnalytics();
    syncMonthlyBudget();

    // Ensure the menu label is in sync
    const demoLbl = document.getElementById('menuDemoLabel');
    if (demoLbl) demoLbl.innerText = isDemoMode ? 'Demo beenden' : 'Demo Modus';
};

document.addEventListener('DOMContentLoaded', () => {
    initThemeHydration();
    loadData();
    if (!window.state.settings.mobileGrid) window.state.settings.mobileGrid = 'multi';
    window.applyGridMode();

    // Set Dynamic Greeting
    const greetings = [
        "Willkommen zurück",
        "Hallo!",
        "Schön, dich zu sehen",
        "Bereit zum Shoppen?",
        "Dein Shopping-Überblick",
        "Neuer Tag, neue Deals",
        "Hi, alles im Blick!"
    ];
    const greetingEl = document.getElementById('dynamicGreeting');
    if (greetingEl) {
        greetingEl.innerText = greetings[Math.floor(Math.random() * greetings.length)];
    }

    if (localStorage.getItem('app_demo_mode_active') === 'true') {
        window.toggleDemoMode();
    }

    renderNav();
    switchView('websites');
    startGlobalSlideshowTimer();
    syncMonthlyBudget();

    // Fix: Ensure Dark Mode is applied on startup
    const savedTheme = state.settings.activeThemeId || 'dark';
    loadTheme(savedTheme);

    // Fix: Set Dashboard Date
    const dDate = document.getElementById('dashboardDate');
    if (dDate && !dDate.value) {
        dDate.value = new Date().toISOString().split('T')[0];
    }

    document.addEventListener('click', (e) => {
        const pill = document.getElementById('secondaryNavPill');
        if (pill && !pill.contains(e.target) && state.isEditingCats) closeCatEdit();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeCatEdit();
            closePopup('productModal');
        }
    });

    window.addEventListener('hashchange', handleRouteChange);
    window.addEventListener('resize', debounce(() => {
        if (state.currentView === 'bundles') syncBundleMarquees();
    }, 200));
});

// Global Handlers
window.handleSearch = (val) => {
    state.searchQuery = val.trim();
    const clearBtn = document.getElementById('searchClearBtn');
    if (clearBtn) clearBtn.style.display = state.searchQuery ? 'flex' : 'none';
    if (state.currentView === 'saved') renderSavedItems();
    else renderProducts();
};

window.clearSearch = () => {
    const inp = document.getElementById('searchInput');
    if (inp) { inp.value = ''; inp.focus(); }
    window.handleSearch('');
};

window.toggleMainMenu = () => {
    const memu = document.getElementById('mainMenuSidebar');
    if (memu) {
        if (memu.classList.contains('open')) {
            window.closePopup('mainMenuSidebar');
        } else {
            window.openPopup('mainMenuSidebar');
        }
    }
    const demoLbl = document.getElementById('menuDemoLabel');
    if (demoLbl) demoLbl.innerText = window.isDemoMode ? 'Demo beenden' : 'Demo Modus';
};

window.exportData = () => {
    const d = JSON.stringify({
        v: 3.0,
        p: state.products,
        t: state.settings,
        c: state.categories,
        s: state.subCats,
        w: state.websites,
        wc: state.websiteCats
    });
    const a = document.createElement('a');
    a.href = 'data:json;charset=utf-8,' + encodeURIComponent(d);
    a.download = 'shop_data.json';
    a.click();
};

window.openImportModal = () => openPopup('importModal');
window.openInfoModal = () => openPopup('infoModal');

// Analytics Handlers
window.setAnalyticsFilter = setAnalyticsFilter;
window.renderAnalytics = renderAnalytics;
window.showRichTooltip = showRichTooltip;
window.hideRichTooltip = hideRichTooltip;
window.triggerBudgetEdit = triggerBudgetEdit;
window.finalizeBudgetEdit = finalizeBudgetEdit;


// Reset Flow
let pendingResetType = '';
window.selectResetOption = (type, el) => {
    pendingResetType = type;
    document.querySelectorAll('.reset-option-card').forEach(c => c.classList.remove('selected'));
    if (el) el.classList.add('selected');
};

window.openResetModal = () => {
    const sel = document.getElementById('resetStepSelection');
    const conf = document.getElementById('resetStepConfirm');
    if (sel) sel.style.display = 'block';
    if (conf) conf.style.display = 'none';
    window.selectResetOption('shop_only', document.querySelector('.reset-option-card'));
    openPopup('resetModal');
};

window.proceedResetStep = () => {
    const sel = document.getElementById('resetStepSelection');
    const conf = document.getElementById('resetStepConfirm');
    if (sel) sel.style.display = 'none';
    if (conf) conf.style.display = 'block';

    const txt = document.getElementById('resetConfirmText');
    if (txt) {
        if (pendingResetType === 'shop_only') {
            txt.innerHTML = "Du bist dabei, <strong>alle Produkte und Shops</strong> zu löschen.<br>Deine Themes bleiben erhalten.";
        } else {
            txt.innerHTML = "<span style='color:red'>WARNUNG:</span> Du bist dabei, <strong>die gesamte App zurückzusetzen.</strong><br>Alle Einstellungen und Custom Themes gehen verloren.";
        }
    }
};

window.executeReset = () => {
    if (pendingResetType === 'shop_only') {
        state.products = [];
        state.categories = ["Kleidung", "Elektronik", "Haushalt", "Bücher"];
        state.subCats = {};
        state.websites = [];
        state.websiteCats = ["Allgemein", "Mode", "Tech", "Möbel"];
        saveAll();
        alert("Shop-Daten wurden gelöscht.");
        location.reload();
    } else if (pendingResetType === 'factory_reset') {
        localStorage.clear();
        sessionStorage.clear();
        alert("Factory Reset durchgeführt. Die App wird neu gestartet.");
        location.reload();
    }
    closePopup('resetModal');
};

