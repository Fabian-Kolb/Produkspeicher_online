import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Plus, X, Check } from 'lucide-react';
import { FilterChip } from '../common/FilterChip';
import { cn } from '../../utils/cn';

interface CategoryEditMenuProps {
  title: string;
  subtitle: string;
  categories: string[];
  onAdd: (cat: string) => void | Promise<void>;
  onDelete: (cat: string) => void | Promise<void>;
  onReorder: (newCats: string[]) => void | Promise<void>;
  onClose: () => void;
  placeholder?: string;
}

export const CategoryEditMenu: React.FC<CategoryEditMenuProps> = ({
  title,
  subtitle,
  categories,
  onAdd,
  onDelete,
  onReorder,
  onClose,
  placeholder = 'Kategorie…',
}) => {
  const [newCatName, setNewCatName] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [hoveredDeleteCat, setHoveredDeleteCat] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const addInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showAddInput && addInputRef.current) {
      addInputRef.current.focus();
    }
  }, [showAddInput]);

  useEffect(() => {
    if (!showTooltip) return;
    const handleOutsideClick = () => {
      setShowTooltip(false);
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [showTooltip]);

  const displayCats = useMemo(() => ['Alle', ...categories], [categories]);

  const handleAddCat = () => {
    const trimmed = newCatName.trim();
    if (trimmed) {
      onAdd(trimmed);
    }
    setNewCatName('');
    setShowAddInput(false);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (index: number) => {
    if (draggedIndex === null || draggedIndex === index || index === 0 || draggedIndex === 0) return;

    const newCats = [...displayCats];
    const [removed] = newCats.splice(draggedIndex, 1);
    newCats.splice(index, 0, removed);

    setDraggedIndex(index);
    onReorder(newCats.slice(1));
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="w-full glass-panel p-6 flex flex-col gap-3 animate-in fade-in slide-in-from-top-4 duration-300 relative shadow-xl">
      {/* Title/Tooltip Button & Close Button */}
      <div className="flex items-center justify-between pb-2 border-b border-border-primary/20 gap-2 relative">
        {/* Title */}
        <h3 className="text-base font-bold text-text-primary tracking-wide">{title}</h3>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Info/Tooltip Button */}
          <div className="relative z-25">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowTooltip(!showTooltip);
              }}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="w-8 h-8 rounded-full bg-text-primary/5 text-text-secondary hover:text-text-primary hover:bg-text-primary/10 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span className="text-sm font-bold select-none">?</span>
            </button>
            
            {/* Tooltip containing subtitle (positioned downwards to avoid overflow clipping) */}
            <span 
              className={cn(
                "absolute top-full right-0 mt-2 w-72 p-3 rounded-2xl glass-panel shadow-xl pointer-events-none transition-all duration-300 z-50 origin-top-right block text-left",
                showTooltip 
                  ? "opacity-100 scale-100 translate-y-0" 
                  : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
              )}
            >
              <span className="text-xs text-text-primary font-semibold mb-1 block">Anleitung</span>
              <span className="text-[11px] text-text-secondary leading-relaxed normal-case font-normal block">
                {subtitle}
              </span>
            </span>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-text-primary/5 text-text-secondary hover:text-text-primary hover:bg-text-primary/10 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
            title="Schließen"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Filter Chips List */}
      <div className="flex flex-wrap items-center gap-2 pt-0">
        {displayCats.map((cat, idx) => {
          const isVirtual = cat === 'Alle';
          const isDragging = draggedIndex === idx;
          const isPendingDelete = pendingDelete === cat;
          const isHoveredDelete = hoveredDeleteCat === cat;

          if (isPendingDelete && !isVirtual) {
            return (
              <div
                key={`confirm-${cat}`}
                className="flex items-center gap-1.5 bg-heart/10 border border-heart/40 rounded-full px-3 py-1.5 text-xs font-semibold text-heart animate-in zoom-in-95 duration-200 select-none shadow-sm"
              >
                <span>Löschen?</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(cat);
                    setPendingDelete(null);
                    setHoveredDeleteCat(null);
                  }}
                  className="p-0.5 rounded-full hover:bg-heart/20 text-heart cursor-pointer transition-colors"
                  title="Bestätigen"
                >
                  <Check size={12} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPendingDelete(null);
                  }}
                  className="p-0.5 rounded-full hover:bg-heart/20 text-heart cursor-pointer transition-colors"
                  title="Abbrechen"
                >
                  <X size={12} />
                </button>
              </div>
            );
          }

          return (
            <div
              key={cat}
              draggable={!isVirtual}
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragEnter={() => handleDragEnter(idx)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className={cn(
                "relative transition-all duration-300",
                isDragging && "opacity-40 scale-95 border-dashed border-text-secondary",
                !isVirtual && "cursor-move group"
              )}
            >
              <FilterChip
                active={false}
                editable={!isVirtual}
                shaking={false}
                className={cn(
                  isVirtual 
                    ? "!border-solid" 
                    : isHoveredDelete
                      ? "border-heart text-heart bg-heart/5 transition-all duration-200"
                      : "group-hover:border-accent group-hover:text-accent group-hover:bg-accent/5 transition-all duration-200",
                  "pointer-events-none select-none"
                )}
              >
                {cat}
              </FilterChip>

              {/* Delete Button */}
              {!isVirtual && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPendingDelete(cat);
                  }}
                  onMouseEnter={() => setHoveredDeleteCat(cat)}
                  onMouseLeave={() => setHoveredDeleteCat(null)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-heart text-white text-[10px] shadow-md scale-0 group-hover:scale-100 hover:!scale-125 active:scale-95 transition-all duration-200 z-10 cursor-pointer pointer-events-auto"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          );
        })}

        {/* Add Category Chip */}
        {!showAddInput && (
          <FilterChip
            onClick={() => setShowAddInput(true)}
            className="!border-dashed !border-accent/50 !text-accent hover:!bg-accent/10 cursor-pointer flex items-center justify-center"
          >
            <Plus size={12} className="mr-1" />
            Neu
          </FilterChip>
        )}

        {/* Inline Add Input */}
        {showAddInput && (
          <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-left-4 duration-200">
            <input
              ref={addInputRef}
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCat();
                if (e.key === 'Escape') {
                  setShowAddInput(false);
                  setNewCatName('');
                }
              }}
              placeholder={placeholder}
              className="w-32 sm:w-40 bg-text-primary/5 border border-border-primary/30 rounded-full text-sm text-text-primary outline-none px-4 py-1.5 placeholder:text-text-secondary/45 hover:border-text-secondary focus:border-text-secondary hover:scale-[1.02] focus:scale-[1.02] transition-all duration-300 transform-gpu origin-center"
            />
            <button
              onClick={handleAddCat}
              className="p-1.5 rounded-full text-accent hover:bg-accent/10 transition-colors cursor-pointer"
              title="Hinzufügen"
            >
              <Plus size={14} />
            </button>
            <button
              onClick={() => {
                setShowAddInput(false);
                setNewCatName('');
              }}
              className="p-1.5 rounded-full text-text-secondary hover:text-text-primary hover:bg-text-primary/5 transition-colors cursor-pointer"
              title="Abbrechen"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
