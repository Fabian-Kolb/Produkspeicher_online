import { state, saveAll } from '../store.js';
import { iconShoppingBag, iconBookmark, iconHeart, iconTrash, iconEdit, iconStar } from '../constants.js';
import { openPopup, closePopup, fireConfetti, updateMarquees, escapeHtml, showToast } from '../utils.js';
import { renderProductCard, renderEmptyState } from '../components/card.js';

export function renderProducts() {
    const grid = document.getElementById('productGrid');
    const addSec = document.getElementById('addProductSection');

    if (state.mainCat === 'Hinzufügen') {
        if (addSec) addSec.classList.add('visible');
        if (grid) grid.style.display = 'none';
        return;
    } else {
        if (addSec) addSec.classList.remove('visible');
        if (grid) grid.style.display = 'grid';
    }

    let f = getSortedAndFilteredProducts();

    if (f.length === 0) {
        renderEmptyState('productGrid', !!state.searchQuery, window.navigateToCreatePage);
    } else {
        if (grid) {
            grid.innerHTML = '';
            f.forEach(p => renderProductCard(p, grid));
        }
    }
    updateMarquees();
    const filterSec = document.getElementById('sharedFilterSection');
    if (filterSec) filterSec.style.display = 'block';
    if (window.applyGlobalTheme) window.applyGlobalTheme();
}

export function renderSavedItems() {
    const grid = document.getElementById('savedGrid');
    if (!grid) return;
    let f = getSortedAndFilteredProducts().filter(p => (p.inWishlist || p.fav));
    if (f.length === 0) {
        renderEmptyState('savedGrid', !!state.searchQuery, window.navigateToCreatePage);
    } else {
        grid.innerHTML = '';
        grid.style.display = 'grid';
        f.forEach(p => renderProductCard(p, grid));
    }
    updateMarquees();
    const filterSec = document.getElementById('sharedFilterSection');
    if (filterSec) filterSec.style.display = 'block';
    if (window.applyGlobalTheme) window.applyGlobalTheme();
}

export function getSortedAndFilteredProducts() {
    let f = [...state.products];
    f = f.filter(p => {
        try {
            const note = p.note ? JSON.parse(p.note) : null;
            return !(note && note.type === 'outfit');
        } catch (e) { return true; }
    });

    if (state.mainCat !== 'Alle' && state.mainCat !== 'Hinzufügen') f = f.filter(p => p.category === state.mainCat);
    if (state.selectedSubCats.length > 0) f = f.filter(p => state.selectedSubCats.includes(p.sub));

    if (state.statusFilter === 'bought') f = f.filter(p => p.bought);
    else if (state.statusFilter === 'reduced') f = f.filter(p => !p.bought && (parseFloat(p.discount) > 0));
    else f = f.filter(p => !p.bought);

    if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase();
        f = f.filter(p => (p.name && p.name.toLowerCase().includes(q)) || (p.shop && p.shop.toLowerCase().includes(q)));
    }

    f.sort((a, b) => {
        if (state.sortMode === 'priceAsc') return a.price - b.price;
        if (state.sortMode === 'priceDesc') return b.price - a.price;
        if (state.sortMode === 'newest') return b.id - a.id;
        if (state.sortMode === 'oldest') return a.id - b.id;
        return 0;
    });
    return f;
}

export function toggleStatusFilter(type) {
    if (state.statusFilter === type) state.statusFilter = 'active';
    else state.statusFilter = type;

    // Update Chips UI
    const bChip = document.getElementById('chipStatBought');
    const rChip = document.getElementById('chipStatReduced');

    if (bChip) bChip.classList.remove('active');
    if (rChip) rChip.classList.remove('active');

    if (state.statusFilter === 'bought' && bChip) bChip.classList.add('active');
    if (state.statusFilter === 'reduced' && rChip) rChip.classList.add('active');

    renderProducts();
}

export function MapsToReduced() {
    window.switchView('products');
    window.switchMainCategory('Alle', null, -1);
    state.statusFilter = 'reduced';
    renderProducts();
    // Update UI to reflect reduction filter active
    setTimeout(() => {
        const rChip = document.getElementById('chipStatReduced');
        if (rChip) rChip.classList.add('active');
    }, 100);
}

export function saveProduct() {
    const p = {
        id: state.editingId || Date.now(),
        name: document.getElementById('inpName').value || 'Unbenannt',
        shop: document.getElementById('inpShop').value,
        url: document.getElementById('inpUrl').value,
        price: parseFloat(document.getElementById('inpPrice').value) || 0,
        discount: parseFloat(document.getElementById('inpDiscount').value) || 0,
        details: document.getElementById('inpDetails').value,
        category: state.modalCat,
        sub: state.modalSub,
        imgs: state.tempImgs,
        fav: false, bought: false, inWishlist: false,
        rating: parseFloat(document.getElementById('inpRating').value) || 0
    };
    if (state.editingId) {
        const idx = state.products.findIndex(x => x.id == state.editingId);
        if (idx > -1) {
            p.fav = state.products[idx].fav;
            p.bought = state.products[idx].bought;
            p.inWishlist = state.products[idx].inWishlist;
            p.rating = state.products[idx].rating;
            state.products[idx] = p;
        }
    } else {
        state.products.push(p);
        fireConfetti(window.innerWidth / 2, window.innerHeight / 2);
    }
    saveAll();
    closePopup('productModal');
    renderProducts();
    if (window.syncMonthlyBudget) window.syncMonthlyBudget();
}

export function openEditModal(id, e) {
    if (e) e.stopPropagation();
    const p = state.products.find(x => x.id == id);
    if (!p) return;
    state.editingId = id;
    state.tempImgs = p.imgs || (p.img ? [p.img] : []);
    state.modalCat = p.category;
    state.modalSub = p.sub;

    document.getElementById('inpName').value = p.name;
    document.getElementById('inpShop').value = p.shop;
    document.getElementById('inpUrl').value = p.url || '';
    document.getElementById('inpPrice').value = p.price;
    document.getElementById('inpDiscount').value = p.discount || '';
    document.getElementById('inpDetails').value = p.details || '';
    const rEl = document.getElementById('inpRating');
    if (rEl) {
        rEl.value = p.rating || 0;
        if (document.getElementById('modalRatingVal')) document.getElementById('modalRatingVal').innerText = p.rating || 0;
    }

    renderChipContainer('editMainCatContainer', state.categories, state.modalCat, (c) => { state.modalCat = c; renderModalSubCats(); });
    renderModalSubCats();
    if (window.renderGallery) window.renderGallery();
    calculateTotal();
    openPopup('productModal');
}

export function deleteProduct(id, e) {
    if (e) e.stopPropagation();
    // Use window.openConfirmModal if available, otherwise fallback
    if (window.openConfirmModal) {
        window.openConfirmModal('Produkt löschen', 'Möchtest du dieses Produkt wirklich unwiderruflich löschen?', () => {
            performDelete(id);
        });
    } else {
        if (confirm('Möchtest du dieses Produkt wirklich löschen?')) {
            performDelete(id);
        }
    }
}

function performDelete(id) {
    state.products = state.products.filter(x => x.id != id);
    saveAll();
    renderProducts();
    if (state.currentView === 'saved') renderSavedItems();
    if (window.syncMonthlyBudget) window.syncMonthlyBudget();
    showToast('Produkt gelöscht');
}

export function toggleFavorite(id, e) {
    if (e) e.stopPropagation();
    const p = state.products.find(x => x.id == id);
    if (p) {
        p.fav = !p.fav;
        saveAll();
        renderProducts();
        if (state.currentView === 'saved') renderSavedItems();
        showToast(p.fav ? 'Zu Favoriten hinzugefügt' : 'Aus Favoriten entfernt');
    }
}

export function toggleBought(id, e) {
    if (e) e.stopPropagation();
    const p = state.products.find(x => x.id == id);
    if (p) {
        p.bought = !p.bought;
        if (p.bought) p.date = new Date().toISOString();
        saveAll();
        renderProducts();
        if (state.currentView === 'saved') renderSavedItems();
        if (window.renderAnalytics) window.renderAnalytics();
        if (window.syncMonthlyBudget) window.syncMonthlyBudget();
        showToast(p.bought ? 'Als gekauft markiert' : 'Kaufstatus entfernt');
    }
}

export function toggleWishlist(id, e) {
    if (e) e.stopPropagation();
    const p = state.products.find(x => x.id == id);
    if (p) {
        p.inWishlist = !p.inWishlist;
        saveAll();
        renderProducts();
        if (state.currentView === 'saved') renderSavedItems();
        showToast(p.inWishlist ? 'Zu Favoriten hinzugefügt' : 'Von Favoriten entfernt');
    }
}

export function updateRatingSave(id, val) {
    const p = state.products.find(x => x.id == id);
    if (p) { p.rating = parseFloat(val); saveAll(); }
}

export function updateRatingVisual(id, val, el) {
    const numEl = document.getElementById('rnum-' + id);
    if (numEl) numEl.innerText = parseFloat(val).toFixed(1) + ' / 10';
}

export function calculateTotal() {
    const p = parseFloat(document.getElementById('inpPrice').value) || 0;
    const d = parseFloat(document.getElementById('inpDiscount').value) || 0;
    const end = p - (p * d / 100);
    const disp = document.getElementById('displayFinalPrice');
    if (disp) disp.innerText = end.toFixed(2) + ' €';
}

export function openModal() {
    state.editingId = null;
    state.tempImgs = [];
    ['inpName', 'inpShop', 'inpUrl', 'inpPrice', 'inpDiscount', 'inpDetails', 'inpImgUrl', 'inpRating'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = (id === 'inpRating' ? 0 : '');
    });
    const mrv = document.getElementById('modalRatingVal');
    if (mrv) mrv.innerText = '0';
    const dfp = document.getElementById('displayFinalPrice');
    if (dfp) dfp.innerText = '0,00 €';
    renderChipContainer('editMainCatContainer', state.categories, state.modalCat || 'Allgemein', (c) => { state.modalCat = c; renderModalSubCats(); });
    renderModalSubCats();
    if (window.renderGallery) window.renderGallery();
    openPopup('productModal');
}

export function renderModalSubCats() {
    const subs = state.subCats[state.modalCat] || [];
    renderChipContainer('editSubCatContainer', subs, state.modalSub, (s) => state.modalSub = s);
}

export function renderChipContainer(id, items, selected, cb) {
    const c = document.getElementById(id);
    if (!c) return;
    c.className = 'chip-container';
    c.innerHTML = '';
    items.forEach(i => {
        const d = document.createElement('div');
        d.className = 'select-chip ' + (i === selected ? 'selected' : '');
        d.innerText = i;
        d.onclick = () => {
            cb(i);
            renderChipContainer(id, items, i, cb);
        };
        c.appendChild(d);
    });
}

export function renderDeals() {
    const grid = document.getElementById('dealsGrid');
    if (!grid) return;
    grid.innerHTML = '';
    const deals = state.products.filter(p => (parseFloat(p.discount) > 0));

    if (!deals || deals.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 100px; opacity: 0.6;">
                <div style="font-size: 48px; margin-bottom: 20px;">🏷️</div>
                <h3 style="font-size: 20px; font-weight: 600;">Keine Deals gefunden</h3>
                <p>Schau später wieder vorbei!</p>
            </div>
        `;
        return;
    }

    if (document.getElementById('dealsEmptyState')) document.getElementById('dealsEmptyState').style.display = 'none';

    deals.forEach(p => {
        const oldPrice = p.price;
        const newPrice = p.price - (p.price * p.discount / 100);
        const imgUrl = (p.imgs && p.imgs.length) ? p.imgs[0] : (p.img || '');

        const safeName = escapeHtml(p.name);
        const safeShop = escapeHtml(p.shop);

        const html = `
        <div class="deal-card" onclick="window.openViewModal('${p.id}')">
            <div class="deal-badge">-${p.discount}%</div>
            <div class="deal-img-box">
                <img src="${imgUrl}" class="deal-img" onerror="this.style.display='none'">
            </div>
            <div class="deal-body">
                <div class="deal-shop">${safeShop}</div>
                <div class="deal-title">${safeName}</div>
                <div class="deal-pricing">
                    <span class="deal-new">${newPrice.toFixed(2)}€</span>
                    <span class="deal-old">${oldPrice.toFixed(2)}€</span>
                </div>
            </div>
        </div>`;
        grid.innerHTML += html;
    });

    if (window.applyGlobalTheme) window.applyGlobalTheme();
}

export function openViewModal(id) {
    const p = state.products.find(x => x.id == id);
    if (!p) return;
    document.getElementById('viewName').innerText = p.name;
    document.getElementById('viewPrice').innerText = p.price.toFixed(2) + ' €';
    document.getElementById('viewLink').href = p.url || '#';
    document.getElementById('viewDetailsText').innerText = p.details || '';

    const dateStr = new Date(p.date || p.dateAdded || p.id).toLocaleDateString();
    document.getElementById('viewCatLabel').innerText = (p.category || p.cat || '') + ' / ' + (p.sub || '') + ' • ' + dateStr;

    const rBadge = document.getElementById('viewRatingBadge');
    if (rBadge) {
        const rVal = p.rating || 0;
        rBadge.innerHTML = `${iconStar} <span>${parseFloat(rVal).toFixed(1)} / 10</span>`;
    }

    const b = document.getElementById('viewImgBox');
    const imgs = p.imgs && p.imgs.length ? p.imgs : (p.img ? [p.img] : []);

    if (imgs.length) {
        b.innerHTML = `<img src="${imgs[0]}" onclick="if(window.openLightbox) window.openLightbox(['${imgs[0]}'],0)" style="cursor:zoom-in;">`;
        const t = document.getElementById('viewGalleryThumbs');
        t.innerHTML = '';
        imgs.forEach((u, i) => {
            t.innerHTML += `<div class="thumb-item"><img src="${u}" onclick="document.querySelector('#viewImgBox img').src='${u}'"></div>`;
        });
    } else {
        b.innerHTML = 'Kein Bild';
    }

    document.getElementById('btnEditFromView').onclick = () => { closePopup('viewModal'); openEditModal(id); };

    openPopup('viewModal');
}

export function openModalWithLink() {
    try {
        const input = document.getElementById('quickLinkInput');
        const url = input ? input.value : '';
        openModal();
        if (url) {
            const smartIn = document.getElementById('inpUrl');
            if (smartIn) smartIn.value = url;

            if (url.trim().length > 0) {
                fetchProductData();
            }
        }
        if (input) input.value = '';
    } catch (e) { console.error(e); openModal(); }
}

export function fetchProductData() {
    const urlInp = document.getElementById('inpUrl');
    const url = urlInp ? urlInp.value : '';
    if (!url) return;

    // Simulate fetch
    const skeleton = document.getElementById('skeletonImage');
    const preview = document.getElementById('imgPreviewBox');

    if (skeleton && preview) {
        preview.innerHTML = '';
        preview.appendChild(skeleton);
        skeleton.style.display = 'block';
    }

    setTimeout(() => {
        if (skeleton) skeleton.style.display = 'none';

        try {
            const host = new URL(url).hostname.replace('www.', '').split('.')[0];
            const nameInp = document.getElementById('inpName');
            const shopInp = document.getElementById('inpShop');
            const priceInp = document.getElementById('inpPrice');

            if (nameInp && !nameInp.value) nameInp.value = 'Produktvorschau (' + host + ')';
            if (shopInp && !shopInp.value) shopInp.value = host;
            if (priceInp && !priceInp.value) {
                const randomPrice = (Math.floor(Math.random() * 80) + 19.99).toFixed(2);
                priceInp.value = randomPrice;
            }
            if (window.calculateTotal) window.calculateTotal();

            const randomColor = Math.floor(Math.random() * 16777215).toString(16);
            state.tempImgs = [`https://placehold.co/400/${randomColor}/FFF?text=${host}`];
            renderGallery();
        } catch (e) { }

    }, 1500);
}

export function renderGallery() {
    const b = document.getElementById('imgPreviewBox');
    const t = document.getElementById('galleryThumbs');
    if (!b || !t) return;

    if (!state.tempImgs || !state.tempImgs.length) {
        b.innerHTML = '<div style="color:var(--text-grey);">Kein Bild</div>';
        t.innerHTML = '';
        return;
    }
    b.innerHTML = `<img src="${state.tempImgs[0]}" style="width:100%; height:100%; object-fit:contain;">`;
    t.innerHTML = '';
    state.tempImgs.forEach((img, idx) => {
        t.innerHTML += `<div class="thumb-item" onclick="window.setMainImg(${idx})"><img src="${img}" style="border-radius:8px;"></div>`;
    });
}

export function setMainImg(idx) {
    if (state.tempImgs && state.tempImgs[idx]) {
        const el = state.tempImgs.splice(idx, 1)[0];
        state.tempImgs.unshift(el);
        renderGallery();
    }
}

export function addImageFromUrlInput() {
    const el = document.getElementById('inpImgUrl');
    if (!el) return;
    const url = el.value.trim();
    if (url) {
        state.tempImgs.push(url);
        renderGallery();
        el.value = '';
    }
}

export function handleImageUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            state.tempImgs.push(e.target.result);
            renderGallery();
        };
        reader.readAsDataURL(input.files[0]);
    }
}

