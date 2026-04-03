import { state, saveAll } from '../store.js';
import { svgGear, iconTrash } from '../constants.js';
import { openPopup, closePopup } from '../utils.js';

export function renderWebsites() {
    const grid = document.getElementById('websiteGrid');
    if (!grid) return;
    grid.innerHTML = '';
    const ws = state.websites.filter(w => state.websiteCat === 'Allgemein' || w.c === state.websiteCat);

    ws.forEach((w) => {
        const logo = `<div class="shop-logo-placeholder">${w.s}</div>`;
        grid.innerHTML += `
        <a href="${w.u}" target="_blank" class="shop-card-modern">
            <div class="shop-menu-btn" onclick="event.preventDefault(); event.stopPropagation();">⋮</div>
            ${logo}
            <div class="shop-name-modern">${w.n}</div>
        </a>`;
    });

    grid.innerHTML += `
    <div class="shop-card-modern add-shop-card" onclick="window.openAddWebsiteModal()">
        <div class="shop-logo-placeholder" style="border-style:dashed; background:transparent; font-size:32px; color:var(--text-grey);">+</div>
        <div class="shop-name-modern" style="color:var(--text-grey);">Shop hinzufügen</div>
    </div>`;

    if (window.applyGlobalTheme) window.applyGlobalTheme();

    // Ensure filters are also rendered when websites are shown
    renderWebsiteFilters();
}

export function renderWebsiteFilters() {
    // 1. Target the CHIP container specifically
    const chipContainer = document.getElementById('websiteChipContainer');
    if (!chipContainer) {
        console.error("CRITICAL: websiteChipContainer not found. Is index.html updated?");
        return;
    }

    // 2. Ensure state validity
    let cats = state.websiteCats;
    if (!cats || !Array.isArray(cats) || cats.length === 0) {
        cats = ['Allgemein'];
        state.websiteCats = cats;
    }

    // 3. Render Chips
    let html = '';
    cats.forEach(wc => {
        const act = state.websiteCat === wc ? 'active' : '';
        const shk = state.isDeleteModeWebCats ? 'shaking' : '';
        const edt = state.isEditingWebCats ? 'editable' : '';
        // Defensive quoting
        const clk = state.isDeleteModeWebCats ? `window.deleteWebCat('${wc.replace(/'/g, "\\'")}', event)` : `window.filterWebsites('${wc.replace(/'/g, "\\'")}', this)`;

        // Drag Events
        let dragEvents = '';
        if (state.isEditingWebCats) {
            dragEvents = `draggable="true" 
                ondragstart="window.handleWebDragStart(event, '${wc.replace(/'/g, "\\'")}')" 
                ondragover="window.handleWebDragOver(event)" 
                ondragenter="window.handleWebDragEnter(event)" 
                ondragleave="window.handleWebDragLeave(event)" 
                ondrop="window.handleWebDrop(event, '${wc.replace(/'/g, "\\'")}')" 
                ondragend="window.handleWebDragEnd(event)"`;
        }

        // Force visibility on chips too
        html += `<button class="filter-chip ${act} ${shk} ${edt}" ${dragEvents} onclick="${clk}" style="visibility: visible !important; opacity: 1 !important; display: inline-block !important;">${wc}</button>`;
    });
    chipContainer.innerHTML = html;

    // 4. Update Gear/Panel State (Active Classes)
    const toolsBtn = document.querySelector('#websiteToolsContainer .gear-icon-btn');
    const panel = document.getElementById('websiteToolsPanel');
    const trashBtn = document.querySelector('#websiteToolsPanel .share-btn');

    if (toolsBtn) {
        if (state.isEditingWebCats) toolsBtn.classList.add('active');
        else toolsBtn.classList.remove('active');
    }

    if (panel) {
        if (state.isEditingWebCats) panel.classList.add('show');
        else panel.classList.remove('show');
    }

    if (trashBtn) {
        if (state.isDeleteModeWebCats) trashBtn.classList.add('active');
        else trashBtn.classList.remove('active');
    }

    console.log("renderWebsiteFilters: Chips updated & Tools state applied.");
}

export function filterWebsites(cat, btn) {
    if (state.websiteCat === cat && cat !== 'Allgemein') {
        filterWebsites('Allgemein', null);
        return;
    }
    state.websiteCat = cat;
    const grid = document.getElementById('websiteGrid');
    if (grid) {
        grid.classList.remove('anim-right', 'anim-left', 'anim-up');
        void grid.offsetWidth;
        grid.classList.add('anim-up');
    }
    renderWebsites();
    renderWebsiteFilters();
}

export function toggleWebEdit(e) {
    if (e) e.stopPropagation();
    state.isEditingWebCats = !state.isEditingWebCats;
    if (!state.isEditingWebCats) state.isDeleteModeWebCats = false;

    // Force instant update for premium feel
    const chipContainer = document.getElementById('websiteChipContainer');
    if (chipContainer) {
        const chips = chipContainer.querySelectorAll('.filter-chip');
        chips.forEach(el => {
            if (state.isEditingWebCats) el.classList.add('editable');
            else el.classList.remove('editable');
        });

        // Update tools
        const toolsBtn = document.querySelector('#websiteToolsContainer .gear-icon-btn');
        const panel = document.getElementById('websiteToolsPanel');
        if (toolsBtn) {
            if (state.isEditingWebCats) toolsBtn.classList.add('active');
            else toolsBtn.classList.remove('active');
        }
        if (panel) {
            if (state.isEditingWebCats) panel.classList.add('show');
            else panel.classList.remove('show');
        }
    }

    renderWebsiteFilters();
}

export function toggleWebDelete(e) { e.stopPropagation(); state.isDeleteModeWebCats = !state.isDeleteModeWebCats; renderWebsiteFilters(); }

export function addNewWebCat() {
    const v = document.getElementById('newWebCatInp').value.trim();
    if (v && !state.websiteCats.includes(v)) {
        state.websiteCats.push(v);
        saveAll();
        renderWebsiteFilters();
    }
}

export function deleteWebCat(c, e) {
    e.stopPropagation();
    state.websiteCats = state.websiteCats.filter(x => x !== c);
    saveAll();
    renderWebsiteFilters();
    renderWebsites();
}

export function openAddWebsiteModal() {
    const c = document.getElementById('newWebCatContainer');
    if (c) {
        c.className = 'chip-container';
        c.innerHTML = '';
        const initialSel = state.websiteCats.length > 0 ? state.websiteCats[0] : '';
        const hiddenInp = document.getElementById('newWebCatSelected');
        if (hiddenInp) hiddenInp.value = initialSel;

        state.websiteCats.forEach(cat => {
            const d = document.createElement('div');
            d.className = 'select-chip' + (cat === initialSel ? ' selected' : '');
            d.innerText = cat;
            d.onclick = () => {
                document.querySelectorAll('#newWebCatContainer .select-chip').forEach(x => x.classList.remove('selected'));
                d.classList.add('selected');
                if (hiddenInp) hiddenInp.value = cat;
            };
            c.appendChild(d);
        });
    }
    openPopup('addWebsiteModal');
}

export function confirmAddWebsite() {
    const n = document.getElementById('newWebName').value;
    const u = document.getElementById('newWebUrl').value;
    const hiddenInp = document.getElementById('newWebCatSelected');
    const c = hiddenInp ? hiddenInp.value : (state.websiteCats[0] || 'Allgemein');

    if (n && u) {
        state.websites.push({ n, u, c, s: n.charAt(0) });
        saveAll();
        closePopup('addWebsiteModal');
        renderWebsites();

        // Reset inputs
        document.getElementById('newWebName').value = '';
        document.getElementById('newWebUrl').value = '';
    }
}

/* --- DRAG & DROP FOR WEBSITE FILTERS --- */
export function handleWebDragStart(e, cat) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', cat);
    e.currentTarget.classList.add('dragging');
}

export function handleWebDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('drag-over');
    return false;
}

export function handleWebDragEnter(e) {
    e.currentTarget.classList.add('drag-over');
}

export function handleWebDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

export function handleWebDrop(e, targetCat) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');

    const draggedCat = e.dataTransfer.getData('text/plain');
    if (draggedCat === targetCat) return;

    const fromIdx = state.websiteCats.indexOf(draggedCat);
    const toIdx = state.websiteCats.indexOf(targetCat);

    if (fromIdx !== -1 && toIdx !== -1) {
        // Move item in array
        state.websiteCats.splice(fromIdx, 1);
        state.websiteCats.splice(toIdx, 0, draggedCat);
        saveAll();
        renderWebsiteFilters();
    }
    return false;
}

export function handleWebDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    document.querySelectorAll('.filter-chip').forEach(el => el.classList.remove('drag-over'));
}

// Expose to window
window.handleWebDragStart = handleWebDragStart;
window.handleWebDragOver = handleWebDragOver;
window.handleWebDragEnter = handleWebDragEnter;
window.handleWebDragLeave = handleWebDragLeave;
window.handleWebDrop = handleWebDrop;
window.handleWebDragEnd = handleWebDragEnd;
