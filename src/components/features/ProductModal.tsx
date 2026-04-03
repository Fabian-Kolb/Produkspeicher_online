import React, { useState, useEffect } from 'react';
import { X, Save, Image as ImageIcon } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useAppStore } from '../../store/useAppStore';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import type { Product } from '../../types';

export const ProductModal: React.FC = () => {
  const { isProductModalOpen, editingProductId, closeProductModal } = useUIStore();
  const { products, addProduct, updateProduct, categories, subCats } = useAppStore();

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
    if (isProductModalOpen && editingProductId) {
      const p = products.find(prod => prod.id === editingProductId);
      if (p) setFormData(p);
    } else if (isProductModalOpen && !editingProductId) {
      setFormData({
        name: '', shop: '', url: '', price: 0, discount: 0, finalPrice: 0,
        rating: 0, details: '', imgs: [], mainCat: categories[0] || 'Setup', subCats: [],
        status: 'active', isFavorite: false, dateAdded: new Date().toISOString()
      });
      setImgInput('');
    }
  }, [isProductModalOpen, editingProductId, products, categories]);

  if (!isProductModalOpen) return null;

  const handleSave = () => {
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
      dateAdded: formData.dateAdded || new Date().toISOString()
    };

    if (editingProductId) {
      updateProduct(editingProductId, p);
    } else {
      addProduct(p);
    }
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-2xl max-h-[95vh] glass-panel bg-bg-card/95 border border-border-primary rounded-3xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-primary shrink-0">
          <h2 className="text-2xl font-playfair font-bold">
            {editingProductId ? 'Produkt bearbeiten' : 'Neues Produkt'}
          </h2>
          <button onClick={closeProductModal} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto hidden-scrollbar flex-col gap-6 flex">

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

          <div>
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 block">URL</label>
            <Input value={formData.url} onChange={e => setFormData({ ...formData, url: e.target.value })} placeholder="https://..." />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 block">Preis (€)</label>
              <Input type="number" value={formData.price} onChange={e => {
                const p = Number(e.target.value);
                const d = Number(formData.discount) || 0;
                setFormData({ ...formData, price: p, finalPrice: p - (p * (d / 100)) });
              }} />
            </div>
            <div>
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 block">Rabatt (%)</label>
              <Input type="number" value={formData.discount} onChange={e => {
                const d = Number(e.target.value);
                const p = Number(formData.price) || 0;
                setFormData({ ...formData, discount: d, finalPrice: p - (p * (d / 100)) });
              }} />
            </div>
            <div>
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 block">Endpreis (€)</label>
              <Input type="number" value={formData.finalPrice?.toFixed(2)} readOnly className="bg-black/5" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 block">Haupt-Kategorie</label>
              <select
                value={formData.mainCat}
                onChange={e => setFormData({ ...formData, mainCat: e.target.value, subCats: [] })}
                className="w-full bg-bg-card border border-border-primary rounded-xl px-4 py-3 outline-none focus:border-text-secondary"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 block">Sub-Kategorien</label>
              <div className="flex flex-wrap gap-2">
                {(subCats[formData.mainCat || ''] || []).map(sub => (
                  <button
                    key={sub}
                    onClick={() => {
                      const current = formData.subCats || [];
                      const next = current.includes(sub) ? current.filter(s => s !== sub) : [...current, sub];
                      setFormData({ ...formData, subCats: next });
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${formData.subCats?.includes(sub) ? 'bg-text-primary text-bg-primary border-transparent' : 'border-border-primary text-text-secondary'}`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 block">Bilder (URLs)</label>
            <div className="flex gap-2 mb-3">
              <Input value={imgInput} onChange={e => setImgInput(e.target.value)} placeholder="Bild-URL einfügen..." icon={<ImageIcon size={16} />} />
              <Button onClick={addImage} variant="secondary">Hinzufügen</Button>
            </div>
            {formData.imgs && formData.imgs.length > 0 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {formData.imgs.map((img, idx) => (
                  <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden shrink-0 border border-border-primary group">
                    <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                    <button onClick={() => removeImage(idx)} className="absolute top-1 right-1 w-6 h-6 bg-heart rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 block">Details / Notizen (Optional)</label>
            <textarea
              value={formData.details}
              onChange={e => setFormData({ ...formData, details: e.target.value })}
              className="w-full bg-bg-card border border-border-primary rounded-xl px-4 py-3 outline-none focus:border-text-secondary min-h-[100px]"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border-primary shrink-0 flex justify-end gap-3">
          <Button variant="ghost" onClick={closeProductModal}>Abbrechen</Button>
          <Button variant="primary" onClick={handleSave} className="flex items-center gap-2">
            <Save size={18} /> Speichern
          </Button>
        </div>

      </div>
    </div>
  );
};
