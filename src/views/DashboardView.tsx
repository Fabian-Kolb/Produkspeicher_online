import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { FilterChip } from '../components/common/FilterChip';
import { Bell, Heart, Settings, Plus, X, ExternalLink, Globe, Link2, Check, Save } from 'lucide-react';
import type { Product, Website } from '../types';
import { CategoryEditMenu } from '../components/features/CategoryEditMenu';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import { Input } from '../components/common/Input';
import { triggerHaptic } from '../utils/haptics';

/* ── Default/Standard Shops ────────────────────────────────── */
const DEFAULT_SHOPS: Website[] = [
  { n: 'Amazon', u: 'https://www.amazon.de', c: 'Allgemein', s: 'A' },
  { n: 'eBay', u: 'https://www.ebay.de', c: 'Allgemein', s: 'E' },
  { n: 'Zalando', u: 'https://www.zalando.de', c: 'Mode', s: 'Z' },
  { n: 'ASOS', u: 'https://www.asos.com/de', c: 'Mode', s: 'A' },
  { n: 'MediaMarkt', u: 'https://www.mediamarkt.de', c: 'Elektronik', s: 'M' },
  { n: 'Saturn', u: 'https://www.saturn.de', c: 'Elektronik', s: 'S' },
  { n: 'IKEA', u: 'https://www.ikea.com/de', c: 'Wohnen', s: 'I' },
  { n: 'Otto', u: 'https://www.otto.de', c: 'Allgemein', s: 'O' },
  { n: 'H&M', u: 'https://www2.hm.com/de_de', c: 'Mode', s: 'H' },
  { n: 'Nike', u: 'https://www.nike.com/de', c: 'Sport', s: 'N' },
  { n: 'Adidas', u: 'https://www.adidas.de', c: 'Sport', s: 'A' },
  { n: 'Thomann', u: 'https://www.thomann.de', c: 'Musik', s: 'T' },
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



/* ═══════════════════════════════════════════════════════════════
   AddShopModal – Redesigned for Ergonomic Glassmorphism & UX
   ═══════════════════════════════════════════════════════════════ */
interface AddShopModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (shop: Website) => void;
  categories: string[];
}

const AddShopModal: React.FC<AddShopModalProps> = ({ open, onClose, onAdd, categories }) => {
  const settings = useAppStore(state => state.settings);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState(categories[1] || 'Allgemein');
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const catDropdownRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && nameRef.current) {
      setTimeout(() => nameRef.current?.focus(), 200);
    }
  }, [open]);

  // Click outside listener for category dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (catDropdownRef.current && !catDropdownRef.current.contains(target)) {
        setIsCatDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Keyboard support: Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        triggerHaptic(15);
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  const handleClose = useCallback(() => {
    triggerHaptic(15);
    onClose();
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    triggerHaptic(15);

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
    onClose();
  };

  if (!open) return null;

  const selectableCats = categories.filter(c => c !== 'Alle');
  const isGlass = settings.isGlassEnabled;

  const labelClass = "text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5 block";

  const inputClass = cn(
    "!rounded-2xl !transition-all !duration-200 text-text-primary placeholder:text-text-secondary/50",
    isGlass
      ? "!bg-white/40 dark:!bg-white/5 !border-white/20 dark:!border-white/10 hover:!bg-white/50"
      : "!bg-black/5 dark:!bg-white/5 !border-border-primary/20",
    "focus:!border-accent/50 focus:outline-none"
  );

  const dropdownTriggerClass = cn(
    "w-full flex items-center justify-between outline-none transition-all duration-200 cursor-pointer text-left text-sm border",
    "rounded-full px-5 py-2.5 text-text-primary",
    isGlass
      ? "bg-white/40 dark:bg-white/5 border-white/20 dark:border-white/10 hover:bg-white/50"
      : "bg-black/5 dark:bg-white/5 border-border-primary/20 hover:bg-black/10 dark:hover:bg-white/10",
    "focus:border-accent/50 focus:outline-none"
  );

  return createPortal(
    <div className={cn(
      "fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-6 transition-all duration-300 animate-in fade-in",
      isGlass ? "bg-black/40 backdrop-blur-sm" : "bg-black/60"
    )}>
      <div className={cn(
        "w-full max-w-md max-h-[98vh] sm:max-h-[95vh] overflow-hidden flex flex-col transition-all duration-300 animate-in zoom-in-95 rounded-[1.5rem]",
        isGlass ? "glass-panel text-text-primary shadow-2xl" : "bg-bg-card border border-border-primary text-text-primary shadow-xl"
      )}>
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between p-4 sm:p-6 border-b shrink-0",
          isGlass ? "border-white/20 dark:border-white/10" : "border-border-primary/20"
        )}>
          <h2 className="text-xl font-semibold text-text-primary tracking-tight">
            Neuen Shop hinzufügen
          </h2>
          <button 
            type="button"
            onClick={handleClose} 
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/5 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          >
            <X size={22} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto hidden-scrollbar flex flex-col gap-4">
          <div>
            <label className={labelClass}>Shop-Name</label>
            <Input
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. MediaMarkt, Thomann..."
              className={inputClass}
              icon={<Globe size={16} />}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Shop-URL</label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="z.B. mediamarkt.de"
              className={inputClass}
              icon={<Link2 size={16} />}
              required
            />
          </div>

          {/* Custom Pill Dropdown with Option 1 Dynamic Auto-Height Expansion */}
          <div className="relative" ref={catDropdownRef}>
            <label className={labelClass}>Kategorie</label>
            <button
              type="button"
              onClick={() => {
                triggerHaptic(10);
                setIsCatDropdownOpen(!isCatDropdownOpen);
              }}
              className={dropdownTriggerClass}
            >
              <span className="truncate">{category || 'Kategorie wählen'}</span>
              <span className="text-text-secondary text-[10px] transform transition-transform duration-300 select-none pointer-events-none ml-2">
                {isCatDropdownOpen ? '▲' : '▼'}
              </span>
            </button>

            <AnimatePresence initial={false}>
              {isCatDropdownOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden mt-2"
                >
                  <div className={cn(
                    "rounded-2xl p-2 flex flex-col gap-1 border",
                    isGlass
                      ? "bg-bg-card/60 backdrop-blur-md border-white/20 text-text-primary"
                      : "bg-black/5 dark:bg-white/5 border-border-primary/20 text-text-primary"
                  )}>
                    {selectableCats.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          triggerHaptic(10);
                          setCategory(c);
                          setIsCatDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer flex items-center justify-between",
                          category === c
                            ? "bg-accent text-bg-primary font-semibold"
                            : "text-text-primary hover:bg-text-primary/10"
                        )}
                      >
                        <span>{c}</span>
                        {category === c && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Live Preview Card */}
          {name.trim() && (
            <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-border-primary/20 bg-black/5 dark:bg-white/5 animate-in fade-in zoom-in-95 duration-200 mt-1">
              <div className="w-10 h-10 rounded-xl bg-accent text-bg-primary font-bold flex items-center justify-center text-base shadow-sm">
                {name.trim()[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-text-primary truncate">{name.trim()}</div>
                <div className="text-xs text-text-secondary truncate">{url.trim() || 'URL ausstehend'}</div>
              </div>
              <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-accent/15 text-accent shrink-0">
                {category}
              </span>
            </div>
          )}

          {/* Modal Footer */}
          <div className={cn(
            "pt-4 mt-2 flex justify-end gap-3 border-t shrink-0",
            isGlass ? "border-white/20 dark:border-white/10" : "border-border-primary/20"
          )}>
            <button
              type="button"
              onClick={handleClose}
              className="bg-inactive-btn-bg text-inactive-btn-text hover:opacity-90 px-5 py-2.5 rounded-full text-sm font-medium transition-colors cursor-pointer select-none active:scale-95"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !url.trim()}
              className="bg-accent text-bg-primary hover:bg-accent-hover px-6 py-2.5 rounded-full text-sm font-semibold shadow-sm transition-all duration-200 active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Save size={18} /> Shop hinzufügen
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

/* ═══════════════════════════════════════════════════════════════
   DashboardView
   ═══════════════════════════════════════════════════════════════ */
export const DashboardView: React.FC = () => {
  const navigate = useNavigate();
  const {
    products, settings, userName, isDemoMode, websites, addWebsite,
    websiteCats, addWebsiteCat, deleteWebsiteCat, reorderWebsiteCats
  } = useAppStore();

  const displayName = userName || (isDemoMode ? 'Gast' : 'User');

  /* ── KPI Carousel Scroll State & Logic ─────────────────── */
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;
    const children = Array.from(container.children) as HTMLElement[];

    let closestIndex = 0;
    let minDistance = Infinity;

    children.forEach((child, idx) => {
      const childRect = child.getBoundingClientRect();
      const childCenter = childRect.left + childRect.width / 2;
      const distance = Math.abs(childCenter - containerCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = idx;
      }
    });

    setActiveCardIndex((prevIndex) => {
      if (prevIndex !== closestIndex) {
        return closestIndex;
      }
      return prevIndex;
    });
  }, []);

  const scrollToCard = (index: number) => {
    triggerHaptic(10);
    const container = scrollContainerRef.current;
    if (!container) return;

    const children = Array.from(container.children) as HTMLElement[];
    if (children[index]) {
      const child = children[index];
      const containerRect = container.getBoundingClientRect();
      const childRect = child.getBoundingClientRect();
      const scrollDelta = (childRect.left + childRect.width / 2) - (containerRect.left + containerRect.width / 2);

      container.scrollBy({
        left: scrollDelta,
        behavior: 'smooth'
      });
      setActiveCardIndex(index);
    }
  };

  /* ── Welcome ───────────────────────────────────────────── */
  const welcomeMessage = useMemo(() => {
    const messages = [
      `Willkommen zurück, ${displayName}`,
      `Hey ${displayName}, schön dich zu sehen!`,
      `Hallo ${displayName}, was shoppen wir heute?`,
      `Moin ${displayName}, bereit für neue Deals?`,
      `Hi ${displayName}, dein Überblick ist bereit.`
    ];
    // Use a simple deterministic hash of the display name to avoid impure Math.random() in render
    let hash = 0;
    for (let i = 0; i < displayName.length; i++) {
      hash = displayName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % messages.length;
    return messages[idx];
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
  const displayCats = useMemo(() => ['Alle', ...websiteCats], [websiteCats]);
  const [activeFilter, setActiveFilter] = useState('Alle');
  const [isEditing, setIsEditing] = useState(false);
  const [showAddShopModal, setShowAddShopModal] = useState(false);

  const handleRemoveCat = (cat: string) => {
    if (cat === 'Alle') return;
    deleteWebsiteCat(cat);
    if (activeFilter === cat) setActiveFilter('Alle');
  };

  const handleAddShop = (shop: Website) => {
    addWebsite(shop);
    // If the shop's category doesn't exist in websiteCats, add it
    if (!websiteCats.includes(shop.c)) {
      addWebsiteCat(shop.c);
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
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-playfair font-bold mb-2">{welcomeMessage}</h1>
        <p className="text-text-secondary text-sm md:text-base">
          Hier ist dein Shopping-Überblick für den{' '}
          <input
            type="date"
            defaultValue={todayStr}
            className="bg-transparent border-b border-text-secondary text-text-primary outline-none focus:border-text-primary transition-colors cursor-pointer"
          />
        </p>
      </div>

      {/* ── KPI Widgets ──────────────────────────────────── */}
      <div className="relative flex flex-col gap-1">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex md:grid md:grid-cols-3 gap-4 md:gap-6 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory md:snap-none scrollbar-none -mx-4 px-4 md:mx-0 md:px-0 pt-2 pb-5 md:py-0"
        >
          {/* Budget Widget */}
          <div
            onClick={() => navigate('/budget')}
            className="glass-panel p-5 cursor-pointer hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] transform-gpu relative overflow-hidden group snap-center snap-always w-full md:w-auto flex-shrink-0 flex flex-col justify-between"
          >
            {/* Background Blob */}
            <div className={cn(
              "absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl transition-all duration-700",
              isOverBudget
                ? "bg-heart/10 group-hover:bg-heart/20"
                : "bg-emerald-500/10 group-hover:bg-emerald-500/20"
            )}></div>

            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex justify-between items-start mb-6">
                <h3 className="font-bold text-sm">Budget Tracker</h3>
                <span className={cn(
                  "text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-full border transition-colors",
                  isOverBudget
                    ? "bg-heart/10 text-heart border-heart/20"
                    : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                )}>
                  {settings.monthlyBudget > 0 ? Math.round((spentThisMonth / settings.monthlyBudget) * 100) : 0}% genutzt
                </span>
              </div>

              <div className="flex flex-col flex-grow justify-center">
                <div className="flex flex-col gap-1 mb-6">
                  <span className="text-xs text-text-secondary font-medium uppercase tracking-wider">Ausgegeben</span>
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-4xl font-bold">{spentThisMonth.toLocaleString('de-DE', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</p>
                    <span className="text-xl font-bold text-text-secondary">€</span>
                  </div>
                  {isOverBudget ? (
                    <span className="text-xs md:text-sm font-bold text-heart mt-1 bg-heart/10 w-max px-2 py-1 rounded-md">
                      {(spentThisMonth - settings.monthlyBudget).toLocaleString('de-DE', {minimumFractionDigits: 0, maximumFractionDigits: 0})} € über dem Budget
                    </span>
                  ) : (
                    <span className="text-xs md:text-sm font-bold text-emerald-500 mt-1 bg-emerald-500/10 w-max px-2 py-1 rounded-md">
                      Noch {(settings.monthlyBudget - spentThisMonth).toLocaleString('de-DE', {minimumFractionDigits: 0, maximumFractionDigits: 0})} € übrig
                    </span>
                  )}
                </div>

                {/* Enhanced Progress Bar */}
                <div className="w-full h-3 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden shadow-inner relative mb-2">
                  <div 
                    className={cn(
                      "absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out overflow-hidden bg-gradient-to-r",
                      isOverBudget
                        ? "from-heart/80 to-heart"
                        : "from-emerald-400 to-emerald-500"
                    )}
                    style={{ width: `${budgetPct}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                  </div>
                </div>

                <div className="flex justify-between text-[10px] md:text-xs text-text-secondary font-bold mt-1">
                  <span>0 €</span>
                  <span>Gesamt: {settings.monthlyBudget.toLocaleString('de-DE')} €</span>
                </div>
              </div>
            </div>
          </div>

          {/* Favorites Widget */}
          <div
            onClick={() => navigate('/favoriten')}
            className="glass-panel p-6 cursor-pointer hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] transform-gpu snap-center snap-always w-full md:w-auto flex-shrink-0 flex flex-col justify-between"
          >
            <div className="flex justify-between items-center mb-6 text-text-secondary">
              <span className="font-semibold uppercase text-xs tracking-wider">Favoriten</span>
              <Heart size={16} />
            </div>
            <div className="flex-grow flex items-center justify-center pb-8">
              <div className="text-6xl font-bold text-text-primary">
                {savedCount}
              </div>
            </div>
          </div>

          {/* Price Alerts Widget */}
          <div
            onClick={() => navigate('/deals')}
            className="glass-panel p-6 cursor-pointer hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] transform-gpu relative overflow-hidden snap-center snap-always w-full md:w-auto flex-shrink-0 flex flex-col justify-between"
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
            <div className="flex-grow flex flex-col items-center justify-center pb-8 relative z-10">
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

        {/* Carousel Pagination Dots */}
        <div className="flex justify-center items-center gap-2 mt-1 md:hidden">
          {[0, 1, 2].map((idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => scrollToCard(idx)}
              className="p-1.5 -m-1.5 focus:outline-none cursor-pointer"
              aria-label={`Gehe zu Karte ${idx + 1}`}
            >
              <div
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  activeCardIndex === idx
                    ? "bg-accent w-6"
                    : "bg-text-secondary/35 w-2 hover:bg-text-secondary/60"
                )}
              />
            </button>
          ))}
        </div>
      </div>

      {/* ── Shops Section ────────────────────────────────── */}
      <div className="mt-4">
        <div className="flex items-center justify-between gap-2 sm:gap-3 mb-5">
          <h2 className="text-lg sm:text-xl md:text-2xl font-playfair font-bold whitespace-nowrap shrink-0">Deine Shops</h2>
          <div className="flex items-center gap-1 sm:gap-1.5 p-0.5 sm:p-1 rounded-full bg-white dark:bg-white/10 border border-white/80 dark:border-white/10 shadow-sm shrink-0">
            <button
              onClick={() => setShowAddShopModal(true)}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium active:scale-95 transition-all duration-200 shadow-sm bg-accent text-bg-primary hover:bg-accent-hover whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>Shop hinzufügen</span>
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center shrink-0 rounded-full bg-accent text-bg-primary hover:bg-accent-hover active:scale-95 transition-all duration-300 shadow-sm cursor-pointer"
              title="Kategorien verwalten"
            >
              <Settings
                className={cn(
                  "w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-500",
                  isEditing ? 'rotate-180' : 'rotate-0'
                )}
              />
            </button>
          </div>
        </div>

        {/* ── Filter Bar with FilterChips ──────────────────── */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {/* Category FilterChips */}
          {displayCats.map((cat) => (
            <FilterChip
              key={cat}
              active={activeFilter === cat && !isEditing}
              onClick={() => {
                if (!isEditing) setActiveFilter(cat);
              }}
            >
              {cat}
            </FilterChip>
          ))}
        </div>

        {/* Slide-down Category Edit Menu */}
        <AnimatePresence>
          {isEditing && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginBottom: 0 }}
              animate={{ height: 'auto', opacity: 1, marginBottom: 24 }}
              exit={{ height: 0, opacity: 0, marginBottom: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden w-full flex justify-center z-10"
            >
              <div className="w-full">
                <CategoryEditMenu
                  title="Shop-Kategorien"
                  subtitle="Ändere die Reihenfolge per Drag & Drop oder klicke auf das X zum Löschen."
                  categories={websiteCats}
                  onAdd={addWebsiteCat}
                  onDelete={handleRemoveCat}
                  onReorder={reorderWebsiteCats}
                  onClose={() => setIsEditing(false)}
                  placeholder="Shop-Kategorie…"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                className="group glass-panel p-4 flex flex-col items-center gap-3 cursor-pointer hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] transform-gpu relative animate-in fade-in zoom-in-95 slide-in-from-bottom-2"
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
        categories={displayCats}
      />
    </div>
  );
};
