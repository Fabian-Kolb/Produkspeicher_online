import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, 
  Save, 
  Image as ImageIcon, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  Tag, 
  Euro, 
  Heart, 
  ChevronsUpDown,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

  // Akkordeon-Sektionen State
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    basic: true,
    categories: false,
    pricing: false,
    media: false,
  });

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

  // Ausgefüllte Felder Pro Sektion zählen
  const basicFilledCount = useMemo(() => {
    let count = 0;
    if (formData.name?.trim()) count++;
    if (formData.shop?.trim()) count++;
    if (formData.url?.trim()) count++;
    return count;
  }, [formData.name, formData.shop, formData.url]);

  const categoriesFilledCount = useMemo(() => {
    let count = 0;
    if (formData.mainCat) count++;
    if (formData.subCats && formData.subCats.length > 0) count++;
    if (formData.rating && Number(formData.rating) > 0) count++;
    if (formData.isFavorite) count++;
    return count;
  }, [formData.mainCat, formData.subCats, formData.rating, formData.isFavorite]);

  const pricingFilledCount = useMemo(() => {
    let count = 0;
    if (formData.price && Number(formData.price) > 0) count++;
    if (formData.discount && Number(formData.discount) > 0) count++;
    return count;
  }, [formData.price, formData.discount]);

  const mediaFilledCount = useMemo(() => {
    let count = 0;
    if (formData.imgs && formData.imgs.length > 0) count++;
    if (formData.details?.trim()) count++;
    return count;
  }, [formData.imgs, formData.details]);

  // Section toggle helper mit Haptik
  const toggleSection = (key: string) => {
    triggerHaptic(12);
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const anyOpen = useMemo(() => {
    return Object.values(openSections).some(Boolean);
  }, [openSections]);

  const closeAllSections = () => {
    triggerHaptic(15);
    setOpenSections({
      basic: false,
      categories: false,
      pricing: false,
      media: false,
    });
  };

  // Click outside listener für Dropdowns
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
      setOpenSections({
        basic: true,
        categories: false,
        pricing: false,
        media: false,
      });

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

  // Image files handler
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
    triggerHaptic(15);
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
    triggerHaptic(15);
    closeProductModal();
  };

  const addImage = () => {
    if (imgInput.trim()) {
      triggerHaptic(10);
      setFormData(prev => ({ ...prev, imgs: [...(prev.imgs || []), imgInput.trim()] }));
      setImgInput('');
    }
  };

  const removeImage = (idx: number) => {
    triggerHaptic(10);
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

  const labelClass = "text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5 block";

  const inputClass = cn(
    "!rounded-2xl !transition-all !duration-200 text-text-primary placeholder:text-text-secondary/50",
    isGlass
      ? "!bg-white/40 dark:!bg-white/5 !border-white/20 dark:!border-white/10 hover:!bg-white/50"
      : "!bg-black/5 dark:!bg-white/5 !border-border-primary/20",
    "focus:!border-accent/50 focus:outline-none"
  );

  const textareaClass = cn(
    "w-full rounded-2xl transition-all duration-200 text-text-primary placeholder:text-text-secondary/50 p-4 outline-none border",
    "min-h-[90px] focus:min-h-[140px]",
    isGlass
      ? "bg-white/40 dark:bg-white/5 border-white/20 dark:border-white/10 hover:bg-white/50"
      : "bg-black/5 dark:bg-white/5 border-border-primary/20 hover:bg-black/10 dark:hover:bg-white/10",
    "focus:border-accent/50 focus:outline-none"
  );

  const dropdownTriggerClass = cn(
    "w-full flex items-center justify-between outline-none transition-all duration-200 cursor-pointer text-left text-sm border",
    "rounded-full px-5 py-2.5 text-text-primary",
    isGlass
      ? "bg-white/40 dark:bg-white/5 border-white/20 dark:border-white/10 hover:bg-white/50"
      : "bg-black/5 dark:bg-white/5 border-border-primary/20 hover:bg-black/10 dark:hover:bg-white/10",
    "focus:border-accent/50 focus:outline-none"
  );

  const dropdownPanelClass = cn(
    "absolute left-0 right-0 mt-2 z-50 rounded-2xl shadow-2xl p-3 flex flex-col gap-2 max-h-60 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 border",
    isGlass
      ? "bg-bg-card/95 backdrop-blur-xl border-white/30 text-text-primary"
      : "bg-bg-card border-border-primary text-text-primary"
  );

  const favoriteButtonClass = cn(
    "w-full h-[46px] rounded-full border flex items-center justify-center gap-2 text-sm font-semibold transition-all duration-200 cursor-pointer select-none active:scale-95",
    formData.isFavorite
      ? "bg-heart border-transparent text-white shadow-sm hover:opacity-90"
      : isGlass
        ? "bg-white/40 dark:bg-white/5 border-white/20 dark:border-white/10 text-text-secondary hover:bg-white/50 hover:text-text-primary"
        : "bg-black/5 dark:bg-white/5 border-border-primary/20 text-text-secondary hover:bg-black/10 dark:hover:bg-white/10 hover:text-text-primary"
  );

  const sensorContainerClass = cn(
    "border-2 border-dashed rounded-2xl p-4 sm:p-6 text-center transition-all duration-200 cursor-pointer flex flex-col gap-3 sm:gap-4",
    isDragging
      ? "border-accent bg-accent/10 scale-[0.99]"
      : isGlass
        ? "border-white/30 dark:border-white/10 bg-white/20 dark:bg-white/5 hover:bg-white/30 hover:border-white/50"
        : "border-border-primary/30 bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.05] hover:border-border-primary"
  );

  const sectionCardClass = cn(
    "rounded-2xl border transition-all duration-300",
    isGlass
      ? "bg-white/40 dark:bg-white/5 border-white/20 dark:border-white/10"
      : "bg-black/[0.02] dark:bg-white/[0.02] border-border-primary/20"
  );

  const sectionHeaderClass = cn(
    "w-full flex items-center justify-between p-3.5 sm:p-4 text-left transition-colors cursor-pointer select-none active:scale-[0.995]",
    "hover:bg-text-primary/5 rounded-2xl"
  );

  const headerClass = cn(
    "flex items-center justify-between p-4 sm:p-6 border-b shrink-0",
    isGlass ? "border-white/20 dark:border-white/10" : "border-border-primary/20"
  );

  const footerClass = cn(
    "p-4 sm:p-6 flex justify-end gap-3 rounded-b-[1.5rem] border-t shrink-0",
    isGlass
      ? "bg-white/30 dark:bg-white/5 border-white/20 dark:border-white/10"
      : "bg-black/[0.02] dark:bg-white/[0.02] border-border-primary/20"
  );

  return (
    <div className={cn(
      "fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-6 transition-all duration-300 animate-in fade-in",
      isGlass ? "bg-black/40 backdrop-blur-sm" : "bg-black/60"
    )}>
      <div className={cn(
        "w-full max-w-2xl max-h-[98vh] sm:max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 rounded-[1.5rem]",
        isGlass ? "glass-panel text-text-primary shadow-2xl" : "bg-bg-card border border-border-primary text-text-primary shadow-xl"
      )}>

        {/* Header */}
        <div className={headerClass}>
          <h2 className="text-xl font-semibold text-text-primary tracking-tight">
            {editingProductId ? 'Produkt bearbeiten' : 'Produkt hinzufügen'}
          </h2>
          
          <div className="flex items-center gap-2">
            {anyOpen && (
              <button
                type="button"
                onClick={closeAllSections}
                className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors py-1.5 px-3 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer active:scale-95"
              >
                <ChevronsUpDown size={14} />
                <span>Alle zuklappen</span>
              </button>
            )}
            <button 
              onClick={handleCancel} 
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/5 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3.5 sm:p-6 overflow-y-auto hidden-scrollbar flex flex-col gap-3 sm:gap-4">

          {/* ABSCHNITT 1: Basis-Informationen */}
          <div className={sectionCardClass}>
            <button
              type="button"
              onClick={() => toggleSection('basic')}
              className={sectionHeaderClass}
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
                  <Info size={18} />
                </div>
                <div className="truncate text-left">
                  <h3 className="text-sm font-bold text-text-primary">Basis-Informationen</h3>
                  {!openSections.basic && (
                    <p className="text-xs text-text-secondary truncate mt-0.5">
                      {formData.name ? `${formData.name}${formData.shop ? ' • ' + formData.shop : ''}` : 'Name, Shop & URL'}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-accent/10 text-accent">
                  {basicFilledCount}/3 Felder
                </span>
                <span className="text-text-secondary">
                  {openSections.basic ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </span>
              </div>
            </button>

            <AnimatePresence initial={false}>
              {openSections.basic && (
                <motion.div
                  key="basic-content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="p-3.5 sm:p-4 pt-1 sm:pt-1 border-t border-border-primary/10 flex flex-col gap-4">
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

                    <div>
                      <label className={labelClass}>URL</label>
                      <Input 
                        value={formData.url} 
                        onChange={e => setFormData({ ...formData, url: e.target.value })} 
                        placeholder="https://..."
                        className={inputClass} 
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ABSCHNITT 2: Kategorisierung & Bewertung */}
          <div className={sectionCardClass}>
            <button
              type="button"
              onClick={() => toggleSection('categories')}
              className={sectionHeaderClass}
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
                  <Tag size={18} />
                </div>
                <div className="truncate text-left">
                  <h3 className="text-sm font-bold text-text-primary">Kategorie & Bewertung</h3>
                  {!openSections.categories && (
                    <p className="text-xs text-text-secondary truncate mt-0.5">
                      {formData.mainCat || 'Setup'}
                      {formData.subCats && formData.subCats.length > 0 ? ` (${formData.subCats.join(', ')})` : ''}
                      {formData.rating ? ` • ⭐ ${formData.rating}` : ''}
                      {formData.isFavorite ? ' • ❤️ Favorit' : ''}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-accent/10 text-accent">
                  {categoriesFilledCount}/4 Felder
                </span>
                <span className="text-text-secondary">
                  {openSections.categories ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </span>
              </div>
            </button>

            <AnimatePresence initial={false}>
              {openSections.categories && (
                <motion.div
                  key="categories-content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-visible"
                >
                  <div className="p-3.5 sm:p-4 pt-1 sm:pt-1 border-t border-border-primary/10 flex flex-col gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Hauptkategorie Dropdown */}
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
                          <span className="text-text-secondary text-[10px] transform transition-transform duration-300 select-none pointer-events-none ml-2">
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
                                    "w-full text-left px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer",
                                    formData.mainCat === c
                                      ? "bg-accent text-bg-primary"
                                      : "text-text-primary hover:bg-text-primary/10"
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
                                  className="w-full text-left px-4 py-2 rounded-full text-sm font-semibold text-accent hover:bg-accent/10 cursor-pointer"
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

                      {/* Subkategorie Dropdown */}
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
                          <span className="text-text-secondary text-[10px] transform transition-transform duration-300 select-none pointer-events-none ml-2">
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
                                      "w-full text-left px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer flex items-center justify-between",
                                      isSelected
                                        ? "bg-accent text-bg-primary"
                                        : "text-text-primary hover:bg-text-primary/10"
                                    )}
                                  >
                                    <span>{s}</span>
                                    {isSelected && <Check size={14} />}
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
                                  className="w-full text-left px-4 py-2 rounded-full text-sm font-semibold text-accent hover:bg-accent/10 cursor-pointer"
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
                          onClick={() => {
                            triggerHaptic(15);
                            setFormData({ ...formData, isFavorite: !formData.isFavorite });
                          }}
                          className={favoriteButtonClass}
                        >
                          <Heart size={16} className={formData.isFavorite ? "fill-current" : ""} />
                          <span>{formData.isFavorite ? 'Als Favorit gespeichert' : 'Als Favorit markieren'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ABSCHNITT 3: Preise & Konditionen */}
          <div className={sectionCardClass}>
            <button
              type="button"
              onClick={() => toggleSection('pricing')}
              className={sectionHeaderClass}
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
                  <Euro size={18} />
                </div>
                <div className="truncate text-left">
                  <h3 className="text-sm font-bold text-text-primary">Preise & Rabatt</h3>
                  {!openSections.pricing && (
                    <p className="text-xs text-text-secondary truncate mt-0.5">
                      {formData.price ? `${formData.price.toFixed(2)} €${formData.discount ? ` (-${formData.discount}%)` : ''}` : 'Kein Preis eingegeben'}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-accent/10 text-accent">
                  {pricingFilledCount}/2 Felder
                </span>
                <span className="text-text-secondary">
                  {openSections.pricing ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </span>
              </div>
            </button>

            <AnimatePresence initial={false}>
              {openSections.pricing && (
                <motion.div
                  key="pricing-content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="p-3.5 sm:p-4 pt-1 sm:pt-1 border-t border-border-primary/10 flex flex-col gap-4">
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
                          placeholder="0.00"
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
                          placeholder="0"
                          className={inputClass} 
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Endpreis (€)</label>
                        <Input 
                          type="number" 
                          value={formData.finalPrice?.toFixed(2)} 
                          readOnly 
                          className={cn(inputClass, "opacity-60 cursor-not-allowed")} 
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ABSCHNITT 4: Bilder & Details */}
          <div className={sectionCardClass}>
            <button
              type="button"
              onClick={() => toggleSection('media')}
              className={sectionHeaderClass}
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
                  <ImageIcon size={18} />
                </div>
                <div className="truncate text-left">
                  <h3 className="text-sm font-bold text-text-primary">Bilder & Details</h3>
                  {!openSections.media && (
                    <p className="text-xs text-text-secondary truncate mt-0.5">
                      {(formData.imgs || []).length} Bild(er)
                      {formData.details ? ' • Details vorhanden' : ''}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-accent/10 text-accent">
                  {mediaFilledCount}/2 Felder
                </span>
                <span className="text-text-secondary">
                  {openSections.media ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </span>
              </div>
            </button>

            <AnimatePresence initial={false}>
              {openSections.media && (
                <motion.div
                  key="media-content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="p-3.5 sm:p-4 pt-1 sm:pt-1 border-t border-border-primary/10 flex flex-col gap-4">
                    {/* Bilder Drag & Drop Zone */}
                    <div>
                      <label className={labelClass}>Bilder (Upload / Drag & Drop / URL)</label>
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
                          className="flex flex-col gap-1 text-center justify-center items-center py-2 cursor-pointer group"
                        >
                          <ImageIcon size={26} className={cn("transition-colors duration-300", isDragging ? "text-accent" : "text-text-secondary group-hover:text-text-primary")} />
                          <span className="text-xs font-semibold text-text-primary mt-1">
                            Bilder hierher ziehen oder <span className="underline group-hover:text-accent transition-colors">durchsuchen</span>
                          </span>
                          <span className="text-[10px] text-text-secondary mt-0.5">
                            Drag & Drop, Klick zum Auswählen oder Clipboard (Strg+V)
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
                          <div className="bg-heart/10 border border-heart/30 text-heart rounded-xl p-3 text-xs flex justify-between items-center animate-in fade-in slide-in-from-top-2 duration-300">
                            <span>{imageError}</span>
                            <button type="button" onClick={() => setImageError(null)} className="text-heart hover:opacity-80 font-bold ml-2">
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
                            className="shrink-0 h-[42px] flex items-center justify-center px-5 rounded-full bg-accent text-bg-primary font-semibold text-xs transition-all duration-200 active:scale-95 shadow-sm hover:bg-accent-hover cursor-pointer"
                          >
                            Hinzufügen
                          </button>
                        </div>

                        {formData.imgs && formData.imgs.length > 0 && (
                          <div className="flex gap-3 overflow-x-auto pb-2 hidden-scrollbar">
                            {formData.imgs.map((img, idx) => (
                              <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-border-primary/20 shadow-sm group">
                                <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                                <button
                                  onClick={() => removeImage(idx)}
                                  type="button"
                                  className="absolute top-1 right-1 w-6 h-6 bg-heart rounded-full flex items-center justify-center text-white md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity shadow-lg active:scale-90 cursor-pointer z-10"
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* Footer */}
        <div className={footerClass}>
          <button 
            type="button" 
            onClick={handleCancel} 
            className="bg-inactive-btn-bg text-inactive-btn-text hover:opacity-90 px-5 py-2.5 rounded-full text-sm font-medium transition-colors cursor-pointer select-none active:scale-95"
          >
            Abbrechen
          </button>
          <button 
            type="button" 
            onClick={handleSave} 
            className="bg-accent text-bg-primary hover:bg-accent-hover px-6 py-2.5 rounded-full text-sm font-semibold shadow-sm transition-all duration-200 active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <Save size={18} /> Speichern
          </button>
        </div>

      </div>
    </div>
  );
};
