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
    version: '0.7.0',
    date: '22. Mai 2026',
    changes: {
      added: [
        'Semantisches Design-Token-System mit 12 zentralen CSS-Variablen eingeführt',
        'Komplett überarbeiteter Theme-Creator mit RGBA-Farbreglern und Live-Vorschau',
        'Globale Vereinheitlichung des Glassmorphismus-Designs (Modals, Sidebar, Navigation)'
      ],
      improved: [
        'Design-Einstellungen vereinfacht durch Vereinheitlichung von Theme und Glassmorphismus'
      ]
    }
  },
  {
    version: '0.6.1',
    date: '22. Mai 2026',
    changes: {
      fixed: [
        'Übergangsanimation bei mobilen Wischgesten auf Release-Ebene flüssig animiert (Reflow-getriggert)'
      ]
    }
  },
  {
    version: '0.6.0',
    date: '22. Mai 2026',
    changes: {
      added: [
        'Echtzeit-Gestensteuerung (Wisch-Navigation) für Mobilgeräte integriert'
      ],
      improved: [
        'Seitenübergänge mit performanten CSS-Transforms und Ease-Out-Expo-Kurven',
        'Einzeln scrollbare Ansichten zur Isolation der Scroll-Positionen zwischen Tabs',
        'Rubber-Band-Effekt bei den äußeren Seitenrändern (Dashboard & Deals)'
      ],
      fixed: [
        'Vermeidung von Wisch-Konflikten bei Eingabefeldern und horizontal scrollbaren Listen'
      ]
    }
  },
  {
    version: '0.5.9',
    date: '21. April 2026',
    changes: {
      fixed: [
        'Produktions-Build (npm run build) wiederhergestellt',
        'Unbenutzte Imports (AnimatePresence, Play) entfernt',
        'Unbenutzte Variable "settings" in KatalogView entfernt'
      ]
    }
  },
  {
    version: '0.5.8',
    date: '21. April 2026',
    changes: {
      fixed: [
        'TypeScript-Fehler "unused variable settings" in FavoritenView behoben'
      ]
    }
  },
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
        className="relative z-10 w-full max-w-2xl max-h-[85vh] rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl transition-all duration-500 glass-panel text-text-primary"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-8 border-b flex items-center justify-between transition-colors border-border-primary/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center border border-accent/20 bg-accent/10 text-accent transition-all">
              <Info size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">App Info & Version</h2>
              <p className="text-[10px] font-black tracking-[0.2em] uppercase opacity-45 text-text-secondary">Ventory Ecosystem</p>
            </div>
          </div>
          <button 
            onClick={toggleAppInfoModal}
            className="w-10 h-10 flex items-center justify-center rounded-xl transition-all bg-black/5 dark:bg-white/5 text-text-secondary hover:text-text-primary"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-8 hidden-scrollbar space-y-10">
          
          {/* Current Version Card */}
          <div className="p-6 rounded-3xl border relative overflow-hidden group transition-all duration-500 bg-accent/10 border-accent/20 shadow-sm">
            <div className="absolute top-[-20%] right-[-10%] w-40 h-40 rounded-full blur-3xl pointer-events-none transition-colors bg-accent/20 group-hover:bg-accent/30" />
            
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] mb-1 block text-accent">Current Release</span>
                <h3 className="text-4xl font-black tracking-tighter">v{CHANGELOG[0].version}</h3>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold opacity-40 uppercase mb-1">Status</span>
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Development Build</span>
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
                        ? "bg-black/5 dark:bg-white/5 border-border-primary/50 shadow-sm" 
                        : "bg-transparent border-border-primary/20 hover:border-border-primary/45"
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
                            ? "bg-accent/10 text-accent border-accent/20" 
                            : "bg-inactive-btn-bg text-inactive-btn-text border-border-primary/10 group-hover:border-border-primary/30"
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
                              <div className="p-5 rounded-2xl border space-y-3 transition-colors bg-emerald-500/5 border-emerald-500/10">
                                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                                  <Zap size={14} /> Neu hinzugefügt
                                </div>
                                <ul className="space-y-2">
                                  {log.changes.added.map((item, i) => (
                                    <li key={i} className="text-[13px] flex gap-3 leading-relaxed font-medium text-text-primary">
                                      <span className="text-emerald-500/40 mt-1.5 shrink-0 w-1 h-1 rounded-full bg-current" />
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {log.changes.improved && (
                              <div className="p-5 rounded-2xl border space-y-3 transition-colors bg-accent/5 border-accent/10">
                                <div className="flex items-center gap-2 text-[10px] font-black text-accent uppercase tracking-widest">
                                  <Sparkles size={14} /> Verbesserungen
                                </div>
                                <ul className="space-y-2">
                                  {log.changes.improved.map((item, i) => (
                                    <li key={i} className="text-[13px] flex gap-3 leading-relaxed font-medium text-text-primary">
                                      <span className="text-accent/40 mt-1.5 shrink-0 w-1 h-1 rounded-full bg-current" />
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {log.changes.fixed && (
                              <div className="p-5 rounded-2xl border space-y-3 transition-colors bg-heart/5 border-heart/10">
                                <div className="flex items-center gap-2 text-[10px] font-black text-heart uppercase tracking-widest">
                                  <ShieldCheck size={14} /> Behoben
                                </div>
                                <ul className="space-y-2">
                                  {log.changes.fixed.map((item, i) => (
                                    <li key={i} className="text-[13px] flex gap-3 leading-relaxed font-medium text-text-primary">
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
        <div className="p-6 border-t text-center transition-colors border-border-primary/30 bg-black/5 dark:bg-white/5">
          <p className="text-[10px] font-bold opacity-20 uppercase tracking-[0.3em]">
            Built with ❤️ by Vibe-Coding © 2026
          </p>
        </div>
      </motion.div>
    </div>
  );
};
