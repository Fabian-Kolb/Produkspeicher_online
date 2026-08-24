import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ArrowRight, 
  ArrowLeft,
  Package, 
  Wallet, 
  Layers, 
  Smartphone,
  Info,
  Compass
} from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../utils/cn';
import { triggerHaptic } from '../../utils/haptics';
import { Button } from '../common/Button';
import logoDark from '../../assets/logo/logo_dark.png';
import logoWhite from '../../assets/logo/logo_white.png';

type ModalStep = 'tour' | 'info';

export const GuestWelcomeModal: React.FC = () => {
  const { isGuestWelcomeModalOpen, closeGuestWelcomeModal } = useUIStore();
  const settings = useAppStore(state => state.settings);
  const [step, setStep] = useState<ModalStep>('tour');

  // Reset to step 1 when opened
  useEffect(() => {
    if (isGuestWelcomeModalOpen) {
      setStep('tour');
    }
  }, [isGuestWelcomeModalOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isGuestWelcomeModalOpen) return;
      if (e.key === 'Escape') {
        triggerHaptic(15);
        closeGuestWelcomeModal();
      } else if (e.key === 'ArrowRight' && step === 'tour') {
        triggerHaptic(15);
        setStep('info');
      } else if (e.key === 'ArrowLeft' && step === 'info') {
        triggerHaptic(15);
        setStep('tour');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGuestWelcomeModalOpen, closeGuestWelcomeModal, step]);

  if (!isGuestWelcomeModalOpen) return null;

  const handleConfirm = () => {
    triggerHaptic(15);
    closeGuestWelcomeModal();
  };

  const handleNextStep = () => {
    triggerHaptic(15);
    setStep('info');
  };

  const handlePrevStep = () => {
    triggerHaptic(15);
    setStep('tour');
  };

  return (
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
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ type: "spring", stiffness: 450, damping: 32 }}
        className={cn(
          "relative z-10 w-full max-w-2xl max-h-[92vh] rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-7 shadow-2xl overflow-hidden flex flex-col my-auto transition-colors duration-300",
          settings.isGlassEnabled ? "glass-panel text-text-primary shadow-black/50" : "bg-bg-card border border-border-primary text-text-primary shadow-xl"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar: Step Navigation Tabs & Close Button */}
        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-border-primary/40">
          {/* Step Tabs */}
          <div className="flex items-center gap-1 sm:gap-2 p-1 rounded-full bg-text-primary/[0.06] border border-text-primary/10">
            <button
              type="button"
              onClick={() => {
                triggerHaptic(15);
                setStep('tour');
              }}
              className={cn(
                "px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5",
                step === 'tour'
                  ? "bg-accent text-bg-primary shadow-md shadow-accent/20"
                  : "text-text-secondary hover:text-text-primary hover:bg-text-primary/5"
              )}
            >
              <Compass size={13} />
              <span>1. Was kann die App?</span>
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic(15);
                setStep('info');
              }}
              className={cn(
                "px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5",
                step === 'info'
                  ? "bg-accent text-bg-primary shadow-md shadow-accent/20"
                  : "text-text-secondary hover:text-text-primary hover:bg-text-primary/5"
              )}
            >
              <Info size={13} />
              <span>2. Gast-Hinweise</span>
            </button>
          </div>

          <button 
            onClick={handleConfirm}
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer bg-text-primary/5 hover:bg-text-primary/10 text-text-secondary hover:text-text-primary shrink-0"
            title="Schließen"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Header with App Logo Asset */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center bg-text-primary/[0.06] border border-border-primary/50 shrink-0 p-2 shadow-inner">
            <img 
              src={settings.theme === 'dark' ? logoWhite : logoDark} 
              alt="Ventory Logo" 
              className="w-full h-full object-contain drop-shadow-sm" 
            />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-accent block">
              {step === 'tour' ? 'Schritt 1 von 2 • Schnelleinweisung' : 'Schritt 2 von 2 • Gast-Modus & Hinweisfenster'}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              {step === 'tour' ? 'Willkommen bei Ventory' : 'Willkommen als Gast'}
            </h2>
          </div>
        </div>

        {/* Step Content Container - fixed without vertical jump stacking */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 -mr-1 hidden-scrollbar min-h-[300px]">
          {step === 'tour' ? (
            /* STEP 1: Feature Einweisung */
            <motion.div
              key="step-tour"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                Ventory ist deine intelligente Schaltzentrale für Technik, Inventar und Monatsbudgets. Hier ist ein kurzer Überblick über die 4 Kernfunktionen:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Feature 1: Inventar */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-text-primary/[0.03] border border-border-primary/50 flex flex-col gap-2 hover:border-accent/30 transition-colors">
                  <div className="flex items-center gap-2 text-accent font-bold text-xs sm:text-sm">
                    <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center">
                      <Package size={15} />
                    </div>
                    <span>Inventar & Katalog</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-text-secondary leading-relaxed">
                    Verwalte all deine Geräte mit Bildern, Wunschpreisen, Rabattstufen und interaktiven Bewertungen von 0 bis 10.
                  </p>
                </div>

                {/* Feature 2: Budget */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-text-primary/[0.03] border border-border-primary/50 flex flex-col gap-2 hover:border-emerald-500/30 transition-colors">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs sm:text-sm">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                      <Wallet size={15} />
                    </div>
                    <span>Budget & Ausgaben</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-text-secondary leading-relaxed">
                    Definiere Monatslimits, verfolge tägliche Ausgaben im interaktiven Diagramm mit Burn-Rate-Forecast & Tagesbelegen.
                  </p>
                </div>

                {/* Feature 3: Bundles */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-text-primary/[0.03] border border-border-primary/50 flex flex-col gap-2 hover:border-indigo-500/30 transition-colors">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs sm:text-sm">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/15 flex items-center justify-center">
                      <Layers size={15} />
                    </div>
                    <span>Bundles & Deals</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-text-secondary leading-relaxed">
                    Stelle Ausstattungen und Setups in Bundles zusammen und entdecke Top-Deals sowie reduzierte Produkte in Echtzeit.
                  </p>
                </div>

                {/* Feature 4: Mobile & Gesten */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-text-primary/[0.03] border border-border-primary/50 flex flex-col gap-2 hover:border-purple-500/30 transition-colors">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-xs sm:text-sm">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center">
                      <Smartphone size={15} />
                    </div>
                    <span>Handy & Wischgesten</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-text-secondary leading-relaxed">
                    100% am Smartphone nutzbar: Horizontale Wisch-Navigation (Swipe), taktile Vibrationen und individuelle Farbschemata.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            /* STEP 2: Gast-Modus & Hinweisfenster */
            <motion.div
              key="step-info"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="space-y-3.5"
            >
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                Du befindest dich im isolierten Gast-Modus. Du kannst alle Kernfunktionen sofort ausprobieren, ohne ein Konto anlegen zu müssen.
              </p>

              {/* Vollständig testbar (Green box) */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-text-primary">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
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
              <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-text-primary">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle size={16} className="text-amber-400 shrink-0" />
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-400">Eingeschränkt im Gast-Modus</h3>
                </div>
                <ul className="text-xs sm:text-sm space-y-1.5 text-text-secondary">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <div>
                      <strong className="text-text-primary">Keine Cloud-Speicherung:</strong> Deine Änderungen laufen rein lokal in diesem Browser und werden nach dem Schließen des Tabs oder beim Abmelden nicht in der Cloud gesichert.
                    </div>
                  </li>
                </ul>
              </div>

              {/* Wegweiser zum Hinweisfenster (Blue Box) */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-accent/10 border border-accent/20 text-text-primary">
                <div className="flex items-center gap-2 mb-1.5">
                  <Info size={16} className="text-accent shrink-0" />
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-accent">Hinweisfenster jederzeit aufrufbar</h3>
                </div>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                  💡 Du kannst diese Einweisung, deine Gast-Infos und die App-Versionierung jederzeit über das <strong className="text-text-primary">Profil-Icon</strong> oben rechts oder im Hauptmenü unter <strong className="text-text-primary">„Gast-Modus (Info)“</strong> erneut öffnen.
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Action Footer */}
        <div className="mt-5 pt-3.5 border-t border-border-primary/40 flex items-center justify-between gap-3">
          {step === 'tour' ? (
            <div className="w-full flex justify-end">
              <Button
                onClick={handleNextStep}
                variant="primary"
                className="w-full sm:w-auto py-2.5 px-6 text-xs sm:text-sm font-bold tracking-wider uppercase gap-2 shadow-lg shadow-accent/20"
              >
                <span>Weiter zu den Gast-Hinweisen</span>
                <ArrowRight size={16} />
              </Button>
            </div>
          ) : (
            <>
              <Button
                onClick={handlePrevStep}
                variant="secondary"
                className="py-2.5 px-4 text-xs font-bold tracking-wider uppercase gap-1.5"
              >
                <ArrowLeft size={15} />
                <span>Zurück</span>
              </Button>
              <Button
                onClick={handleConfirm}
                variant="primary"
                className="py-2.5 px-6 text-xs sm:text-sm font-bold tracking-wider uppercase gap-2 shadow-lg shadow-accent/20"
              >
                <span>Verstanden & Ausprobieren</span>
                <ArrowRight size={16} />
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};
