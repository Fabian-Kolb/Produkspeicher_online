import React, { useEffect } from 'react';
import { X, Bookmark, ShoppingBag, Trash2, Edit3, ExternalLink } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../common/Button';
import { cn } from '../../utils/cn';

export const ProductDetailModal: React.FC = () => {
  const { isProductDetailModalOpen, viewingProductId, closeProductDetailModal, openProductModal } = useUIStore();
  const { products, updateProduct, deleteProduct } = useAppStore();
  
  const product = products.find(p => p.id === viewingProductId);

  // Keyboard support: Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeProductDetailModal();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [closeProductDetailModal]);

  if (!isProductDetailModalOpen || !product) return null;

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateProduct(product.id, { isFavorite: !product.isFavorite });
  };

  const handleToggleBought = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = product.status === 'bought' ? 'active' : 'bought';
    updateProduct(product.id, { 
      status: newStatus,
      dateBought: newStatus === 'bought' ? new Date().toISOString() : null
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Möchtest du dieses Produkt wirklich löschen?')) {
      deleteProduct(product.id);
      closeProductDetailModal();
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    closeProductDetailModal();
    openProductModal(product.id);
  };

  const images = product.imgs.length > 0 ? product.imgs : ['https://via.placeholder.com/800'];

  return (
    <div 
      className="fixed inset-0 z-[250] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
      onClick={closeProductDetailModal}
    >
      <div 
        className="w-full max-w-6xl max-h-[90vh] glass-panel bg-bg-card border border-border-primary/50 rounded-[3rem] overflow-hidden flex flex-col md:flex-row shadow-2xl animate-in zoom-in-95 duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Left Side: Scrollable Image Gallery */}
        <div className="w-full md:w-1/2 overflow-y-auto hidden-scrollbar bg-black/10 p-4 md:p-10 flex flex-col gap-6 md:gap-10 max-h-[45vh] md:max-h-none">
          {images.map((img, idx) => (
            <div 
              key={idx}
              className="relative w-full aspect-square rounded-[2.5rem] overflow-hidden bg-bg-card border border-border-primary/20 shadow-md group flex items-center justify-center shrink-0"
            >
              {/* Subtle background glow */}
              <div 
                className="absolute inset-0 blur-2xl opacity-10 pointer-events-none transition-opacity group-hover:opacity-20"
                style={{ backgroundImage: `url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
              />
              
              <img 
                src={img} 
                alt={`${product.name} ${idx + 1}`}
                className="relative z-10 w-full h-full object-contain p-6 transition-transform duration-700 group-hover:scale-105"
              />
              
              {idx === 0 && product.discount > 0 && (
                <div className="absolute top-6 left-6 bg-heart text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg z-20 uppercase tracking-widest">
                  -{product.discount}% OFF
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right Side: Details */}
        <div className="w-full md:w-1/2 p-8 md:p-14 flex flex-col overflow-y-auto hidden-scrollbar bg-bg-card relative">
          
          {/* Mobile Close Button – always visible on small screens */}
          <button 
            onClick={closeProductDetailModal}
            className="absolute top-3 right-3 md:hidden w-10 h-10 flex items-center justify-center rounded-2xl bg-text-primary/10 hover:bg-text-primary/20 transition-all text-text-secondary hover:text-text-primary border border-border-primary/20 z-10"
          >
            <X size={20} />
          </button>

          {/* Top Actions & Header */}
          <div className="flex justify-between items-start mb-6 md:mb-10 pr-12 md:pr-0">
            <div className="flex flex-col gap-2 md:gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-text-secondary opacity-60">
                {product.shop}
              </span>
              <h2 className="text-2xl md:text-5xl font-bold leading-tight text-text-primary tracking-tight">
                {product.name}
              </h2>
            </div>
            {/* Desktop Close Button */}
            <button 
              onClick={closeProductDetailModal}
              className="hidden md:flex w-14 h-14 items-center justify-center rounded-2xl bg-text-primary/5 hover:bg-text-primary/10 transition-all text-text-secondary hover:text-text-primary active:scale-90 border border-border-primary/20"
            >
              <X size={32} />
            </button>
          </div>

          {/* Pricing & Rating Info */}
          <div className="flex items-center gap-4 md:gap-10 mb-6 md:mb-12">
            <div className="flex flex-col">
              {product.discount > 0 && (
                <span className="text-sm font-bold text-text-secondary line-through opacity-40 mb-1">
                  {product.price.toFixed(2)} €
                </span>
              )}
              <span className="text-3xl md:text-5xl font-black tracking-tighter text-text-primary">
                {product.finalPrice.toFixed(2)}<span className="text-lg md:text-2xl ml-1">€</span>
              </span>
            </div>
            <div className="h-12 md:h-16 w-px bg-border-primary/30 mx-1 md:mx-2" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em] mb-1 md:mb-2 opacity-60">Rating</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl md:text-3xl font-black text-text-primary">{product.rating.toFixed(1)}</span>
                <span className="text-xs text-text-secondary font-bold opacity-30 mt-1">/ 10</span>
              </div>
            </div>
          </div>

          {/* Tags / Categories */}
          <div className="flex flex-wrap gap-3 mb-12">
            <span className="px-5 py-2 rounded-xl bg-text-primary/10 text-text-primary text-[10px] font-black uppercase tracking-[0.2em] border border-border-primary/20">
              {product.mainCat}
            </span>
            {product.subCats.map(sub => (
              <span key={sub} className="px-5 py-2 rounded-xl bg-text-primary/5 text-text-secondary text-[10px] font-bold uppercase tracking-[0.2em] border border-border-primary/10">
                {sub}
              </span>
            ))}
          </div>

          {/* Description Section */}
          <div className="mb-14 flex-grow">
            <h4 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.4em] mb-6 opacity-60">Notizen & Details</h4>
            <div className="p-8 rounded-[2rem] bg-text-primary/5 border border-border-primary/10 flex flex-col gap-4">
              <p className="text-text-primary/80 leading-relaxed whitespace-pre-wrap text-[15px] font-medium italic">
                {product.details || 'Keine Details hinterlegt.'}
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col gap-6 mt-auto">
            
            {/* Main Action Bar */}
            <div className="flex flex-col sm:flex-row gap-5">
              {product.url ? (
                <a 
                  href={product.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-[2]"
                >
                  <Button variant="primary" className="w-full flex items-center justify-center gap-4 py-6 rounded-2xl shadow-xl shadow-text-primary/10 text-base">
                    <ExternalLink size={22} strokeWidth={3} /> Zum Shop
                  </Button>
                </a>
              ) : null}
              
              <Button 
                variant={product.status === 'bought' ? 'primary' : 'glass'}
                onClick={handleToggleBought}
                className={cn(
                  "flex-1 flex items-center justify-center gap-3 py-6 rounded-2xl transition-all shadow-md",
                  product.status === 'bought' ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-bg-card border-border-primary/30"
                )}
              >
                <ShoppingBag size={22} className={product.status === 'bought' ? "fill-current" : ""} />
                <span className="font-black uppercase tracking-widest text-xs">{product.status === 'bought' ? 'Gekauft' : 'Kaufen'}</span>
              </Button>
            </div>

            {/* Sub Action Toolbar */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-text-primary/5 border border-border-primary/10">
              <button 
                onClick={handleToggleFavorite}
                className={cn(
                  "flex items-center gap-3 px-6 py-3 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest leading-none",
                  product.isFavorite ? "text-amber-500 bg-amber-500/10 shadow-sm shadow-amber-500/5" : "text-text-secondary hover:text-text-primary"
                )}
              >
                <Bookmark size={20} className={product.isFavorite ? "fill-current" : ""} />
                {product.isFavorite ? 'Gespeichert' : 'Merken'}
              </button>
              
              <div className="flex gap-3">
                <button 
                  onClick={handleEdit}
                  className="w-12 h-12 flex items-center justify-center rounded-xl bg-bg-card text-text-secondary hover:text-blue-500 hover:bg-blue-500/5 transition-all border border-border-primary/20 hover:border-blue-500/30"
                  title="Bearbeiten"
                >
                  <Edit3 size={20} />
                </button>
                <button 
                  onClick={handleDelete}
                  className="w-12 h-12 flex items-center justify-center rounded-xl bg-bg-card text-heart/60 hover:text-heart hover:bg-heart/5 transition-all border border-border-primary/20 hover:border-heart/30"
                  title="Löschen"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
