export const state = {
    products: [], editingId: null, tempImgs: [],
    modalCat: 'Hardware', modalSub: '', mainCat: 'Alle', selectedSubCats: [],
    websiteCat: 'Allgemein',
    categories: ['Hardware', 'Software', 'Setup', 'Clothing', 'Home'],
    subCats: {
        'Hardware': ['Laptops', 'Kameras', 'Monitore', 'Tastaturen', 'Mäuse', 'Audio', 'Tablets', 'Gaming', 'Gadgets'],
        'Software': ['Design', 'Audio', 'Coding', 'Web', 'Produktivität'],
        'Setup': ['Tische', 'Stühle', 'Beleuchtung', 'Mikrofone', 'Deko'],
        'Clothing': ['Jacken', 'Schuhe', 'Hosen', 'T-Shirts', 'Accessoires', 'Outdoor', 'Bags'],
        'Home': ['Audio', 'Beleuchtung', 'Gadgets', 'Küche', 'Deko']
    },
    websites: [{ n: 'Amazon', u: 'https://amazon.de', c: 'Allgemein', s: 'A' }],
    websiteCats: ['Allgemein', 'Mode'],
    isEditingCats: false, isDeleteModeCats: false,
    isEditingSubs: false, isDeleteModeSubs: false,
    isEditingWebCats: false, isDeleteModeWebCats: false,
    sortMode: 'default', statusFilter: 'active', searchQuery: '',
    previousView: 'websites',
    lastChartData: [],
    analyticsMode: '7d',
    collectionFilters: { cat: 'Alle', sub: 'Alle' },
    collections: [],
    draftCollection: { name: '', items: [] },
    collectionSearch: '',
    collectionSort: 'newest',
    canvasItems: [],
    settings: {
        theme: 'dark',
        monthlyBudget: 2000,
        isGlassEnabled: false,
        customThemes: [],
        activeThemeId: 'default'
    }
};

export let isDemoMode = false;
export let realDataCache = [];
export let realCatsCache = [];
export let realSubCatsCache = {};

export function setDemoMode(val) { isDemoMode = val; }
export function setRealDataCache(val) { realDataCache = val; }
export function setRealCatsCache(val) { realCatsCache = val; }
export function setRealSubCatsCache(val) { realSubCatsCache = val; }

export function loadData() {
    // Helper to safely load and parse data
    const safeLoad = (key, defaultVal, name) => {
        try {
            const raw = localStorage.getItem(key);
            // if raw is null/undefined/empty, return default
            if (!raw) return defaultVal;
            // try parse
            return JSON.parse(raw) || defaultVal;
        } catch (e) {
            console.warn(`Corrupt data found regarding ${name}, resetting default.`, e);
            return defaultVal;
        }
    };

    // Load simple state properties using their initial values as defaults
    state.products = safeLoad('ls_products_final', state.products || [], 'products');
    state.categories = safeLoad('ls_cats_final', state.categories, 'categories');
    state.subCats = safeLoad('ls_subs_final', state.subCats, 'sub-categories');
    state.websites = safeLoad('ls_webs_final', state.websites, 'websites');
    state.websiteCats = safeLoad('ls_webcats_final', state.websiteCats, 'website-categories');
    state.collections = safeLoad('ls_collections_final', state.collections || [], 'collections');

    // Settings requires special merging to preserve defaults for new properties
    try {
        const rawSet = localStorage.getItem('ls_settings_final');
        if (rawSet) {
            const parsed = JSON.parse(rawSet);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                state.settings = { ...state.settings, ...parsed };
            }
        }
    } catch (e) {
        console.warn('Corrupt data found regarding settings, using defaults.', e);
        // Keep state.settings as is (defaults)
    }
}

export function saveData() {
    if (isDemoMode) {
        localStorage.setItem('ls_settings_final', JSON.stringify(state.settings));
        return;
    }
    localStorage.setItem('ls_products_final', JSON.stringify(state.products));
    localStorage.setItem('ls_cats_final', JSON.stringify(state.categories));
    localStorage.setItem('ls_subs_final', JSON.stringify(state.subCats));
    localStorage.setItem('ls_webs_final', JSON.stringify(state.websites));
    localStorage.setItem('ls_webcats_final', JSON.stringify(state.websiteCats));
    localStorage.setItem('ls_settings_final', JSON.stringify(state.settings));
    localStorage.setItem('ls_collections_final', JSON.stringify(state.collections));
}

export function saveAll() {
    if (isDemoMode) return;
    saveData();
}
