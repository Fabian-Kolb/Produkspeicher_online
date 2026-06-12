import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Save, Image as ImageIcon } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useAppStore } from '../../store/useAppStore';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { cn } from '../../utils/cn';
import type { Product } from '../../types';
import { triggerHaptic } from '../../utils/haptics';

export const ProductModal: React.FC = () => {
  const { isProductModalOpen, editingProductId, closeProductModal } = useUIStore();
  const { products, updateProduct, addProduct, addCategory, addSubCategory, categories, subCats, settings } = useAppStore();

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

  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const [isSubCatDropdownOpen, setIsSubCatDropdownOpen] = useState(false);
  const [catSearch, setCatSearch] = useState('');
  const [subCatSearch, setSubCatSearch] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageFiles, setImageFiles] = useState<{ objectUrl: string; file: File }[]>([]);

  const catDropdownRef = useRef<HTMLDivElement>(null);
  const subCatDropdownRef = useRef<HTMLDivElement>(null);
  const createdObjectUrlsRef = useRef<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isPopulatingRef = useRef(false);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter(c => c.toLowerCase().includes(catSearch.toLowerCase()));
  }, [categories, catSearch]);

  // Filtered subcategories
  const filteredSubCategories = useMemo(() => {
    const available = subCats[formData.mainCat || ''] || [];
    return available.filter(s => s.toLowerCase().includes(subCatSearch.toLowerCase()));
  }, [subCats, formData.mainCat, subCatSearch]);

  // Click outside listener for category and subcategory dropdowns
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (catDropdownRef.current && !catDropdownRef.current.contains(target)) {
        setIsCatDropdownOpen(false);
      }
      if (subCatDropdownRef.current && !subCatDropdownRef.current.contains(target)) {
        setIsSubCatDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Helper to clear object URLs
  const clearObjectUrls = () => {
    createdObjectUrlsRef.current.forEach(url => {
      URL.revokeObjectURL(url);
    });
    createdObjectUrlsRef.current = [];
  };

  // Populate data when modal opens
  useEffect(() => {
    if (isProductModalOpen) {
      isPopulatingRef.current = true;
      setImageError(null);
      setImageFiles([]);
      createdObjectUrlsRef.current = [];
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
      setTimeout(() => {
        isPopulatingRef.current = false;
      }, 50);
    } else {
      clearObjectUrls();
      setImageFiles([]);
      setImageError(null);
    }
  }, [isProductModalOpen, editingProductId, products, categories]);

  // Reset selected subcategories when main category changes (except during initial loading)
  useEffect(() => {
    if (isProductModalOpen && !isPopulatingRef.current) {
      setFormData(prev => ({ ...prev, subCats: [] }));
    }
  }, [formData.mainCat, isProductModalOpen]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      clearObjectUrls();
    };
  }, []);

  // Keyboard support: Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isProductModalOpen) closeProductModal();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isProductModalOpen, closeProductModal]);

  // Image files handler (validates files, generates object URLs, handles errors)
  const handleImageFiles = (files: File[]) => {
    setImageError(null);
    const newImgs: string[] = [];
    const newFiles: { objectUrl: string; file: File }[] = [];
    const invalidFiles: File[] = [];

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        invalidFiles.push(file);
        return;
      }
      const objectUrl = URL.createObjectURL(file);
      newImgs.push(objectUrl);
      newFiles.push({ objectUrl, file });
      createdObjectUrlsRef.current.push(objectUrl);
    });

    if (invalidFiles.length > 0) {
      setImageError(`Nur Bilddateien sind erlaubt! Übersprungene Dateien: ${invalidFiles.map(f => f.name).join(', ')}`);
      triggerHaptic(50);
    }

    if (newImgs.length > 0) {
      setFormData(prev => ({
        ...prev,
        imgs: [...(prev.imgs || []), ...newImgs]
      }));
      setImageFiles(prev => [...prev, ...newFiles]);
      triggerHaptic(10);
    }
  };

  // Smart Clipboard-Paste Event Listener
  useEffect(() => {
    const handlePasteEvent = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      
      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) files.push(file);
        }
      }
      
      if (files.length > 0) {
        e.preventDefault();
        handleImageFiles(files);
      }
    };

    if (isProductModalOpen) {
      window.addEventListener('paste', handlePasteEvent);
    }
    return () => window.removeEventListener('paste', handlePasteEvent);
  }, [isProductModalOpen]);

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

    // Echte Bilddateien loggen, um TS6133 zu vermeiden und API-Übertragung vorzubereiten
    if (imageFiles.length > 0) {
      console.log('API-Upload bereit für Bilddateien:', imageFiles.map(f => f.file.name));
    }

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
    const imgUrlToRemove = formData.imgs?.[idx];
    if (imgUrlToRemove) {
      if (imgUrlToRemove.startsWith('blob:')) {
        URL.revokeObjectURL(imgUrlToRemove);
        createdObjectUrlsRef.current = createdObjectUrlsRef.current.filter(u => u !== imgUrlToRemove);
        setImageFiles(prev => prev.filter(f => f.objectUrl !== imgUrlToRemove));
      }
    }
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

          {/* Zeile 3: Hauptkategorie & Subkategorie */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative" ref={catDropdownRef}>
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 block">Haupt-Kategorie</label>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(10);
                  setIsCatDropdownOpen(!isCatDropdownOpen);
                }}
                className="w-full flex items-center justify-between bg-bg-card border border-border-primary text-text-primary rounded-full px-5 py-2.5 outline-none hover:border-text-secondary focus:border-text-secondary hover:-translate-y-0.5 focus:-translate-y-0.5 hover:scale-[1.015] focus:scale-[1.015] hover:shadow-md focus:shadow-md transition-all duration-500 ease-out transform-gpu origin-center cursor-pointer text-left text-sm"
              >
                <span className="truncate">{formData.mainCat || 'Kategorie wählen'}</span>
                <span className="text-text-secondary text-[10px] transform transition-transform duration-300 select-none pointer-events-none ml-2">
                  {isCatDropdownOpen ? '▲' : '▼'}
                </span>
              </button>

              {isCatDropdownOpen && (
                <div className="absolute left-0 right-0 mt-2 z-50 glass-panel bg-bg-card border border-border-primary rounded-xl shadow-2xl p-3 flex flex-col gap-2 max-h-60 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                  <Input
                    value={catSearch}
                    onChange={e => setCatSearch(e.target.value)}
                    placeholder="Suchen / Hinzufügen..."
                    className="py-1 text-xs"
                    autoFocus
                  />
                  <div className="flex flex-col gap-1 overflow-y-auto max-h-40 hidden-scrollbar">
                    {filteredCategories.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          triggerHaptic(10);
                          setFormData({ ...formData, mainCat: c });
                          setIsCatDropdownOpen(false);
                          setCatSearch('');
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                          formData.mainCat === c
                            ? "bg-accent text-bg-primary"
                            : "text-text-primary hover:bg-text-primary/5"
                        )}
                      >
                        {c}
                      </button>
                    ))}
                    {catSearch.trim() && !categories.some(c => c.toLowerCase() === catSearch.trim().toLowerCase()) && (
                      <button
                        type="button"
                        onClick={async () => {
                          triggerHaptic(15);
                          const newCat = catSearch.trim();
                          await addCategory(newCat);
                          setFormData({ ...formData, mainCat: newCat });
                          setIsCatDropdownOpen(false);
                          setCatSearch('');
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-accent hover:bg-accent/10 cursor-pointer"
                      >
                        + "{catSearch.trim()}" neu erstellen
                      </button>
                    )}
                    {filteredCategories.length === 0 && !catSearch.trim() && (
                      <span className="text-xs text-text-secondary italic text-center py-2">Keine Kategorien vorhanden.</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={subCatDropdownRef}>
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 block">Sub-Kategorie</label>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(10);
                  setIsSubCatDropdownOpen(!isSubCatDropdownOpen);
                }}
                className="w-full flex items-center justify-between bg-bg-card border border-border-primary text-text-primary rounded-full px-5 py-2.5 outline-none hover:border-text-secondary focus:border-text-secondary hover:-translate-y-0.5 focus:-translate-y-0.5 hover:scale-[1.015] focus:scale-[1.015] hover:shadow-md focus:shadow-md transition-all duration-500 ease-out transform-gpu origin-center cursor-pointer text-left text-sm"
              >
                <span className="truncate">
                  {formData.subCats && formData.subCats.length > 0
                    ? formData.subCats.join(', ')
                    : 'Subkategorie wählen'}
                </span>
                <span className="text-text-secondary text-[10px] transform transition-transform duration-300 select-none pointer-events-none ml-2">
                  {isSubCatDropdownOpen ? '▲' : '▼'}
                </span>
              </button>

              {isSubCatDropdownOpen && (
                <div className="absolute left-0 right-0 mt-2 z-50 glass-panel bg-bg-card border border-border-primary rounded-xl shadow-2xl p-3 flex flex-col gap-2 max-h-60 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                  <Input
                    value={subCatSearch}
                    onChange={e => setSubCatSearch(e.target.value)}
                    placeholder="Suchen / Hinzufügen..."
                    className="py-1 text-xs"
                    autoFocus
                  />
                  <div className="flex flex-col gap-1 overflow-y-auto max-h-40 hidden-scrollbar">
                    {filteredSubCategories.map(s => {
                      const isSelected = formData.subCats?.includes(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            triggerHaptic(10);
                            const current = formData.subCats || [];
                            const next = current.includes(s)
                              ? current.filter(item => item !== s)
                              : [...current, s];
                            setFormData({ ...formData, subCats: next });
                          }}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center justify-between",
                            isSelected
                              ? "bg-accent text-bg-primary"
                              : "text-text-primary hover:bg-text-primary/5"
                          )}
                        >
                          <span>{s}</span>
                          {isSelected && <span className="text-xs">✓</span>}
                        </button>
                      );
                    })}
                    {subCatSearch.trim() && !(subCats[formData.mainCat || ''] || []).some(s => s.toLowerCase() === subCatSearch.trim().toLowerCase()) && (
                      <button
                        type="button"
                        onClick={async () => {
                          triggerHaptic(15);
                          const newSub = subCatSearch.trim();
                          await addSubCategory(formData.mainCat || 'Setup', newSub);
                          const current = formData.subCats || [];
                          setFormData({ ...formData, subCats: [...current, newSub] });
                          setSubCatSearch('');
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-accent hover:bg-accent/10 cursor-pointer"
                      >
                        + "{subCatSearch.trim()}" neu erstellen
                      </button>
                    )}
                    {filteredSubCategories.length === 0 && !subCatSearch.trim() && (
                      <span className="text-xs text-text-secondary italic text-center py-2">Keine Unterkategorien vorhanden.</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Zeile 4: Bewertung & Favorit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 block">Als Favorit markieren</label>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isFavorite: !formData.isFavorite })}
                className={cn(
                  "w-full h-[46px] rounded-full border flex items-center justify-center gap-1.5 text-sm font-bold transition-all duration-300 cursor-pointer select-none active:scale-95",
                  formData.isFavorite
                    ? "bg-accent text-bg-primary border-transparent shadow-md"
                    : "border-border-primary text-text-secondary hover:text-text-primary hover:bg-text-primary/5"
                )}
              >
                ❤️ Favorit
              </button>
            </div>
          </div>

          {/* Bilder Drag & Drop Zone */}
          <div>
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 block">Bilder (URLs / Upload)</label>
            <div
              onDragOver={e => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={e => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  const imgFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
                  if (imgFiles.length > 0) {
                    handleImageFiles(imgFiles);
                  }
                }
              }}
              className={cn(
                "border-2 border-dashed rounded-2xl p-4 transition-all duration-300 flex flex-col gap-4 bg-bg-card/30",
                isDragging
                  ? "border-accent bg-accent/5 scale-[1.01]"
                  : "border-border-primary hover:border-text-secondary"
              )}
            >
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col gap-1 text-center justify-center items-center py-3 cursor-pointer group"
              >
                <ImageIcon size={28} className={cn("transition-colors duration-300", isDragging ? "text-accent" : "text-text-secondary group-hover:text-text-primary")} />
                <span className="text-xs font-bold text-text-primary mt-1">
                  Bilder hierher ziehen oder <span className="text-accent underline group-hover:text-accent/80 transition-colors">durchsuchen</span>
                </span>
                <span className="text-[10px] text-text-secondary">
                  Unterstützt Drag & Drop, Klicken zum Auswählen oder Clipboard-Paste (Strg+V)
                </span>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={e => {
                    if (e.target.files && e.target.files.length > 0) {
                      const imgFiles = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
                      if (imgFiles.length > 0) {
                        handleImageFiles(imgFiles);
                      }
                    }
                  }}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
              </div>

              {imageError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl p-3 text-xs flex justify-between items-center animate-in fade-in slide-in-from-top-2 duration-300">
                  <span>{imageError}</span>
                  <button type="button" onClick={() => setImageError(null)} className="text-red-500 hover:text-red-400 font-bold ml-2">
                    <X size={14} />
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  value={imgInput}
                  onChange={e => setImgInput(e.target.value)}
                  placeholder="Bild-URL einfügen..."
                  className="bg-bg-card/50"
                  icon={<ImageIcon size={16} />}
                />
                <Button
                  type="button"
                  onClick={addImage}
                  variant="primary"
                  className="shrink-0 h-[46px] flex items-center justify-center px-6"
                >
                  Hinzufügen
                </Button>
              </div>

              {formData.imgs && formData.imgs.length > 0 && (
                <div className="flex gap-3 overflow-x-auto pb-2 hidden-scrollbar">
                  {formData.imgs.map((img, idx) => (
                    <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 border border-border-primary group">
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
          <Button variant="danger" onClick={handleCancel}>Abbrechen</Button>
          <Button variant="primary" onClick={handleSave} className="flex items-center gap-2">
            <Save size={18} /> Speichern
          </Button>
        </div>

      </div>
    </div>
  );
};
