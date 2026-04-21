import React, { useMemo } from 'react';
import { Search } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useUIStore } from '../store/useUIStore';
import { SubNavigation } from '../components/layout/SubNavigation';
import { ProductCard } from '../components/features/ProductCard';
import type { Product } from '../types';
import { cn } from '../utils/cn';


export const KatalogView: React.FC = () => {
  const { products, categories, subCats, settings } = useAppStore();
  const {
    mainCat, selectedSubCats, sortMode, searchQuery, statusFilter,
    setSearchQuery, setSortMode, setStatusFilter
  } = useUIStore();

  const filteredProducts = useMemo(() => {
    // ... (logic remains same)
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
      <SubNavigation categories={categories} />

      {/* Control Bar (Search, Sort, Filters) */}
      <div className="flex flex-col gap-6 mb-12">
        {/* Top Row: Search & Main Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="relative w-full sm:w-auto">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              placeholder="Suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-md rounded-full pl-10 pr-4 py-2 text-sm outline-none focus:border-text-secondary transition-all shadow-sm"
            />
          </div>

          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as any)}
            className="bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-md rounded-full px-4 py-2 text-sm outline-none focus:border-text-secondary shadow-sm appearance-none pr-8 relative cursor-pointer"
          >
            <option value="default">Sort: Favoriten</option>
            <option value="priceAsc">Preis aufsteigend</option>
            <option value="priceDesc">Preis absteigend</option>
            <option value="newest">Neueste zuerst</option>
            <option value="oldest">Älteste zuerst</option>
          </select>

          <button
            onClick={() => setStatusFilter(statusFilter === 'bought' ? 'active' : 'bought')}
            className={cn(
              "px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 shadow-sm border",
              statusFilter === 'bought' 
                ? "bg-blue-600 dark:bg-blue-500 text-white border-transparent"
                : 'bg-slate-50/40 dark:bg-slate-800/20 border-slate-50 dark:border-slate-700/10 text-text-secondary hover:text-text-primary hover:scale-105 hover:shadow-md'
            )}
          >
            Gekauft
          </button>
          <button
            onClick={() => setStatusFilter(statusFilter === 'reduced' ? 'active' : 'reduced')}
            className={cn(
              "px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 shadow-sm border",
              statusFilter === 'reduced' 
                ? "bg-blue-600 dark:bg-blue-500 text-white border-transparent"
                : 'bg-slate-50/40 dark:bg-slate-800/20 border-slate-50 dark:border-slate-700/10 text-text-secondary hover:text-text-primary hover:scale-105 hover:shadow-md'
            )}
          >
            Reduziert
          </button>
        </div>

        {/* Bottom Row: Sub Filters */}
        <div className="min-h-[44px] flex flex-wrap gap-2 justify-center items-center">
          {mainCat !== 'Alle' && subCats[mainCat] && subCats[mainCat].map(sub => (
            <button
              key={sub}
              onClick={() => {
                useUIStore.setState(state => {
                  const newSubCats = state.selectedSubCats.includes(sub)
                    ? state.selectedSubCats.filter(s => s !== sub)
                    : [...state.selectedSubCats, sub];
                  return { selectedSubCats: newSubCats };
                })
              }}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-medium transition-colors border shadow-sm",
                selectedSubCats.includes(sub)
                  ? "bg-blue-600 dark:bg-blue-500 text-white border-transparent"
                  : 'bg-slate-50/40 dark:bg-slate-800/20 border-slate-50 dark:border-slate-700/10 text-text-secondary hover:text-text-primary'
              )}
            >
              {sub}
            </button>
          ))}
        </div>

      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-6">
        {filteredProducts.map((product: Product) => (
          <ProductCard key={product.id} product={product} />
        ))}

        {filteredProducts.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-text-secondary">
            <div className="text-4xl mb-4">🛒</div>
            <p className="text-lg">Keine Produkte gefunden.</p>
          </div>
        )}
      </div>
    </div>
  );
};
