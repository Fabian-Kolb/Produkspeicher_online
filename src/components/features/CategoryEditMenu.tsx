import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Plus, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useUIStore } from '../../store/useUIStore';
import { FilterChip } from '../common/FilterChip';
import { cn } from '../../utils/cn';

export const CategoryEditMenu: React.FC = () => {
  const { categories, addCategory, deleteCategory, reorderCategories } = useAppStore();
  const { closeCategoryMenu } = useUIStore();

  const [newCatName, setNewCatName] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
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
      addCategory(trimmed);
    }
    setNewCatName('');
    setShowAddInput(false);
  };

  const handleRemoveCat = (cat: string) => {
    if (cat === 'Alle') return;
    if (confirm(`Möchtest du die Kategorie "${cat}" wirklich löschen? Alle Produkte in dieser Kategorie werden auf "Alle" zurückgesetzt.`)) {
      deleteCategory(cat);
    }
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
    reorderCategories(newCats.slice(1));
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="w-full glass-panel p-6 flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-300 relative">
      {/* Title */}
      <div className="flex items-center justify-between pb-2 border-b border-white/5">
        <div>
          <h3 className="text-sm font-bold text-text-primary">Kategorien verwalten</h3>
          <p className="text-xs text-text-secondary">Drag & Drop zum Sortieren, zum Löschen auf das X klicken</p>
        </div>
        <button
          onClick={closeCategoryMenu}
          className="p-1.5 rounded-full text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      {/* Filter Chips List */}
      <div className="flex flex-wrap items-center gap-2">
        {displayCats.map((cat, idx) => {
          const isVirtual = cat === 'Alle';
          const isDragging = draggedIndex === idx;

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
                isDragging && "opacity-40 scale-95 border-dashed",
                !isVirtual && "cursor-move"
              )}
            >
              <FilterChip
                active={false}
                editable={!isVirtual}
                shaking={!isVirtual}
              >
                {cat}
              </FilterChip>

              {/* Delete Button */}
              {!isVirtual && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveCat(cat);
                  }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-heart text-white text-[10px] shadow-md hover:scale-110 active:scale-95 transition-transform duration-150 z-10 cursor-pointer"
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
            className="!border-dashed !border-emerald-400/50 !text-emerald-400 hover:!bg-emerald-400/10 cursor-pointer"
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
              placeholder="Kategorie…"
              className="w-28 bg-[var(--theme-glass-bg)] border border-emerald-400/40 rounded-full text-sm text-text-primary outline-none px-3 py-1.5 placeholder:text-text-secondary/50 focus:border-emerald-400 transition-colors"
            />
            <button
              onClick={handleAddCat}
              className="p-1.5 rounded-full text-emerald-400 hover:bg-emerald-400/10 transition-colors cursor-pointer"
            >
              <Plus size={14} />
            </button>
            <button
              onClick={() => {
                setShowAddInput(false);
                setNewCatName('');
              }}
              className="p-1.5 rounded-full text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
