import React, { useState, useRef, useEffect } from 'react';
import { Pencil, Trash2, Plus, Check, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useUIStore } from '../../store/useUIStore';

export const CategoryMenu: React.FC<{ anchorRef: React.RefObject<HTMLButtonElement> }> = ({ anchorRef }) => {
  const { categories, addCategory, deleteCategory, renameCategory } = useAppStore();
  const { closeCategoryMenu } = useUIStore();
  
  const [newCatName, setNewCatName] = useState('');
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) && 
        anchorRef.current && 
        !anchorRef.current.contains(event.target as Node)
      ) {
        closeCategoryMenu();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeCategoryMenu, anchorRef]);

  const handleAdd = () => {
    if (newCatName.trim()) {
      addCategory(newCatName.trim());
      setNewCatName('');
    }
  };

  const handleRename = (oldName: string) => {
    if (editValue.trim() && editValue !== oldName) {
      renameCategory(oldName, editValue.trim());
    }
    setEditingCat(null);
  };

  return (
    <div 
      ref={menuRef}
      className="absolute top-full right-0 mt-4 w-72 bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-xl rounded-2xl shadow-2xl z-[100] p-4 animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-sm font-bold text-text-primary">Kategorien verwalten</h3>
        <button onClick={closeCategoryMenu} className="text-text-secondary hover:text-text-primary transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="space-y-1 max-h-64 overflow-y-auto no-scrollbar mb-4">
        {categories.map((cat) => (
          <div key={cat} className="group flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors">
            {editingCat === cat ? (
              <div className="flex items-center gap-2 w-full">
                <input 
                  autoFocus
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRename(cat)}
                  className="bg-black/20 border border-white/10 rounded-lg px-2 py-1 text-sm text-text-primary outline-none flex-grow"
                />
                <button onClick={() => handleRename(cat)} className="text-green-500 hover:text-green-400">
                  <Check size={16} />
                </button>
              </div>
            ) : (
              <>
                <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors font-medium">{cat}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => { setEditingCat(cat); setEditValue(cat); }}
                    className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-white/10 rounded-md transition-all"
                  >
                    <Pencil size={14} />
                  </button>
                  <button 
                    onClick={() => {
                        if (confirm(`Möchtest du die Kategorie "${cat}" wirklich löschen? Alle Produkte in dieser Kategorie werden auf "Alle" zurückgesetzt.`)) {
                            deleteCategory(cat);
                        }
                    }}
                    className="p-1.5 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-white/5">
        <div className="flex items-center gap-2">
          <input 
            type="text"
            placeholder="Neue Kategorie..."
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="flex-grow bg-black/10 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-text-primary outline-none focus:border-white/20 transition-all placeholder:text-text-secondary/50"
          />
          <button 
            onClick={handleAdd}
            className="p-2.5 bg-text-primary text-bg-primary rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-text-primary/10 flex items-center justify-center"
          >
            <Plus size={18} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
};
