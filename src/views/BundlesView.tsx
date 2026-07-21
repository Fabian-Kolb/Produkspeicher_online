import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useUIStore } from '../store/useUIStore';
import { Layers, Plus, Trash2, Search, X, BookOpen, ShoppingBag, Check, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import type { BundleItem } from '../types';
import { Button } from '../components/common/Button';
import { FilterChip } from '../components/common/FilterChip';
import { triggerHaptic } from '../utils/haptics';

/* ── Marquee wrapper: scrolls children horizontally when they overflow ── */
const MarqueeOverflow: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [needsMarquee, setNeedsMarquee] = useState(false);

  useEffect(() => {
    const check = () => {
      if (outerRef.current && innerRef.current) {
        setNeedsMarquee(innerRef.current.scrollWidth > outerRef.current.clientWidth + 4);
      }
    };
    check();
    const obs = new ResizeObserver(check);
    if (outerRef.current) obs.observe(outerRef.current);
    return () => obs.disconnect();
  }, [children]);

  return (
    <div ref={outerRef} className={`overflow-hidden whitespace-nowrap ${className}`}>
      <div
        ref={innerRef}
        className={needsMarquee ? 'inline-flex animate-marquee' : 'inline-flex'}
        style={needsMarquee ? { animationDuration: `${(innerRef.current?.scrollWidth || 800) / 40}s` } : undefined}
      >
        {children}
        {needsMarquee && <>{children}</>}
      </div>
    </div>
  );
};

export const BundlesView: React.FC = () => {
  const { bundles, products, categories, subCats, addBundle, updateBundle, deleteBundle } = useAppStore();
  const { activeBundleId, setActiveBundleId, bundleDraft, setBundleDraft, openProductDetailModal } = useUIStore();

  const [searchQuery, setSearchQuery] = useState('');

  // Editor filter state (local to bundle editor, separate from global filters)
  const [editorMainCat, setEditorMainCat] = useState('Alle');
  const [editorSelectedSubCats, setEditorSubCats] = useState<string[]>([]);
  const [editorStatusFilter, setEditorStatusFilter] = useState<'all' | 'bought' | 'reduced'>('all');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Mobile editor tab state: 'catalog' or 'bundle'
  const [mobileEditorTab, setMobileEditorTab] = useState<'catalog' | 'bundle'>('catalog');

  const isEditing = Boolean(activeBundleId);

  const activeFilterCount = (editorMainCat !== 'Alle' ? 1 : 0) + (editorSelectedSubCats.length > 0 ? 1 : 0) + (editorStatusFilter !== 'all' ? 1 : 0);

  // When active bundle changes, update draft in UIStore
  useEffect(() => {
    if (activeBundleId && activeBundleId !== 'new') {
      const b = bundles.find(b => b.id === activeBundleId);
      if (b) {
        setBundleDraft({ name: b.name, items: b.items });
      }
    } else if (activeBundleId === 'new') {
      if (!bundleDraft) {
        setBundleDraft({ name: '', items: [] });
      }
    }
    setEditorMainCat('Alle');
    setEditorSubCats([]);
    setEditorStatusFilter('all');
    setIsMobileFilterOpen(false);
    setMobileEditorTab('catalog');
  }, [activeBundleId, bundles, setBundleDraft, bundleDraft]);

  const draftName = bundleDraft?.name || '';
  const draftItems = bundleDraft?.items || [];

  const setDraftName = (name: string) => setBundleDraft({ name, items: draftItems });
  const setDraftItems = (items: BundleItem[]) => setBundleDraft({ name: draftName, items });

  const editorFilteredProducts = useMemo(() => {
    let result = products;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.shop.toLowerCase().includes(q));
    }

    if (editorStatusFilter === 'bought') {
      result = result.filter(p => p.status === 'bought');
    } else if (editorStatusFilter === 'reduced') {
      result = result.filter(p => p.discount > 0);
    }

    if (editorMainCat !== 'Alle') {
      result = result.filter(p => p.mainCat === editorMainCat);
      if (editorSelectedSubCats.length > 0) {
        result = result.filter(p => p.subCats.some((sub: string) => editorSelectedSubCats.includes(sub)));
      }
    }

    return result;
  }, [products, searchQuery, editorMainCat, editorSelectedSubCats, editorStatusFilter]);

  const handleCreateOrUpdate = () => {
    if (!draftName.trim()) return;

    if (activeBundleId === 'new') {
      addBundle({ name: draftName, items: draftItems });
      setActiveBundleId(null);
      setBundleDraft(null);
    } else if (activeBundleId) {
      updateBundle(activeBundleId, { name: draftName, items: draftItems });
      setActiveBundleId(null);
      setBundleDraft(null);
    }
    triggerHaptic(20);
  };

  const handleAddItem = (productId: string) => {
    const existing = draftItems.find(i => i.id === productId);
    let next;
    if (existing) {
      next = draftItems.map(i => i.id === productId ? { ...i, qty: i.qty + 1 } : i);
    } else {
      next = [...draftItems, { id: productId, qty: 1 }];
    }
    setDraftItems(next);
    triggerHaptic(15);
  };

  const handleRemoveItem = (productId: string) => {
    setDraftItems(draftItems.filter(i => i.id !== productId));
    triggerHaptic(15);
  };

  const handleDecreaseItem = (productId: string) => {
    const next = draftItems.map(i => {
      if (i.id === productId) {
        return i.qty > 1 ? { ...i, qty: i.qty - 1 } : i;
      }
      return i;
    }).filter(i => i.qty > 0);
    setDraftItems(next);
    triggerHaptic(15);
  };

  const handleCancelBundle = () => {
    triggerHaptic(15);
    setBundleDraft(null);
    setActiveBundleId(null);
  };

  const draftTotal = useMemo(() => {
    return draftItems.reduce((sum, item) => {
      const p = products.find(prod => prod.id === item.id);
      return sum + ((p?.finalPrice || 0) * item.qty);
    }, 0);
  }, [draftItems, products]);

  const getBundleTotal = (items: BundleItem[]) => {
    return items.reduce((sum, item) => {
      const p = products.find(prod => prod.id === item.id);
      return sum + ((p?.finalPrice || 0) * item.qty);
    }, 0);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[calc(100vh-140px)] flex flex-col pt-2 md:pt-4">
      {/* Marquee keyframe style */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      <AnimatePresence mode="wait" initial={false}>
        {!activeBundleId ? (
          <motion.div
            key="bundle-list-view"
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 flex flex-col"
          >
            {bundles.length === 0 ? (
              /* Empty State */
              <div className="flex-1 flex flex-col items-center justify-center -mt-16">
                <div className="w-16 h-16 bg-bg-primary rounded-full flex items-center justify-center shadow-lg mb-6">
                  <Layers size={28} className="text-text-primary" />
                </div>
                <h2 className="text-xl font-bold mb-2 text-text-primary">Noch keine Bundles erstellt</h2>
                <p className="text-text-secondary text-sm mb-8">Erstelle dein erstes Bundle um Produkte zu gruppieren.</p>
                <Button
                  onClick={() => {
                    triggerHaptic(15);
                    setActiveBundleId('new');
                  }}
                >
                  Jetzt erstellen
                </Button>
              </div>
            ) : (
              /* ── Bundle Cards ── */
              <div className="flex flex-col gap-4 md:gap-6 px-1 md:px-4">
                {bundles.map(bundle => {
                  const totalArticles = bundle.items.reduce((acc, i) => acc + i.qty, 0);
                  const totalPrice = getBundleTotal(bundle.items);

                  return (
                    <div
                      key={bundle.id}
                      className="glass-panel rounded-2xl md:rounded-3xl p-4 md:p-8 relative overflow-hidden"
                    >
                      {/* Top row: Name + Controls */}
                      <div className="flex flex-col md:flex-row justify-between items-start mb-4 md:mb-8 gap-4 md:gap-3">
                        <div className="w-full md:flex-1 min-w-0">
                          <MarqueeOverflow>
                            <h2 className="text-lg md:text-2xl font-playfair font-bold text-text-primary md:mr-8 whitespace-nowrap">{bundle.name}</h2>
                          </MarqueeOverflow>
                          <p className="text-xs text-text-secondary mt-1 md:mt-0.5">{totalArticles} Artikel</p>
                        </div>

                        {/* Right side: Price + Actions */}
                        <div className="backdrop-blur-md rounded-2xl md:rounded-3xl p-3 md:p-4 flex flex-col items-end gap-2 md:gap-3 shrink-0 self-end md:self-start border border-text-primary/15 bg-text-primary/10 transition-all shadow-sm">
                          <span className="text-lg md:text-2xl font-bold text-text-primary">{totalPrice.toFixed(2)} €</span>
                          <div className="flex items-center gap-1.5 md:gap-2">
                            <Button
                              onClick={() => {
                                triggerHaptic(15);
                                setActiveBundleId(bundle.id);
                              }}
                              size="sm"
                              className="h-7 md:h-8"
                            >
                              Bearbeiten
                            </Button>
                            <button
                              onClick={() => {
                                triggerHaptic(15);
                                deleteBundle(bundle.id);
                              }}
                              className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer shadow-sm group/trash border bg-accent text-bg-primary border-transparent hover:bg-heart hover:text-white"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Products row – horizontal scroll */}
                      <MarqueeOverflow className="mb-4 md:mb-8">
                        <div className="flex gap-3 md:gap-6 pr-4 md:pr-8">
                          {bundle.items.map(item => {
                            const product = products.find(p => p.id === item.id);
                            if (!product) return null;
                            return (
                              <div 
                                key={item.id} 
                                onClick={() => openProductDetailModal(product.id)}
                                className="flex flex-col w-28 md:w-44 shrink-0 glass-panel rounded-xl md:rounded-2xl p-2 md:p-3 pb-3 md:pb-4 cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-xl"
                              >
                                <div className="w-full aspect-square rounded-lg md:rounded-xl overflow-hidden mb-2 md:mb-3 shadow-sm">
                                  <img
                                    src={product.imgs[0] || 'https://via.placeholder.com/200'}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <p className="text-[9px] md:text-[10px] text-text-secondary uppercase tracking-wider font-medium">{product.shop}</p>
                                <p className="text-xs md:text-sm font-bold text-text-primary truncate">{product.name}</p>
                                <p className="text-xs md:text-sm text-text-primary mt-0.5">{product.finalPrice.toFixed(2)} €</p>
                              </div>
                            );
                          })}
                        </div>
                      </MarqueeOverflow>

                      {/* Bottom right: Kaufen button */}
                      <div className="flex justify-end">
                        <Button onClick={() => triggerHaptic(15)}>
                          Kaufen
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          /* ═══ BUNDLE EDITOR ═══ */
          <motion.div
            key="bundle-editor-view"
            initial={{ opacity: 0, y: 25, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 25, scale: 0.97 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col flex-1 min-h-0 gap-4 lg:gap-6 relative pb-16 lg:pb-0"
          >
            <div className="flex flex-col lg:flex-row flex-1 min-h-0 gap-4 lg:gap-6 items-start">
              {/* Top Box on Mobile / Perfectly Top-Aligned Decoupled Viewport Sidebar on Desktop */}
              <div className="w-full lg:w-[340px] xl:w-[380px] glass-panel rounded-2xl lg:rounded-3xl p-4 lg:p-5 flex flex-col justify-between shrink-0 order-1 lg:order-2 lg:self-start lg:sticky lg:top-4 lg:h-[calc(100vh-150px)]">
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex justify-between items-center mb-3 shrink-0">
                    <input
                      type="text"
                      value={draftName}
                      onChange={e => setDraftName(e.target.value)}
                      placeholder="Name der Zusammenstellung..."
                      className="bg-transparent border-b border-transparent hover:border-text-secondary/30 focus:border-text-secondary outline-none font-bold text-base lg:text-lg text-text-primary placeholder:text-text-secondary/70 w-full py-1 transition-all duration-500 ease-out"
                    />
                  </div>

                  <div className="flex-1 overflow-y-auto hidden-scrollbar pr-1 space-y-2 max-h-[240px] lg:max-h-none min-h-[90px]">
                    {draftItems.length === 0 && (
                      <div className="py-6 lg:py-12 flex flex-col items-center justify-center text-text-secondary opacity-50">
                        <Layers size={24} className="mb-1.5" />
                        <p className="text-xs lg:text-sm text-center">Füge Produkte aus dem Katalog hinzu.</p>
                      </div>
                    )}
                    {draftItems.map(item => {
                      const product = products.find(p => p.id === item.id);
                      if (!product) return null;
                      return (
                        <div key={item.id} className="flex items-center justify-between p-2 lg:p-2.5 glass-panel rounded-xl lg:rounded-2xl border border-accent/20 bg-accent/5">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <img src={product.imgs[0] || 'https://via.placeholder.com/100'} className="w-8 h-8 lg:w-10 lg:h-10 object-cover rounded-lg lg:rounded-xl shrink-0" alt="" />
                            <div className="min-w-0">
                              <p className="font-bold text-xs leading-tight truncate">{product.name}</p>
                              <p className="text-[10px] text-text-secondary">{product.finalPrice.toLocaleString('de-DE')} € ({item.qty}x)</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-1.5">
                            <button
                              onClick={() => handleDecreaseItem(item.id)}
                              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer text-xs font-bold shadow-sm bg-accent text-bg-primary hover:bg-accent-hover shrink-0"
                            >
                              −
                            </button>
                            <button
                              onClick={() => handleAddItem(item.id)}
                              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer text-xs font-bold shadow-sm bg-accent text-bg-primary hover:bg-accent-hover shrink-0"
                            >
                              +
                            </button>
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer text-xs font-bold shadow-sm bg-accent text-bg-primary hover:bg-heart hover:text-white shrink-0"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-[var(--theme-glass-border)] shrink-0">
                  <div className="flex justify-between items-center mb-2.5">
                    <span className="text-xs lg:text-sm text-text-secondary">Gesamtpreis:</span>
                    <span className="font-bold text-base lg:text-xl">{draftTotal.toLocaleString('de-DE')} €</span>
                  </div>
                  <Button
                    onClick={handleCreateOrUpdate}
                    className="w-full py-2.5 lg:py-3 shadow-sm bg-accent text-bg-primary hover:bg-accent-hover text-xs sm:text-sm font-bold whitespace-nowrap overflow-hidden text-ellipsis"
                  >
                    Zusammenstellung speichern
                  </Button>
                </div>
              </div>

              {/* Bottom Box on Mobile / Left Panel on Desktop: Full Catalog with Filters */}
              <div className="flex-1 glass-panel rounded-2xl lg:rounded-3xl p-3 sm:p-4 lg:p-6 flex flex-col relative order-2 lg:order-1 w-full">
                {/* Filter Bar */}
                <div className="flex flex-col gap-3 mb-4 shrink-0">
                  {/* Search + Mobile Filter Toggle Button */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Suchen..."
                        className="w-full bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] rounded-full pl-10 pr-4 py-2 text-sm outline-none hover:border-text-secondary focus:border-text-secondary hover:-translate-y-0.5 focus:-translate-y-0.5 hover:scale-[1.01] focus:scale-[1.01] hover:shadow-md focus:shadow-md transition-all duration-300 ease-out transform-gpu shadow-sm"
                      />
                    </div>

                    {/* Mobile Filter Toggle Button (Visible on mobile lg:hidden) */}
                    <button
                      onClick={() => {
                        triggerHaptic(15);
                        setIsMobileFilterOpen(prev => !prev);
                      }}
                      className={cn(
                        "lg:hidden h-9 px-3.5 rounded-full text-xs font-bold flex items-center gap-1.5 border transition-all duration-300 shrink-0 cursor-pointer select-none",
                        isMobileFilterOpen || activeFilterCount > 0
                          ? "bg-accent text-bg-primary border-accent shadow-sm"
                          : "bg-[var(--theme-glass-bg)] border-[var(--theme-glass-border)] text-text-secondary hover:text-text-primary"
                      )}
                    >
                      <SlidersHorizontal size={14} />
                      <span>Filter</span>
                      {activeFilterCount > 0 && (
                        <span className="bg-bg-primary text-accent text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-extrabold ml-0.5 shadow-sm">
                          {activeFilterCount}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Filter Content (Always visible on Desktop lg:flex, collapsible on Mobile) */}
                  <div className={cn(
                    "flex flex-col gap-3 transition-all",
                    !isMobileFilterOpen && "hidden lg:flex"
                  )}>
                    {/* Main Category pills – flex wrap layout */}
                    <div className="flex flex-wrap gap-1.5 items-center py-1">
                      <FilterChip
                        active={editorMainCat === 'Alle'}
                        onClick={() => {
                          triggerHaptic(15);
                          setEditorMainCat('Alle');
                          setEditorSubCats([]);
                        }}
                        className="shrink-0"
                      >
                        Alle
                      </FilterChip>
                      {categories.map(cat => (
                        <FilterChip
                          key={cat}
                          active={editorMainCat === cat}
                          onClick={() => {
                            triggerHaptic(15);
                            setEditorMainCat(cat);
                            setEditorSubCats([]);
                          }}
                          className="shrink-0"
                        >
                          {cat}
                        </FilterChip>
                      ))}
                    </div>

                    {/* Sub-category chips (if main category selected) */}
                    {editorMainCat !== 'Alle' && subCats[editorMainCat] && subCats[editorMainCat].length > 0 && (
                      <div className="flex flex-wrap gap-1.5 items-center pt-2 pb-1 border-t border-[var(--theme-glass-border)]">
                        <span className="text-[10px] uppercase font-bold text-text-secondary mr-1">Unterkategorien:</span>
                        <FilterChip
                          active={editorSelectedSubCats.length === 0}
                          onClick={() => {
                            triggerHaptic(15);
                            setEditorSubCats([]);
                          }}
                          className="shrink-0"
                        >
                          Alle
                        </FilterChip>
                        {subCats[editorMainCat].map(sub => (
                          <FilterChip
                            key={sub}
                            active={editorSelectedSubCats.includes(sub)}
                            onClick={() => {
                              triggerHaptic(15);
                              setEditorSubCats(
                                editorSelectedSubCats.includes(sub)
                                  ? editorSelectedSubCats.filter(s => s !== sub)
                                  : [...editorSelectedSubCats, sub]
                              );
                            }}
                            className="shrink-0"
                          >
                            {sub}
                          </FilterChip>
                        ))}
                      </div>
                    )}

                    {/* Status filter pills (Gekauft / Reduziert as sleek mini-chips) */}
                    <div className="flex items-center gap-1.5 pt-2 pb-1 border-t border-[var(--theme-glass-border)]">
                      <span className="text-[10px] uppercase font-bold text-text-secondary mr-1">Status:</span>
                      <FilterChip
                        active={editorStatusFilter === 'bought'}
                        onClick={() => {
                          triggerHaptic(15);
                          setEditorStatusFilter(editorStatusFilter === 'bought' ? 'all' : 'bought');
                        }}
                        className="shrink-0"
                      >
                        ✓ Gekauft
                      </FilterChip>
                      <FilterChip
                        active={editorStatusFilter === 'reduced'}
                        onClick={() => {
                          triggerHaptic(15);
                          setEditorStatusFilter(editorStatusFilter === 'reduced' ? 'all' : 'reduced');
                        }}
                        className="shrink-0"
                      >
                        % Reduziert
                      </FilterChip>
                    </div>
                  </div>
                </div>

                {/* Product Grid – Natural page flow without constrained inner scroll box */}
                <div className="w-full">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-3 pt-2 pb-8">
                    {editorFilteredProducts.map(product => {
                      const draftItem = draftItems.find(i => i.id === product.id);
                      const isSelected = Boolean(draftItem);
                      const selectedQty = draftItem?.qty || 0;

                      return (
                        <div
                          key={product.id}
                          onClick={() => {
                            handleAddItem(product.id);
                          }}
                          className={cn(
                            "glass-panel group relative flex flex-col overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] transform-gpu rounded-xl sm:rounded-2xl p-1.5 sm:p-2.5 cursor-pointer select-none",
                            isSelected
                              ? "ring-2 ring-accent border-accent bg-accent/15 dark:bg-accent/20 shadow-lg shadow-accent/15 scale-[1.01]"
                              : "hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-xl"
                          )}
                        >
                          <div className="relative w-full aspect-square rounded-lg sm:rounded-xl overflow-hidden bg-text-primary/10 mb-1.5">
                            <img
                              src={product.imgs[0] || 'https://via.placeholder.com/400'}
                              alt={product.name}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                              loading="lazy"
                            />
                            {product.discount > 0 && (
                              <div className="absolute top-1 left-1 bg-heart text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-md z-10">
                                -{product.discount}%
                              </div>
                            )}

                            {/* Selection Highlight Badge */}
                            <AnimatePresence>
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0, opacity: 0 }}
                                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                                  className="absolute top-1 right-1 bg-accent text-bg-primary text-[9px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full shadow-lg flex items-center gap-0.5 z-10"
                                >
                                  <Check size={10} className="stroke-[3]" />
                                  <span>{selectedQty}x</span>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-text-secondary mb-0.5 line-clamp-1 px-0.5">
                            {product.shop}
                          </span>
                          <h3 className={cn(
                            "font-bold text-xs sm:text-sm leading-snug mb-0.5 line-clamp-1 px-0.5 transition-colors",
                            isSelected ? "text-accent font-extrabold" : "text-text-primary"
                          )}>
                            {product.name}
                          </h3>
                          <div className="flex items-center justify-between px-0.5 mt-auto pt-0.5">
                            <span className="font-bold text-xs sm:text-sm">
                              {product.finalPrice.toFixed(2)} €
                            </span>
                            {isSelected && (
                              <span className="text-[9px] font-extrabold text-accent bg-accent/20 px-1 py-0.5 rounded-md">
                                Ausgewählt
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {editorFilteredProducts.length === 0 && (
                      <div className="col-span-full py-16 flex flex-col items-center justify-center text-text-secondary">
                        <p className="text-sm">Keine Produkte gefunden.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

