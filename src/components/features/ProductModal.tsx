import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Save, Image as ImageIcon } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useAppStore } from '../../store/useAppStore';
import { Input } from '../common/Input';
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

  const isGlass = settings.isGlassEnabled;

  const labelClass = "text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block";

  const inputClass = cn(
    "!rounded-2xl !transition-all !duration-200 text-slate-800 placeholder-slate-400 !translate-y-0 !hover:translate-y-0 !focus:translate-y-0 !scale-100 !hover:scale-100 !focus:scale-100 !shadow-none !hover:shadow-none !focus:shadow-none",
    isGlass
      ? "!bg-white/40 !border-white/20 hover:!bg-white/50"
      : "!bg-slate-50 !border-slate-200 hover:!bg-slate-100/30",
    "focus:!bg-white focus:!border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
  );

  const textareaClass = cn(
    "w-full rounded-2xl transition-all duration-200 text-slate-800 placeholder-slate-400 min-h-[100px] focus:min-h-[160px] p-4 outline-none border",
    "!translate-y-0 !hover:translate-y-0 !focus:translate-y-0 !scale-100 !hover:scale-100 !focus:scale-100 !shadow-none !hover:shadow-none !focus:shadow-none",
    isGlass
      ? "!bg-white/40 !border-white/20 hover:!bg-white/50"
      : "!bg-slate-50 !border-slate-200 hover:!bg-slate-100/30",
    "focus:!bg-white focus:!border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
  );

  const dropdownTriggerClass = cn(
    "w-full flex items-center justify-between outline-none transition-all duration-200 cursor-pointer text-left text-sm border",
    "!rounded-full px-5 py-2.5 !translate-y-0 !hover:translate-y-0 !focus:translate-y-0 !scale-100 !hover:scale-100 !focus:scale-100 !shadow-none !hover:shadow-none !focus:shadow-none",
    isGlass
      ? "!bg-white/40 !border-white/20 hover:!bg-white/50 text-slate-800"
      : "!bg-slate-50 !border-slate-200 hover:!bg-slate-100/30 text-slate-800",
    "focus:!bg-white focus:!border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
  );

  const dropdownPanelClass = cn(
    "absolute left-0 right-0 mt-2 z-50 rounded-2xl shadow-2xl p-3 flex flex-col gap-2 max-h-60 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 border",
    isGlass
      ? "bg-white/80 backdrop-blur-xl border-white/40 text-slate-800"
      : "bg-white border-slate-200 text-slate-800"
  );

  const favoriteButtonClass = cn(
    "w-full h-[46px] rounded-full border flex items-center justify-center gap-1.5 text-sm font-semibold transition-all duration-200 cursor-pointer select-none active:scale-95",
    formData.isFavorite
      ? "bg-blue-600 border-transparent text-white shadow-sm shadow-blue-500/10 hover:bg-blue-700"
      : isGlass
        ? "bg-white/40 border-white/20 text-slate-600 hover:bg-white/50"
        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100/70"
  );

  const sensorContainerClass = cn(
    "border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-200 cursor-pointer flex flex-col gap-4",
    isDragging
      ? isGlass
        ? "border-white/60 bg-black/30 scale-[0.99]"
        : "border-slate-400 bg-black/10 scale-[0.99]"
      : isGlass
        ? "border-white/40 bg-white/20 hover:bg-white/30 hover:border-white/60"
        : "border-slate-200 bg-slate-50 hover:bg-slate-100/70 hover:border-slate-300"
  );

  const footerClass = cn(
    "p-6 flex justify-end gap-3 rounded-b-[1.5rem] border-t",
    isGlass
      ? "bg-white/30 border-white/20"
      : "bg-slate-50 border-slate-100"
  );

  const cancelButtonClass = cn(
    "px-5 py-2.5 rounded-full text-sm font-medium text-slate-600 transition-colors cursor-pointer select-none active:scale-95",
    isGlass ? "hover:bg-white/20 text-slate-700" : "hover:bg-slate-100"
  );

  const headerClass = cn(
    "flex items-center justify-between p-4 sm:p-6 border-b shrink-0",
    isGlass ? "border-white/20" : "border-slate-200"
  );

  return (
    <div className={cn(
      "fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-6 transition-all duration-300 animate-in fade-in",
      isGlass ? "bg-black/40 backdrop-blur-sm" : "bg-black/60"
    )}>
      <div className={cn(
        "w-full max-w-2xl max-h-[98vh] sm:max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 rounded-[1.5rem]",
        isGlass ? "bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl" : "bg-white border border-slate-200 shadow-xl"
      )}>

        {/* Header */}
        <div className={headerClass}>
          <h2 className="text-xl font-semibold text-slate-800 tracking-tight">
            {editingProductId ? 'Produkt bearbeiten' : 'Produkt hinzufügen'}
          </h2>
          <button onClick={handleCancel} className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100/50 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto hidden-scrollbar flex flex-col gap-5 sm:gap-6">

          {/* Name & Shop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Name</label>
              <Input 
                value={formData.name} 
                onChange={e => setFormData({ ...formData, name: e.target.value })} 
                placeholder="Produktname"
                className={inputClass} 
              />
            </div>
            <div>
              <label className={labelClass}>Shop / Marke</label>
              <Input 
                value={formData.shop} 
                onChange={e => setFormData({ ...formData, shop: e.target.value })} 
                placeholder="Amazon, Thomann..."
                className={inputClass} 
              />
            </div>
          </div>

          {/* URL */}
          <div>
            <label className={labelClass}>URL</label>
            <Input 
              value={formData.url} 
              onChange={e => setFormData({ ...formData, url: e.target.value })} 
              placeholder="https://..."
              className={inputClass} 
            />
          </div>

          {/* Price & Discount */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Preis (€)</label>
              <Input 
                type="number" 
                value={formData.price || ''} 
                onChange={e => {
                  const p = Number(e.target.value);
                  const d = Number(formData.discount) || 0;
                  setFormData({ ...formData, price: p, finalPrice: p - (p * (d / 100)) });
                }}
                className={inputClass} 
              />
            </div>
            <div>
              <label className={labelClass}>Rabatt (%)</label>
              <Input 
                type="number" 
                value={formData.discount || ''} 
                onChange={e => {
                  const d = Number(e.target.value);
                  const p = Number(formData.price) || 0;
                  setFormData({ ...formData, discount: d, finalPrice: p - (p * (d / 100)) });
                }}
                className={inputClass} 
              />
            </div>
            <div>
              <label className={labelClass}>Endpreis (€)</label>
              <Input 
                type="number" 
                value={formData.finalPrice?.toFixed(2)} 
                readOnly 
                className={cn(inputClass, "opacity-60")} 
              />
            </div>
          </div>

          {/* Zeile 3: Hauptkategorie & Subkategorie */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative" ref={catDropdownRef}>
              <label className={labelClass}>Haupt-Kategorie</label>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(10);
                  setIsCatDropdownOpen(!isCatDropdownOpen);
                }}
                className={dropdownTriggerClass}
              >
                <span className="truncate">{formData.mainCat || 'Kategorie wählen'}</span>
                <span className="text-slate-400 text-[10px] transform transition-transform duration-300 select-none pointer-events-none ml-2">
                  {isCatDropdownOpen ? '▲' : '▼'}
                </span>
              </button>

              {isCatDropdownOpen && (
                <div className={dropdownPanelClass}>
                  <Input
                    value={catSearch}
                    onChange={e => setCatSearch(e.target.value)}
                    placeholder="Suchen / Hinzufügen..."
                    className={inputClass}
                    autoFocus
                  />
                  <div className="flex flex-col gap-1 overflow-y-auto max-h-40 hidden-scrollbar mt-1">
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
                            ? "bg-blue-600 text-white"
                            : "text-slate-700 hover:bg-slate-100/50"
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
                        className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-blue-600 hover:bg-blue-50 cursor-pointer"
                      >
                        + "{catSearch.trim()}" neu erstellen
                      </button>
                    )}
                    {filteredCategories.length === 0 && !catSearch.trim() && (
                      <span className="text-xs text-slate-400 italic text-center py-2">Keine Kategorien vorhanden.</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={subCatDropdownRef}>
              <label className={labelClass}>Sub-Kategorie</label>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(10);
                  setIsSubCatDropdownOpen(!isSubCatDropdownOpen);
                }}
                className={dropdownTriggerClass}
              >
                <span className="truncate">
                  {formData.subCats && formData.subCats.length > 0
                    ? formData.subCats.join(', ')
                    : 'Subkategorie wählen'}
                </span>
                <span className="text-slate-400 text-[10px] transform transition-transform duration-300 select-none pointer-events-none ml-2">
                  {isSubCatDropdownOpen ? '▲' : '▼'}
                </span>
              </button>

              {isSubCatDropdownOpen && (
                <div className={dropdownPanelClass}>
                  <Input
                    value={subCatSearch}
                    onChange={e => setSubCatSearch(e.target.value)}
                    placeholder="Suchen / Hinzufügen..."
                    className={inputClass}
                    autoFocus
                  />
                  <div className="flex flex-col gap-1 overflow-y-auto max-h-40 hidden-scrollbar mt-1">
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
                              ? "bg-blue-600 text-white"
                              : "text-slate-700 hover:bg-slate-100/50"
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
                        className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-blue-600 hover:bg-blue-50 cursor-pointer"
                      >
                        + "{subCatSearch.trim()}" neu erstellen
                      </button>
                    )}
                    {filteredSubCategories.length === 0 && !subCatSearch.trim() && (
                      <span className="text-xs text-slate-400 italic text-center py-2">Keine Unterkategorien vorhanden.</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Zeile 4: Bewertung & Favorit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Bewertung (1-10)</label>
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
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Als Favorit markieren</label>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isFavorite: !formData.isFavorite })}
                className={favoriteButtonClass}
              >
                ❤️ Favorit
              </button>
            </div>
          </div>

          {/* Bilder Drag & Drop Zone */}
          <div>
            <label className={labelClass}>Bilder (URLs / Upload)</label>
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
              className={sensorContainerClass}
            >
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col gap-1 text-center justify-center items-center py-3 cursor-pointer group"
              >
                <ImageIcon size={28} className={cn("transition-colors duration-300", isDragging ? "text-slate-600 dark:text-slate-300" : "text-slate-400 group-hover:text-slate-600")} />
                <span className="text-xs font-semibold text-slate-700 mt-1">
                  Bilder hierher ziehen oder <span className="underline group-hover:text-slate-900 transition-colors">durchsuchen</span>
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
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
                  className={inputClass}
                  icon={<ImageIcon size={16} />}
                />
                <button
                  type="button"
                  onClick={addImage}
                  className="shrink-0 h-[46px] flex items-center justify-center px-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-all duration-200 active:scale-95 shadow-sm hover:shadow shadow-blue-500/10 cursor-pointer"
                >
                  Hinzufügen
                </button>
              </div>

              {formData.imgs && formData.imgs.length > 0 && (
                <div className="flex gap-3 overflow-x-auto pb-2 hidden-scrollbar">
                  {formData.imgs.map((img, idx) => (
                    <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 border border-slate-100 shadow-sm group">
                      <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage(idx)}
                        type="button"
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity shadow-lg active:scale-90 cursor-pointer z-10"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div>
            <label className={labelClass}>Details / Notizen (Optional)</label>
            <textarea
              value={formData.details}
              onChange={e => setFormData({ ...formData, details: e.target.value })}
              className={textareaClass}
              placeholder="Zusätzliche Informationen..."
            />
          </div>

        </div>

        {/* Footer */}
        <div className={footerClass}>
          <button 
            type="button" 
            onClick={handleCancel} 
            className={cancelButtonClass}
          >
            Abbrechen
          </button>
          <button 
            type="button" 
            onClick={handleSave} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full text-sm font-medium shadow-sm shadow-blue-500/10 hover:shadow-md hover:shadow-blue-500/20 transition-all duration-200 active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <Save size={18} /> Speichern
          </button>
        </div>

      </div>
    </div>
  );
};
