import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { FilterChip } from '../components/common/FilterChip';
import { Bell, Euro, Heart, Settings, Plus, X, ExternalLink, Globe, Tag, Link2, Store } from 'lucide-react';
import type { Product, Website } from '../types';

/* ── Default/Standard Shops ────────────────────────────────── */
const DEFAULT_SHOPS: Website[] = [
  { n: 'Amazon',      u: 'https://www.amazon.de',       c: 'Allgemein',   s: 'A' },
  { n: 'eBay',        u: 'https://www.ebay.de',         c: 'Allgemein',   s: 'E' },
  { n: 'Zalando',     u: 'https://www.zalando.de',      c: 'Mode',        s: 'Z' },
  { n: 'ASOS',        u: 'https://www.asos.com/de',     c: 'Mode',        s: 'A' },
  { n: 'MediaMarkt',  u: 'https://www.mediamarkt.de',   c: 'Elektronik',  s: 'M' },
  { n: 'Saturn',      u: 'https://www.saturn.de',       c: 'Elektronik',  s: 'S' },
  { n: 'IKEA',        u: 'https://www.ikea.com/de',     c: 'Wohnen',      s: 'I' },
  { n: 'Otto',        u: 'https://www.otto.de',         c: 'Allgemein',   s: 'O' },
  { n: 'H&M',         u: 'https://www2.hm.com/de_de',   c: 'Mode',        s: 'H' },
  { n: 'Nike',        u: 'https://www.nike.com/de',     c: 'Sport',       s: 'N' },
  { n: 'Adidas',      u: 'https://www.adidas.de',       c: 'Sport',       s: 'A' },
  { n: 'Thomann',     u: 'https://www.thomann.de',      c: 'Musik',       s: 'T' },
];

/* ── Accent colors for shop avatars ────────────────────────── */
const AVATAR_COLORS = [
  'from-blue-500 to-cyan-400',
  'from-purple-500 to-pink-400',
  'from-emerald-500 to-teal-400',
  'from-orange-500 to-amber-400',
  'from-rose-500 to-pink-400',
  'from-indigo-500 to-violet-400',
  'from-sky-500 to-blue-400',
  'from-lime-500 to-green-400',
  'from-fuchsia-500 to-purple-400',
  'from-amber-500 to-yellow-400',
  'from-teal-500 to-cyan-400',
  'from-red-500 to-orange-400',
];

/* ── Favicon helper ────────────────────────────────────────── */
function getFavicon(url: string) {
  try {
    const host = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
  } catch {
    return null;
  }
}

/* ── Default filter categories ─────────────────────────────── */
const DEFAULT_FILTER_CATS = ['Alle', 'Allgemein', 'Mode', 'Elektronik', 'Wohnen', 'Sport', 'Musik'];

/* ═══════════════════════════════════════════════════════════════
   AddShopModal – Inline-Modal zum Hinzufügen neuer Shops
   ═══════════════════════════════════════════════════════════════ */
interface AddShopModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (shop: Website) => void;
  categories: string[];
}

const AddShopModal: React.FC<AddShopModalProps> = ({ open, onClose, onAdd, categories }) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState(categories[1] || 'Allgemein');
  const [closing, setClosing] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && nameRef.current) {
      setTimeout(() => nameRef.current?.focus(), 200);
    }
  }, [open]);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 250);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    // Auto-prefix https if needed
    let finalUrl = url.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }

    onAdd({
      n: name.trim(),
      u: finalUrl,
      c: category,
      s: name.trim()[0]?.toUpperCase() || '?',
    });

    setName('');
    setUrl('');
    setCategory(categories[1] || 'Allgemein');
    handleClose();
  };

  if (!open && !closing) return null;

  // Filter out "Alle" from the category selector
  const selectableCats = categories.filter(c => c !== 'Alle');

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        closing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md glass-panel p-6 transition-all duration-300 ${
          closing
            ? 'scale-95 opacity-0 translate-y-4'
            : 'scale-100 opacity-100 translate-y-0 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center">
              <Store size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">Neuen Shop hinzufügen</h3>
              <p className="text-xs text-text-secondary">URL und Kategorie angeben</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full text-text-secondary hover:text-text-primary hover:bg-white/10 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Shop Name */}
          <div className="relative">
            <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Shop-Name (z.B. MediaMarkt)"
              className="w-full bg-white/5 border border-[var(--theme-glass-border)] rounded-2xl pl-10 pr-4 py-3 text-sm text-text-primary outline-none focus:border-text-secondary transition-all placeholder:text-text-secondary/40"
              required
            />
          </div>

          {/* URL */}
          <div className="relative">
            <Link2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="URL (z.B. mediamarkt.de)"
              className="w-full bg-white/5 border border-[var(--theme-glass-border)] rounded-2xl pl-10 pr-4 py-3 text-sm text-text-primary outline-none focus:border-text-secondary transition-all placeholder:text-text-secondary/40"
              required
            />
          </div>

          {/* Category */}
          <div className="relative">
            <Tag size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-white/5 border border-[var(--theme-glass-border)] rounded-2xl pl-10 pr-4 py-3 text-sm text-text-primary outline-none focus:border-text-secondary transition-all appearance-none cursor-pointer"
            >
              {selectableCats.map(c => (
                <option key={c} value={c} className="bg-[var(--card-bg)] text-text-primary">{c}</option>
              ))}
            </select>
          </div>

          {/* Preview */}
          {name.trim() && (
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-[var(--theme-glass-border)] animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm">
                {name.trim()[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text-primary truncate">{name.trim()}</div>
                <div className="text-xs text-text-secondary truncate">{url.trim() || '—'}</div>
              </div>
              <span className="text-[10px] text-text-secondary/70 bg-white/5 px-2 py-0.5 rounded-full flex-shrink-0">
                {category}
              </span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!name.trim() || !url.trim()}
            className="mt-2 w-full py-3 rounded-2xl bg-text-primary text-bg-primary font-semibold text-sm transition-all duration-300 hover:opacity-90 hover:shadow-lg active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Shop hinzufügen
          </button>
        </form>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   DashboardView
   ═══════════════════════════════════════════════════════════════ */
export const DashboardView: React.FC = () => {
  const navigate = useNavigate();
  const { products, settings, userName, isDemoMode, websites, addWebsite } = useAppStore();
  
  const displayName = userName || (isDemoMode ? 'Gast' : 'User');

  /* ── Welcome ───────────────────────────────────────────── */
  const welcomeMessage = useMemo(() => {
    const messages = [
      `Willkommen zurück, ${displayName}`,
      `Hey ${displayName}, schön dich zu sehen!`,
      `Hallo ${displayName}, was shoppen wir heute?`,
      `Moin ${displayName}, bereit für neue Deals?`,
      `Hi ${displayName}, dein Überblick ist bereit.`
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }, [displayName]);

  /* ── KPI helpers ───────────────────────────────────────── */
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const spentThisMonth = useMemo(() => {
    return products
      .filter((p: Product) => {
        if (p.status !== 'bought') return false;
        const dateToCompare = p.dateBought || p.dateAdded;
        const d = new Date(dateToCompare);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum: number, p: Product) => sum + p.finalPrice, 0);
  }, [products, currentMonth, currentYear]);

  const savedCount = products.filter((p: Product) => p.isFavorite).length;
  const alertCount = products.filter((p: Product) => p.discount > 0).length;

  const budgetPct = Math.min((spentThisMonth / settings.monthlyBudget) * 100, 100);
  const isOverBudget = spentThisMonth > settings.monthlyBudget;

  const todayStr = new Date().toISOString().split('T')[0];

  /* ── Shop filter state ─────────────────────────────────── */
  const [filterCats, setFilterCats] = useState<string[]>(DEFAULT_FILTER_CATS);
  const [activeFilter, setActiveFilter] = useState('Alle');
  const [isEditing, setIsEditing] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);
  const [showAddShopModal, setShowAddShopModal] = useState(false);
  const addInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showAddInput && addInputRef.current) {
      addInputRef.current.focus();
    }
  }, [showAddInput]);

  const handleAddCat = () => {
    const trimmed = newCatName.trim();
    if (trimmed && !filterCats.includes(trimmed)) {
      setFilterCats(prev => [...prev, trimmed]);
    }
    setNewCatName('');
    setShowAddInput(false);
  };

  const handleRemoveCat = (cat: string) => {
    if (cat === 'Alle') return;
    setFilterCats(prev => prev.filter(c => c !== cat));
    if (activeFilter === cat) setActiveFilter('Alle');
  };

  const handleAddShop = (shop: Website) => {
    addWebsite(shop);
    // If the shop's category doesn't exist in filterCats, add it
    if (!filterCats.includes(shop.c)) {
      setFilterCats(prev => [...prev, shop.c]);
    }
  };

  /* ── Merge default + user shops ────────────────────────── */
  const allShops = useMemo(() => {
    const userShopNames = new Set(websites.map(w => w.n.toLowerCase()));
    const defaults = DEFAULT_SHOPS.filter(s => !userShopNames.has(s.n.toLowerCase()));
    return [...websites, ...defaults];
  }, [websites]);

  const filteredShops = useMemo(() => {
    if (activeFilter === 'Alle') return allShops;
    return allShops.filter(s => s.c === activeFilter);
  }, [allShops, activeFilter]);

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ── Welcome Hero ─────────────────────────────────── */}
      <div className="flex flex-col items-center justify-center text-center mt-4">
        <h1 className="text-3xl md:text-4xl font-playfair font-bold mb-2">{welcomeMessage}</h1>
        <p className="text-text-secondary">
          Hier ist dein Shopping-Überblick für den{' '}
          <input 
            type="date" 
            defaultValue={todayStr} 
            className="bg-transparent border-b border-text-secondary text-text-primary outline-none focus:border-text-primary transition-colors cursor-pointer"
          />
        </p>
      </div>

      {/* ── KPI Widgets ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Budget Widget */}
        <div 
          onClick={() => navigate('/budget')}
          className="glass-panel p-6 cursor-pointer hover:-translate-y-1 transition-transform duration-300"
        >
          <div className="flex justify-between items-center mb-6 text-text-secondary">
            <span className="font-semibold uppercase text-xs tracking-wider">Monatsbudget</span>
            <Euro size={16} />
          </div>
          <div className="flex flex-col items-center">
            <div className="text-4xl font-bold mb-1">
              {spentThisMonth.toLocaleString('de-DE')} €
            </div>
            <div className="text-xs text-text-secondary mb-4">
              von <span className="font-bold text-text-primary">{settings.monthlyBudget.toLocaleString('de-DE')} €</span> Budget
            </div>
            <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden mb-2 relative">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${isOverBudget ? 'bg-heart' : 'bg-emerald-500'}`}
                style={{ width: `${budgetPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Favorites Widget */}
        <div 
          onClick={() => navigate('/favoriten')}
          className="glass-panel p-6 cursor-pointer hover:-translate-y-1 transition-transform duration-300"
        >
          <div className="flex justify-between items-center mb-6 text-text-secondary">
            <span className="font-semibold uppercase text-xs tracking-wider">Favoriten</span>
            <Heart size={16} />
          </div>
          <div className="flex h-full items-center justify-center pb-8">
            <div className="text-6xl font-bold text-text-primary">
              {savedCount}
            </div>
          </div>
        </div>

        {/* Price Alerts Widget */}
        <div 
          onClick={() => navigate('/deals')}
          className="glass-panel p-6 cursor-pointer hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden"
        >
          <div className="flex justify-between items-center mb-6 text-text-secondary relative z-10">
            <span className="font-semibold uppercase text-xs tracking-wider">Preisalarme</span>
            <div className="relative">
              <Bell size={16} />
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-heart rounded-full animate-ping" />
              )}
            </div>
          </div>
          <div className="flex flex-col h-full items-center justify-center pb-8 relative z-10">
            <div className="text-6xl font-bold text-heart mb-2">
              {alertCount}
            </div>
            <div className="text-xs text-text-secondary">Artikel reduziert</div>
          </div>
          
          {alertCount > 0 && (
            <div className="absolute inset-0 bg-heart/5 mix-blend-screen pointer-events-none" />
          )}
        </div>
      </div>

      {/* ── Shops Section ────────────────────────────────── */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-playfair font-bold">Deine Shops</h2>
          <button
            onClick={() => setShowAddShopModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-text-primary text-bg-primary hover:opacity-90 active:scale-95 transition-all duration-200 shadow-md"
          >
            <Plus size={14} />
            Shop hinzufügen
          </button>
        </div>

        {/* ── Filter Bar with FilterChips ──────────────────── */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {/* Gear FilterChip */}
          <FilterChip
            active={isEditing}
            onClick={() => {
              setIsEditing(!isEditing);
              setShowAddInput(false);
              setNewCatName('');
            }}
            className="!px-3"
          >
            <Settings
              size={14}
              className={`transition-transform duration-500 ${isEditing ? 'rotate-180' : 'rotate-0'}`}
            />
          </FilterChip>

          {/* Category FilterChips */}
          {filterCats.map((cat) => (
            <div key={cat} className="relative animate-in fade-in zoom-in-95 duration-200">
              <FilterChip
                active={activeFilter === cat && !isEditing}
                editable={isEditing && cat !== 'Alle'}
                shaking={isEditing && cat !== 'Alle'}
                onClick={() => {
                  if (!isEditing) setActiveFilter(cat);
                }}
              >
                {cat}
              </FilterChip>

              {/* Delete Badge in Edit Mode */}
              {isEditing && cat !== 'Alle' && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemoveCat(cat); }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-heart text-white text-[10px] shadow-md hover:scale-110 active:scale-95 transition-transform duration-150 z-10 animate-in zoom-in duration-200"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          ))}

          {/* Add new category chip in edit mode */}
          {isEditing && !showAddInput && (
            <FilterChip
              onClick={() => setShowAddInput(true)}
              className="!border-dashed !border-emerald-400/50 !text-emerald-400 hover:!bg-emerald-400/10 animate-in fade-in zoom-in-95 duration-200"
            >
              <Plus size={12} className="mr-1" />
              Neu
            </FilterChip>
          )}

          {/* Inline add input */}
          {isEditing && showAddInput && (
            <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-left-4 duration-200">
              <input
                ref={addInputRef}
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddCat();
                  if (e.key === 'Escape') { setShowAddInput(false); setNewCatName(''); }
                }}
                placeholder="Kategorie…"
                className="w-28 bg-[var(--theme-glass-bg)] border border-emerald-400/40 rounded-full text-sm text-text-primary outline-none px-3 py-1.5 placeholder:text-text-secondary/50 focus:border-emerald-400 transition-colors"
              />
              <button
                onClick={handleAddCat}
                className="p-1.5 rounded-full text-emerald-400 hover:bg-emerald-400/10 transition-colors"
              >
                <Plus size={14} />
              </button>
              <button
                onClick={() => { setShowAddInput(false); setNewCatName(''); }}
                className="p-1.5 rounded-full text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Shop count */}
          <span className="ml-auto text-xs text-text-secondary tabular-nums">
            {filteredShops.length} {filteredShops.length === 1 ? 'Shop' : 'Shops'}
          </span>
        </div>

        {/* ── Shop Grid ───────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredShops.map((shop, idx) => {
            const favicon = getFavicon(shop.u);
            const colorClass = AVATAR_COLORS[idx % AVATAR_COLORS.length];
            // Staggered animation delay
            const delay = Math.min(idx * 50, 600);

            return (
              <a
                key={`${shop.n}-${idx}`}
                href={shop.u}
                target="_blank"
                rel="noopener noreferrer"
                className="group glass-panel p-4 flex flex-col items-center gap-3 cursor-pointer hover:-translate-y-1.5 hover:shadow-xl hover:shadow-black/10 transition-all duration-300 relative animate-in fade-in zoom-in-95 slide-in-from-bottom-2"
                style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
              >
                {/* External link indicator */}
                <ExternalLink 
                  size={12} 
                  className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-50 transition-opacity duration-300 text-text-secondary" 
                />

                {/* Avatar */}
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colorClass} flex items-center justify-center shadow-lg overflow-hidden group-hover:scale-110 transition-transform duration-300`}>
                  {favicon ? (
                    <img 
                      src={favicon} 
                      alt={shop.n} 
                      className="w-7 h-7 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent) {
                          const span = document.createElement('span');
                          span.className = 'text-white font-bold text-lg';
                          span.textContent = shop.s;
                          parent.appendChild(span);
                        }
                      }}
                    />
                  ) : (
                    <span className="text-white font-bold text-lg">{shop.s}</span>
                  )}
                </div>

                {/* Name */}
                <span className="text-sm font-medium text-text-primary text-center leading-tight truncate w-full">
                  {shop.n}
                </span>

                {/* Category tag */}
                <span className="text-[10px] text-text-secondary/70 bg-white/5 px-2 py-0.5 rounded-full">
                  {shop.c}
                </span>
              </a>
            );
          })}
        </div>

        {/* Empty state */}
        {filteredShops.length === 0 && (
          <div className="glass-panel py-16 flex flex-col items-center justify-center text-text-secondary animate-in fade-in duration-300">
            <div className="text-5xl mb-4">🏪</div>
            <p className="text-sm mb-1">Keine Shops in dieser Kategorie.</p>
            <button 
              onClick={() => setActiveFilter('Alle')}
              className="mt-3 text-xs text-text-primary underline underline-offset-4 hover:no-underline transition-all"
            >
              Alle anzeigen
            </button>
          </div>
        )}
      </div>

      {/* ── Add Shop Modal ────────────────────────────────── */}
      <AddShopModal
        open={showAddShopModal}
        onClose={() => setShowAddShopModal(false)}
        onAdd={handleAddShop}
        categories={filterCats}
      />
    </div>
  );
};
