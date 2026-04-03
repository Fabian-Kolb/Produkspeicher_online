import { state, saveData } from '../store.js';
import { hexToRgba, shadeColor, openPopup, closePopup } from '../utils.js';
import { applyCardStyle } from '../components/card.js';
import { iconEdit } from '../constants.js';

export function applyGlobalTheme() {
    const isDark = state.settings.theme === 'dark';
    if (isDark) {
        document.body.classList.add('dark-mode');
        document.documentElement.classList.add('dark');
        document.documentElement.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.remove('dark-mode');
    }

    // Glass Mode Toggle determines if we show blur/shapes or solid
    const activeId = state.settings.activeThemeId;
    const customTheme = state.settings.customThemes?.find(t => t.id === activeId);

    let isGlass = false;
    if (customTheme) {
        isGlass = !!customTheme.isGlassEnabled;
    } else {
        // Standard Modes Logic
        isGlass = (activeId === 'light-glass' || activeId === 'dark-glass');
    }

    if (isGlass) {
        document.body.classList.add('glass-mode');
        document.documentElement.classList.add('glass-mode');
    } else {
        document.body.classList.remove('glass-mode');
        document.documentElement.classList.remove('glass-mode');
    }
}

export function loadTheme(id) {
    const r = document.documentElement.style;
    const stage = document.getElementById('glass-stage');

    // Comprehensive property cleanup
    const props = [
        '--bg-color', '--card-bg', '--text-main', '--text-dark', '--text-grey',
        '--input-border', '--nav-bg', '--hover-bg', '--header-bg',
        '--blob-color-1', '--blob-color-2', '--glass-blur', '--primary-color',
        '--glass-bg', '--glass-border'
    ];
    props.forEach(p => r.removeProperty(p));

    // 1. STANDARD MODI
    if (id === 'dark' || id === 'dark-glass') {
        state.settings.theme = 'dark';
        const isGlass = (id === 'dark-glass');
        r.setProperty('--bg-color', '#09090b');
        r.setProperty('--card-bg', '#18181b');
        r.setProperty('--text-dark', '#ffffff');
        r.setProperty('--text-main', '#fafafa');
        r.setProperty('--input-border', '#27272a');
        r.setProperty('--primary-color', '#3b82f6');
        r.setProperty('--blob-color-1', '#1e293b');
        r.setProperty('--blob-color-2', '#0f172a');
        if (stage) stage.className = 'use-blobs';

    } else if (id === 'default' || id === 'light-glass') {
        state.settings.theme = 'light';
        const isGlass = (id === 'light-glass');
        r.setProperty('--bg-color', '#fcfbf9');
        r.setProperty('--card-bg', '#ffffff');
        r.setProperty('--text-dark', '#1a1a1a');
        r.setProperty('--text-main', '#1a1a1a');
        r.setProperty('--input-border', '#e0e0e0');
        r.setProperty('--primary-color', '#3b82f6');
        r.setProperty('--blob-color-1', '#6366f1');
        r.setProperty('--blob-color-2', '#a855f7');
        if (stage) stage.className = 'use-circles';

        // 2. CUSTOM THEMES
    } else {
        const theme = state.settings.customThemes?.find(t => t.id === id);
        if (theme) {
            state.settings.theme = theme.isDark ? 'dark' : 'light';
            if (theme.colors) {
                Object.entries(theme.colors).forEach(([key, val]) => {
                    r.setProperty(key, val);
                });
            }
            if (theme.primary) r.setProperty('--primary-color', theme.primary);
            if (stage) stage.className = theme.shapeType === 'circle' ? 'use-circles' : 'use-blobs';
        }
    }

    state.settings.activeThemeId = id;
    saveData();
    applyGlobalTheme();
    syncThemeUI();
    renderThemeManager(); // Re-render to update the active checkmark
}

export function toggleTheme() {
    const isDark = document.getElementById('themeToggle').checked;

    // Check if we are currently in a Glass mode (Standard or Custom)
    const activeId = state.settings.activeThemeId;
    const customTheme = state.settings.customThemes?.find(t => t.id === activeId);
    const isGlass = (activeId && activeId.includes('glass')) || (customTheme && customTheme.isGlassEnabled);

    if (isGlass) {
        // Switch between Light Glass and Dark Glass
        // Note: For custom themes, this simple toggle might revert to standard glass modes
        // unless we have specific logic to find the "counterpart" custom theme.
        // For now, we switch to Standard Light/Dark Glass.
        loadTheme(isDark ? 'dark-glass' : 'light-glass');
    } else {
        // Default Toggle behavior: switch between Solid Light and Solid Dark
        applyBaseMode(isDark ? 'dark' : 'light');
    }
}

export function applyBaseMode(theme) {
    state.settings.theme = theme;
    state.settings.activeThemeId = (theme === 'dark' ? 'dark' : 'default');
    loadTheme(state.settings.activeThemeId);
}

export function syncThemeUI() {
    const t = document.getElementById('themeToggle');
    if (t) t.checked = (state.settings.theme === 'dark');
}

export function renderThemeManager() {
    const container = document.getElementById('themeManagerContent');
    if (!container) return;
    const { customThemes, activeThemeId } = state.settings;

    container.innerHTML = `
        <div class="theme-manager-container" style="display:flex; flex-direction:column; gap:20px; padding: 24px;">
            
            <div>
                <h4 style="margin-bottom:12px; color:var(--text-grey); font-size:12px; text-transform:uppercase; letter-spacing:0.5px; padding-left:4px;">Klassisch</h4>
                <div style="display:flex; flex-direction:column; gap:12px;">
                    <div class="theme-option-box ${activeThemeId === 'default' ? 'active' : ''}" onclick="window.loadTheme('default')">
                        <div class="theme-option-info">
                            <span class="theme-option-title">Light Mode</span>
                            <span class="theme-option-desc">Klares, helles Design</span>
                        </div>
                        <div class="theme-option-check">✓</div>
                    </div>
                    
                    <div class="theme-option-box ${activeThemeId === 'dark' ? 'active' : ''}" onclick="window.loadTheme('dark')">
                        <div class="theme-option-info">
                            <span class="theme-option-title">Dark Mode</span>
                            <span class="theme-option-desc">Augenschonend & tief</span>
                        </div>
                        <div class="theme-option-check">✓</div>
                    </div>
                </div>
            </div>

            <div>
                <h4 style="margin-bottom:12px; color:var(--text-grey); font-size:12px; text-transform:uppercase; letter-spacing:0.5px; padding-left:4px;">Glassmorphismus</h4>
                <div style="display:flex; flex-direction:column; gap:12px;">
                    <div class="theme-option-box ${activeThemeId === 'light-glass' ? 'active' : ''}" onclick="window.loadTheme('light-glass')">
                        <div class="theme-option-info">
                            <span class="theme-option-title">Light Glass</span>
                            <span class="theme-option-desc">Milchglas mit bunten Akzenten</span>
                        </div>
                        <div class="theme-option-check">✓</div>
                    </div>
                    
                    <div class="theme-option-box ${activeThemeId === 'dark-glass' ? 'active' : ''}" onclick="window.loadTheme('dark-glass')">
                        <div class="theme-option-info">
                            <span class="theme-option-title">Dark Glass</span>
                            <span class="theme-option-desc">Premium Dark Mode Erlebnis</span>
                        </div>
                        <div class="theme-option-check">✓</div>
                    </div>
                </div>
            </div>
            
            <div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; padding-left:4px;">
                    <h4 style="color:var(--text-grey); margin:0; font-size:12px; text-transform:uppercase; letter-spacing:0.5px;">Eigene Designs</h4>
                    <button onclick="window.openThemeCreator()" class="theme-create-btn">+ Neu</button>
                </div>
                <div style="display:flex; flex-direction:column; gap:12px;">
                    ${customThemes && customThemes.length > 0 ? customThemes.map(t =>
        `
                    <div class="theme-option-box ${activeThemeId === t.id ? 'active' : ''}" style="display:flex; justify-content:space-between; padding-right:8px;">
                        <div style="flex-grow:1; display:flex; align-items:center; cursor:pointer;" onclick="window.loadTheme('${t.id}')">
                            <div class="theme-option-info">
                                <span class="theme-option-title">${t.name}</span>
                                <span class="theme-option-desc">Benutzerdefiniert</span>
                            </div>
                            <div class="theme-option-check" style="margin-left:auto; margin-right:12px;">✓</div>
                        </div>
                        <div style="display:flex; gap:4px; align-items:center;">
                            <button onclick="window.openThemeCreator('${t.id}', event)" style="background:none; border:none; padding:8px; cursor:pointer; color:var(--text-grey); opacity:0.7;" title="Bearbeiten">
                                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                            </button>
                            <button onclick="window.deleteCustomTheme('${t.id}', event)" style="background:none; border:none; padding:8px; cursor:pointer; color:var(--heart-color); opacity:0.7;" title="Löschen">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                            </button>
                        </div>
                    </div>
                    `
    ).join('') : '<div style="padding:16px; text-align:center; color:var(--text-grey); font-size:13px; border:1px dashed var(--input-border); border-radius:12px;">Noch keine eigenen Designs.</div>'}
                </div>
            </div>
            
        </div>
    `;
}

// --- STABLE THEME CREATOR LOGIC ---
let tempThemeState = {};
let activeCreatorTab = 'basis';

const THEME_PRESETS = [
    { name: 'Aurora', bg: '#0f172a', card: '#1e293b', primary: '#38bdf8', blob1: '#0ea5e9', blob2: '#6366f1', isDark: true, glass: true },
    { name: 'Sunset', bg: '#fef2f2', card: '#ffffff', primary: '#f43f5e', blob1: '#fb7185', blob2: '#fbbf24', isDark: false, glass: true },
    { name: 'Emerald', bg: '#064e3b', card: '#065f46', primary: '#10b981', blob1: '#059669', blob2: '#34d399', isDark: true, glass: true },
    { name: 'Nordic', bg: '#f8fafc', card: '#ffffff', primary: '#475569', blob1: '#94a3b8', blob2: '#cbd5e1', isDark: false, glass: false },
    { name: 'Cyberpunk', bg: '#000000', card: '#111111', primary: '#f0abfc', blob1: '#d946ef', blob2: '#3b82f6', isDark: true, glass: true }
];

export function openThemeCreator(editId = null) {
    activeCreatorTab = 'basis';
    openPopup('themeCreatorModal');
    if (editId) {
        const t = state.settings.customThemes.find(x => x.id === editId);
        if (t) {
            tempThemeState = JSON.parse(JSON.stringify(t));
            // Map colors object back to flat properties for the UI
            if (t.colors) {
                tempThemeState.bgSolid = t.colors['--bg-color'];
                tempThemeState.cardBg = t.colors['--card-bg'];
                tempThemeState.primary = t.colors['--primary-color'];
                tempThemeState.textMain = t.colors['--text-dark'] || (t.isDark ? '#fafafa' : '#1a1a1a');
                tempThemeState.textSecondary = t.colors['--text-grey'] || (t.isDark ? '#a1a1aa' : '#3a3a3a');
                tempThemeState.borderColor = t.colors['--input-border'] || (t.isDark ? '#27272a' : '#e0e0e0');
                tempThemeState.blobColor1 = t.colors['--blob-color-1'];
                tempThemeState.blobColor2 = t.colors['--blob-color-2'];
                const blurStr = t.colors['--glass-blur'] || '20px';
                tempThemeState.glassBlur = parseInt(blurStr);
            }
        }
    } else {
        tempThemeState = {
            id: 'custom-' + Date.now(),
            name: 'Mein Design',
            bgSolid: '#fcfbf9',
            cardBg: '#ffffff',
            textMain: '#1a1a1a',
            textSecondary: '#3a3a3a',
            borderColor: '#e0e0e0',
            primary: '#3b82f6',
            isGlassEnabled: true,
            shapeType: 'blob',
            blobColor1: '#6366f1',
            blobColor2: '#a855f7',
            glassBlur: 20,
            glassOpacity: 0.35,
            isDark: false
        };
    }
    // Initial Render of the Main Layout
    const msg = document.getElementById('themeCreatorContent');
    if (msg) msg.innerHTML = ''; // Reset layout state
    renderThemeCreator();
}

export function renderThemeCreator() {
    const container = document.getElementById('themeCreatorContent');
    if (!container) return;

    // 1. INITIALIZE LAYOUT IF EMPTY
    if (container.innerHTML.trim() === '') {
        container.innerHTML = `
            <div class="creator-sidebar">
                <div class="creator-tabs">
                    <button id="tab-basis" class="tab-btn" onclick="window.updateThemeCreatorTab('basis')">Basis</button>
                    <button id="tab-effekte" class="tab-btn" onclick="window.updateThemeCreatorTab('effekte')">Glass</button>
                    <button id="tab-presets" class="tab-btn" onclick="window.updateThemeCreatorTab('presets')">Presets</button>
                </div>
                <div class="tab-content-area" id="creatorTabContent"></div>
                <div style="padding: 20px; border-top: 1px solid var(--input-border); flex-shrink: 0;">
                    <button onclick="window.saveTheme()" class="main-btn" style="width: 100%; padding: 12px; font-size: 14px;">Speichern & Anwenden</button>
                </div>
            </div>
            <div class="creator-preview-panel">
                <div class="preview-canvas">
                    <div class="preview-glass-stage" id="previewGlassStage">
                        <div class="blob b1" id="previewBlob1"></div>
                        <div class="blob b2" id="previewBlob2"></div>
                        <div class="blob b3" id="previewBlob3"></div>
                    </div>
                    <!-- Realistic Header Mock -->
                    <div class="prev-header">
                        <div class="prev-logo"><div class="prev-logo-icon"></div></div>
                        <div class="prev-nav-glider">
                            <div class="prev-nav-pill active">Dashboard</div>
                            <div class="prev-nav-pill">Katalog</div>
                            <div class="prev-nav-pill">Favoriten</div>
                        </div>
                        <div class="prev-tools"><div class="prev-circle"></div></div>
                    </div>
                    <!-- Secondary Nav Mock -->
                    <div class="prev-secondary-nav">
                        <div class="prev-chip active">Alle</div>
                        <div class="prev-chip">Hardware</div>
                        <div class="prev-chip">Software</div>
                        <div class="prev-chip">Setup</div>
                    </div>
                    <!-- Scrollable Content Area -->
                    <div class="preview-scroll">
                        <!-- Filters Mock -->
                        <div class="prev-filter-bar">
                            <div class="prev-search-box"><div class="prev-search-icon"></div> Suchen...</div>
                            <div class="prev-chip-box">Sort: Favoriten</div>
                            <div class="prev-chip-box">Gekauft</div>
                        </div>
                        <!-- Grid Mock -->
                        <div class="prev-grid">
                            <!-- Card 1 -->
                            <div class="preview-card">
                                <div class="prev-card-img-container"><div class="prev-card-img"></div></div>
                                <div class="prev-card-body">
                                    <div class="prev-card-content-split">
                                        <div class="prev-info-left">
                                            <div class="prev-card-vendor">APPLE</div>
                                            <div class="prev-card-title">Apple Vision Pro</div>
                                            <div class="prev-card-price">3499.00 <span class="prev-currency">€</span></div>
                                        </div>
                                        <div class="prev-status-right">
                                            <div style="color:var(--text-grey);"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg></div>
                                            <div style="color:var(--text-grey);"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg></div>
                                            <div style="color:var(--text-grey);"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></div>
                                        </div>
                                    </div>
                                    <div class="prev-card-footer">
                                        <div class="prev-slider-track"><div class="prev-slider-thumb"></div></div>
                                        <div class="prev-rating-val">0.0 / 10</div>
                                    </div>
                                </div>
                            </div>
                            <!-- Card 2 -->
                            <div class="preview-card">
                                <div class="prev-card-img-container"><div class="prev-card-img" style="background:#555;"></div></div>
                                <div class="prev-card-body">
                                    <div class="prev-card-content-split">
                                        <div class="prev-info-left">
                                            <div class="prev-card-vendor">HERMAN MILLER</div>
                                            <div class="prev-card-title">Herman Miller Embody</div>
                                            <div class="prev-card-price">1850.00 <span class="prev-currency">€</span></div>
                                        </div>
                                        <div class="prev-status-right">
                                            <div style="color:var(--text-grey);"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg></div>
                                            <div style="color:#f1c40f;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg></div>
                                            <div style="color:var(--text-grey);"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></div>
                                        </div>
                                    </div>
                                    <div class="prev-card-footer">
                                        <div class="prev-slider-track"><div class="prev-slider-thumb"></div></div>
                                        <div class="prev-rating-val">0.0 / 10</div>
                                    </div>
                                </div>
                            </div>
                             <!-- Card 3 -->
                             <div class="preview-card">
                                <div class="prev-card-img-container"><div class="prev-card-img" style="background:#334;"></div></div>
                                <div class="prev-card-body">
                                    <div class="prev-card-content-split">
                                        <div class="prev-info-left">
                                            <div class="prev-card-vendor">AMAZON</div>
                                            <div class="prev-card-title">Audeze Maxwell</div>
                                            <div class="prev-card-price">349.00 <span class="prev-currency">€</span></div>
                                        </div>
                                        <div class="prev-status-right">
                                            <div style="color:var(--text-grey);"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg></div>
                                            <div style="color:var(--text-grey);"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg></div>
                                            <div style="color:var(--text-grey);"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></div>
                                        </div>
                                    </div>
                                    <div class="prev-card-footer">
                                        <div class="prev-slider-track"><div class="prev-slider-thumb"></div></div>
                                        <div class="prev-rating-val">0.0 / 10</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div style="position:absolute; bottom:20px; right:20px; background:rgba(0,0,0,0.5); color:#fff; padding:5px 12px; border-radius:20px; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1px; z-index:10;">Live Vorschau</div>
            </div>
        `;
    }

    // 2. UPDATE TABS UI
    container.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.id === `tab-${activeCreatorTab}`);
    });

    // 3. RENDER TAB CONTENT
    renderCreatorTabContent();

    // 4. UPDATE PREVIEW
    updatePreviewStyles();
}

function renderCreatorTabContent() {
    const area = document.getElementById('creatorTabContent');
    if (!area) return;

    const { name, isGlassEnabled, shapeType, blobColor1, blobColor2, bgSolid, cardBg, textMain, textSecondary, borderColor, glassBlur, glassOpacity, isDark, primary } = tempThemeState;

    if (activeCreatorTab === 'basis') {
        area.innerHTML = `
            <div class="creator-section active">
                <div class="creator-group" style="margin-bottom:12px;">
                    <label>Name des Designs</label>
                    <input type="text" class="modal-input" placeholder="z.B. Ocean Breeze" value="${name}" oninput="window.updateThemeState('name', this.value)">
                </div>
                
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-top:16px;">
                    <div class="creator-group" style="margin-bottom:0;">
                        <label>Hintergrund</label>
                        <div class="color-input-wrapper">
                            <input type="color" value="${bgSolid}" oninput="window.updateThemeState('bgSolid', this.value)">
                            <span class="color-hex">${bgSolid}</span>
                        </div>
                    </div>
                    ${!isGlassEnabled ? `
                    <div class="creator-group" style="margin-bottom:0;">
                        <label>Karten & Boxen</label>
                        <div class="color-input-wrapper">
                            <input type="color" value="${cardBg}" oninput="window.updateThemeState('cardBg', this.value)">
                            <span class="color-hex">${cardBg}</span>
                        </div>
                    </div>
                    ` : `
                    <div class="creator-group" style="margin-bottom:0; opacity:0.5; pointer-events:none;">
                        <label>Karten & Boxen</label>
                        <div class="color-input-wrapper">
                            <input type="color" value="${cardBg}" disabled>
                            <span class="color-hex" style="font-size:11px;">(via Glass Farbe)</span>
                        </div>
                    </div>
                    `}
                    <div class="creator-group" style="margin-bottom:0;">
                        <label>Akzentfarbe</label>
                        <div class="color-input-wrapper">
                            <input type="color" value="${primary}" oninput="window.updateThemeState('primary', this.value)">
                            <span class="color-hex">${primary}</span>
                        </div>
                    </div>
                    <div class="creator-group" style="margin-bottom:0;">
                        <label>Text (Haupt)</label>
                        <div class="color-input-wrapper">
                            <input type="color" value="${textMain}" oninput="window.updateThemeState('textMain', this.value)">
                            <span class="color-hex">${textMain}</span>
                        </div>
                    </div>
                    <div class="creator-group" style="margin-bottom:0;">
                        <label>Text (Neben) & Icons</label>
                        <div class="color-input-wrapper">
                            <input type="color" value="${textSecondary}" oninput="window.updateThemeState('textSecondary', this.value)">
                            <span class="color-hex">${textSecondary}</span>
                        </div>
                    </div>
                    <div class="creator-group" style="margin-bottom:0;">
                        <label>Linien & Rahmen</label>
                        <div class="color-input-wrapper">
                            <input type="color" value="${borderColor}" oninput="window.updateThemeState('borderColor', this.value)">
                            <span class="color-hex">${borderColor}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else if (activeCreatorTab === 'effekte') {
        area.innerHTML = `
            <div class="creator-section active">
                <div class="creator-group">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <label>Glass-Effekt aktivieren</label>
                        <label class="switch-small"><input type="checkbox" ${isGlassEnabled ? 'checked' : ''} onchange="window.updateThemeState('isGlassEnabled', this.checked)"><span class="slider"></span></label>
                    </div>
                </div>
                
                ${isGlassEnabled ? `
                <div class="creator-group">
                    <label>Glass Modus (Wie sich Farben überdecken)</label>
                    <div style="display:flex; gap:10px;">
                        <button class="tab-btn ${!isDark ? 'active' : ''}" style="flex:1;" onclick="window.updateThemeState('isDark', false)">Hell</button>
                        <button class="tab-btn ${isDark ? 'active' : ''}" style="flex:1;" onclick="window.updateThemeState('isDark', true)">Dunkel</button>
                    </div>
                </div>
                <div class="creator-group" style="margin-bottom:12px;">
                    <label>Glass Farbe (Deckkraft beachten)</label>
                    <div class="color-input-wrapper">
                        <input type="color" value="${cardBg}" oninput="window.updateThemeState('cardBg', this.value)">
                        <span class="color-hex">${cardBg}</span>
                    </div>
                </div>
                <div class="creator-group slider-group">
                    <div class="slider-header"><label>Glass Blur (Unschärfe)</label><span class="slider-val">${glassBlur}px</span></div>
                    <input type="range" min="0" max="80" value="${glassBlur}" oninput="window.updateThemeState('glassBlur', parseInt(this.value))">
                </div>
                <div class="creator-group slider-group">
                    <div class="slider-header"><label>Glass Transparenz (Nur bei Dark Mode)</label><span class="slider-val">${Math.round(glassOpacity * 100)}%</span></div>
                    <input type="range" min="5" max="95" value="${Math.round(glassOpacity * 100)}" oninput="window.updateThemeState('glassOpacity', parseFloat(this.value)/100)">
                </div>

                <hr style="border:0; border-top:1px solid var(--input-border); margin:16px 0;">

                <div class="creator-group">
                    <label>Hintergrund-Formen (Hinter dem Glas)</label>
                    <select onchange="window.updateThemeState('shapeType', this.value)" class="modern-select" style="margin-bottom:12px; width:100%;">
                        <option value="blob" ${shapeType === 'blob' ? 'selected' : ''}>Organisch (Blobs)</option>
                        <option value="circle" ${shapeType === 'circle' ? 'selected' : ''}>Geometrisch (Kreise)</option>
                    </select>
                </div>
                <div style="display:flex; gap:12px;">
                    <div class="creator-group" style="flex:1; margin-bottom:0;">
                        <label>Form 1</label>
                        <div class="color-input-wrapper">
                            <input type="color" value="${blobColor1}" oninput="window.updateThemeState('blobColor1', this.value)">
                            <span class="color-hex">${blobColor1}</span>
                        </div>
                    </div>
                    <div class="creator-group" style="flex:1; margin-bottom:0;">
                        <label>Form 2</label>
                        <div class="color-input-wrapper">
                            <input type="color" value="${blobColor2}" oninput="window.updateThemeState('blobColor2', this.value)">
                            <span class="color-hex">${blobColor2}</span>
                        </div>
                    </div>
                </div>
                ` : `
                <div style="padding:16px; text-align:center; color:var(--text-grey); font-size:13px; border:1px dashed var(--input-border); border-radius:12px;">
                    Aktiviere Glass, um Tiefeneffekte und Hintergrundformen zu verwenden.
                </div>
                `}
            </div>
        `;
    } else if (activeCreatorTab === 'presets') {
        area.innerHTML = `
            <div class="creator-section active">
                <div class="preset-grid">
                    ${THEME_PRESETS.map(p => `
                        <div class="preset-card" onclick="window.applyPreset('${p.name}')">
                            <div class="preset-preview">
                                <div class="p-col" style="background:${p.bg}"></div>
                                <div class="p-col" style="background:${p.primary}"></div>
                                <div class="p-col" style="background:linear-gradient(135deg, ${p.blob1}, ${p.blob2})"></div>
                            </div>
                            <div class="preset-name">${p.name}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}

function updatePreviewStyles() {
    const container = document.getElementById('themeCreatorContent');
    const canvas = container.querySelector('.preview-canvas');
    if (!canvas) return;

    const { isGlassEnabled, bgSolid, cardBg, textMain, textSecondary, borderColor, glassBlur, glassOpacity, isDark, primary, blobColor1, blobColor2 } = tempThemeState;
    const isDarkNow = !!isDark;
    const mainText = textMain || (isDarkNow ? '#ffffff' : '#1a1a1a');

    // Convert hex to RGB for transparent glass
    let r = 255, g = 255, b = 255;
    if (cardBg) {
        let hex = cardBg.replace('#', '');
        if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        if (hex.length === 6) {
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
        }
    }

    // Fallbacks
    const safeBlur = isNaN(glassBlur) ? 20 : glassBlur;
    const safeOpacity = isNaN(glassOpacity) ? 0.35 : glassOpacity;

    // ISOLATE PREVIEW STYLING ENTIRLY
    // By re-defining the standard app CSS variables locally on .preview-canvas,
    // all the inherited styles of elements inside .preview-canvas (pills, cards, etc) will use the new colors natively.
    const glassCardBg = isDarkNow ? `rgba(${r},${g},${b},${safeOpacity * 0.8})` : `rgba(${r},${g},${b},${safeOpacity})`;
    const glassCardBorder = isDarkNow ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.4)';

    canvas.style.setProperty('--bg-color', bgSolid || '#ffffff', 'important');
    canvas.style.setProperty('--card-bg', isGlassEnabled ? glassCardBg : (cardBg || '#ffffff'), 'important');
    canvas.style.setProperty('--text-main', mainText, 'important');
    canvas.style.setProperty('--text-dark', mainText, 'important');
    canvas.style.setProperty('--text-grey', textSecondary || (isDarkNow ? '#a1a1aa' : '#3a3a3a'), 'important');
    canvas.style.setProperty('--input-border', isGlassEnabled ? glassCardBorder : (borderColor || '#e0e0e0'), 'important');
    canvas.style.setProperty('--primary-color', primary || '#3b82f6', 'important');
    canvas.style.setProperty('--glass-blur', `${safeBlur}px`, 'important');
    canvas.style.setProperty('--blob-color-1', blobColor1 || '#6366f1', 'important');
    canvas.style.setProperty('--blob-color-2', blobColor2 || '#a855f7', 'important');

    const rootBackdrop = isGlassEnabled ? `blur(${safeBlur}px) saturate(160%)` : 'none';
    canvas.style.setProperty('--preview-backdrop', rootBackdrop, 'important');

    // Explicitly set the canvas backplates ensuring they apply correctly
    canvas.style.setProperty('background-color', 'var(--bg-color)', 'important');
    canvas.style.setProperty('color', 'var(--text-dark)', 'important');

    // 3. Clear direct legacy inline styles, cards now inherit --preview-backdrop & --card-bg.
    const previewCards = canvas.querySelectorAll('.preview-card');
    previewCards.forEach(card => {
        card.style.background = 'var(--card-bg)';
        card.style.borderColor = 'var(--input-border)';
        card.style.backdropFilter = 'var(--preview-backdrop)';
        card.style.webkitBackdropFilter = 'var(--preview-backdrop)';
    });

    // 4. Update the "Local Stage" (Blobs/Circles)
    const previewStage = canvas.querySelector('.preview-glass-stage');
    if (previewStage) {
        previewStage.className = `preview-glass-stage ${tempThemeState.shapeType === 'circle' ? 'use-circles' : 'use-blobs'}`;
        previewStage.style.setProperty('opacity', isGlassEnabled ? '1' : '0', 'important');
        const blobs = previewStage.querySelectorAll('.blob');
        blobs.forEach(b => {
            b.style.setProperty('mix-blend-mode', isDarkNow ? 'screen' : 'multiply', 'important');
            b.style.setProperty('opacity', (isDarkNow ? '0.6' : '0.8'), 'important');
            b.style.setProperty('background', `linear-gradient(135deg, ${blobColor1 || '#6366f1'}, ${blobColor2 || '#a855f7'})`, 'important');
        });
    }
}

export function updateThemeCreatorTab(tab) {
    if (activeCreatorTab === tab) return;
    activeCreatorTab = tab;

    // Update Tabs UI
    const container = document.getElementById('themeCreatorContent');
    if (container) {
        container.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.id === `tab-${tab}`);
        });
    }

    renderCreatorTabContent();
}

export function applyPreset(name) {
    const p = THEME_PRESETS.find(x => x.name === name);
    if (!p) return;
    tempThemeState = {
        ...tempThemeState,
        bgSolid: p.bg,
        cardBg: p.card,
        primary: p.primary,
        blobColor1: p.blob1,
        blobColor2: p.blob2,
        isDark: !!p.isDark,
        isGlassEnabled: !!p.glass
    };
    renderThemeCreator();
}

export function updateThemeState(key, val) {
    tempThemeState[key] = val;

    // 1. Update the Live Preview Canvas
    updatePreviewStyles();

    // 2. Focused UI Updates (Avoid re-rendering the whole tab if possible to keep focus/picker open)
    const area = document.getElementById('creatorTabContent');
    if (!area) return;

    // Update Hex Labels if a color changed
    if (key.includes('Color') || key === 'primary' || key === 'bgSolid' || key === 'cardBg') {
        const wrappers = area.querySelectorAll('.color-input-wrapper');
        wrappers.forEach(w => {
            const input = w.querySelector('input');
            const hex = w.querySelector('.color-hex');
            if (input && hex && input.value.toLowerCase() === val.toString().toLowerCase()) {
                hex.innerText = val.toUpperCase();
            }
        });
    }

    // Update Slider Value Labels
    if (key === 'glassBlur' || key === 'glassOpacity') {
        const sliderGroups = area.querySelectorAll('.slider-group');
        sliderGroups.forEach(g => {
            const input = g.querySelector('input');
            const valLabel = g.querySelector('.slider-val');
            if (input && valLabel) {
                if (key === 'glassBlur' && input.value == val) {
                    valLabel.innerText = val + 'px';
                }
                if (key === 'glassOpacity' && Math.round(parseFloat(input.value)) == Math.round(val * 100)) {
                    valLabel.innerText = Math.round(val * 100) + '%';
                }
            }
        });
    }

    // Structural triggers: Only re-render the whole tab for toggles/switches/tabs
    if (key === 'isDark' || key === 'isGlassEnabled' || key === 'shapeType') {
        renderCreatorTabContent();
    }
}

export function saveTheme() {
    if (!tempThemeState.name) return;

    // Automate isDark based on background color lightness
    let isDarkBg = false;
    if (tempThemeState.bgSolid) {
        let hex = tempThemeState.bgSolid.replace('#', '');
        if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        isDarkBg = (yiq < 128);
    }

    // Convert hex to RGB for transparent glass cardBg
    let r = 255, g = 255, b = 255;
    if (tempThemeState.cardBg) {
        let hex = tempThemeState.cardBg.replace('#', '');
        if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        if (hex.length === 6) {
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
        }
    }

    const safeOpacity = isNaN(tempThemeState.glassOpacity) ? 0.35 : tempThemeState.glassOpacity;
    const isDarkNow = tempThemeState.isGlassEnabled ? !!tempThemeState.isDark : isDarkBg;
    const glassCardBg = isDarkNow ? `rgba(${r},${g},${b},${safeOpacity * 0.8})` : `rgba(${r},${g},${b},${safeOpacity})`;
    const glassCardBorder = isDarkNow ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.4)';

    const finalTheme = {
        id: tempThemeState.id,
        name: tempThemeState.name,
        type: 'custom',
        isGlassEnabled: !!tempThemeState.isGlassEnabled,
        shapeType: tempThemeState.shapeType || 'blob',
        isDark: isDarkNow,
        blobColor1: tempThemeState.blobColor1,
        blobColor2: tempThemeState.blobColor2,
        glassBlur: tempThemeState.glassBlur || 20,
        glassOpacity: tempThemeState.glassOpacity || 0.35,
        primary: tempThemeState.primary || '#3b82f6',
        colors: {
            '--bg-color': tempThemeState.bgSolid,
            '--card-bg': tempThemeState.cardBg,
            '--glass-bg': glassCardBg,
            '--glass-border': glassCardBorder,
            '--text-main': tempThemeState.textMain || (tempThemeState.isDark ? '#fafafa' : '#1a1a1a'),
            '--text-dark': tempThemeState.textMain || (tempThemeState.isDark ? '#fafafa' : '#1a1a1a'),
            '--text-grey': tempThemeState.textSecondary || (tempThemeState.isDark ? '#a1a1aa' : '#3a3a3a'),
            '--input-border': tempThemeState.borderColor || (tempThemeState.isDark ? '#27272a' : '#e0e0e0'),
            '--blob-color-1': tempThemeState.blobColor1,
            '--blob-color-2': tempThemeState.blobColor2,
            '--glass-blur': (tempThemeState.glassBlur || 20) + 'px',
            '--primary-color': tempThemeState.primary
        }
    };

    if (!state.settings.customThemes) state.settings.customThemes = [];
    const idx = state.settings.customThemes.findIndex(t => t.id === finalTheme.id);
    if (idx > -1) state.settings.customThemes[idx] = finalTheme;
    else state.settings.customThemes.push(finalTheme);

    saveData();
    closePopup('themeCreatorModal');
    renderThemeManager();
    loadTheme(finalTheme.id);
}

export function closeThemeCreator() {
    closePopup('themeCreatorModal');
    // Ensure actual global theme is intact
    loadTheme(state.settings.activeThemeId);
}

export function openThemeManagerWrapper() {
    renderThemeManager();
    openPopup('settingsModal');
}

export function deleteCustomTheme(id, event) {
    if (event) event.stopPropagation();
    if (confirm('Bist du sicher, dass du dieses Design löschen möchtest?')) {
        state.settings.customThemes = state.settings.customThemes.filter(t => t.id !== id);
        if (state.settings.activeThemeId === id) {
            state.settings.activeThemeId = 'dark'; // Fallback
            loadTheme('dark');
        }
        saveData();
        renderThemeManager();
    }
}
