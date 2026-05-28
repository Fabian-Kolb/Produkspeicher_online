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
  const addInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showAddInput && addInputRef.current) {
      addInputRef.current.focus();
    }
  }, [showAddInput]);

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
    <div className="w-full glass-panel p-6 flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-300 relative shadow-xl">
      {/* Title */}
      <div className="flex items-center justify-between pb-3 border-b border-border-primary/20">
        <div>
          <h3 className="text-sm font-bold text-text-primary tracking-wide">{title}</h3>
          <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 text-text-secondary hover:text-text-primary hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
          title="Schließen"
        >
          <X size={15} />
        </button>
      </div>

      {/* Filter Chips List */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {displayCats.map((cat, idx) => {
          const isVirtual = cat === 'Alle';
          const isDragging = draggedIndex === idx;
          const isPendingDelete = pendingDelete === cat;

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
                  isVirtual ? "!border-solid" : "group-hover:border-heart group-hover:text-heart group-hover:bg-heart/5 transition-all duration-200",
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
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-heart text-white text-[10px] shadow-md scale-0 group-hover:scale-100 active:scale-95 transition-all duration-200 z-10 cursor-pointer pointer-events-auto"
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
            className="!border-dashed !border-emerald-400/50 !text-emerald-400 hover:!bg-emerald-400/10 cursor-pointer flex items-center justify-center"
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
              className="w-32 sm:w-40 bg-black/5 dark:bg-white/5 border border-border-primary/30 rounded-full text-sm text-text-primary outline-none px-4 py-1.5 placeholder:text-text-secondary/45 hover:border-text-secondary focus:border-text-secondary hover:scale-[1.02] focus:scale-[1.02] transition-all duration-300 transform-gpu origin-center"
            />
            <button
              onClick={handleAddCat}
              className="p-1.5 rounded-full text-emerald-400 hover:bg-emerald-400/10 transition-colors cursor-pointer"
              title="Hinzufügen"
            >
              <Plus size={14} />
            </button>
            <button
              onClick={() => {
                setShowAddInput(false);
                setNewCatName('');
              }}
              className="p-1.5 rounded-full text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors cursor-pointer"
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
