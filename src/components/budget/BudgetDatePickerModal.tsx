import React from 'react';
import { cn } from '../../utils/cn';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  timeRange: '7d' | 'month' | 'total';
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
}

export const BudgetDatePickerModal: React.FC<BudgetDatePickerModalProps> = ({
  isOpen,
  onClose,
  timeRange,
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
}) => {
  if (!isOpen) return null;

  const handleCloseDatePicker = () => {
    onClose();
    setSelectedMonthForWeekPicker(null);
    setRangePickerStart(null);
  };

  const renderDatePickerContent = () => {
    const today = new Date();

    if (selectedMonthForWeekPicker) {
      const weeks = getWeeksOfMonth(selectedMonthForWeekPicker.year, selectedMonthForWeekPicker.month);

      return (
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center border-b border-[var(--theme-glass-border)] pb-2 mb-1">
            <button
              onClick={() => setSelectedMonthForWeekPicker(null)}
              className="flex items-center gap-1 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            >
              <ChevronLeft size={14} />
              <span>Zurück</span>
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
                      : 'hover:bg-text-primary/5 text-text-secondary hover:text-text-primary border border-transparent hover:border-[var(--theme-glass-border)]'
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
        <div className="flex justify-between items-center border-b border-[var(--theme-glass-border)] pb-3">
          <button
            onClick={() => setPickerYear((p) => p - 1)}
            className="p-1 rounded-full hover:bg-text-primary/5 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
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
              'p-1 rounded-full transition-all cursor-pointer',
              pickerYear >= today.getFullYear()
                ? 'opacity-35 cursor-not-allowed'
                : 'hover:bg-text-primary/5 text-text-secondary hover:text-text-primary'
            )}
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
          className="mt-2 py-2 w-full rounded-xl bg-text-primary/5 text-text-primary text-xs font-bold hover:bg-text-primary/10 transition-colors border border-[var(--theme-glass-border)] cursor-pointer"
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

  return (
    <>
      {/* Desktop Date Selection Popover (Rendered inside relative parent container) */}
      <div className="hidden sm:block absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-2xl p-4 rounded-2xl shadow-xl w-[300px]">
        {renderDatePickerContent()}
      </div>
      <div className="hidden sm:block fixed inset-0 z-40 bg-transparent" onClick={handleCloseDatePicker} />

      {/* Mobile Date Picker Drawer */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          exit={{ opacity: 0 }}
          onClick={handleCloseDatePicker}
          className="sm:hidden fixed inset-0 z-50 bg-black"
        />
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-[var(--theme-glass-bg)] border-t border-[var(--theme-glass-border)] backdrop-blur-2xl rounded-t-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
        >
          <div className="w-12 h-1.5 bg-text-secondary/20 rounded-full mx-auto mb-6" />
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-bold text-base text-text-primary">Zeitraum auswählen</h4>
            <button
              onClick={handleCloseDatePicker}
              className="p-1.5 rounded-full bg-text-primary/5 text-text-secondary hover:text-text-primary cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <div>{renderDatePickerContent()}</div>
        </motion.div>
      </AnimatePresence>
    </>
  );
};
