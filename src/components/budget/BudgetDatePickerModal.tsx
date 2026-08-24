import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';
import { ChevronLeft, ChevronRight, X, Calendar, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';
import { Button } from '../common/Button';

const getMonday = (d: Date): Date => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

const getWeeksOfMonth = (year: number, month: number) => {
  const weeks: { start: Date; end: Date; label: string }[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const current = getMonday(firstDay);
  let weekIndex = 1;

  while (current <= lastDay) {
    const start = new Date(current);
    const end = new Date(current);
    end.setDate(end.getDate() + 6);

    const startStr = start.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
    const endStr = end.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });

    weeks.push({
      start,
      end,
      label: `Woche ${weekIndex}: ${startStr} - ${endStr}`,
    });

    current.setDate(current.getDate() + 7);
    weekIndex++;
  }

  return weeks;
};

interface BudgetDatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  timeRange: '7d' | 'month' | 'total' | 'custom';
  setTimeRange?: (range: '7d' | 'month' | 'total' | 'custom') => void;
  currentPeriodDate: Date;
  setCurrentPeriodDate: (d: Date) => void;
  pickerYear: number;
  setPickerYear: React.Dispatch<React.SetStateAction<number>>;
  selectedMonthForWeekPicker: { year: number; month: number } | null;
  setSelectedMonthForWeekPicker: React.Dispatch<React.SetStateAction<{ year: number; month: number } | null>>;
  rangePickerStart: Date | null;
  setRangePickerStart: React.Dispatch<React.SetStateAction<Date | null>>;
  totalStartDate: Date;
  setTotalStartDate: (d: Date) => void;
  totalEndDate: Date;
  setTotalEndDate: (d: Date) => void;
  customStartDate?: Date;
  setCustomStartDate?: (d: Date) => void;
  customEndDate?: Date;
  setCustomEndDate?: (d: Date) => void;
}

export const BudgetDatePickerModal: React.FC<BudgetDatePickerModalProps> = ({
  isOpen,
  onClose,
  timeRange,
  setTimeRange,
  currentPeriodDate,
  setCurrentPeriodDate,
  pickerYear,
  setPickerYear,
  selectedMonthForWeekPicker,
  setSelectedMonthForWeekPicker,
  rangePickerStart,
  setRangePickerStart,
  totalStartDate,
  setTotalStartDate,
  totalEndDate,
  setTotalEndDate,
  customStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  setCustomStartDate = () => {},
  customEndDate = new Date(),
  setCustomEndDate = () => {},
}) => {
  const [tempCustomStart, setTempCustomStart] = useState<string>(() => {
    return (customStartDate || new Date()).toISOString().split('T')[0];
  });
  const [tempCustomEnd, setTempCustomEnd] = useState<string>(() => {
    return (customEndDate || new Date()).toISOString().split('T')[0];
  });

  useEffect(() => {
    if (isOpen) {
      if (customStartDate) setTempCustomStart(customStartDate.toISOString().split('T')[0]);
      if (customEndDate) setTempCustomEnd(customEndDate.toISOString().split('T')[0]);
    }
  }, [isOpen, customStartDate, customEndDate]);

  const handleCloseDatePicker = () => {
    triggerHaptic(10);
    onClose();
    setSelectedMonthForWeekPicker(null);
    setRangePickerStart(null);
  };

  const handleApplyCustomRange = () => {
    triggerHaptic(15);
    const start = new Date(tempCustomStart);
    const end = new Date(tempCustomEnd);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      if (start > end) {
        setCustomStartDate(end);
        setCustomEndDate(start);
      } else {
        setCustomStartDate(start);
        setCustomEndDate(end);
      }
      if (setTimeRange) setTimeRange('custom');
    }
    handleCloseDatePicker();
  };

  const setCustomPreset = (daysBack: number) => {
    triggerHaptic(10);
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - daysBack);
    
    setTempCustomStart(start.toISOString().split('T')[0]);
    setTempCustomEnd(now.toISOString().split('T')[0]);
    setCustomStartDate(start);
    setCustomEndDate(now);
    if (setTimeRange) setTimeRange('custom');
    handleCloseDatePicker();
  };

  const renderDatePickerContent = () => {
    const today = new Date();

    // Mode: Custom Range
    if (timeRange === 'custom') {
      return (
        <div className="flex flex-col gap-4">
          <div className="text-xs text-text-secondary">
            Wähle ein beliebiges Start- und Enddatum für die Budget-Analyse:
          </div>

          {/* Quick Presets */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setCustomPreset(7)}
              className="py-1.5 px-2.5 rounded-xl bg-text-primary/5 hover:bg-text-primary/10 text-[11px] font-bold text-text-primary transition-colors border border-border-primary/20 cursor-pointer"
            >
              Letzte 7 Tage
            </button>
            <button
              type="button"
              onClick={() => setCustomPreset(30)}
              className="py-1.5 px-2.5 rounded-xl bg-text-primary/5 hover:bg-text-primary/10 text-[11px] font-bold text-text-primary transition-colors border border-border-primary/20 cursor-pointer"
            >
              Letzte 30 Tage
            </button>
            <button
              type="button"
              onClick={() => setCustomPreset(90)}
              className="py-1.5 px-2.5 rounded-xl bg-text-primary/5 hover:bg-text-primary/10 text-[11px] font-bold text-text-primary transition-colors border border-border-primary/20 cursor-pointer"
            >
              Letzte 90 Tage
            </button>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const startOfYear = new Date(now.getFullYear(), 0, 1);
                setTempCustomStart(startOfYear.toISOString().split('T')[0]);
                setTempCustomEnd(now.toISOString().split('T')[0]);
                setCustomStartDate(startOfYear);
                setCustomEndDate(now);
                if (setTimeRange) setTimeRange('custom');
                handleCloseDatePicker();
              }}
              className="py-1.5 px-2.5 rounded-xl bg-text-primary/5 hover:bg-text-primary/10 text-[11px] font-bold text-text-primary transition-colors border border-border-primary/20 cursor-pointer"
            >
              Dieses Jahr
            </button>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                setTempCustomStart(startOfMonth.toISOString().split('T')[0]);
                setTempCustomEnd(now.toISOString().split('T')[0]);
                setCustomStartDate(startOfMonth);
                setCustomEndDate(now);
                if (setTimeRange) setTimeRange('custom');
                handleCloseDatePicker();
              }}
              className="py-1.5 px-2.5 rounded-xl bg-text-primary/5 hover:bg-text-primary/10 text-[11px] font-bold text-text-primary transition-colors border border-border-primary/20 cursor-pointer col-span-2 sm:col-span-2"
            >
              Dieser Monat bis heute
            </button>
          </div>

          {/* Date Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border-primary/20">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-text-secondary tracking-wider">Startdatum</label>
              <input
                type="date"
                value={tempCustomStart}
                onChange={(e) => setTempCustomStart(e.target.value)}
                className="w-full bg-text-primary/5 border border-border-primary/30 focus:border-accent p-2 rounded-xl text-xs font-bold text-text-primary outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-text-secondary tracking-wider">Enddatum</label>
              <input
                type="date"
                value={tempCustomEnd}
                onChange={(e) => setTempCustomEnd(e.target.value)}
                className="w-full bg-text-primary/5 border border-border-primary/30 focus:border-accent p-2 rounded-xl text-xs font-bold text-text-primary outline-none"
              />
            </div>
          </div>

          <Button
            variant="primary"
            onClick={handleApplyCustomRange}
            className="w-full py-2.5 mt-2 font-bold text-xs gap-2"
          >
            <Check size={14} strokeWidth={3} />
            <span>Zeitraum übernehmen</span>
          </Button>
        </div>
      );
    }

    if (selectedMonthForWeekPicker) {
      const weeks = getWeeksOfMonth(selectedMonthForWeekPicker.year, selectedMonthForWeekPicker.month);

      return (
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center border-b border-border-primary/20 pb-2 mb-1">
            <button
              onClick={() => setSelectedMonthForWeekPicker(null)}
              className="flex items-center gap-1 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            >
              <ChevronLeft size={14} />
              <span>Zurück zu Monaten</span>
            </button>
            <span className="font-bold text-xs text-text-primary">
              {new Date(selectedMonthForWeekPicker.year, selectedMonthForWeekPicker.month).toLocaleDateString(
                'de-DE',
                { month: 'long', year: 'numeric' }
              )}
            </span>
          </div>

          <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
            {weeks.map((w, idx) => {
              const isFuture = w.start > today;
              const currentMonday = getMonday(currentPeriodDate);
              const isSelected = getMonday(w.start).getTime() === currentMonday.getTime();

              return (
                <button
                  key={idx}
                  disabled={isFuture}
                  onClick={() => {
                    setCurrentPeriodDate(getMonday(w.start));
                    handleCloseDatePicker();
                  }}
                  className={cn(
                    'py-2.5 px-3 rounded-xl text-left font-semibold text-xs transition-all cursor-pointer',
                    isFuture
                      ? 'opacity-25 cursor-not-allowed'
                      : isSelected
                      ? 'bg-accent text-bg-primary shadow-sm'
                      : 'hover:bg-text-primary/5 text-text-secondary hover:text-text-primary border border-transparent hover:border-border-primary/20'
                  )}
                >
                  {w.label}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    const months = [
      { short: 'Jan', num: 0 },
      { short: 'Feb', num: 1 },
      { short: 'Mär', num: 2 },
      { short: 'Apr', num: 3 },
      { short: 'Mai', num: 4 },
      { short: 'Jun', num: 5 },
      { short: 'Jul', num: 6 },
      { short: 'Aug', num: 7 },
      { short: 'Sep', num: 8 },
      { short: 'Okt', num: 9 },
      { short: 'Nov', num: 10 },
      { short: 'Dez', num: 11 },
    ];

    return (
      <div className="flex flex-col gap-4">
        {timeRange === 'total' && (
          <div className="text-[10px] font-bold text-accent uppercase tracking-wider mb-1 text-center bg-accent/10 py-1.5 px-2 rounded-lg border border-accent/20">
            {rangePickerStart
              ? `Start: ${rangePickerStart.toLocaleDateString('de-DE', { month: 'short', year: 'numeric' })} • Bitte End-Monat wählen.`
              : 'Bitte Start- und End-Monat wählen.'}
          </div>
        )}

        {/* Year Selector */}
        <div className="flex justify-between items-center border-b border-border-primary/20 pb-3">
          <button
            onClick={() => setPickerYear((p) => p - 1)}
            className="p-1.5 rounded-full hover:bg-text-primary/10 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            title="Vorheriges Jahr"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="font-bold text-sm text-text-primary">{pickerYear}</span>
          <button
            onClick={() => {
              if (pickerYear < today.getFullYear()) {
                setPickerYear((p) => p + 1);
              }
            }}
            disabled={pickerYear >= today.getFullYear()}
            className={cn(
              'p-1.5 rounded-full transition-all cursor-pointer',
              pickerYear >= today.getFullYear()
                ? 'opacity-35 cursor-not-allowed'
                : 'hover:bg-text-primary/10 text-text-secondary hover:text-text-primary'
            )}
            title="Nächstes Jahr"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Months Grid */}
        <div className="grid grid-cols-3 gap-2">
          {months.map((m) => {
            const isFuture = pickerYear > today.getFullYear() || (pickerYear === today.getFullYear() && m.num > today.getMonth());
            let isSelected = false;
            let isWithinRange = false;

            const checkDate = new Date(pickerYear, m.num, 1);

            if (timeRange === 'total') {
              const startLimit = new Date(totalStartDate.getFullYear(), totalStartDate.getMonth(), 1);
              const endLimit = new Date(totalEndDate.getFullYear(), totalEndDate.getMonth(), 1);

              if (rangePickerStart) {
                const startLimitActive = new Date(rangePickerStart.getFullYear(), rangePickerStart.getMonth(), 1);
                isSelected = checkDate.getTime() === startLimitActive.getTime();
              } else {
                const isStart = checkDate.getTime() === startLimit.getTime();
                const isEnd = checkDate.getTime() === endLimit.getTime();
                isSelected = isStart || isEnd;
                isWithinRange = checkDate > startLimit && checkDate < endLimit;
              }
            } else {
              isSelected = currentPeriodDate.getFullYear() === pickerYear && currentPeriodDate.getMonth() === m.num;
            }

            return (
              <button
                key={m.num}
                disabled={isFuture}
                onClick={() => {
                  if (timeRange === '7d') {
                    setSelectedMonthForWeekPicker({ year: pickerYear, month: m.num });
                  } else if (timeRange === 'total') {
                    const clickedDate = new Date(pickerYear, m.num, 1);
                    if (!rangePickerStart) {
                      setRangePickerStart(clickedDate);
                    } else {
                      const start = rangePickerStart < clickedDate ? rangePickerStart : clickedDate;
                      const end = rangePickerStart < clickedDate ? clickedDate : rangePickerStart;

                      setTotalStartDate(new Date(start.getFullYear(), start.getMonth(), 1));
                      setTotalEndDate(new Date(end.getFullYear(), end.getMonth() + 1, 0));
                      setCurrentPeriodDate(new Date(end.getFullYear(), end.getMonth() + 1, 0));
                      handleCloseDatePicker();
                    }
                  } else {
                    const anchor =
                      pickerYear === today.getFullYear() && m.num === today.getMonth()
                        ? today
                        : new Date(pickerYear, m.num + 1, 0);
                    setCurrentPeriodDate(anchor);
                    handleCloseDatePicker();
                  }
                }}
                className={cn(
                  'py-2.5 rounded-xl text-center font-semibold text-xs transition-all cursor-pointer',
                  isFuture
                    ? 'opacity-20 cursor-not-allowed'
                    : isSelected
                    ? 'bg-accent text-bg-primary shadow-sm'
                    : isWithinRange
                    ? 'bg-accent/20 text-text-primary'
                    : 'hover:bg-text-primary/5 text-text-secondary hover:text-text-primary'
                )}
              >
                {m.short}
              </button>
            );
          })}
        </div>

        {/* Quick jump */}
        <button
          onClick={() => {
            const now = new Date();
            if (timeRange === '7d') {
              setCurrentPeriodDate(getMonday(now));
            } else if (timeRange === 'total') {
              const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
              setTotalStartDate(start);
              setTotalEndDate(now);
              setCurrentPeriodDate(now);
            } else {
              setCurrentPeriodDate(now);
            }
            setPickerYear(now.getFullYear());
            handleCloseDatePicker();
          }}
          className="mt-2 py-2 w-full rounded-xl bg-text-primary/5 text-text-primary text-xs font-bold hover:bg-text-primary/10 transition-colors border border-border-primary/20 cursor-pointer"
        >
          {timeRange === '7d'
            ? 'Aktuelle Woche (Heute)'
            : timeRange === 'total'
            ? 'Letzte 6 Monate (Zurücksetzen)'
            : 'Aktueller Monat (Heute)'}
        </button>
      </div>
    );
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 select-none">
          {/* Backdrop */}
          <motion.div
            key="budget-date-picker-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleCloseDatePicker}
            className="fixed inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* Centered Modal Card */}
          <motion.div
            key="budget-date-picker-modal"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 26, stiffness: 350 }}
            className="relative z-10 w-full max-w-sm sm:max-w-md bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-3xl p-5 sm:p-6 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-text-primary max-h-[90vh] overflow-y-auto no-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border-primary/20 pb-3 mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-accent/15 flex items-center justify-center text-accent shadow-sm">
                  <Calendar size={16} strokeWidth={2.5} />
                </div>
                <h3 className="font-bold text-sm text-text-primary">
                  {timeRange === '7d'
                    ? 'Woche auswählen'
                    : timeRange === 'month'
                    ? 'Monat auswählen'
                    : timeRange === 'total'
                    ? 'Gesamtzeitraum wählen'
                    : 'Benutzerdefinierter Zeitraum'}
                </h3>
              </div>
              <button
                onClick={handleCloseDatePicker}
                className="p-1.5 rounded-full hover:bg-text-primary/10 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                title="Schließen"
              >
                <X size={16} />
              </button>
            </div>

            {/* Mode Switcher Tabs inside Modal */}
            <div className="flex items-center bg-text-primary/5 border border-border-primary/20 p-1 rounded-2xl mb-4 gap-1 shrink-0">
              {(['7d', 'month', 'total', 'custom'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    triggerHaptic(10);
                    if (setTimeRange) setTimeRange(mode);
                  }}
                  className={cn(
                    'flex-1 py-1.5 rounded-xl text-[11px] font-bold transition-all text-center cursor-pointer select-none',
                    timeRange === mode
                      ? 'bg-accent text-bg-primary shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  )}
                >
                  {mode === '7d' ? 'Woche' : mode === 'month' ? 'Monat' : mode === 'total' ? 'Gesamt' : 'Frei'}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1">{renderDatePickerContent()}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
