import { state, saveData, saveAll } from '../store.js';
import { hexToRgba } from '../utils.js';
import { iconShoppingBag } from '../constants.js';

export function renderAnalytics() {
    const view = document.getElementById('viewAnalytics');
    if (view) {
        view.scrollTop = 0;

        const wrapper = view.querySelector('.content-wrapper');
        if (wrapper) {
            wrapper.style.display = 'flex';
            wrapper.style.flexDirection = 'column';
            wrapper.style.justifyContent = 'flex-start';
            wrapper.style.alignItems = 'stretch';
            wrapper.style.gap = '40px';
            wrapper.style.minHeight = 'auto';
        }
    }

    requestAnimationFrame(() => {
        const { start, end } = getAnalyticsDates();

        // 1. Regular Products
        const regularItems = state.products.filter(p => {
            if (!p.bought) return false;
            try {
                const d = new Date(p.date || p.dateAdded || p.id);
                return d >= start && d <= end;
            } catch (e) { return false; }
        });

        // 2. Bundle Items
        const bundleItems = [];
        if (state.collections) {
            state.collections.filter(b => b.bought && b.purchaseDate).forEach(b => {
                const bDate = new Date(b.purchaseDate);
                // Ensure date is valid before comparing
                if (!isNaN(bDate.getTime()) && bDate >= start && bDate <= end) {
                    b.items.forEach(item => {
                        const qty = item.qty || 1;
                        for (let i = 0; i < qty; i++) {
                            bundleItems.push({
                                ...item,
                                date: b.purchaseDate,
                                bundleId: b.id,
                                bundleName: b.name,
                                bought: true,
                                // Ensure price is a number
                                price: parseFloat(item.price) || 0
                            });
                        }
                    });
                }
            });
        }

        const allFilteredItems = [...regularItems, ...bundleItems];

        // Improved Sort: Date Descending -> Bundle Grouping
        allFilteredItems.sort((a, b) => {
            const dateA = new Date(a.date || a.dateAdded || a.id);
            const dateB = new Date(b.date || b.dateAdded || b.id);

            // Primary: Date Descending
            if (dateA - dateB !== 0) {
                return dateB - dateA;
            }

            // Secondary: Group by Bundle ID (items with same bundleId stay together)
            if (a.bundleId && b.bundleId) {
                return a.bundleId.localeCompare(b.bundleId);
            }
            // Put bundled items before regular items if timestamps match perfectly
            if (a.bundleId) return -1;
            if (b.bundleId) return 1;

            return 0;
        });

        renderChart(allFilteredItems);
        updateKPIs(allFilteredItems);
        renderTransactions(allFilteredItems);
        if (window.applyGlobalTheme) window.applyGlobalTheme();
    });
}

export function getAnalyticsDates() {
    const now = new Date();
    let end = new Date(now); end.setHours(23, 59, 59, 999);
    let start = new Date(now); start.setHours(0, 0, 0, 0);

    if (state.analyticsMode === '7d') {
        start.setDate(now.getDate() - 6);
    } else if (state.analyticsMode === 'month') {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (state.analyticsMode === 'all') {
        const boughtProducts = state.products.filter(p => p.bought);
        const boughtBundles = state.collections ? state.collections.filter(b => b.bought && b.purchaseDate) : [];

        let minTime = Infinity;
        if (boughtProducts.length > 0) {
            const dates = boughtProducts.map(p => new Date(p.date || p.dateAdded || p.id).getTime());
            minTime = Math.min(minTime, ...dates);
        }
        if (boughtBundles.length > 0) {
            const dates = boughtBundles.map(b => new Date(b.purchaseDate).getTime());
            minTime = Math.min(minTime, ...dates);
        }

        if (minTime !== Infinity) {
            start = new Date(minTime);
        } else {
            start.setDate(now.getDate() - 30);
        }
        start.setHours(0, 0, 0, 0);
    } else if (state.analyticsMode === 'custom') {
        const sVal = document.getElementById('analyticsStart').value;
        const eVal = document.getElementById('analyticsEnd').value;

        if (sVal) start = new Date(sVal);
        if (eVal) end = new Date(eVal);

        if (start > end) {
            end = new Date(start);
            document.getElementById('analyticsEnd').value = sVal;
        }

        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
    }

    if (isNaN(start.getTime())) start = new Date();
    if (isNaN(end.getTime())) end = new Date();

    return { start, end };
}

export function renderChart(customItems = null) {
    const canvas = document.getElementById('analyticsChartCanvas');
    if (!canvas) return;
    canvas.innerHTML = '';

    const { start, end } = getAnalyticsDates();
    const dayInMillis = 24 * 60 * 60 * 1000;
    const diffDays = Math.max(1, Math.ceil((end - start) / dayInMillis));

    const dataPoints = [];
    for (let i = 0; i <= diffDays; i++) {
        const d = new Date(start.getTime() + i * dayInMillis);
        if (d > end) break;

        const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(d); dayEnd.setHours(23, 59, 59, 999);

        const sourceItems = customItems || state.products;
        const itemsOnDay = sourceItems.filter(p => {
            if (!p.bought) return false;
            const pDate = new Date(p.date || p.dateAdded || p.id);
            return pDate >= dayStart && pDate <= dayEnd;
        });

        const dayTotal = itemsOnDay.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0);
        dataPoints.push({ date: d, value: dayTotal, items: itemsOnDay });
    }

    const w = canvas.offsetWidth || 800;
    const h = canvas.offsetHeight || 300;
    const paddingLeft = 85;
    const paddingRight = 40;
    const paddingTop = 30;
    const paddingBottom = 40;

    const innerW = w - paddingLeft - paddingRight;
    const innerH = h - paddingTop - paddingBottom;

    const maxVal = Math.max(...dataPoints.map(p => p.value), 100) * 1.2;
    const getX = (i) => paddingLeft + (i / (dataPoints.length - 1 || 1)) * innerW;
    const getY = (v) => h - paddingBottom - (v / maxVal) * innerH;

    const formatCurrency = (val) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(val);

    let dPath = `M ${getX(0)} ${getY(dataPoints[0].value)}`;
    let areaPath = `M ${getX(0)} ${h - paddingBottom} L ${getX(0)} ${getY(dataPoints[0].value)}`;

    dataPoints.forEach((p, i) => {
        const x = getX(i);
        const y = getY(p.value);
        if (i > 0) dPath += ` L ${x} ${y}`;
        areaPath += ` L ${x} ${y}`;
    });
    areaPath += ` L ${getX(dataPoints.length - 1)} ${h - paddingBottom} Z`;

    const yTicks = [0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal];
    const yTickHtml = yTicks.map(v => `
        <text x="${paddingLeft - 15}" y="${getY(v)}" text-anchor="end" class="chart-axis-label" dominant-baseline="middle">${formatCurrency(v)}</text>
        <line x1="${paddingLeft}" y1="${getY(v)}" x2="${w - paddingRight}" y2="${getY(v)}" class="chart-grid-line" stroke-opacity="0.2" />
    `).join('');

    const isMonthly = diffDays > 60;
    const xTicks = [];

    if (isMonthly) {
        let current = new Date(start.getFullYear(), start.getMonth(), 1);
        if (current < start) current.setMonth(current.getMonth() + 1);

        while (current <= end) {
            const offsetDays = Math.floor((current.getTime() - start.getTime()) / dayInMillis);
            if (offsetDays >= 0 && offsetDays < dataPoints.length) {
                xTicks.push({
                    idx: offsetDays,
                    label: current.toLocaleDateString('de-DE', { month: 'short' })
                });
            }
            current.setMonth(current.getMonth() + 1);
        }
    } else {
        let step = Math.ceil(diffDays / 8) || 1;
        dataPoints.forEach((p, i) => {
            if (i % step === 0 || i === dataPoints.length - 1) {
                xTicks.push({
                    idx: i,
                    label: p.date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
                });
            }
        });
    }

    const xTicksHtml = xTicks.map(t => `
        <text x="${getX(t.idx)}" y="${h - paddingBottom + 22}" text-anchor="middle" class="chart-axis-label">${t.label}</text>
        <line x1="${getX(t.idx)}" y1="${h - paddingBottom}" x2="${getX(t.idx)}" y2="${h - paddingBottom + 6}" stroke="var(--input-border)" />
    `).join('');

    const triggerWidth = innerW / (dataPoints.length - 1 || 1);
    state.lastChartData = dataPoints;

    const svg = `
    <svg class="chart-svg" viewBox="0 0 ${w} ${h}" style="overflow:visible;">
        <defs>
            <linearGradient id="chartAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="var(--text-dark)" stop-opacity="0.15" />
                <stop offset="100%" stop-color="var(--text-dark)" stop-opacity="0" />
            </linearGradient>
        </defs>
        <g>${yTickHtml}</g>
        <g>${xTicksHtml}</g>
        <line x1="${paddingLeft}" y1="${h - paddingBottom}" x2="${w - paddingRight}" y2="${h - paddingBottom}" stroke="var(--text-dark)" stroke-width="1.5" />
        <line x1="${paddingLeft}" y1="${paddingTop}" x2="${paddingLeft}" y2="${h - paddingBottom}" stroke="var(--text-dark)" stroke-width="1" stroke-opacity="0.3" />
        <path d="${areaPath}" fill="url(#chartAreaGradient)" />
        <path d="${dPath}" class="chart-line" />
        ${dataPoints.map((p, i) => {
        const rectX = i === 0 ? getX(0) : getX(i) - triggerWidth / 2;
        const rectW = (i === 0 || i === dataPoints.length - 1) ? triggerWidth / 2 : triggerWidth;
        return `
            <g class="chart-point-group" 
               onmouseenter="window.showRichTooltip(event, ${i})" 
               onmouseleave="window.hideRichTooltip()">
                <rect x="${rectX}" y="${paddingTop}" width="${rectW}" height="${innerH}" fill="transparent" style="cursor:crosshair;" />
                <circle cx="${getX(i)}" cy="${getY(p.value)}" class="chart-tooltip-point" />
            </g>`;
    }).join('')}
    </svg>`;

    canvas.innerHTML = svg;
}

export function syncMonthlyBudget() {
    const limit = state.settings.monthlyBudget || 2000;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Combine products and bundles
    const regularItems = state.products.filter(p => p.bought);
    const bundleItems = [];
    if (state.collections) {
        state.collections.filter(b => b.bought && b.purchaseDate).forEach(b => {
            b.items.forEach(item => {
                const qty = item.qty || 1;
                for (let i = 0; i < qty; i++) {
                    bundleItems.push({ ...item, date: b.purchaseDate, bought: true });
                }
            });
        });
    }

    const allItems = [...regularItems, ...bundleItems];
    const monthlyTransactions = allItems
        .filter(p => new Date(p.date || p.dateAdded || p.id) >= startOfMonth)
        .sort((a, b) => new Date(a.date || a.dateAdded || a.id) - new Date(b.date || b.dateAdded || b.id));

    let currentSum = 0;
    let overflowDate = null;
    const monthlySpent = monthlyTransactions.reduce((sum, p) => {
        const val = (parseFloat(p.price) || 0);
        currentSum += val;
        if (!overflowDate && currentSum > limit) {
            overflowDate = new Date(p.date || p.dateAdded || p.id);
        }
        return sum + val;
    }, 0);

    const fmt = (v) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v);
    const isOver = monthlySpent > limit;
    const diff = Math.abs(limit - monthlySpent);

    const formatFullDate = (d) => {
        if (!d) return '';
        return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const targets = [
        {
            spent: 'dashBudgetSpent', limit: 'dashBudgetLimit', green: 'dashBarGreen', red: 'dashBarRed',
            badge: 'dashOverflowBadge', tip: 'dashBudgetStatusText', dateBox: 'dashOverflowDateContainer'
        },
        {
            spent: 'budgetSpentLabel', limit: 'budgetLimitLabel', green: 'budgetBarGreen', red: 'budgetBarRed',
            badge: 'budgetOverflowBadge', tip: 'budgetStatusText', dateBox: 'budgetOverflowDateContainer'
        }
    ];

    targets.forEach(t => {
        const elSpent = document.getElementById(t.spent);
        const elLimit = document.getElementById(t.limit);
        const elGreen = document.getElementById(t.green);
        const elRed = document.getElementById(t.red);
        const elBadge = document.getElementById(t.badge);
        const elTip = t.tip ? document.getElementById(t.tip) : null;
        const elDateBox = document.getElementById(t.dateBox);

        if (elSpent) {
            elSpent.innerText = fmt(monthlySpent);
            elSpent.classList.toggle('is-over', isOver);
        }
        if (elLimit) elLimit.innerText = fmt(limit);

        if (elGreen && elRed) {
            if (!isOver) {
                const p = (monthlySpent / Math.max(1, limit)) * 100;
                elGreen.style.width = p + '%';
                elGreen.classList.add('full');
                elRed.style.width = '0%';
            } else {
                const total = monthlySpent;
                const pGreen = (limit / total) * 100;
                const pRed = ((total - limit) / total) * 100;
                elGreen.style.width = pGreen + '%';
                elGreen.classList.remove('full');
                elRed.style.width = pRed + '%';
            }
        }

        if (elBadge) {
            if (isOver) {
                elBadge.innerText = `+ ${fmt(diff)} drüber`;
                elBadge.classList.add('visible');
            } else {
                elBadge.classList.remove('visible');
            }
        }

        if (elDateBox) {
            if (isOver && overflowDate) {
                const dStr = formatFullDate(overflowDate);
                elDateBox.innerHTML = `
                    <div class="overflow-date-box">
                        <span class="overflow-date-label">seit</span>
                        <span class="overflow-date-value">
                            ${dStr}
                        </span>
                    </div>`;
                elDateBox.style.display = 'block';
            } else {
                elDateBox.style.display = 'none';
            }
        }

        if (elTip) {
            if (isOver) {
                elTip.innerText = `${fmt(diff)} über Budget!`;
                elTip.classList.add('is-over');
                elTip.classList.remove('is-remaining');
            } else {
                elTip.innerText = `Noch ${fmt(limit - monthlySpent)} verfügbar`;
                elTip.classList.add('is-remaining');
                elTip.classList.remove('is-over');
            }
        }
    });

    const wishlistCount = state.products.filter(p => p.inWishlist && !p.bought).length;
    const dashWishCount = document.getElementById('statWishlistCount');
    if (dashWishCount) dashWishCount.innerText = wishlistCount;
}

export function setAnalyticsFilter(mode, btn) {
    state.analyticsMode = mode;
    document.querySelectorAll('.range-pill-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    const container = document.getElementById('analyticsControlBar');
    const today = new Date().toISOString().split('T')[0];

    if (mode === 'custom') {
        container.classList.add('is-custom');
        const sInp = document.getElementById('analyticsStart');
        const eInp = document.getElementById('analyticsEnd');
        sInp.max = today;
        eInp.max = today;
        if (!sInp.value) {
            const d = new Date(); d.setDate(d.getDate() - 7);
            sInp.value = d.toISOString().split('T')[0];
            eInp.value = today;
        }
        eInp.min = sInp.value;
    } else {
        container.classList.remove('is-custom');
    }
    renderAnalytics();
}

export function showRichTooltip(e, index) {
    const p = state.lastChartData[index];
    if (!p) return;
    const tooltip = document.getElementById('chart-rich-tooltip');
    if (!tooltip) return;

    const formatCurrency = (val) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(val);
    const dateFormatted = p.date.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });

    let itemsHtml = p.items.length > 0
        ? p.items.slice(0, 5).map(it => `
            <div class="tooltip-item" style="justify-content:space-between; width:100%;">
                <span style="overflow:hidden; text-overflow:ellipsis;">${it.name}</span>
                <span style="font-weight:600; margin-left:10px;">${formatCurrency(it.price)}</span>
            </div>
        `).join('')
        : '<div class="tooltip-item">Keine Einkäufe</div>';

    if (p.items.length > 5) itemsHtml += `<div class="tooltip-item" style="color:var(--text-grey); font-style:italic;">... und ${p.items.length - 5} weitere</div>`;

    tooltip.innerHTML = `
        <div class="tooltip-header">${dateFormatted}</div>
        <div class="tooltip-item-list">${itemsHtml}</div>
        <div class="tooltip-footer">
            <span class="tooltip-total-label">Summe</span>
            <span class="tooltip-total-value" style="font-size:15px;">${formatCurrency(p.value)}</span>
        </div>
    `;

    tooltip.style.opacity = '1';

    const updatePos = (me) => {
        const x = me.clientX + 15;
        const y = me.clientY - 20;
        const tw = tooltip.offsetWidth;
        const th = tooltip.offsetHeight;
        const winW = window.innerWidth;
        const winH = window.innerHeight;

        let finalX = x;
        let finalY = y;

        if (x + tw > winW) finalX = me.clientX - tw - 15;
        if (y + th > winH) finalY = me.clientY - th - 15;
        if (finalY < 0) finalY = 10;

        tooltip.style.left = finalX + 'px';
        tooltip.style.top = finalY + 'px';
    };

    updatePos(e);
    e.target.onmousemove = updatePos;
}

export function hideRichTooltip() {
    const tooltip = document.getElementById('chart-rich-tooltip');
    if (tooltip) tooltip.style.opacity = '0';
}

export function renderTransactions(providedItems) {
    const list = document.getElementById('transactionList');
    if (!list) return;
    list.innerHTML = '';
    const items = providedItems || [];
    if (items.length === 0) {
        list.innerHTML = '<div style="color:var(--text-grey); padding:20px;">Keine Transaktionen in diesem Zeitraum.</div>';
        return;
    }

    let currentBundleId = null;
    let bundleGroupHtml = '';
    let bundleTotal = 0;
    let bundleDate = '';
    let bundleName = '';

    const flushBundle = () => {
        if (!currentBundleId) return '';
        const html = `
        <div class="transaction-bundle-group">
            <div class="trans-bundle-header-premium">
                <div class="trans-bundle-icon-box">
                    ${iconShoppingBag}
                </div>
                <div class="trans-bundle-meta">
                    <div class="trans-bundle-label">Bundle Kauf</div>
                    <div class="trans-bundle-title-large">${bundleName}</div>
                    <div class="trans-bundle-date-small">${bundleDate}</div>
                </div>
                <div class="trans-bundle-total-large">-${bundleTotal.toFixed(2)} €</div>
            </div>
            <div class="trans-bundle-grid">
                ${bundleGroupHtml}
            </div>
        </div>`;
        currentBundleId = null;
        bundleGroupHtml = '';
        bundleTotal = 0;
        return html;
    };

    items.forEach(p => {
        const rawDate = p.date || p.dateAdded || p.id;
        const dateStr = new Date(rawDate).toLocaleDateString();

        if (p.bundleId) {
            // Check if we need to start a new bundle group or continue existing
            if (currentBundleId !== p.bundleId) {
                list.innerHTML += flushBundle(); // Flush previous if any
                currentBundleId = p.bundleId;
                bundleName = p.bundleName;
                bundleDate = dateStr;
            }
            // Add to current bundle group
            bundleTotal += p.price;
            bundleGroupHtml += `
            <div class="trans-bundle-item-card">
                <div class="trans-item-img-box">
                    <img src="${(p.imgs && p.imgs.length) ? p.imgs[0] : (p.img || '')}" alt="${p.name}">
                </div>
                <div class="trans-item-info">
                    <div class="trans-item-name">${p.name}</div>
                    <div class="trans-item-shop">${p.shop || 'Shop'}</div>
                </div>
                <div class="trans-item-price">${p.price.toFixed(2)} €</div>
            </div>`;
        } else {
            list.innerHTML += flushBundle(); // Flush previous if any
            // Render regular item
            const html = `
            <div class="transaction-item">
                <div class="trans-left">
                    <div class="trans-date">${dateStr}</div>
                    <div>
                        <div class="trans-name">${p.name}</div>
                        <span class="trans-shop">${p.shop || 'Shop'}</span>
                    </div>
                </div>
                <div class="trans-price">-${p.price.toFixed(2)} €</div>
            </div>`;
            list.innerHTML += html;
        }
    });
    list.innerHTML += flushBundle(); // Flush remaining
}

export function updateKPIs(items) {
    const fmt = (v) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v);
    const total = items.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0);
    const count = items.length;
    const avg = count > 0 ? total / count : 0;

    const mode = state.analyticsMode;
    const lExp = document.getElementById('labelTotalSpent');
    const lCnt = document.getElementById('labelPurchaseCount');
    const lAvg = document.getElementById('labelAveragePrice');
    const lMax = document.getElementById('labelMostExpensive');

    const labelMap = {
        '7d': ' (7 Tage)',
        'month': ' (Dieser Monat)',
        'custom': ' (Zeitraum)',
        'all': ' (Gesamt)'
    };
    const suffix = labelMap[mode] || ' (Gesamt)';

    if (lExp) lExp.innerText = "Ausgaben" + suffix;
    if (lCnt) lCnt.innerText = "Käufe" + suffix;
    if (lAvg) lAvg.innerText = "Ø Preis" + suffix;
    if (lMax) lMax.innerText = mode === 'all' ? "Teuerstes Item" : "Teuerstes" + suffix;

    let expensive = "-";
    if (count > 0) {
        const top = [...items].sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0))[0];
        expensive = `${top.name} (${fmt(top.price)})`;
    }

    document.getElementById('kpiTotalSpent').innerText = fmt(total);
    document.getElementById('kpiPurchaseCount').innerText = count;
    document.getElementById('kpiAveragePrice').innerText = fmt(avg);
    document.getElementById('kpiMostExpensive').innerText = expensive;
    document.getElementById('kpiMostExpensive').title = expensive;
}
export function triggerBudgetEdit(e) {
    if (e) e.stopPropagation();
    const overlay = document.getElementById('budgetEditOverlay');
    const input = document.getElementById('budgetGlobalInput');
    if (overlay && input) {
        input.value = state.settings.monthlyBudget || 2000;
        overlay.style.display = 'flex';
        input.focus();
        input.select();
    }
}

export function finalizeBudgetEdit() {
    const input = document.getElementById('budgetGlobalInput');
    const overlay = document.getElementById('budgetEditOverlay');
    if (input && overlay) {
        const newVal = parseFloat(input.value);
        if (!isNaN(newVal) && newVal >= 0) {
            state.settings.monthlyBudget = newVal;
            saveAll();
            syncMonthlyBudget();
        }
        overlay.style.display = 'none';
    }
}
