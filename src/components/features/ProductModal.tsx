import React, { useState, useEffect } from 'react';
import { X, Save, Image as ImageIcon } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useAppStore } from '../../store/useAppStore';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { cn } from '../../utils/cn';
import type { Product } from '../../types';

export const ProductModal: React.FC = () => {
  const { isProductModalOpen, editingProductId, closeProductModal } = useUIStore();
  const { products, updateProduct, addProduct, categories, subCats, settings } = useAppStore();

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    shop: '',
    url: '',
    price: 0,
    discount: 0,
    finalPrice: 0,
    rating: 0,
    details: '',
    imgs: [],
    mainCat: 'Setup',
    subCats: [],
    status: 'active',
    isFavorite: false,
  });

  const [imgInput, setImgInput] = useState('');

  useEffect(() => {
    if (isProductModalOpen) {
      if (editingProductId) {
        const p = products.find(prod => prod.id === editingProductId);
        if (p) setFormData(p);
      } else {
        setFormData({
          name: '',
          shop: '',
          url: '',
          price: 0,
          discount: 0,
          finalPrice: 0,
          rating: 0,
          details: '',
          imgs: [],
          mainCat: categories[0] || 'Setup',
          subCats: [],
          status: 'active',
          isFavorite: false,
        });
      }
    }
  }, [isProductModalOpen, editingProductId, products, categories]);

  // Keyboard support: Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isProductModalOpen) closeProductModal();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isProductModalOpen, closeProductModal]);

  if (!isProductModalOpen) return null;

  const handleSave = () => {
    const isNowBought = (formData.status || 'active') === 'bought';
    
    const p: Omit<Product, 'id'> = {
      name: formData.name || 'Unbenannt',
      shop: formData.shop || 'Unbekannt',
      url: formData.url || '',
      price: Number(formData.price) || 0,
      discount: Number(formData.discount) || 0,
      finalPrice: Number(formData.finalPrice) || 0,
      rating: Number(formData.rating) || 0,
      details: formData.details || '',
      imgs: formData.imgs || [],
      mainCat: formData.mainCat || categories[0],
      subCats: formData.subCats || [],
      status: formData.status || 'active',
      isFavorite: formData.isFavorite || false,
      dateAdded: formData.dateAdded || new Date().toISOString(),
      dateBought: isNowBought ? (formData.dateBought || new Date().toISOString()) : null
    };

    if (editingProductId) {
      updateProduct(editingProductId, p);
    } else {
      addProduct(p);
    }
    closeProductModal();
  };

  const handleCancel = () => {
    closeProductModal();
  };

  const addImage = () => {
    if (imgInput.trim()) {
      setFormData(prev => ({ ...prev, imgs: [...(prev.imgs || []), imgInput.trim()] }));
      setImgInput('');
    }
  };

  const removeImage = (idx: number) => {
    setFormData(prev => ({ ...prev, imgs: (prev.imgs || []).filter((_, i) => i !== idx) }));
  };

  return (
    <div className={cn(
      "fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-6 bg-black/60 animate-in fade-in duration-300",
      settings.isGlassEnabled && "backdrop-blur-sm"
    )}>
      <div className="w-full max-w-2xl max-h-[98vh] sm:max-h-[95vh] glass-panel overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">

        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border-primary shrink-0">
          <h2 className="text-xl sm:text-2xl font-playfair font-bold">
            {editingProductId ? 'Produkt bearbeiten' : 'Produkt hinzufügen'}
          </h2>
          <button onClick={handleCancel} className="w-10 h-10 flex items-center justify-center rounded-full text-text-secondary hover:text-text-primary hover:bg-text-primary/10 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto hidden-scrollbar flex flex-col gap-5 sm:gap-6">

          {/* Name & Shop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 block">Name</label>
              <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Produktname" />
            </div>
            <div>
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 block">Shop / Marke</label>
              <Input value={formData.shop} onChange={e => setFormData({ ...formData, shop: e.target.value })} placeholder="Amazon, Thomann..." />
            </div>
          </div>

          {/* URL */}
          <div>
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 block">URL</label>
            <Input value={formData.url} onChange={e => setFormData({ ...formData, url: e.target.value })} placeholder="https://..." />
          </div>

          {/* Price & Discount */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 block">Preis (€)</label>
              <Input type="number" value={formData.price || ''} onChange={e => {
                const p = Number(e.target.value);
                const d = Number(formData.discount) || 0;
                setFormData({ ...formData, price: p, finalPrice: p - (p * (d / 100)) });
              }} />
            </div>
            <div>
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 block">Rabatt (%)</label>
              <Input type="number" value={formData.discount || ''} onChange={e => {
                const d = Number(e.target.value);
                const p = Number(formData.price) || 0;
                setFormData({ ...formData, discount: d, finalPrice: p - (p * (d / 100)) });
              }} />
            </div>
            <div>
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 block">Endpreis (€)</label>
              <Input type="number" value={formData.finalPrice?.toFixed(2)} readOnly className="opacity-60" />
            </div>
          </div>

          {/* Category, Rating, and Status Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 block">Haupt-Kategorie</label>
              <select
                value={formData.mainCat}
                onChange={e => setFormData({ ...formData, mainCat: e.target.value, subCats: [] })}
                className="w-full bg-bg-card border border-border-primary text-text-primary rounded-xl px-4 py-2.5 outline-none hover:border-text-secondary focus:border-text-secondary hover:-translate-y-0.5 focus:-translate-y-0.5 hover:scale-[1.015] focus:scale-[1.015] hover:shadow-md focus:shadow-md transition-all duration-500 ease-out transform-gpu origin-center cursor-pointer"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 block">Bewertung (1-10)</label>
              <Input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={formData.rating || ''}
                onChange={e => {
                  const val = Math.max(0, Math.min(10, Number(e.target.value)));
                  setFormData({ ...formData, rating: val });
                }}
                placeholder="z. B. 8.5"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 block">Status / Favorit</label>
              <div className="flex gap-2 items-stretch">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isFavorite: !formData.isFavorite })}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all duration-300 cursor-pointer select-none active:scale-95",
                    formData.isFavorite
                      ? "bg-heart text-white border-transparent shadow-md"
                      : "border-border-primary text-text-secondary hover:text-text-primary hover:bg-text-primary/5"
                  )}
                >
                  ❤️ Favorit
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: formData.status === 'bought' ? 'active' : 'bought' })}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all duration-300 cursor-pointer select-none active:scale-95",
                    formData.status === 'bought'
                      ? "bg-accent text-bg-primary border-transparent shadow-md font-bold"
                      : "border-border-primary text-text-secondary hover:text-text-primary hover:bg-text-primary/5"
                  )}
                >
                  🛒 Gekauft
                </button>
              </div>
            </div>
          </div>

          {/* Sub-Categories */}
          <div>
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 block">Sub-Kategorien</label>
            <div className="flex flex-wrap gap-2">
              {(subCats[formData.mainCat || ''] || []).map(sub => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => {
                    const current = formData.subCats || [];
                    const next = current.includes(sub) ? current.filter(s => s !== sub) : [...current, sub];
                    setFormData({ ...formData, subCats: next });
                  }}
                  className={cn(
                    "px-4 py-2 sm:px-3 sm:py-1 rounded-full text-xs font-medium border transition-colors duration-200 cursor-pointer select-none active:scale-95",
                    formData.subCats?.includes(sub)
                      ? "bg-text-primary text-bg-primary border-transparent font-bold"
                      : "border-border-primary text-text-secondary hover:text-text-primary hover:bg-text-primary/5"
                  )}
                >
                  {sub}
                </button>
              ))}
              {(subCats[formData.mainCat || ''] || []).length === 0 && (
                <span className="text-xs text-text-secondary italic">Keine Unterkategorien für diese Hauptkategorie definiert.</span>
              )}
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 block">Bilder (URLs)</label>
            <div className="flex gap-2 mb-3">
              <Input value={imgInput} onChange={e => setImgInput(e.target.value)} placeholder="Bild-URL einfügen..." icon={<ImageIcon size={16} />} />
              <Button onClick={addImage} variant="secondary" className="shrink-0 h-[46px] flex items-center justify-center active:scale-95">Hinzufügen</Button>
            </div>
            {formData.imgs && formData.imgs.length > 0 && (
              <div className="flex gap-3 overflow-x-auto pb-2 hidden-scrollbar">
                {formData.imgs.map((img, idx) => (
                  <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden shrink-0 border border-border-primary group">
                    <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(idx)}
                      type="button"
                      className="absolute top-1 right-1 w-7 h-7 bg-heart rounded-full flex items-center justify-center text-white md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity shadow-lg active:scale-90 cursor-pointer z-10"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 block">Details / Notizen (Optional)</label>
            <textarea
              value={formData.details}
              onChange={e => setFormData({ ...formData, details: e.target.value })}
              className="w-full bg-bg-card border border-border-primary rounded-xl px-4 py-3 outline-none hover:border-text-secondary focus:border-text-secondary hover:-translate-y-0.5 focus:-translate-y-0.5 hover:scale-[1.01] focus:scale-[1.01] hover:shadow-md focus:shadow-md min-h-[100px] focus:min-h-[160px] transition-all duration-500 ease-out transform-gpu origin-center"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-border-primary shrink-0 flex justify-end gap-3">
          <Button variant="ghost" onClick={handleCancel} className="active:scale-95">Abbrechen</Button>
          <Button variant="primary" onClick={handleSave} className="flex items-center gap-2 active:scale-95">
            <Save size={18} /> Speichern
          </Button>
        </div>

      </div>
    </div>
  );
};
