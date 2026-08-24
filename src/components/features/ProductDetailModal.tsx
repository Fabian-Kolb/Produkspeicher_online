import React, { useEffect, useState } from 'react';
import { X, Bookmark, ShoppingBag, Trash2, Edit3, ExternalLink, Tag, Package, Star } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../common/Button';
import { cn } from '../../utils/cn';
import { triggerHaptic } from '../../utils/haptics';

export const ProductDetailModal: React.FC = () => {
  const { isProductDetailModalOpen, viewingProductId, closeProductDetailModal, openProductModal } = useUIStore();
  const { products, updateProduct, deleteProduct } = useAppStore();
  
  const product = products.find(p => p.id === viewingProductId);
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});

  // Reset active image when product changes
  useEffect(() => {
    if (product) {
      setActiveImgIdx(product.mainImgIdx || 0);
      setFailedImages({});
    }
  }, [product?.id]);

  // Keyboard support: Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        triggerHaptic(10);
        closeProductDetailModal();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [closeProductDetailModal]);

  if (!isProductDetailModalOpen || !product) return null;

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic(15);
    updateProduct(product.id, { isFavorite: !product.isFavorite });
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

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic(15);
    if (window.confirm('Möchtest du dieses Produkt wirklich löschen?')) {
      deleteProduct(product.id);
      closeProductDetailModal();
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic(15);
    closeProductDetailModal();
    openProductModal(product.id);
  };

  const images = product.imgs && product.imgs.length > 0 ? product.imgs : ['https://via.placeholder.com/800'];
  const currentImg = images[activeImgIdx] || images[0];
  const isCurrentImgFailed = failedImages[activeImgIdx];
  const savings = product.price - product.finalPrice;
  const ratingValue = typeof product.rating === 'number' ? Math.min(Math.max(product.rating, 0), 10) : 0;
  const ratingPct = (ratingValue / 10) * 100;

  return (
    <div 
      className="fixed inset-0 z-[250] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300 select-none"
      onClick={() => {
        triggerHaptic(10);
        closeProductDetailModal();
      }}
    >
      <div 
        className="w-full max-w-5xl max-h-[90vh] glass-panel rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row shadow-2xl animate-in zoom-in-95 duration-400 border border-border-primary/20"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Left Side: Interactive Gallery */}
        <div className="w-full md:w-1/2 bg-black/15 p-4 sm:p-8 flex flex-col justify-between items-center gap-4 max-h-[45vh] md:max-h-none border-b md:border-b-0 md:border-r border-border-primary/10">
          
          {/* Main Hero Preview */}
          <div className="relative w-full flex-1 min-h-[220px] aspect-square rounded-[2rem] overflow-hidden bg-bg-card/40 border border-border-primary/20 shadow-lg flex items-center justify-center group">
            {/* Ambient Background Glow */}
            {!isCurrentImgFailed && (
              <div 
                className="absolute inset-0 blur-3xl opacity-15 pointer-events-none transition-opacity group-hover:opacity-25"
                style={{ backgroundImage: `url(${currentImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
              />
            )}
            
            {!isCurrentImgFailed ? (
              <img 
                src={currentImg} 
                alt={`${product.name} Ansicht ${activeImgIdx + 1}`}
                onError={() => setFailedImages(prev => ({ ...prev, [activeImgIdx]: true }))}
                className="relative z-10 w-full h-full object-contain p-4 sm:p-6 transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="relative z-10 flex flex-col items-center justify-center gap-2 text-text-secondary/60 p-6 text-center">
                <Package size={42} strokeWidth={1.5} className="opacity-70" />
                <span className="text-xs font-semibold">{product.shop || 'Produktbild nicht verfügbar'}</span>
              </div>
            )}
            
            {/* Badges on Hero */}
            <div className="absolute top-4 left-4 flex flex-col items-start gap-1.5 z-20 pointer-events-none">
              {product.discount > 0 && (
                <div className="bg-heart text-white text-[11px] font-black px-3 py-1 rounded-full shadow-lg tracking-wider">
                  -{product.discount}% RABATT
                </div>
              )}
              {product.status === 'bought' && (
                <div className="bg-emerald-500/90 text-white backdrop-blur-md text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                  ✓ GEKAUFT
                </div>
              )}
            </div>
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="flex items-center gap-2.5 overflow-x-auto max-w-full py-1 px-1 scrollbar-none">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    triggerHaptic(15);
                    setActiveImgIdx(idx);
                  }}
                  className={cn(
                    "w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-bg-card/60 border transition-all duration-300 shrink-0 p-1 flex items-center justify-center cursor-pointer",
                    activeImgIdx === idx 
                      ? "ring-2 ring-accent border-accent scale-105 shadow-md bg-accent/10" 
                      : "border-border-primary/20 opacity-60 hover:opacity-100 hover:border-text-secondary/50"
                  )}
                  title={`Bild ${idx + 1} anzeigen`}
                >
                  {!failedImages[idx] ? (
                    <img 
                      src={img} 
                      alt=""
                      onError={() => setFailedImages(prev => ({ ...prev, [idx]: true }))}
                      className="w-full h-full object-contain rounded-lg" 
                    />
                  ) : (
                    <Package size={16} className="text-text-secondary/60" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Details & Actions */}
        <div className="w-full md:w-1/2 p-6 sm:p-10 flex flex-col overflow-y-auto hidden-scrollbar bg-transparent relative">
          
          {/* Header */}
          <div className="flex justify-between items-start mb-4 pr-10 md:pr-0">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary opacity-70">
                {product.shop || 'Shop'}
              </span>
              <h2 className="text-xl sm:text-3xl font-playfair font-bold leading-tight text-text-primary">
                {product.name}
              </h2>
            </div>
            
            {/* Close Button */}
            <button 
              onClick={() => {
                triggerHaptic(10);
                closeProductDetailModal();
              }}
              className="absolute top-4 right-4 md:static w-10 h-10 flex items-center justify-center rounded-full bg-text-primary/10 hover:bg-text-primary/20 transition-all duration-300 hover:scale-105 active:scale-95 text-text-secondary hover:text-text-primary border border-border-primary/20 cursor-pointer"
              title="Schließen"
            >
              <X size={18} />
            </button>
          </div>

          {/* Price & Savings Breakdown */}
          <div className="p-4 sm:p-5 rounded-2xl bg-text-primary/5 border border-border-primary/15 flex flex-col gap-3 mb-6">
            <div className="flex items-baseline justify-between flex-wrap gap-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
                  {product.finalPrice.toFixed(2)} €
                </span>
                {product.discount > 0 && (
                  <span className="text-sm sm:text-base font-semibold text-text-secondary line-through opacity-60">
                    {product.price.toFixed(2)} €
                  </span>
                )}
              </div>

              {/* Rating Pill */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-text-primary/10 border border-border-primary/20">
                <Star size={13} className="text-amber-400 fill-amber-400" />
                <span className="text-xs font-bold text-text-primary">{ratingValue.toFixed(1)}</span>
                <span className="text-[10px] text-text-secondary font-medium">/ 10</span>
              </div>
            </div>

            {/* Savings highlight */}
            {product.discount > 0 && (
              <div className="flex items-center gap-2 text-xs font-bold text-heart bg-heart/10 px-3 py-1.5 rounded-xl border border-heart/20">
                <Tag size={14} className="shrink-0" />
                <span>Du sparst {savings.toFixed(2)} € (-{product.discount}%)</span>
              </div>
            )}

            {/* Rating Bar */}
            <div className="w-full flex items-center gap-2 pt-1">
              <div className="flex-1 h-1.5 bg-text-primary/10 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-accent/70 to-accent transition-all duration-500"
                  style={{ width: `${ratingPct}%` }}
                />
              </div>
              <span className="text-[10px] font-semibold text-text-secondary">Bewertung</span>
            </div>
          </div>

          {/* Tags / Categories */}
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="px-3.5 py-1.5 rounded-xl bg-accent text-bg-primary text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
              {product.mainCat}
            </span>
            {product.subCats.map(sub => (
              <span key={sub} className="px-3.5 py-1.5 rounded-xl bg-text-primary/10 text-text-primary text-[10px] font-semibold tracking-wide border border-border-primary/15">
                {sub}
              </span>
            ))}
          </div>

          {/* Description Section */}
          <div className="mb-8 flex-grow">
            <h4 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em] mb-2 opacity-70">Notizen & Details</h4>
            <div className="p-4 sm:p-5 rounded-2xl bg-text-primary/5 border border-border-primary/10">
              <p className="text-text-primary/85 leading-relaxed whitespace-pre-wrap text-sm font-normal">
                {product.details || 'Keine Notizen zu diesem Produkt hinterlegt.'}
              </p>
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex flex-col gap-3 mt-auto">
            {/* Primary Actions Row */}
            <div className="flex gap-3">
              {product.url && (
                <a 
                  href={product.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={() => triggerHaptic(15)}
                  className="flex-1"
                >
                  <Button variant="primary" className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold shadow-lg">
                    <ExternalLink size={16} />
                    <span>Zum Shop</span>
                  </Button>
                </a>
              )}
              
              <Button 
                variant={product.status === 'bought' ? 'primary' : 'glass'}
                onClick={handleToggleBought}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all shadow-md",
                  product.status === 'bought' 
                    ? "bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600" 
                    : "bg-bg-card border-border-primary/30"
                )}
              >
                <ShoppingBag size={16} className={product.status === 'bought' ? "fill-current" : ""} />
                <span>{product.status === 'bought' ? 'Als Wunschliste' : 'Als Gekauft'}</span>
              </Button>
            </div>

            {/* Secondary Toolbar Row */}
            <div className="flex items-center justify-between p-2 rounded-2xl bg-text-primary/5 border border-border-primary/10">
              <button 
                onClick={handleToggleFavorite}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer font-bold text-xs",
                  product.isFavorite ? "text-heart bg-heart/10 shadow-sm" : "text-text-secondary hover:text-text-primary"
                )}
              >
                <Bookmark size={16} className={product.isFavorite ? "fill-current" : ""} />
                <span>{product.isFavorite ? 'Gespeichert' : 'Merken'}</span>
              </button>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleEdit}
                  className="p-2 rounded-xl bg-bg-card text-text-secondary hover:text-accent transition-all active:scale-90 cursor-pointer border border-border-primary/20"
                  title="Bearbeiten"
                >
                  <Edit3 size={16} />
                </button>
                <button 
                  onClick={handleDelete}
                  className="p-2 rounded-xl bg-bg-card text-text-secondary hover:text-heart transition-all active:scale-90 cursor-pointer border border-border-primary/20"
                  title="Löschen"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
