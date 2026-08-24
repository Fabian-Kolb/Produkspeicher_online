import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { ProductCard } from '../components/features/ProductCard';
import { Bell, Tag, ArrowRight } from 'lucide-react';
import type { Product } from '../types';
import { Button } from '../components/common/Button';
import { triggerHaptic } from '../utils/haptics';

export const DealsView: React.FC = () => {
  const navigate = useNavigate();
  const { products } = useAppStore();
  
  // Deals are defined as products that have a discount (discount > 0)
  const dealProducts = useMemo(() => products.filter((p: Product) => p.discount > 0), [products]);

  const totalSavings = useMemo(() => {
    return dealProducts.reduce((sum, p) => sum + (p.price - p.finalPrice), 0);
  }, [dealProducts]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-playfair font-bold flex items-center gap-3">
            <span>Price Alerts & Deals</span>
            <div className="relative">
              <Bell className="text-heart" size={24} />
              {dealProducts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-heart rounded-full animate-ping" />
              )}
            </div>
          </h1>
          <p className="text-text-secondary text-xs sm:text-sm mt-1.5">
            Aktuelle Rabatte und Preissenkungen in deiner Liste.
          </p>
        </div>

        {dealProducts.length > 0 && (
          <div className="glass-panel px-4 py-2 rounded-2xl flex items-center gap-3 self-start sm:self-auto border border-heart/20 bg-heart/5">
            <Tag size={16} className="text-heart shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-text-secondary">Gesamtersparnis</span>
              <span className="text-sm font-extrabold text-heart">
                {totalSavings.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-6">
        {dealProducts.map((product: Product) => (
          <ProductCard key={product.id} product={product} />
        ))}

        {dealProducts.length === 0 && (
          <div className="col-span-full py-16 px-6 glass-panel rounded-3xl flex flex-col items-center justify-center text-center max-w-lg mx-auto my-8 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-heart/10 text-heart flex items-center justify-center mb-4">
              <Bell size={30} strokeWidth={2} />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-1">Keine aktiven Deals</h3>
            <p className="text-xs sm:text-sm text-text-secondary mb-6 leading-relaxed">
              Aktuell sind keine Produkte mit einem Rabatt versehen. Sobald ein Preisnachlass eingetragen wird, erscheint der Artikel automatisch hier.
            </p>
            <Button
              variant="primary"
              onClick={() => {
                triggerHaptic(15);
                navigate('/katalog');
              }}
              className="text-xs font-bold gap-2 py-2.5 px-4 shadow-md"
            >
              <span>Katalog durchstöbern</span>
              <ArrowRight size={14} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
