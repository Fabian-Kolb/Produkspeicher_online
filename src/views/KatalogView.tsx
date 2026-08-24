import React, { useMemo } from 'react';
import { Search, X, ChevronDown, Plus, RotateCcw, PackageSearch } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useUIStore } from '../store/useUIStore';
import { SubNavigation } from '../components/layout/SubNavigation';
import { ProductCard } from '../components/features/ProductCard';
import type { Product } from '../types';
import { FilterChip } from '../components/common/FilterChip';
import { Button } from '../components/common/Button';
import { triggerHaptic } from '../utils/haptics';

export const KatalogView: React.FC = () => {
  const { products, categories, subCats } = useAppStore();
  const {
    mainCat, selectedSubCats, sortMode, searchQuery, statusFilter,
    setSearchQuery, setSortMode, setStatusFilter, openProductModal
  } = useUIStore();

  const filteredProducts = useMemo(() => {
    let result = products;

    // 1. Search
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      result = result.filter((p: Product) =>
        p.name.toLowerCase().includes(lowerQ) ||
        p.shop.toLowerCase().includes(lowerQ)
      );
    }

    // 2. Status Filter
    if (statusFilter === 'bought') {
      result = result.filter((p: Product) => p.status === 'bought');
    } else if (statusFilter === 'reduced') {
      result = result.filter((p: Product) => p.discount > 0);
    } 

    // 3. Category Filter
    if (mainCat !== 'Alle') {
      result = result.filter((p: Product) => p.mainCat === mainCat);

      if (selectedSubCats.length > 0) {
        result = result.filter((p: Product) => p.subCats.some((sub: string) => selectedSubCats.includes(sub)));
      }
    }

    // 4. Sort
    result = [...result].sort((a: Product, b: Product) => {
      if (sortMode === 'priceAsc') return a.finalPrice - b.finalPrice;
      if (sortMode === 'priceDesc') return b.finalPrice - a.finalPrice;
      if (sortMode === 'newest') return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
      if (sortMode === 'oldest') return new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime();
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
    });

    return result;
  }, [products, mainCat, selectedSubCats, sortMode, searchQuery, statusFilter]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div 
        style={{ 
          transform: 'translateX(var(--katalog-header-x, 0px))', 
          transition: 'var(--header-transition, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1))' 
        }}
      >
        <SubNavigation categories={categories} />

        {/* Control Bar (Search, Sort, Filters) */}
        <div className="flex flex-col gap-6 mb-12">
          {/* Top Row: Search & Main Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="relative group w-full sm:w-64 sm:focus-within:w-80 sm:hover:w-80 transition-[width] duration-300 ease-out">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none transition-colors group-focus-within:text-text-primary" />
              <input
                type="text"
                placeholder="Suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full glass-panel rounded-full pl-10 pr-9 py-2 text-sm outline-none border border-border-primary/20 hover:border-text-secondary/60 focus:border-accent shadow-sm focus:shadow-md transition-all duration-300"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHaptic(10);
                    setSearchQuery('');
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-text-secondary hover:text-text-primary bg-text-primary/5 hover:bg-text-primary/15 transition-all duration-200 cursor-pointer active:scale-90 z-10"
                  title="Suche leeren"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="relative">
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as any)}
                className="glass-panel rounded-full pl-4 pr-9 py-2 text-sm outline-none focus:border-text-secondary shadow-sm appearance-none cursor-pointer transition-all duration-300 select-none"
              >
                <option value="default">Sort: Favoriten</option>
                <option value="priceAsc">Preis aufsteigend</option>
                <option value="priceDesc">Preis absteigend</option>
                <option value="newest">Neueste zuerst</option>
                <option value="oldest">Älteste zuerst</option>
              </select>
              <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none opacity-70" />
            </div>

            <FilterChip
              active={statusFilter === 'bought'}
              onClick={() => setStatusFilter(statusFilter === 'bought' ? 'active' : 'bought')}
            >
              Gekauft
            </FilterChip>
            <FilterChip
              active={statusFilter === 'reduced'}
              onClick={() => setStatusFilter(statusFilter === 'reduced' ? 'active' : 'reduced')}
            >
              Reduziert
            </FilterChip>
          </div>

          {/* Bottom Row: Sub Filters */}
          <div className="min-h-[44px] flex flex-wrap gap-2 justify-center items-center">
            {mainCat !== 'Alle' && subCats[mainCat] && subCats[mainCat].map(sub => (
              <FilterChip
                key={sub}
                active={selectedSubCats.includes(sub)}
                onClick={() => {
                  useUIStore.setState(state => {
                    const newSubCats = state.selectedSubCats.includes(sub)
                      ? state.selectedSubCats.filter(s => s !== sub)
                      : [...state.selectedSubCats, sub];
                    return { selectedSubCats: newSubCats };
                  })
                }}
              >
                {sub}
              </FilterChip>
            ))}
          </div>

        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-6">
        {filteredProducts.map((product: Product) => (
          <ProductCard key={product.id} product={product} />
        ))}

        {filteredProducts.length === 0 && (
          <div className="col-span-full py-16 px-6 glass-panel rounded-3xl flex flex-col items-center justify-center text-center max-w-lg mx-auto my-8 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-text-primary/5 flex items-center justify-center mb-4 text-text-secondary">
              <PackageSearch size={32} strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-1">Keine Produkte gefunden</h3>
            <p className="text-xs sm:text-sm text-text-secondary mb-6 leading-relaxed">
              {searchQuery
                ? `Es wurden keine Produkte für die Suche „${searchQuery}“ gefunden.`
                : 'Für die aktuelle Filter- und Kategorieauswahl sind noch keine passenden Produkte vorhanden.'}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              {(searchQuery || selectedSubCats.length > 0 || statusFilter !== 'active' || mainCat !== 'Alle') && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    triggerHaptic(15);
                    setSearchQuery('');
                    setStatusFilter('active');
                    useUIStore.setState({ mainCat: 'Alle', selectedSubCats: [] });
                  }}
                  className="text-xs font-bold gap-2 py-2.5 px-4"
                >
                  <RotateCcw size={14} />
                  <span>Filter zurücksetzen</span>
                </Button>
              )}
              <Button
                variant="primary"
                onClick={() => {
                  triggerHaptic(15);
                  openProductModal();
                }}
                className="text-xs font-bold gap-2 py-2.5 px-4 shadow-md"
              >
                <Plus size={14} />
                <span>Produkt anlegen</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
