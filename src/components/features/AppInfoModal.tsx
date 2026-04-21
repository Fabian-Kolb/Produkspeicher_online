import React, { useEffect, useState } from 'react';
import { X, Info, Sparkles, Zap, ShieldCheck, History, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../store/useUIStore';
import { cn } from '../../utils/cn';

interface LogEntry {
  version: string;
  date: string;
  changes: {
    added?: string[];
    fixed?: string[];
    improved?: string[];
  };
}

const CHANGELOG: LogEntry[] = [
  {
    version: '0.3.5',
    date: '21. April 2026',
    changes: {
      added: [
        'Neues App-Info Fenster mit Versionierung & Changelog',
        'Agent Skill für automatisierte Update-Logs hinterlegt'
      ],
      improved: [
        'Design-System "Luminous Sanctuary" weiter verfeinert',
        'Responsive Animationen für Modals'
      ]
    }
  },
  {
    version: '0.2.8',
    date: '20. April 2026',
    changes: {
      added: [
        'Vollständiger Responsive Support (Mobile & Tablet)',
        'Bottom-Navigation für Mobilgeräte',
        'Swipe-Gesten zur Kategorie-Navigation'
      ],
      fixed: [
        'Zustand Store Persistenz-Fehler bei Neustart behoben'
      ]
    }
  },
  {
    version: '0.1.0',
    date: '15. April 2026',
    changes: {
      added: [
        'Initialer Release von Ventory (Alpha)',
        'Produkt-Katalog mit Filter & Sortierung',
        'Favoriten & Budget-Tracking',
        'Theme-Manager mit Custom Themes'
      ]
    }
  }
];

export const AppInfoModal: React.FC = () => {
  const { isAppInfoModalOpen, toggleAppInfoModal } = useUIStore();
  const [expandedVersions, setExpandedVersions] = useState<string[]>([CHANGELOG[0].version]);

  // Keyboard support: Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAppInfoModalOpen) toggleAppInfoModal();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isAppInfoModalOpen, toggleAppInfoModal]);

  if (!isAppInfoModalOpen) return null;

  const toggleVersion = (version: string) => {
    setExpandedVersions(prev => 
      prev.includes(version) 
        ? prev.filter(v => v !== version) 
        : [...prev, version]
    );
  };

  return (
    <div 
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={toggleAppInfoModal}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-2xl max-h-[85vh] glass-panel bg-bg-card border border-border-primary/50 rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-8 border-b border-border-primary/30 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
              <Info size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-text-primary tracking-tight">App Info & Version</h2>
              <p className="text-xs text-text-secondary font-medium tracking-widest uppercase opacity-60">Ventory Ecosystem</p>
            </div>
          </div>
          <button 
            onClick={toggleAppInfoModal}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-text-primary/5 hover:bg-text-primary/10 transition-all text-text-secondary hover:text-text-primary"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-8 hidden-scrollbar space-y-10">
          
          {/* Current Version Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-500/10 to-violet-500/10 border border-blue-500/20 relative overflow-hidden group">
            <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-blue-500/20 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/30 transition-colors" />
            
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 mb-1 block">Current Release</span>
                <h3 className="text-4xl font-black text-text-primary tracking-tighter">v{CHANGELOG[0].version}</h3>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-text-secondary opacity-60 uppercase mb-1">Status</span>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">Development Build</span>
              </div>
            </div>
          </div>

          {/* Changelog Sections */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <History size={18} className="text-text-secondary" />
              <h4 className="text-sm font-bold text-text-primary uppercase tracking-widest">Update Historie</h4>
            </div>

            <div className="space-y-4">
              {CHANGELOG.map((log) => {
                const isExpanded = expandedVersions.includes(log.version);
                return (
                  <div 
                    key={log.version} 
                    className={cn(
                      "rounded-[2rem] border transition-all duration-300 overflow-hidden",
                      isExpanded 
                        ? "bg-text-primary/[0.03] border-border-primary shadow-sm" 
                        : "bg-transparent border-border-primary/20 hover:border-border-primary/40"
                    )}
                  >
                    {/* Version Header (Clickable) */}
                    <button 
                      onClick={() => toggleVersion(log.version)}
                      className="w-full flex items-center justify-between p-6 text-left group"
                    >
                      <div className="flex items-center gap-4">
                        <span className={cn(
                          "text-sm font-black px-3 py-1 rounded-xl border transition-colors",
                          isExpanded 
                            ? "bg-blue-500/10 text-blue-500 border-blue-500/20" 
                            : "bg-text-secondary/5 text-text-secondary border-border-primary/10 group-hover:border-border-primary/30"
                        )}>
                          v{log.version}
                        </span>
                        <span className="text-[10px] font-bold text-text-secondary opacity-40 uppercase tracking-tight">{log.date}</span>
                      </div>
                      <div className="text-text-secondary opacity-40 group-hover:opacity-100 transition-opacity">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </button>

                    {/* Version Content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        >
                          <div className="px-6 pb-8 space-y-5">
                            {log.changes.added && (
                              <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 space-y-3">
                                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                                  <Zap size={14} /> Neu hinzugefügt
                                </div>
                                <ul className="space-y-2">
                                  {log.changes.added.map((item, i) => (
                                    <li key={i} className="text-[13px] text-text-primary/70 flex gap-3 leading-relaxed">
                                      <span className="text-emerald-500/40 mt-1.5 shrink-0 w-1 h-1 rounded-full bg-current" />
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {log.changes.improved && (
                              <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/10 space-y-3">
                                <div className="flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-widest">
                                  <Sparkles size={14} /> Verbesserungen
                                </div>
                                <ul className="space-y-2">
                                  {log.changes.improved.map((item, i) => (
                                    <li key={i} className="text-[13px] text-text-primary/70 flex gap-3 leading-relaxed">
                                      <span className="text-blue-500/40 mt-1.5 shrink-0 w-1 h-1 rounded-full bg-current" />
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {log.changes.fixed && (
                              <div className="p-5 rounded-2xl bg-heart/5 border border-heart/10 space-y-3">
                                <div className="flex items-center gap-2 text-[10px] font-black text-heart uppercase tracking-widest">
                                  <ShieldCheck size={14} /> Behoben
                                </div>
                                <ul className="space-y-2">
                                  {log.changes.fixed.map((item, i) => (
                                    <li key={i} className="text-[13px] text-text-primary/70 flex gap-3 leading-relaxed">
                                      <span className="text-heart/40 mt-1.5 shrink-0 w-1 h-1 rounded-full bg-current" />
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-white/[0.01] border-t border-border-primary/20 text-center">
          <p className="text-[10px] font-bold text-text-secondary opacity-40 uppercase tracking-[0.3em]">
            Built with ❤️ by Vibe-Coding © 2026
          </p>
        </div>
      </motion.div>
    </div>
  );
};
