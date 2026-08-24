import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Scale, AlertTriangle, FileText, X, Check } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../utils/cn';
import { triggerHaptic } from '../../utils/haptics';
import { Button } from '../common/Button';

export const LegalDisclaimerModal: React.FC = () => {
  const { isLegalDisclaimerModalOpen, closeLegalDisclaimerModal } = useUIStore();
  const settings = useAppStore(state => state.settings);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isLegalDisclaimerModalOpen) {
        triggerHaptic(15);
        closeLegalDisclaimerModal();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isLegalDisclaimerModalOpen, closeLegalDisclaimerModal]);

  if (!isLegalDisclaimerModalOpen) return null;

  const handleClose = () => {
    triggerHaptic(15);
    closeLegalDisclaimerModal();
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        onClick={handleClose}
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
            "relative z-10 w-full max-w-2xl max-h-[90vh] rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 shadow-2xl overflow-hidden flex flex-col my-auto transition-all duration-300",
            settings.isGlassEnabled ? "glass-panel text-text-primary shadow-black/50" : "bg-bg-card border border-border-primary text-text-primary shadow-xl"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center bg-accent/15 text-accent border border-accent/25 shrink-0 shadow-inner">
                <Scale size={22} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-text-secondary block opacity-70">Rechtliche Hinweise & Bedingungen</span>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Datenschutz & Haftungsausschluss</h2>
              </div>
            </div>
            <button 
              onClick={handleClose}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer bg-text-primary/5 hover:bg-text-primary/10 text-text-secondary hover:text-text-primary shrink-0"
              title="Schließen"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 -mr-1 hidden-scrollbar text-xs sm:text-sm text-text-secondary leading-relaxed">
            
            {/* 1. Bereitstellung "Wie besehen" */}
            <div className="p-4 sm:p-5 rounded-2xl bg-text-primary/[0.03] border border-border-primary/40 space-y-1.5">
              <div className="flex items-center gap-2 text-text-primary font-bold text-sm">
                <FileText size={16} className="text-accent shrink-0" />
                <h3>1. Bereitstellung „Wie besehen“ (As-Is)</h3>
              </div>
              <p>
                Die Nutzung dieser Web-Anwendung erfolgt auf eigenes Risiko. Die Anwendung, sämtliche Funktionen und bereitgestellte Werkzeuge werden im aktuellen Entwicklungszustand („wie besehen“ bzw. „as is“) zur Verfügung gestellt, ohne jegliche ausdrückliche oder stillschweigende Gewährleistung.
              </p>
            </div>

            {/* 2. Haftungsausschluss */}
            <div className="p-4 sm:p-5 rounded-2xl bg-text-primary/[0.03] border border-border-primary/40 space-y-1.5">
              <div className="flex items-center gap-2 text-text-primary font-bold text-sm">
                <ShieldCheck size={16} className="text-accent shrink-0" />
                <h3>2. Haftungsausschluss & Verfügbarkeit</h3>
              </div>
              <p>
                Es wird keine Garantie oder Haftung für eine dauerhafte Datenspeicherung, ununterbrochene Server- und Systemverfügbarkeit oder absolute Datensicherheit übernommen. Datenverluste können nicht ausgeschlossen werden.
              </p>
            </div>

            {/* 3. KI- & Analyseinhalte */}
            <div className="p-4 sm:p-5 rounded-2xl bg-text-primary/[0.03] border border-border-primary/40 space-y-1.5">
              <div className="flex items-center gap-2 text-text-primary font-bold text-sm">
                <AlertTriangle size={16} className="text-amber-400 shrink-0" />
                <h3>3. Daten- & KI-Inhalte</h3>
              </div>
              <p>
                Automatisch generierte Auswertungen, Preisalarme, Budget-Prognosen und Vorschläge dienen ausschließlich der unverbindlichen Orientierung. Sie stellen zu keinem Zeitpunkt eine verbindliche Finanz-, Kauf- oder Rechtsberatung dar.
              </p>
            </div>

            {/* 4. Eigenverantwortung (Important Box) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-heart/10 border border-heart/25 text-text-primary">
              <div className="flex items-center gap-2 text-heart font-bold text-sm mb-2">
                <AlertTriangle size={16} className="shrink-0" />
                <h3 className="uppercase tracking-wider text-xs sm:text-sm">4. Eigenverantwortung</h3>
              </div>
              <p className="font-medium text-xs sm:text-sm text-text-primary leading-relaxed">
                „Das Betreten und Ausprobieren dieser App geschieht vollkommen auf eigene Gefahr und in reiner Selbstverantwortung – es gibt hier weder Sicherheiten noch Garantien.“
              </p>
            </div>

          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-border-primary/40 flex justify-end">
            <Button
              onClick={handleClose}
              variant="primary"
              className="w-full sm:w-auto py-2.5 px-6 text-xs sm:text-sm font-bold tracking-wider uppercase gap-2"
            >
              <Check size={16} />
              <span>Gelesen & Akzeptiert</span>
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
