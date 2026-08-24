import React, { useState } from 'react';
import { Bookmark, ShoppingBag, Trash2, Check, Package } from 'lucide-react';
import type { Product } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { useUIStore } from '../../store/useUIStore';
import { triggerHaptic } from '../../utils/haptics';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { updateProduct, deleteProduct } = useAppStore();
  const { openProductDetailModal } = useUIStore();
  const [imgError, setImgError] = useState(false);

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic(15);
    updateProduct(product.id, { isFavorite: !product.isFavorite });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic(15);
    deleteProduct(product.id);
  };
  
  const handleToggleBought = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic(15);
    const newStatus = product.status === 'bought' ? 'active' : 'bought';
    updateProduct(product.id, { 
      status: newStatus,
      dateBought: newStatus === 'bought' ? new Date().toISOString() : null
    });
  };

  const mainImg = product.imgs && product.imgs.length > 0 ? product.imgs[product.mainImgIdx || 0] : null;
  const ratingValue = typeof product.rating === 'number' ? Math.min(Math.max(product.rating, 0), 10) : 0;
  const ratingPct = (ratingValue / 10) * 100;

  return (
    <div 
      onClick={() => {
        triggerHaptic(10);
        openProductDetailModal(product.id);
      }}
      className="glass-panel group relative flex flex-col overflow-hidden hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] transform-gpu rounded-[1.5rem] p-3 cursor-pointer select-none"
    >
      
      {/* Image Container */}
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-text-primary/5 border border-border-primary/20 mb-3 flex items-center justify-center">
        {mainImg && !imgError ? (
          <img 
            src={mainImg} 
            alt={product.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 p-4 text-text-secondary/50 bg-gradient-to-br from-text-primary/[0.03] to-text-primary/[0.08]">
            <Package size={28} strokeWidth={1.5} className="text-text-secondary/60 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary/60 text-center line-clamp-1">
              {product.shop || 'Produkt'}
            </span>
          </div>
        )}

        {/* Badges on Top */}
        <div className="absolute top-2 left-2 flex flex-col items-start gap-1 z-10 pointer-events-none">
          {product.discount > 0 && (
            <div className="bg-heart text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-md animate-in fade-in zoom-in-95 duration-200">
              -{product.discount}%
            </div>
          )}
          {product.status === 'bought' && (
            <div className="bg-emerald-500/90 text-white backdrop-blur-sm text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-md flex items-center gap-1 animate-in fade-in zoom-in-95 duration-200">
              <Check size={10} strokeWidth={3} />
              <span>Gekauft</span>
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex justify-between items-start px-1 mb-3 flex-grow min-w-0">
        
        {/* Left Side: Text Details */}
        <div className="flex flex-col flex-1 pr-2 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1 line-clamp-1">
            {product.shop || 'Allgemein'}
          </span>
          <h3 className="font-bold text-sm leading-snug mb-1 line-clamp-2 text-text-primary">
            {product.name}
          </h3>
          <div className="flex items-baseline gap-1.5 mt-auto">
            <span className="font-extrabold text-sm text-text-primary">
              {product.finalPrice.toFixed(2)} €
            </span>
            {product.discount > 0 && (
              <span className="text-[11px] text-text-secondary line-through opacity-60">
                {product.price.toFixed(2)} €
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Actions (Vertical) */}
        <div className="flex flex-col gap-2.5 shrink-0 items-center justify-start mt-0.5">
          <button 
            onClick={handleToggleBought} 
            className="p-1 rounded-full hover:bg-text-primary/10 text-text-secondary hover:text-text-primary transition-all active:scale-90"
            title={product.status === 'bought' ? 'Als Wunschliste markieren' : 'Als Gekauft markieren'}
          >
            <ShoppingBag size={16} strokeWidth={2} className={product.status === 'bought' ? 'text-accent fill-accent' : ''} />
          </button>
          <button 
            onClick={handleToggleFavorite} 
            className="p-1 rounded-full hover:bg-text-primary/10 text-text-secondary hover:text-heart transition-all active:scale-90"
            title={product.isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
          >
            <Bookmark size={16} strokeWidth={2} fill={product.isFavorite ? 'currentColor' : 'none'} className={product.isFavorite ? 'text-heart fill-heart' : ''} />
          </button>
          <button 
            onClick={handleDelete} 
            className="p-1 rounded-full hover:bg-heart/10 text-text-secondary hover:text-heart transition-all active:scale-90"
            title="Produkt löschen"
          >
            <Trash2 size={15} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Dynamic Rating Slider Bar */}
      <div className="mt-auto px-1 flex items-center justify-between gap-2.5 text-[10px] text-text-secondary font-bold">
        <div className="flex-1 relative h-1.5 bg-text-primary/10 rounded-full overflow-hidden flex items-center">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-accent/70 to-accent transition-all duration-500 ease-out"
            style={{ width: `${ratingPct}%` }}
          />
        </div>
        <span className="text-[10px] font-semibold text-text-secondary shrink-0 tabular-nums">
          {ratingValue > 0 ? ratingValue.toFixed(1) : '0.0'} / 10
        </span>
      </div>

    </div>
  );
};
