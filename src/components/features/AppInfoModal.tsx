import React, { useEffect, useState } from 'react';
import { X, Info, Sparkles, Zap, ShieldCheck, History, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../store/useUIStore';
import { useAppStore } from '../../store/useAppStore';
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
    version: '0.5.7',
    date: '21. April 2026',
    changes: {
      improved: [
        'Solid Blue Interaction Standard für den Solid-Modus verfeinert',
        'Bundle-Editor Buttons (+, -, ×) jetzt mit blauem Rand und weißem Inhalt',
        'Status-Filter (Gekauft/Reduziert) nutzen jetzt konsistent das Blue-Interaction Design',
        'Optimierte Sichtbarkeit der Preis-Anzeige (dezentes Grau im Solid-Modus)',
        'Filter-Chips (Kategorien, Status, Sub-Cats) jetzt deutlich grau wenn nicht ausgewählt',
        'Trash-Icon Standard: Solid Blau + Weißes Icon standardmäßig im Solid-Modus',
        'Trash-Icon Farbumschlag zu Solid Rot (bg-heart) nur auf Hover'
      ]
    }
  },
  {
    version: '0.5.4',
    date: '21. April 2026',
    changes: {
      fixed: [
        'Fehlende "cn" Utility-Imports in Katalog-, Favoriten- und BudgetView behoben'
      ]
    }
  },
  {
    version: '0.5.3',
    date: '21. April 2026',
    changes: {
      fixed: [
        'Import-Fehler "Cannot find name cn" in BudgetView behoben'
      ]
    }
  },
  {
    version: '0.5.2',
    date: '21. April 2026',
    changes: {
      fixed: [
        'ReferenceError: settings is not defined in BundlesView behoben'
      ]
    }
  },
  {
    version: '0.5.1',
    date: '21. April 2026',
    changes: {
      added: [
        'Dual-Theme Interaktions-System implementiert',
        'Intelligente Style-Wiederherstellung für den Glass-Modus',
        'Dokumentation des dualen Design-Systems im Interaction-Skill'
      ],
      improved: [
        'Dynamische Budget-Visualisierung (Emerald/Blue Switch)',
        'Navigation-Pills passen sich jetzt nahtlos dem Glass-Setting an',
        'Katalog-Filter und Shop-Buttons unterstützen beide Design-Profile'
      ]
    }
  },
  {
    version: '0.5.0',
    date: '21. April 2026',
    changes: {
      added: [
        'Premium Blue Interaction Design System eingeführt',
        'Neuer Agent Skill für Interaction-Design & Button-Regeln',
        'SVG Bar Chart mit blauen Verläufen und Glow-Effekten'
      ],
      improved: [
        'Skill-Struktur reorganisiert (Frontend-Architecture)',
        'Ganze App auf konsistentes "Blue Pill" Feedback umgestellt',
        'Optimierte Hover-Zustände für Transaktionen und Charts'
      ]
    }
  },
  {
    version: '0.4.0',
    date: '21. April 2026',
    changes: {
      added: [
        'Vier Premium Modal-Modi: Solid Dark, Solid White, Glass Dark, Glass White',
        'Neue Design-Kontrollen im Theme-Manager für Modal-Style & Theme',
        'Agent Skill für Modal-Design-Standards hinterlegt'
      ],
      improved: [
        'Optimierte Typografie und Abstände in Modals',
        'Verbesserte Kontraste für helle Modal-Modi'
      ]
    }
  },
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
  const settings = useAppStore(state => state.settings);
  const isModalDark = settings.modalTheme === 'dark' || (settings.modalTheme === 'auto' && settings.theme === 'dark');
  const isModalGlass = settings.modalStyle === 'glass';
  
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
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6"
      onClick={toggleAppInfoModal}
    >
      <div className={cn(
        "absolute inset-0 bg-black/60 transition-opacity duration-300",
        settings.isGlassEnabled && "backdrop-blur-sm"
      )} />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={cn(
          "relative z-10 w-full max-w-2xl max-h-[85vh] rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl transition-all duration-500",
          isModalDark 
            ? (isModalGlass ? "bg-[#1a1a1a]/80 backdrop-blur-2xl border border-white/10 text-white" : "bg-[#2a2a2a] border border-border-primary/50 text-white")
            : (isModalGlass ? "bg-white/70 backdrop-blur-2xl border border-white/40 text-[#111827]" : "bg-white border border-black/5 text-[#111827]"),
          isModalDark ? "shadow-black/40" : "shadow-black/10"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={cn(
          "p-8 border-b flex items-center justify-between transition-colors",
          isModalDark ? "border-white/10 bg-white/[0.02]" : "border-black/5 bg-black/[0.01]"
        )}>
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all",
              isModalDark 
                ? "bg-blue-500/10 text-blue-400 border-blue-500/20" 
                : "bg-blue-500/5 text-blue-600 border-blue-500/10"
            )}>
              <Info size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">App Info & Version</h2>
              <p className={cn(
                "text-[10px] font-black tracking-[0.2em] uppercase opacity-40",
                isModalDark ? "text-white" : "text-black"
              )}>Ventory Ecosystem</p>
            </div>
          </div>
          <button 
            onClick={toggleAppInfoModal}
            className={cn(
              "w-10 h-10 flex items-center justify-center rounded-xl transition-all",
              isModalDark 
                ? "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white" 
                : "bg-black/5 hover:bg-black/10 text-black/40 hover:text-black"
            )}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-8 hidden-scrollbar space-y-10">
          
          {/* Current Version Card */}
          <div className={cn(
            "p-6 rounded-3xl border relative overflow-hidden group transition-all duration-500",
            isModalDark 
              ? "bg-gradient-to-br from-blue-500/10 to-violet-500/10 border-blue-500/20" 
              : "bg-gradient-to-br from-blue-500/5 to-violet-500/5 border-blue-500/10 shadow-sm"
          )}>
            <div className={cn(
              "absolute top-[-20%] right-[-10%] w-40 h-40 rounded-full blur-3xl pointer-events-none transition-colors",
              isModalDark ? "bg-blue-500/20 group-hover:bg-blue-500/30" : "bg-blue-500/10 group-hover:bg-blue-500/20"
            )} />
            
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-[0.3em] mb-1 block",
                  isModalDark ? "text-blue-400" : "text-blue-600"
                )}>Current Release</span>
                <h3 className="text-4xl font-black tracking-tighter">v{CHANGELOG[0].version}</h3>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold opacity-40 uppercase mb-1">Status</span>
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors",
                  isModalDark 
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                    : "bg-emerald-500/5 text-emerald-600 border-emerald-500/10"
                )}>Development Build</span>
              </div>
            </div>
          </div>

          {/* Changelog Sections */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <History size={18} className="opacity-40" />
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Update Historie</h4>
            </div>

            <div className="space-y-4">
              {CHANGELOG.map((log) => {
                const isExpanded = expandedVersions.includes(log.version);
                return (
                  <div 
                    key={log.version} 
                    className={cn(
                      "rounded-[2rem] border transition-all duration-500 overflow-hidden",
                      isExpanded 
                        ? (isModalDark ? "bg-white/[0.03] border-white/10 shadow-sm" : "bg-black/[0.02] border-black/5 shadow-sm") 
                        : (isModalDark ? "bg-transparent border-white/5 hover:border-white/20" : "bg-transparent border-black/5 hover:border-black/10")
                    )}
                  >
                    {/* Version Header (Clickable) */}
                    <button 
                      onClick={() => toggleVersion(log.version)}
                      className="w-full flex items-center justify-between p-6 text-left group"
                    >
                      <div className="flex items-center gap-4">
                        <span className={cn(
                          "text-xs font-black px-3 py-1 rounded-xl border transition-all",
                          isExpanded 
                            ? "bg-blue-500/10 text-blue-500 border-blue-500/20" 
                            : "bg-text-secondary/5 text-text-secondary border-border-primary/10 group-hover:border-border-primary/30"
                        )}>
                          v{log.version}
                        </span>
                        <span className="text-[10px] font-bold opacity-30 uppercase tracking-tight">{log.date}</span>
                      </div>
                      <div className="opacity-20 group-hover:opacity-100 transition-opacity">
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
                              <div className={cn(
                                "p-5 rounded-2xl border space-y-3 transition-colors",
                                isModalDark ? "bg-emerald-500/5 border-emerald-500/10" : "bg-emerald-500/[0.03] border-emerald-500/10"
                              )}>
                                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                                  <Zap size={14} /> Neu hinzugefügt
                                </div>
                                <ul className="space-y-2">
                                  {log.changes.added.map((item, i) => (
                                    <li key={i} className={cn(
                                      "text-[13px] flex gap-3 leading-relaxed font-medium",
                                      isModalDark ? "text-white/70" : "text-black/70"
                                    )}>
                                      <span className="text-emerald-500/40 mt-1.5 shrink-0 w-1 h-1 rounded-full bg-current" />
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {log.changes.improved && (
                              <div className={cn(
                                "p-5 rounded-2xl border space-y-3 transition-colors",
                                isModalDark ? "bg-blue-500/5 border-blue-500/10" : "bg-blue-500/[0.03] border-blue-500/10"
                              )}>
                                <div className="flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-widest">
                                  <Sparkles size={14} /> Verbesserungen
                                </div>
                                <ul className="space-y-2">
                                  {log.changes.improved.map((item, i) => (
                                    <li key={i} className={cn(
                                      "text-[13px] flex gap-3 leading-relaxed font-medium",
                                      isModalDark ? "text-white/70" : "text-black/70"
                                    )}>
                                      <span className="text-blue-500/40 mt-1.5 shrink-0 w-1 h-1 rounded-full bg-current" />
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {log.changes.fixed && (
                              <div className={cn(
                                "p-5 rounded-2xl border space-y-3 transition-colors",
                                isModalDark ? "bg-heart/5 border-heart/10" : "bg-heart/[0.03] border-heart/10"
                              )}>
                                <div className="flex items-center gap-2 text-[10px] font-black text-heart uppercase tracking-widest">
                                  <ShieldCheck size={14} /> Behoben
                                </div>
                                <ul className="space-y-2">
                                  {log.changes.fixed.map((item, i) => (
                                    <li key={i} className={cn(
                                      "text-[13px] flex gap-3 leading-relaxed font-medium",
                                      isModalDark ? "text-white/70" : "text-black/70"
                                    )}>
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
        <div className={cn(
          "p-6 border-t text-center transition-colors",
          isModalDark ? "bg-white/[0.01] border-white/5" : "bg-black/[0.01] border-black/5"
        )}>
          <p className="text-[10px] font-bold opacity-20 uppercase tracking-[0.3em]">
            Built with ❤️ by Vibe-Coding © 2026
          </p>
        </div>
      </motion.div>
    </div>
  );
};
