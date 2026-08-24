import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle2, AlertCircle, X, ArrowRight } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../utils/cn';
import { triggerHaptic } from '../../utils/haptics';
import { Button } from '../common/Button';

export const GuestWelcomeModal: React.FC = () => {
  const { isGuestWelcomeModalOpen, closeGuestWelcomeModal } = useUIStore();
  const settings = useAppStore(state => state.settings);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isGuestWelcomeModalOpen) {
        triggerHaptic(15);
        closeGuestWelcomeModal();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isGuestWelcomeModalOpen, closeGuestWelcomeModal]);

  if (!isGuestWelcomeModalOpen) return null;

  const handleConfirm = () => {
    triggerHaptic(15);
    closeGuestWelcomeModal();
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        onClick={handleConfirm}
      >
        {/* Backdrop */}
        <div 
          className={cn(
            "fixed inset-0 bg-black/60 transition-opacity duration-300",
            settings.isGlassEnabled && "backdrop-blur-sm"
          )}
        />

        {/* Modal Window */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className={cn(
            "relative z-10 w-full max-w-xl max-h-[92vh] rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 shadow-2xl overflow-hidden flex flex-col my-auto transition-all duration-300",
            settings.isGlassEnabled ? "glass-panel text-text-primary shadow-black/50" : "bg-bg-card border border-border-primary text-text-primary shadow-xl"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-5 sm:mb-6">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center bg-accent/15 text-accent border border-accent/25 shrink-0 shadow-inner">
                <Sparkles size={22} className="animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-accent block">Interaktiver Demo-Zugang</span>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Willkommen als Gast</h2>
              </div>
            </div>
            <button 
              onClick={handleConfirm}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer bg-text-primary/5 hover:bg-text-primary/10 text-text-secondary hover:text-text-primary shrink-0"
              title="Schließen"
            >
              <X size={18} />
            </button>
          </div>

          {/* Intro Description */}
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-6">
            Du befindest dich im isolierten Gast-Modus. Du kannst alle Kernfunktionen sofort ausprobieren, ohne ein Konto anlegen zu müssen.
          </p>

          {/* Sections Overview (Scrollable container if needed on small screens) */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 -mr-1 hidden-scrollbar">
            
            {/* Vollständig testbar (Green box) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-text-primary">
              <div className="flex items-center gap-2 mb-2.5">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-400">Vollständig testbar</h3>
              </div>
              <ul className="text-xs sm:text-sm space-y-1.5 text-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>Gesamte Benutzeroberfläche & responsive Ansichten</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>Produkt- & Inventarverwaltung (Hinzufügen, Editieren, Löschen)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>Interaktives Monatsbudget, Ausgabenverlauf & Diagramme</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>Bundle-Zusammenstellungen, Preissenkungs-Filter & Themes</span>
                </li>
              </ul>
            </div>

            {/* Eingeschränkt (Orange box) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-text-primary">
              <div className="flex items-center gap-2 mb-2.5">
                <AlertCircle size={18} className="text-amber-400 shrink-0" />
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-400">Eingeschränkt im Gast-Modus</h3>
              </div>
              <ul className="text-xs sm:text-sm space-y-2 text-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <div>
                    <strong className="text-text-primary">Keine Cloud-Speicherung:</strong> Deine Änderungen laufen rein lokal in diesem Browser und werden nach dem Schließen des Tabs oder beim Abmelden nicht in der Cloud gesichert.
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Action Footer */}
          <div className="mt-6 pt-4 border-t border-border-primary/40 flex justify-end">
            <Button
              onClick={handleConfirm}
              variant="primary"
              className="w-full sm:w-auto py-3 px-6 text-xs sm:text-sm font-bold tracking-wider uppercase gap-2 shadow-lg shadow-accent/20"
            >
              <span>Verstanden & Ausprobieren</span>
              <ArrowRight size={16} />
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
