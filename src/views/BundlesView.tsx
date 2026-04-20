import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useUIStore } from '../store/useUIStore';
import { Layers, Plus, Trash2, Search, X, BookOpen, ShoppingBag } from 'lucide-react';
import { cn } from '../utils/cn';
import type { BundleItem } from '../types';

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
  const { activeBundleId, setActiveBundleId, bundleDraft, setBundleDraft } = useUIStore();

  const [searchQuery, setSearchQuery] = useState('');

  // Editor filter state (local to bundle editor, separate from global filters)
  const [editorMainCat, setEditorMainCat] = useState('Alle');
  const [editorSelectedSubCats, setEditorSubCats] = useState<string[]>([]);
  const [editorStatusFilter, setEditorStatusFilter] = useState<'all' | 'bought' | 'reduced'>('all');

  // Mobile editor tab state: 'catalog' or 'bundle'
  const [mobileEditorTab, setMobileEditorTab] = useState<'catalog' | 'bundle'>('catalog');

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
  };

  const handleRemoveItem = (productId: string) => {
    setDraftItems(draftItems.filter(i => i.id !== productId));
  };

  const handleDecreaseItem = (productId: string) => {
    const next = draftItems.map(i => {
      if (i.id === productId) {
        return i.qty > 1 ? { ...i, qty: i.qty - 1 } : i;
      }
      return i;
    }).filter(i => i.qty > 0);
    setDraftItems(next);
  };

  const handleCancelBundle = () => {
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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[calc(100vh-140px)] flex flex-col">
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

      {/* Header */}
      <div className="mb-6 md:mb-8 flex justify-between items-center px-1 md:px-4">
        <h1 className="text-2xl md:text-3xl font-playfair font-bold">
          Bundles
        </h1>
        <button
          onClick={() => setActiveBundleId('new')}
          className="bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-md px-3 md:px-5 py-2 md:py-2.5 rounded-full font-medium text-sm hover:bg-white/10 transition-colors shadow-sm text-text-primary flex items-center gap-1.5 md:gap-2"
        >
          <Plus size={15} /> <span>Neues Bundle</span>
        </button>
      </div>

      {!activeBundleId ? (
        <>
          {bundles.length === 0 ? (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center -mt-16">
              <div className="w-16 h-16 bg-bg-primary rounded-full flex items-center justify-center shadow-lg mb-6">
                <Layers size={28} className="text-text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2 text-text-primary">Noch keine Bundles erstellt</h2>
              <p className="text-text-secondary text-sm mb-8">Erstelle dein erstes Bundle um Produkte zu gruppieren.</p>
              <button
                onClick={() => setActiveBundleId('new')}
                className="bg-text-primary text-bg-primary px-6 py-3 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity shadow-md"
              >
                Jetzt erstellen
              </button>
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
                    <div className="flex justify-between items-start mb-4 md:mb-8 gap-3">
                      <div className="flex-1 min-w-0">
                        <MarqueeOverflow>
                          <h2 className="text-lg md:text-2xl font-playfair font-bold text-text-primary mr-8">{bundle.name}</h2>
                        </MarqueeOverflow>
                        <p className="text-xs text-text-secondary mt-0.5">{totalArticles} Artikel</p>
                      </div>

                      {/* Right side: Price + Actions */}
                      <div className="bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl md:rounded-3xl p-3 md:p-4 flex flex-col items-end gap-2 md:gap-3 shrink-0">
                        <span className="text-lg md:text-2xl font-bold text-text-primary">{totalPrice.toFixed(2)} €</span>
                        <div className="flex items-center gap-1.5 md:gap-2">
                          <button
                            onClick={() => setActiveBundleId(bundle.id)}
                            className="bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-md px-2.5 md:px-4 py-1.5 rounded-full text-xs font-medium hover:bg-white/10 transition-colors"
                          >
                            Bearbeiten
                          </button>
                          <button
                            onClick={() => deleteBundle(bundle.id)}
                            className="w-7 h-7 md:w-8 md:h-8 bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] rounded-full flex items-center justify-center text-text-secondary hover:text-heart transition-colors"
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
                            <div key={item.id} className="flex flex-col w-28 md:w-44 shrink-0 glass-panel rounded-xl md:rounded-2xl p-2 md:p-3 pb-3 md:pb-4">
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
                      <button className="bg-text-primary text-bg-primary px-4 md:px-6 py-2 md:py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity shadow-md">
                        Kaufen
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* ═══ BUNDLE EDITOR ═══ */
        <div className="flex flex-col flex-1 min-h-0 gap-4 md:gap-6">

          {/* Mobile Tab Switcher */}
          <div className="flex md:hidden gap-0 glass-panel rounded-2xl p-1 mx-1">
            <button
              onClick={() => setMobileEditorTab('catalog')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
                mobileEditorTab === 'catalog' ? 'bg-text-primary text-bg-primary shadow-sm' : 'text-text-secondary'
              )}
            >
              <BookOpen size={16} />
              Katalog
            </button>
            <button
              onClick={() => setMobileEditorTab('bundle')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
                mobileEditorTab === 'bundle' ? 'bg-text-primary text-bg-primary shadow-sm' : 'text-text-secondary'
              )}
            >
              <ShoppingBag size={16} />
              Bundle {draftItems.length > 0 && <span className="bg-heart text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center leading-none">{draftItems.length}</span>}
            </button>
          </div>

          <div className="flex flex-col md:flex-row flex-1 min-h-0 gap-4 md:gap-6">
            {/* Left panel: Full Catalog with Filters */}
            <div className={cn(
              'flex-[3] glass-panel rounded-2xl md:rounded-3xl p-4 md:p-6 flex flex-col overflow-hidden relative',
              // On mobile, hide this panel when on 'bundle' tab
              mobileEditorTab === 'bundle' ? 'hidden md:flex' : 'flex'
            )}>
              {/* Filter Bar */}
              <div className="flex flex-col gap-3 mb-4 shrink-0">
                {/* Search */}
                <div className="relative">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Suchen..."
                    className="w-full bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] rounded-full pl-10 pr-4 py-2 text-sm outline-none"
                  />
                </div>

                {/* Category pills – scrollable */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  <button
                    onClick={() => setEditorMainCat('Alle')}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium transition-all shadow-sm whitespace-nowrap shrink-0',
                      editorMainCat === 'Alle' ? 'bg-text-primary text-bg-primary border border-transparent' : 'bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] text-text-secondary hover:text-text-primary'
                    )}
                  >
                    Alle
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setEditorMainCat(cat)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium transition-all shadow-sm whitespace-nowrap shrink-0',
                        editorMainCat === cat ? 'bg-text-primary text-bg-primary border border-transparent' : 'bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] text-text-secondary hover:text-text-primary'
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Status filters */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditorStatusFilter(editorStatusFilter === 'bought' ? 'all' : 'bought')}
                    className={cn(
                      'flex-1 py-1.5 rounded-full text-xs font-medium transition-all shadow-sm',
                      editorStatusFilter === 'bought' ? 'bg-text-primary text-bg-primary border border-transparent' : 'bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] text-text-secondary hover:text-text-primary'
                    )}
                  >
                    Gekauft
                  </button>
                  <button
                    onClick={() => setEditorStatusFilter(editorStatusFilter === 'reduced' ? 'all' : 'reduced')}
                    className={cn(
                      'flex-1 py-1.5 rounded-full text-xs font-medium transition-all shadow-sm',
                      editorStatusFilter === 'reduced' ? 'bg-text-primary text-bg-primary border border-transparent' : 'bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] text-text-secondary hover:text-text-primary'
                    )}
                  >
                    Reduziert
                  </button>
                </div>

                {/* Sub-category chips */}
                {editorMainCat !== 'Alle' && subCats[editorMainCat] && (
                  <div className="flex flex-wrap gap-1.5 justify-center items-center">
                    <button
                      onClick={() => setEditorSubCats([])}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium transition-all shadow-sm',
                        editorSelectedSubCats.length === 0 ? 'bg-text-primary text-bg-primary border border-transparent' : 'bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] text-text-secondary hover:text-text-primary'
                      )}
                    >
                      Alle
                    </button>
                    {subCats[editorMainCat].map(sub => (
                      <button
                        key={sub}
                        onClick={() => {
                          setEditorSubCats(
                            editorSelectedSubCats.includes(sub)
                              ? editorSelectedSubCats.filter(s => s !== sub)
                              : [...editorSelectedSubCats, sub]
                          );
                        }}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-xs font-medium transition-all shadow-sm',
                          editorSelectedSubCats.includes(sub) ? 'bg-text-primary text-bg-primary border border-transparent' : 'bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] text-text-secondary hover:text-text-primary'
                        )}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Grid */}
              <div className="flex-1 relative overflow-hidden">
                <div className="absolute inset-0 overflow-y-auto hidden-scrollbar" style={{ maskImage: 'linear-gradient(to bottom, transparent 0%, black 40px, black calc(100% - 60px), transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 40px, black calc(100% - 60px), transparent 100%)' }}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 pt-8 pb-16">
                    {editorFilteredProducts.map(product => (
                      <div
                        key={product.id}
                        onClick={() => { handleAddItem(product.id); setMobileEditorTab('bundle'); }}
                        className="glass-panel group relative flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl rounded-2xl p-2 md:p-3 cursor-pointer"
                      >
                        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-black/20 mb-2">
                          <img
                            src={product.imgs[0] || 'https://via.placeholder.com/400'}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            loading="lazy"
                          />
                          {product.discount > 0 && (
                            <div className="absolute top-1.5 left-1.5 bg-heart text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-md">
                              -{product.discount}%
                            </div>
                          )}
                        </div>
                        <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-0.5 line-clamp-1 px-0.5">{product.shop}</span>
                        <h3 className="font-bold text-xs md:text-sm leading-snug mb-0.5 line-clamp-1 px-0.5">{product.name}</h3>
                        <span className="font-bold text-xs md:text-sm px-0.5">{product.finalPrice.toFixed(2)} €</span>
                      </div>
                    ))}
                    {editorFilteredProducts.length === 0 && (
                      <div className="col-span-full py-16 flex flex-col items-center justify-center text-text-secondary">
                        <p className="text-sm">Keine Produkte gefunden.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right panel: Bundle Editor */}
            <div className={cn(
              'md:flex-1 glass-panel rounded-2xl md:rounded-3xl p-4 md:p-6 flex flex-col justify-between overflow-hidden md:min-w-[280px]',
              mobileEditorTab === 'catalog' ? 'hidden md:flex' : 'flex'
            )}>
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex justify-between items-center mb-4 shrink-0">
                  <input
                    type="text"
                    value={draftName}
                    onChange={e => setDraftName(e.target.value)}
                    placeholder="Name der Zusammenstellung..."
                    className="bg-transparent border-none outline-none font-bold text-base md:text-lg text-text-primary placeholder:text-text-secondary/70 w-full"
                  />
                  <button onClick={handleCancelBundle} className="text-text-secondary hover:text-text-primary transition-colors cursor-pointer shrink-0 ml-3 font-bold"><X size={18} /></button>
                </div>

                <div className="flex-1 overflow-y-auto hidden-scrollbar pr-1 space-y-2.5 min-h-[200px]">
                  {draftItems.length === 0 && (
                    <div className="h-full min-h-[150px] flex flex-col items-center justify-center text-text-secondary opacity-50">
                      <Layers size={28} className="mb-2" />
                      <p className="text-sm text-center">Füge Produkte aus dem Katalog hinzu.</p>
                    </div>
                  )}
                  {draftItems.map(item => {
                    const product = products.find(p => p.id === item.id);
                    if (!product) return null;
                    return (
                      <div key={item.id} className="flex items-center justify-between p-3 glass-panel rounded-xl md:rounded-2xl">
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <img src={product.imgs[0] || 'https://via.placeholder.com/100'} className="w-10 h-10 md:w-12 md:h-12 object-cover rounded-lg md:rounded-xl shrink-0" alt="" />
                          <div className="min-w-0">
                            <p className="font-bold text-xs md:text-sm leading-tight line-clamp-1">{product.name}</p>
                            <p className="text-[10px] text-text-secondary">{product.finalPrice.toLocaleString('de-DE')} € ({item.qty}x)</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <button
                            onClick={() => handleDecreaseItem(item.id)}
                            className="w-7 h-7 md:w-9 md:h-9 rounded-full bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] flex items-center justify-center text-text-primary hover:bg-white/20 transition-colors text-sm font-bold"
                          >
                            −
                          </button>
                          <button
                            onClick={() => handleAddItem(item.id)}
                            className="w-7 h-7 md:w-9 md:h-9 rounded-full bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] flex items-center justify-center text-text-primary hover:bg-white/20 transition-colors text-sm font-bold"
                          >
                            +
                          </button>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="w-7 h-7 md:w-9 md:h-9 rounded-full bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] flex items-center justify-center text-text-primary hover:text-heart transition-colors text-sm font-bold"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[var(--theme-glass-border)] shrink-0">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-text-secondary">Gesamtpreis:</span>
                  <span className="font-bold text-lg md:text-xl">{draftTotal.toLocaleString('de-DE')} €</span>
                </div>
                <button
                  onClick={handleCreateOrUpdate}
                  className="w-full bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] py-2.5 md:py-3 rounded-xl text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10 transition-colors shadow-sm"
                >
                  Zusammenstellung speichern
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
