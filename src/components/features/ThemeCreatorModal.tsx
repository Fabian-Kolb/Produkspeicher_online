import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, Square, Layers, Sun, Moon, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../store/useUIStore';
import { useAppStore } from '../../store/useAppStore';
import { applyGlobalTheme, applyBaseMode } from '../../utils/themeHelpers';
import { cn } from '../../utils/cn';
import type { CustomTheme } from '../../types';

export const ThemeCreatorModal: React.FC = () => {
  const { isThemeManagerOpen, toggleThemeManager } = useUIStore();
  const { settings, updateSettings, addCustomTheme, deleteCustomTheme, updateCustomTheme } = useAppStore();

  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  
  // Custom Theme Editor State
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const [draftTheme, setDraftTheme] = useState<Partial<CustomTheme>>({
    name: 'Mein Theme',
    colors: {
      bg: '#1a1a1a', card: '#2a2a2a', textDark: '#ffffff', textGrey: '#a0a0a0',
      border: '#404040', heart: '#FF3366', glassBg: 'rgba(42, 42, 42, 0.7)', glassBorder: 'rgba(255, 255, 255, 0.1)'
    }
  });

  // Apply draft colors live when editing
  useEffect(() => {
    if (activeTab === 'custom' && draftTheme.colors) {
      applyGlobalTheme(draftTheme.colors);
    } else {
      // Revert to saved settings
      applyBaseMode(settings.theme);
      if (settings.activeThemeId !== 'default') {
        const t = settings.customThemes.find(t => t.id === settings.activeThemeId);
        if (t) applyGlobalTheme(t.colors);
      }
    }
  }, [activeTab, draftTheme.colors, settings.theme, settings.activeThemeId, settings.customThemes]);

  if (!isThemeManagerOpen) return null;

  const handleApplyPreset = (mode: 'light' | 'dark') => {
    updateSettings({ theme: mode, activeThemeId: 'default' });
  };

  const handleApplyCustom = (themeId: string) => {
    updateSettings({ activeThemeId: themeId });
  };

  const handleSaveDraft = () => {
    if (editingThemeId) {
      updateCustomTheme(editingThemeId, draftTheme);
    } else {
      addCustomTheme(draftTheme as Omit<CustomTheme, 'id'>);
    }
    setEditingThemeId(null);
    setActiveTab('presets');
  };

  const isModalDark = settings.modalTheme === 'dark' || (settings.modalTheme === 'auto' && settings.theme === 'dark');
  const isModalGlass = settings.modalStyle === 'glass';

  return (
    <div className={cn(
      "fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-black/60 transition-all duration-300",
      settings.isGlassEnabled && "backdrop-blur-sm shadow-2xl"
    )} onClick={toggleThemeManager}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={cn(
          "w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl transition-all duration-500",
          isModalDark 
            ? (isModalGlass ? "bg-[#1a1a1a]/80 backdrop-blur-2xl border border-white/10" : "bg-[#2a2a2a] border border-border-primary/50 text-white")
            : (isModalGlass ? "bg-white/70 backdrop-blur-2xl border border-white/40" : "bg-white border border-black/5 text-[#111827]"),
          isModalDark ? "shadow-black/40" : "shadow-black/10"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-primary shrink-0">
          <h2 className="text-2xl font-playfair font-bold">Design & Themes</h2>
          <button onClick={toggleThemeManager} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Sidebar / Tabs */}
          <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-border-primary p-4 md:p-6 flex flex-col gap-4 overflow-y-auto hidden-scrollbar">
            {/* Presets */}
            <div>
              <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4">Standard</h3>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => handleApplyPreset('light')}
                  className={cn(
                    "p-4 rounded-xl border flex items-center justify-between transition-all",
                    settings.theme === 'light' && settings.activeThemeId === 'default' ? "border-text-primary bg-text-primary/5" : "border-border-primary hover:border-text-secondary"
                  )}
                >
                  <span className="font-medium">Light Mode</span>
                  {settings.theme === 'light' && settings.activeThemeId === 'default' && <Check size={16} />}
                </button>
                <button 
                  onClick={() => handleApplyPreset('dark')}
                  className={cn(
                    "p-4 rounded-xl border flex items-center justify-between transition-all",
                    settings.theme === 'dark' && settings.activeThemeId === 'default' ? "border-text-primary bg-text-primary/5" : "border-border-primary hover:border-text-secondary"
                  )}
                >
                  <span className="font-medium">Dark Mode</span>
                  {settings.theme === 'dark' && settings.activeThemeId === 'default' && <Check size={16} />}
                </button>
              </div>
            </div>

            {/* Custom List */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider">Eigene Themes</h3>
                <button onClick={() => { setActiveTab('custom'); setEditingThemeId(null); setDraftTheme({name: 'Neues Theme', colors: {...draftTheme.colors!}}); }} className="text-xs font-bold text-text-primary hover:underline">
                  + Neu
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {settings.customThemes.map(t => (
                  <div key={t.id} className="flex gap-2">
                    <button 
                      onClick={() => handleApplyCustom(t.id)}
                      className={cn(
                        "flex-1 p-4 rounded-xl border flex items-center justify-between transition-all text-left",
                        settings.activeThemeId === t.id ? "border-text-primary bg-text-primary/5" : "border-border-primary hover:border-text-secondary"
                      )}
                    >
                      <span className="font-medium">{t.name}</span>
                      {settings.activeThemeId === t.id && <Check size={16} />}
                    </button>
                    <button 
                      onClick={() => { setActiveTab('custom'); setEditingThemeId(t.id); setDraftTheme(t); }}
                      className="w-10 flex items-center justify-center rounded-xl border border-border-primary hover:bg-black/5"
                      title="Bearbeiten"
                    >
                      ✏️
                    </button>
                    {t.id !== 'default' && (
                      <button 
                        onClick={() => deleteCustomTheme(t.id)}
                        className="w-10 flex items-center justify-center rounded-xl border border-border-primary hover:bg-heart/10 text-heart"
                        title="Löschen"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Modal Styles */}
            <div className="mt-6 pt-6 border-t border-border-primary">
              <h3 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-4">Modal Style</h3>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => updateSettings({ modalStyle: 'solid' })}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all",
                    settings.modalStyle === 'solid' ? "border-text-primary bg-text-primary/5" : "border-border-primary/50 hover:border-text-secondary"
                  )}
                >
                  <Square size={20} className={settings.modalStyle === 'solid' ? "text-text-primary" : "text-text-secondary"} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Solid</span>
                </button>
                <button 
                  onClick={() => updateSettings({ modalStyle: 'glass' })}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all",
                    settings.modalStyle === 'glass' ? "border-text-primary bg-text-primary/5" : "border-border-primary/50 hover:border-text-secondary"
                  )}
                >
                  <Layers size={20} className={settings.modalStyle === 'glass' ? "text-text-primary" : "text-text-secondary"} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Glass</span>
                </button>
              </div>
            </div>

            {/* Modal Theme */}
            <div className="mt-4">
              <h3 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-4">Modal Theme</h3>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => updateSettings({ modalTheme: 'light' })}
                  className={cn(
                    "flex flex-col items-center gap-2 p-2 rounded-2xl border transition-all",
                    settings.modalTheme === 'light' ? "border-text-primary bg-text-primary/5" : "border-border-primary/50 hover:border-text-secondary"
                  )}
                >
                  <Sun size={18} className={settings.modalTheme === 'light' ? "text-text-primary" : "text-text-secondary"} />
                  <span className="text-[9px] font-bold uppercase tracking-tight">Light</span>
                </button>
                <button 
                  onClick={() => updateSettings({ modalTheme: 'dark' })}
                  className={cn(
                    "flex flex-col items-center gap-2 p-2 rounded-2xl border transition-all",
                    settings.modalTheme === 'dark' ? "border-text-primary bg-text-primary/5" : "border-border-primary/50 hover:border-text-secondary"
                  )}
                >
                  <Moon size={18} className={settings.modalTheme === 'dark' ? "text-text-primary" : "text-text-secondary"} />
                  <span className="text-[9px] font-bold uppercase tracking-tight">Dark</span>
                </button>
                <button 
                  onClick={() => updateSettings({ modalTheme: 'auto' })}
                  className={cn(
                    "flex flex-col items-center gap-2 p-2 rounded-2xl border transition-all",
                    settings.modalTheme === 'auto' ? "border-text-primary bg-text-primary/5" : "border-border-primary/50 hover:border-text-secondary"
                  )}
                >
                  <Zap size={18} className={settings.modalTheme === 'auto' ? "text-text-primary" : "text-text-secondary"} />
                  <span className="text-[9px] font-bold uppercase tracking-tight">Auto</span>
                </button>
              </div>
            </div>

            {/* Global Settings */}
            <div className="mt-auto pt-6 border-t border-border-primary">
              <h3 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-4">Global</h3>
              <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-black/5 transition-colors">
                <span className="text-sm font-medium">Glassmorphism</span>
                <input 
                  type="checkbox" 
                  checked={settings.isGlassEnabled}
                  onChange={(e) => updateSettings({ isGlassEnabled: e.target.checked })}
                  className="w-5 h-5 accent-text-primary rounded cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="w-full md:w-2/3 p-4 md:p-8 overflow-y-auto bg-black/5">
            {activeTab === 'presets' ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-text-secondary">
                <div className="text-6xl mb-4">🎨</div>
                <h3 className="text-xl font-bold font-playfair mb-2 text-text-primary">Theme & Design Manager</h3>
                <p className="max-w-md">Wähle ein Standard-Theme, aktiviere Glass-Effekte oder erstelle auf der linken Seite dein komplett eigenes Farbschema.</p>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                <div className="flex justify-between items-center mb-6">
                  <input 
                    type="text" 
                    value={draftTheme.name}
                    onChange={e => setDraftTheme({...draftTheme, name: e.target.value})}
                    className="text-2xl font-playfair font-bold bg-transparent border-b border-border-primary outline-none focus:border-text-primary px-2 py-1"
                  />
                  <div className="flex gap-3">
                    <button onClick={() => setActiveTab('presets')} className="px-4 py-2 rounded-xl text-sm font-medium border border-border-primary hover:bg-black/5">Abbrechen</button>
                    <button onClick={handleSaveDraft} className="px-4 py-2 rounded-xl text-sm font-medium bg-text-primary text-bg-primary hover:opacity-90 shadow-md">Speichern</button>
                  </div>
                </div>

                {/* Color Pickers Generator */}
                <div className="grid grid-cols-2 gap-6">
                  {draftTheme.colors && Object.entries(draftTheme.colors).map(([key, val]) => (
                    <div key={key} className="flex flex-col gap-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                      <div className="flex gap-3 items-center">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-border-primary shadow-inner shrink-0 cursor-pointer">
                          <input 
                            type="color" 
                            value={val.length === 7 ? val : '#ffffff'} 
                            onChange={e => setDraftTheme({...draftTheme, colors: {...draftTheme.colors!, [key]: e.target.value}})}
                            className="absolute -inset-2 w-14 h-14 cursor-pointer"
                            // Color picker inputs struggle with rgba, so a real app might need a custom hex/rgba component
                          />
                        </div>
                        <input 
                          type="text" 
                          value={val}
                          onChange={e => setDraftTheme({...draftTheme, colors: {...draftTheme.colors!, [key]: e.target.value}})}
                          className="flex-1 bg-bg-card border border-border-primary rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-text-secondary"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Live Preview Minimap */}
                <div className="mt-10 p-6 rounded-2xl border border-border-primary glass-panel" style={{ background: draftTheme.colors?.bg }}>
                  <h4 className="font-playfair font-bold mb-4" style={{ color: draftTheme.colors?.textDark }}>Live Vorschau</h4>
                  <div className="flex gap-4">
                    <div className="flex-1 p-4 rounded-xl border" style={{ background: draftTheme.colors?.card, borderColor: draftTheme.colors?.border }}>
                      <div className="h-4 w-1/2 rounded mb-2" style={{ background: draftTheme.colors?.textDark }}></div>
                      <div className="h-3 w-full rounded mb-4" style={{ background: draftTheme.colors?.textGrey }}></div>
                      <button className="px-4 py-2 rounded-lg text-xs font-bold w-full" style={{ background: draftTheme.colors?.textDark, color: draftTheme.colors?.bg }}>Aktion</button>
                    </div>
                    <div className="flex-1 p-4 rounded-xl border flex items-center justify-center" style={{ background: draftTheme.colors?.glassBg, borderColor: draftTheme.colors?.glassBorder }}>
                      <span className="font-bold" style={{ color: draftTheme.colors?.heart }}>❤</span>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
