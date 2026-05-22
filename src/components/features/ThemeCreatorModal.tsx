import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, Layers, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../store/useUIStore';
import { useAppStore } from '../../store/useAppStore';
import { applyGlobalTheme, applyBaseMode, THEME_PRESETS, rgbaToHexAndAlpha, hexToRgba } from '../../utils/themeHelpers';
import { cn } from '../../utils/cn';
import type { CustomTheme } from '../../types';

const COLOR_LABELS: Record<string, string> = {
  bg: 'App-Hintergrund',
  card: 'Karten & Paneele',
  border: 'Rahmen & Linien',
  textDark: 'Haupttext',
  textGrey: 'Nebentext',
  accent: 'Akzent (Aktiv)',
  accentHover: 'Akzent Hover',
  inactiveBtnBg: 'Inaktiver Button-Hintergrund',
  inactiveBtnText: 'Inaktiver Button-Text',
  heart: 'Herz-Farbe (Favoriten)',
  glassBg: 'Glas-Hintergrund',
  glassBorder: 'Glas-Rahmen',
};

export const ThemeCreatorModal: React.FC = () => {
  const { isThemeManagerOpen, toggleThemeManager } = useUIStore();
  const { settings, updateSettings, addCustomTheme, deleteCustomTheme, updateCustomTheme } = useAppStore();

  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [isMobile, setIsMobile] = useState(false);
  
  // Custom Theme Editor State
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const [draftTheme, setDraftTheme] = useState<Partial<CustomTheme>>({
    name: 'Mein Theme',
    colors: {
      bg: '#1a1a1a',
      card: '#252525',
      border: '#333333',
      textDark: '#ffffff',
      textGrey: '#a0a0a0',
      accent: '#3b82f6',
      accentHover: '#2563eb',
      inactiveBtnBg: '#333333',
      inactiveBtnText: '#888888',
      heart: '#ef4444',
      glassBg: 'rgba(37, 37, 37, 0.7)',
      glassBorder: 'rgba(255, 255, 255, 0.08)'
    }
  });

  // Track viewport size for mobile layout adaptations
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isThemeManagerOpen) {
        toggleThemeManager();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isThemeManagerOpen, toggleThemeManager]);

  // Apply draft colors live when editing
  useEffect(() => {
    if (activeTab === 'custom' && draftTheme.colors) {
      applyGlobalTheme(draftTheme.colors, settings.theme === 'dark');
    } else {
      // Revert to saved settings
      const preset = THEME_PRESETS.find(p => p.id === settings.activeThemeId);
      if (preset) {
        applyGlobalTheme(preset.colors, preset.isDark);
      } else {
        const custom = settings.customThemes.find(t => t.id === settings.activeThemeId);
        if (custom) {
          applyGlobalTheme(custom.colors, settings.theme === 'dark');
        } else {
          applyBaseMode(settings.theme);
        }
      }
    }
  }, [activeTab, draftTheme.colors, settings.theme, settings.activeThemeId, settings.customThemes]);

  if (!isThemeManagerOpen) return null;

  const handleApplyPreset = (presetId: string) => {
    const preset = THEME_PRESETS.find(p => p.id === presetId);
    if (preset) {
      updateSettings({ 
        theme: preset.isDark ? 'dark' : 'light',
        activeThemeId: presetId 
      });
    }
  };

  const handleApplyCustom = (themeId: string) => {
    const custom = settings.customThemes.find(t => t.id === themeId);
    if (custom) {
      updateSettings({ activeThemeId: themeId });
    }
  };

  const handleSaveDraft = () => {
    if (!draftTheme.name || !draftTheme.colors) return;
    
    if (editingThemeId) {
      updateCustomTheme(editingThemeId, draftTheme);
    } else {
      addCustomTheme(draftTheme as Omit<CustomTheme, 'id'>);
    }
    setEditingThemeId(null);
    setActiveTab('presets');
  };

  const handleCancelEditing = () => {
    setEditingThemeId(null);
    setActiveTab('presets');
  };

  return (
    <div className={cn(
      "fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-black/60 transition-all duration-300",
      settings.isGlassEnabled && "backdrop-blur-sm shadow-2xl"
    )} onClick={toggleThemeManager}>
      <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={cn(
          "w-full max-w-4xl rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl transition-all duration-500 glass-panel text-text-primary bg-bg-card border border-border-primary",
          activeTab === 'presets' && isMobile ? "h-[65vh]" : "h-[85vh] md:h-[80vh]"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-primary shrink-0">
          <div className="flex items-center gap-3">
            {activeTab === 'custom' && isMobile && (
              <button 
                onClick={handleCancelEditing} 
                className="p-2 -ml-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              >
                ← Back
              </button>
            )}
            <h2 className="text-2xl font-playfair font-bold">Design & Themes</h2>
          </div>
          <button onClick={toggleThemeManager} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {/* Left Sidebar / Presets Overview */}
            {(!isMobile || activeTab === 'presets') && (
              <motion.div 
                key="presets-list"
                initial={isMobile ? { opacity: 0, x: -50 } : { opacity: 1 }}
                animate={{ opacity: 1, x: 0 }}
                exit={isMobile ? { opacity: 0, x: -50 } : { opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-border-primary p-4 md:p-6 flex flex-col gap-4 overflow-y-auto hidden-scrollbar shrink-0"
              >
                {/* Standard Presets */}
                <div>
                  <h3 className="text-xs font-black text-text-secondary uppercase tracking-[0.2em] mb-4">Standard Presets</h3>
                  <div className="flex flex-col gap-2">
                    {THEME_PRESETS.map((preset) => (
                      <button 
                        key={preset.id}
                        onClick={() => handleApplyPreset(preset.id)}
                        className={cn(
                          "p-3 rounded-xl border flex items-center justify-between transition-all text-left",
                          settings.activeThemeId === preset.id ? "border-text-primary bg-text-primary/5 font-bold" : "border-border-primary hover:border-text-secondary"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full border border-border-primary" style={{ backgroundColor: preset.colors.accent }}></div>
                          <span className="text-sm font-medium">{preset.name}</span>
                        </div>
                        {settings.activeThemeId === preset.id && <Check size={16} />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom List */}
                <div className="mt-4 flex flex-col gap-3">
                  <h3 className="text-xs font-black text-text-secondary uppercase tracking-[0.2em]">Eigene Themes</h3>
                  
                  {/* High presence New Theme Button */}
                  <button 
                    onClick={() => { 
                      setActiveTab('custom'); 
                      setEditingThemeId(null); 
                      setDraftTheme({
                        name: 'Mein Theme',
                        colors: {
                          bg: '#1a1a1a',
                          card: '#252525',
                          border: '#333333',
                          textDark: '#ffffff',
                          textGrey: '#a0a0a0',
                          accent: '#3b82f6',
                          accentHover: '#2563eb',
                          inactiveBtnBg: '#333333',
                          inactiveBtnText: '#888888',
                          heart: '#ef4444',
                          glassBg: 'rgba(37, 37, 37, 0.7)',
                          glassBorder: 'rgba(255, 255, 255, 0.08)'
                        }
                      }); 
                    }} 
                    className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-accent/40 text-accent hover:border-accent hover:bg-accent/5 font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] shadow-sm cursor-pointer"
                  >
                    <Plus size={16} />
                    <span>Neues Theme erstellen</span>
                  </button>

                  <div className="flex flex-col gap-2">
                    {settings.customThemes.filter(t => !THEME_PRESETS.some(p => p.id === t.id)).map(t => (
                      <div key={t.id} className="flex gap-2">
                        <button 
                          onClick={() => handleApplyCustom(t.id)}
                          className={cn(
                            "flex-1 p-3 rounded-xl border flex items-center justify-between transition-all text-left",
                            settings.activeThemeId === t.id ? "border-text-primary bg-text-primary/5 font-bold" : "border-border-primary hover:border-text-secondary"
                          )}
                        >
                          <span className="text-sm font-medium">{t.name}</span>
                          {settings.activeThemeId === t.id && <Check size={16} />}
                        </button>
                        <button 
                          onClick={() => { setActiveTab('custom'); setEditingThemeId(t.id); setDraftTheme(t); }}
                          className="w-10 h-10 flex items-center justify-center rounded-xl border border-border-primary hover:bg-black/5 shrink-0"
                          title="Bearbeiten"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => deleteCustomTheme(t.id)}
                          className="w-10 h-10 flex items-center justify-center rounded-xl border border-border-primary hover:bg-heart/10 text-heart shrink-0"
                          title="Löschen"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Global Settings */}
                <div className="mt-auto pt-6 border-t border-border-primary">
                  <h3 className="text-xs font-black text-text-secondary uppercase tracking-[0.2em] mb-4">Optionen</h3>
                  <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl hover:bg-text-primary/5 transition-colors border border-border-primary/50">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Layers size={16} />
                      Glassmorphismus
                    </span>
                    <input 
                      type="checkbox" 
                      checked={settings.isGlassEnabled}
                      onChange={(e) => updateSettings({ isGlassEnabled: e.target.checked })}
                      className="w-5 h-5 accent-accent rounded cursor-pointer"
                    />
                  </label>
                </div>
              </motion.div>
            )}

            {/* Right Editor / Info Pane */}
            {(!isMobile || activeTab === 'custom') && (
              <motion.div 
                key="right-pane"
                initial={isMobile ? { opacity: 0, y: 30 } : { opacity: 1 }}
                animate={{ opacity: 1, y: 0 }}
                exit={isMobile ? { opacity: 0, y: 30 } : { opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="w-full md:w-2/3 p-4 md:p-8 overflow-y-auto bg-black/5 flex flex-col"
              >
                {activeTab === 'presets' ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-text-secondary p-6">
                    {/* No emoji icon here */}
                    <h3 className="text-xl font-bold font-playfair mb-2 text-text-primary">Theme & Design Manager</h3>
                    <p className="max-w-md text-sm">Wähle ein vordefiniertes Preset, schalte Glassmorphismus an/aus, oder erstelle dein ganz persönliches Theme über den "+ Neu" Button.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-primary pb-4">
                      <input 
                        type="text" 
                        value={draftTheme.name}
                        onChange={e => setDraftTheme({...draftTheme, name: e.target.value})}
                        className="text-2xl font-playfair font-bold bg-transparent border-b border-border-primary/50 hover:border-text-secondary focus:border-text-secondary outline-none px-2 py-1 w-full sm:w-auto text-text-primary hover:-translate-y-0.5 focus:-translate-y-0.5 hover:scale-[1.015] focus:scale-[1.015] transition-all duration-500 ease-out transform-gpu origin-left"
                        placeholder="Theme Name"
                      />
                      <div className="flex gap-3 w-full sm:w-auto justify-end shrink-0">
                        <button onClick={handleCancelEditing} className="px-4 py-2 rounded-xl text-sm font-medium border border-border-primary hover:bg-black/5">Abbrechen</button>
                        <button onClick={handleSaveDraft} className="px-5 py-2 rounded-xl text-sm font-medium bg-accent text-bg-primary hover:opacity-90 shadow-md">Speichern</button>
                      </div>
                    </div>

                    {/* Color Pickers Generator - Two Columns on Mobile */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
                      {draftTheme.colors && Object.entries(draftTheme.colors).map(([key, val]) => {
                        const isGlassColor = key === 'glassBg' || key === 'glassBorder';
                        const { hex, alpha } = rgbaToHexAndAlpha(val);

                        return (
                          <div key={key} className="flex flex-col gap-1.5 p-2 sm:p-4 rounded-xl sm:rounded-2xl border border-border-primary/50 bg-bg-card/50">
                            <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-text-secondary truncate">
                              {COLOR_LABELS[key] || key}
                            </label>
                            
                            <div className="flex gap-2 sm:gap-3 items-center">
                              {/* Color Preview Block - enlarged for tap feedback */}
                              <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-lg overflow-hidden border border-border-primary shadow-inner shrink-0 cursor-pointer">
                                <input 
                                  type="color" 
                                  value={isGlassColor ? hex : val} 
                                  onChange={e => {
                                    const newHex = e.target.value;
                                    const newVal = isGlassColor ? hexToRgba(newHex, alpha) : newHex;
                                    setDraftTheme({
                                      ...draftTheme,
                                      colors: { ...draftTheme.colors!, [key]: newVal }
                                    });
                                  }}
                                  className="absolute -inset-2 w-14 h-14 cursor-pointer"
                                />
                              </div>
                              <input 
                                type="text" 
                                value={val}
                                onChange={e => {
                                  setDraftTheme({
                                    ...draftTheme,
                                    colors: { ...draftTheme.colors!, [key]: e.target.value }
                                  });
                                }}
                                className="w-full bg-bg-card border border-border-primary hover:border-text-secondary focus:border-text-secondary rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-mono outline-none hover:-translate-y-0.5 focus:-translate-y-0.5 hover:scale-[1.015] focus:scale-[1.015] transition-all duration-500 ease-out transform-gpu origin-center shadow-sm min-w-0"
                              />
                            </div>

                            {isGlassColor && (
                              <div className="flex flex-col gap-1 mt-1">
                                <div className="flex justify-between text-[8px] sm:text-[10px] text-text-secondary font-bold">
                                  <span>Deckkraft</span>
                                  <span>{Math.round(alpha * 100)}%</span>
                                </div>
                                <input 
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={Math.round(alpha * 100)}
                                  onChange={e => {
                                    const newAlpha = parseInt(e.target.value) / 100;
                                    const newVal = hexToRgba(hex, newAlpha);
                                    setDraftTheme({
                                      ...draftTheme,
                                      colors: { ...draftTheme.colors!, [key]: newVal }
                                    });
                                  }}
                                  className="w-full accent-accent h-1 bg-border-primary rounded-lg appearance-none cursor-pointer"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Live Preview Minimap */}
                    <div className="mt-4 p-4 sm:p-6 rounded-3xl border border-border-primary relative overflow-hidden" style={{ background: draftTheme.colors?.bg }}>
                      {/* Glowing Blobs for preview if glassmorphism is checked */}
                      {settings.isGlassEnabled && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30 z-0">
                          <div className="absolute top-[-25%] left-[-10%] w-[60%] h-[60%] bg-violet-600/40 rounded-full blur-[80px]" />
                          <div className="absolute bottom-[-25%] right-[-10%] w-[60%] h-[60%] bg-pink-500/30 rounded-full blur-[80px]" />
                        </div>
                      )}

                      <div className="relative z-10">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4" style={{ color: draftTheme.colors?.textDark }}>Live Vorschau</h4>
                        
                        <div className="grid grid-cols-2 gap-3">
                          {/* Left Minimap Card */}
                          <div 
                            className={cn(
                              "p-3 sm:p-5 rounded-2xl border transition-all duration-300",
                              settings.isGlassEnabled ? "backdrop-blur-xl" : ""
                            )}
                            style={{ 
                              backgroundColor: settings.isGlassEnabled ? draftTheme.colors?.glassBg : draftTheme.colors?.card, 
                              borderColor: settings.isGlassEnabled ? draftTheme.colors?.glassBorder : draftTheme.colors?.border 
                            }}
                          >
                            <div className="h-3 w-2/3 rounded mb-2" style={{ background: draftTheme.colors?.textDark }}></div>
                            <div className="h-2 w-full rounded mb-4" style={{ background: draftTheme.colors?.textGrey }}></div>
                            
                            <div className="flex gap-2">
                              <button 
                                className="flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider text-center"
                                style={{ backgroundColor: draftTheme.colors?.accent, color: draftTheme.colors?.bg }}
                                onClick={() => {}}
                              >
                                Aktiv
                              </button>
                              <button 
                                className="flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider text-center"
                                style={{ backgroundColor: draftTheme.colors?.inactiveBtnBg, color: draftTheme.colors?.inactiveBtnText }}
                                onClick={() => {}}
                              >
                                Inaktiv
                              </button>
                            </div>
                          </div>

                          {/* Right Minimap Card */}
                          <div 
                            className={cn(
                              "p-3 sm:p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between",
                              settings.isGlassEnabled ? "backdrop-blur-xl" : ""
                            )}
                            style={{ 
                              backgroundColor: settings.isGlassEnabled ? draftTheme.colors?.glassBg : draftTheme.colors?.card, 
                              borderColor: settings.isGlassEnabled ? draftTheme.colors?.glassBorder : draftTheme.colors?.border 
                            }}
                          >
                            <div className="flex justify-between items-center mb-6">
                              <span className="text-[9px] font-bold" style={{ color: draftTheme.colors?.textGrey }}>Shop Name</span>
                              <span style={{ color: draftTheme.colors?.heart }}>❤</span>
                            </div>
                            <div className="h-3.5 w-1/2 rounded" style={{ background: draftTheme.colors?.textDark }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

