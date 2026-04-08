import React from 'react';
import { Bookmark, ShoppingBag, Trash2 } from 'lucide-react';
import type { Product } from '../../types';
import { useAppStore } from '../../store/useAppStore';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { updateProduct, deleteProduct } = useAppStore();

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateProduct(product.id, { isFavorite: !product.isFavorite });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteProduct(product.id);
  };
  
  const handleToggleBought = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = product.status === 'bought' ? 'active' : 'bought';
    updateProduct(product.id, { 
      status: newStatus,
      dateBought: newStatus === 'bought' ? new Date().toISOString() : null
    });
  };

  const mainImg = product.imgs[product.mainImgIdx || 0] || 'https://via.placeholder.com/400';

  return (
    <div className="glass-panel group relative flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl rounded-[1.5rem] p-3 cursor-pointer">
      
      {/* Image Container */}
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-black/20 mb-3">
        <img 
          src={mainImg} 
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        {product.discount > 0 && (
          <div className="absolute top-2 left-2 bg-heart text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md">
            -{product.discount}%
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex justify-between items-start px-1 mb-4 flex-grow">
        
        {/* Left Side: Text Details */}
        <div className="flex flex-col flex-1 pr-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1 line-clamp-1">
            {product.shop}
          </span>
          <h3 className="font-bold text-sm leading-snug mb-1 line-clamp-2">
            {product.name}
          </h3>
          <span className="font-bold text-sm">
            {product.finalPrice.toFixed(2)} €
          </span>
        </div>

        {/* Right Side: Actions (Vertical) */}
        <div className="flex flex-col gap-3 shrink-0 items-center justify-start mt-1">
          <button onClick={handleToggleBought} className="text-text-secondary hover:text-text-primary transition-colors">
            <ShoppingBag size={16} strokeWidth={2} className={product.status === 'bought' ? 'text-emerald-500 fill-emerald-500' : ''} />
          </button>
          <button onClick={handleToggleFavorite} className="text-text-secondary hover:text-amber-400 transition-colors">
            <Bookmark size={16} strokeWidth={2} fill={product.isFavorite ? 'currentColor' : 'none'} className={product.isFavorite ? 'text-amber-400' : ''} />
          </button>
          <button onClick={handleDelete} className="text-text-secondary hover:text-heart transition-colors">
            <Trash2 size={16} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Bottom Slider / Rating */}
      <div className="mt-auto px-1 flex items-center justify-between gap-3 text-[10px] text-text-secondary font-bold">
        <div className="flex-1 relative h-1.5 bg-text-primary/10 rounded-full flex items-center">
          <div className="absolute left-0 w-2.5 h-2.5 bg-text-primary rounded-full shadow-sm"></div>
        </div>
        <span>{product.rating ? product.rating.toFixed(1) : '0.0'} / 10</span>
      </div>

    </div>
  );
};
