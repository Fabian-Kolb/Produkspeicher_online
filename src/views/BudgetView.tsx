import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useUIStore } from '../store/useUIStore';
import type { Product } from '../types';
import { cn } from '../utils/cn';
import { BarChart3, TrendingUp, ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';
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
      label: `Woche ${weekIndex}: ${startStr} - ${endStr}`
    });
    
    current.setDate(current.getDate() + 7);
    weekIndex++;
  }
  
  return weeks;
};

export const BudgetView: React.FC = () => {
  const { products, settings, updateSettings } = useAppStore();
  const { setView, setStatusFilter, setSearchQuery } = useUIStore();
  const [timeRange, setTimeRange] = useState<'7d' | 'month' | 'total'>('month');
  const [chartMode, setChartMode] = useState<'daily' | 'cumulative'>('cumulative');
  const [sortBy, setSortBy] = useState<'date' | 'price'>('date');
  const [hoveredDay, setHoveredDay] = useState<{ label: string; dateLabel: string; dateKey: string; dailyValue: number; cumulativeValue: number | null; isFuture: boolean; products: Product[] } | null>(null);

  // Date range explorer states
  const [currentPeriodDate, setCurrentPeriodDate] = useState<Date>(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState<number>(new Date().getFullYear());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Week and custom range picker states
  const [totalStartDate, setTotalStartDate] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() - 5, 1);
  });
  const [totalEndDate, setTotalEndDate] = useState<Date>(() => new Date());
  const [selectedMonthForWeekPicker, setSelectedMonthForWeekPicker] = useState<{ year: number; month: number } | null>(null);
  const [rangePickerStart, setRangePickerStart] = useState<Date | null>(null);

  const handleCloseDatePicker = () => {
    setIsDatePickerOpen(false);
    setSelectedMonthForWeekPicker(null);
    setRangePickerStart(null);
  };

  // Auto-scroll mobile month view to the right
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, [timeRange, currentPeriodDate, chartMode]);
  
  const [selectedDay, setSelectedDay] = useState<{ label: string; dateLabel: string; dateKey: string; dailyValue: number; cumulativeValue: number | null; isFuture: boolean; products: Product[] } | null>(null);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState(String(settings.monthlyBudget));
  const [budgetEditMode, setBudgetEditMode] = useState<'day' | 'week' | 'month'>('month');

  const handleEditModeChange = (mode: 'day' | 'week' | 'month') => {
    setBudgetEditMode(mode);
    if (mode === 'month') {
      setTempBudget(String(settings.monthlyBudget));
    } else if (mode === 'week') {
      setTempBudget(String(Math.round(settings.monthlyBudget / 30 * 7)));
    } else {
      setTempBudget(String(Math.round(settings.monthlyBudget / 30)));
    }
  };

  const handleBudgetSubmit = () => {
    const val = Number(tempBudget);
    if (!isNaN(val) && val >= 0) {
      let finalMonthlyBudget = val;
      if (budgetEditMode === 'day') {
        finalMonthlyBudget = val * 30;
      } else if (budgetEditMode === 'week') {
        finalMonthlyBudget = (val / 7) * 30;
      }
      updateSettings({ monthlyBudget: Math.round(finalMonthlyBudget) });
    } else {
      setTempBudget(String(settings.monthlyBudget));
    }
    setIsEditingBudget(false);
  };

  // Reset selected day on view/period changes
  useEffect(() => {
    setSelectedDay(null);
  }, [timeRange, currentPeriodDate]);

  const boughtProducts = useMemo(() => products.filter((p: Product) => p.status === 'bought'), [products]);
  
  // Filter bought products that fall within the active period
  const activePeriodProducts = useMemo(() => {
    return boughtProducts.filter((p: Product) => {
      const pDate = new Date(p.dateBought || p.dateAdded);
      
      if (timeRange === '7d') {
        const startDate = getMonday(currentPeriodDate);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        
        const checkDate = new Date(pDate);
        return checkDate >= startDate && checkDate <= endDate;
      }
      
      if (timeRange === 'month') {
        return pDate.getMonth() === currentPeriodDate.getMonth() && pDate.getFullYear() === currentPeriodDate.getFullYear();
      }
      
      // For 'total' (custom span from totalStartDate to totalEndDate)
      const startDate = new Date(totalStartDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(totalEndDate);
      endDate.setHours(23, 59, 59, 999);
      
      const checkDate = new Date(pDate);
      return checkDate >= startDate && checkDate <= endDate;
    });
  }, [boughtProducts, timeRange, currentPeriodDate, totalStartDate, totalEndDate]);

  const spentThisMonth = useMemo(() => {
    const targetMonth = currentPeriodDate.getMonth();
    const targetYear = currentPeriodDate.getFullYear();
    return boughtProducts
      .filter((p: Product) => {
        const date = p.dateBought || p.dateAdded;
        const d = new Date(date);
        return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
      })
      .reduce((sum: number, p: Product) => sum + (p.finalPrice || 0), 0);
  }, [boughtProducts, currentPeriodDate]);

  // Helper to format Date in local YYYY-MM-DD
  const getLocalDateKey = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to calculate target value for any date key safely
  const getTargetVal = (dateKey: string) => {
    if (dateKey.endsWith('-00')) return 0;
    const parts = dateKey.split('-');
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);
    const dim = new Date(year, month, 0).getDate(); // Get last day of month
    return (settings.monthlyBudget / dim) * day;
  };

  // Helper to calculate target value for Soll-Pace line based on index
  const getSollPaceVal = (i: number) => {
    if (timeRange === '7d') {
      return (settings.monthlyBudget / 30) * (i + 1);
    }
    const item = chartData[i];
    if (!item) return 0;
    const dateKey = item.dateKey;
    const parts = dateKey.split('-');
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);
    const dim = new Date(year, month, 0).getDate(); // Get last day of month
    return (settings.monthlyBudget / dim) * day;
  };

  // Chart data calculation based on timeRange and selected anchor date
  const chartData = useMemo(() => {
    const today = currentPeriodDate;
    const dateMap: Record<string, { label: string, dateLabel: string, value: number, products: Product[] }> = {};
    
    if (timeRange === '7d') {
      const monday = getMonday(currentPeriodDate);
      const weekdays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(d.getDate() + i);
        const dateKey = getLocalDateKey(d);
        const label = weekdays[i];
        dateMap[dateKey] = { label, dateLabel: d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }), value: 0, products: [] };
      }
    } else if (timeRange === 'month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0); // End of month
      for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
        const dateKey = getLocalDateKey(d);
        const label = d.toLocaleDateString('de-DE', { day: '2-digit' });
        dateMap[dateKey] = { label, dateLabel: d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }), value: 0, products: [] };
      }
    } else if (timeRange === 'total') {
      // Show custom span of months - no Month 0 prepended for bar chart spikes
      let current = new Date(totalStartDate.getFullYear(), totalStartDate.getMonth(), 1);
      const endLimit = new Date(totalEndDate.getFullYear(), totalEndDate.getMonth(), 1);
      
      while (current <= endLimit) {
        const dateKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
        const label = current.toLocaleDateString('de-DE', { month: 'short' });
        dateMap[dateKey] = { label, dateLabel: current.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }), value: 0, products: [] };
        
        current.setMonth(current.getMonth() + 1);
      }
    }

    boughtProducts.forEach(p => {
      const pDate = new Date(p.dateBought || p.dateAdded);
      let pKey = '';
      
      if (timeRange === 'total') {
        pKey = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, '0')}`;
      } else {
        pKey = getLocalDateKey(pDate);
      }

      if (dateMap[pKey]) {
        dateMap[pKey].value += (p.finalPrice || 0);
        dateMap[pKey].products.push(p);
      }
    });

    const realToday = new Date();
    const todayStr = getLocalDateKey(realToday);
    const sortedKeys = Object.keys(dateMap).sort((a, b) => a.localeCompare(b));
    let runningSum = 0;
    return sortedKeys.map(key => {
      const item = dateMap[key];
      const isFuture = (timeRange === 'month' || timeRange === '7d') && key > todayStr;
      
      if (!isFuture) {
        runningSum += item.value;
      }
      
      return {
        dateKey: key,
        label: item.label,
        dateLabel: item.dateLabel || '',
        dailyValue: item.value,
        cumulativeValue: isFuture ? null : runningSum,
        isFuture,
        products: item.products
      };
    });
  }, [boughtProducts, timeRange, chartMode, currentPeriodDate, totalStartDate, totalEndDate]);

  // Coordinate Constants for Unified Mapping
  const PAD_TOP = 40;
  const PAD_BOTTOM = 220;
  const MARGIN_LEFT = 50; // New gutter for Y-axis labels
  const DRAW_HEIGHT = PAD_BOTTOM - PAD_TOP;
  const DRAW_WIDTH = 600 - MARGIN_LEFT;

  const chartVal = (d: any) => (chartMode === 'cumulative' && timeRange !== 'total') ? d.cumulativeValue : d.dailyValue;

  const actualData = useMemo(() => chartData.filter(d => !d.isFuture), [chartData]);
  
  const latestCumulativeSpend = useMemo(() => {
    if (actualData.length === 0) return 0;
    return actualData[actualData.length - 1].cumulativeValue || 0;
  }, [actualData]);

  // Projected spending at the end of the month
  const projectedEndSpend = useMemo(() => {
    const activeDaysCount = actualData.length;
    if (activeDaysCount === 0) return 0;
    const dailyAverage = latestCumulativeSpend / activeDaysCount;
    const totalDaysCount = chartData.length;
    return dailyAverage * totalDaysCount;
  }, [actualData, chartData, latestCumulativeSpend]);

  // Projected spending at the end of the week
  const projectedEndWeekSpend = useMemo(() => {
    if (timeRange !== '7d') return 0;
    const activeDays = actualData.filter(d => d.label !== '');
    const activeDaysCount = activeDays.length;
    if (activeDaysCount === 0) return 0;
    const dailyAverage = latestCumulativeSpend / activeDaysCount;
    return dailyAverage * 7;
  }, [actualData, timeRange, latestCumulativeSpend]);

  const roundedMax = useMemo(() => {
    let limit = 10;
    if (timeRange === 'total') {
      limit = settings.monthlyBudget;
    } else if (chartMode === 'cumulative') {
      if (chartData.length > 0) {
        if (timeRange === '7d') {
          limit = Math.max(
            (settings.monthlyBudget / 30) * 7,
            projectedEndWeekSpend
          );
        } else {
          limit = Math.max(
            getTargetVal(chartData[chartData.length - 1].dateKey),
            projectedEndSpend
          );
        }
      }
    } else {
      limit = settings.monthlyBudget / 30;
    }

    const rawMax = Math.max(...chartData.map(d => chartVal(d) || 0), limit, 10);
    if (rawMax <= 100) return Math.ceil(rawMax / 10) * 10;
    if (rawMax <= 300) return 300;
    if (rawMax <= 500) return 500;
    if (rawMax <= 1000) return 1000;
    return Math.ceil(rawMax / 250) * 250;
  }, [chartData, chartMode, timeRange, settings.monthlyBudget, projectedEndSpend, projectedEndWeekSpend]);

  const getY = (val: number) => PAD_BOTTOM - (val / roundedMax) * DRAW_HEIGHT;
  const BAR_PITCH = DRAW_WIDTH / (chartData.length || 1);
  const getX = (i: number) => {
    const isBar = chartMode === 'daily' || timeRange === 'total';
    if (isBar) {
      const slotWidth = DRAW_WIDTH / Math.max(chartData.length, 1);
      return MARGIN_LEFT + slotWidth * i + slotWidth / 2;
    } else {
      return MARGIN_LEFT + (i / Math.max(chartData.length - 1, 1)) * DRAW_WIDTH;
    }
  };

  const barWidth = useMemo(() => {
    const pitch = DRAW_WIDTH / Math.max(chartData.length, 1);
    if (timeRange === '7d') return 48;
    if (timeRange === 'month') return Math.max(pitch * 0.6, 6);
    return Math.max(pitch * 0.6, 12);
  }, [chartData.length, timeRange, DRAW_WIDTH]);

  const timeRangeLabel = timeRange === '7d' ? 'Woche' : timeRange === 'month' ? 'Dieser Monat' : 'Gesamt';
  const timeRangeSpend = chartData.reduce((sum, d) => sum + d.dailyValue, 0);
  const timeRangeProductsCount = chartData.reduce((sum, d) => sum + d.products.length, 0);
  const averagePrice = timeRangeProductsCount > 0 ? timeRangeSpend / timeRangeProductsCount : 0;

  const isCurrentMonth = useMemo(() => {
    const today = new Date();
    return currentPeriodDate.getFullYear() === today.getFullYear() && currentPeriodDate.getMonth() === today.getMonth();
  }, [currentPeriodDate]);

  const isCurrentWeek = useMemo(() => {
    const today = new Date();
    return getMonday(currentPeriodDate).getTime() === getMonday(today).getTime();
  }, [currentPeriodDate]);

  const formattedActivePeriod = useMemo(() => {
    if (timeRange === '7d') {
      const monday = getMonday(currentPeriodDate);
      const sunday = new Date(monday);
      sunday.setDate(sunday.getDate() + 6);
      const startStr = monday.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
      const endStr = sunday.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
      return `${startStr} - ${endStr}`;
    }
    if (timeRange === 'month') {
      return currentPeriodDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
    }
    // For 'total' (custom span)
    const startStr = totalStartDate.toLocaleDateString('de-DE', { month: 'short', year: 'numeric' });
    const endStr = totalEndDate.toLocaleDateString('de-DE', { month: 'short', year: 'numeric' });
    return `${startStr} - ${endStr}`;
  }, [currentPeriodDate, timeRange, totalStartDate, totalEndDate]);

  const handlePrevPeriod = () => {
    if (timeRange === '7d') {
      const newDate = new Date(currentPeriodDate);
      newDate.setDate(newDate.getDate() - 7);
      setCurrentPeriodDate(getMonday(newDate));
    } else if (timeRange === 'total') {
      const newStart = new Date(totalStartDate);
      const newEnd = new Date(totalEndDate);
      newStart.setMonth(newStart.getMonth() - 1);
      newEnd.setMonth(newEnd.getMonth() - 1);
      setTotalStartDate(newStart);
      setTotalEndDate(newEnd);
      setCurrentPeriodDate(new Date(newEnd.getFullYear(), newEnd.getMonth() + 1, 0));
    } else {
      const newDate = new Date(currentPeriodDate);
      newDate.setMonth(newDate.getMonth() - 1);
      setCurrentPeriodDate(newDate);
    }
  };

  const handleNextPeriod = () => {
    const today = new Date();
    if (timeRange === '7d') {
      const newDate = new Date(currentPeriodDate);
      newDate.setDate(newDate.getDate() + 7);
      const targetMonday = getMonday(newDate);
      const currentWeekMonday = getMonday(today);
      setCurrentPeriodDate(targetMonday > currentWeekMonday ? currentWeekMonday : targetMonday);
    } else if (timeRange === 'total') {
      const newStart = new Date(totalStartDate);
      const newEnd = new Date(totalEndDate);
      newStart.setMonth(newStart.getMonth() + 1);
      newEnd.setMonth(newEnd.getMonth() + 1);
      
      const maxEnd = new Date(today.getFullYear(), today.getMonth(), 1);
      const targetEnd = new Date(newEnd.getFullYear(), newEnd.getMonth(), 1);
      
      if (targetEnd <= maxEnd) {
        setTotalStartDate(newStart);
        setTotalEndDate(newEnd);
        setCurrentPeriodDate(new Date(newEnd.getFullYear(), newEnd.getMonth() + 1, 0));
      }
    } else {
      const newDate = new Date(currentPeriodDate);
      newDate.setMonth(newDate.getMonth() + 1);
      if (newDate.getFullYear() > today.getFullYear() || (newDate.getFullYear() === today.getFullYear() && newDate.getMonth() > today.getMonth())) {
        setCurrentPeriodDate(today);
      } else {
        setCurrentPeriodDate(newDate);
      }
    }
  };

  const isNextDisabled = useMemo(() => {
    const today = new Date();
    if (timeRange === '7d') {
      return getMonday(currentPeriodDate) >= getMonday(today);
    }
    if (timeRange === 'total') {
      return totalEndDate.getFullYear() > today.getFullYear() || 
            (totalEndDate.getFullYear() === today.getFullYear() && totalEndDate.getMonth() >= today.getMonth());
    }
    return currentPeriodDate.getFullYear() > today.getFullYear() || 
          (currentPeriodDate.getFullYear() === today.getFullYear() && currentPeriodDate.getMonth() >= today.getMonth());
  }, [currentPeriodDate, timeRange, totalEndDate]);

  const renderDatePickerContent = () => {
    const today = new Date();
    
    // Sub-step for week selection in '7d' (Woche) mode
    if (selectedMonthForWeekPicker) {
      const weeks = getWeeksOfMonth(selectedMonthForWeekPicker.year, selectedMonthForWeekPicker.month);
      
      return (
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center border-b border-[var(--theme-glass-border)] pb-2 mb-1">
            <button
              onClick={() => setSelectedMonthForWeekPicker(null)}
              className="flex items-center gap-1 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors"
            >
              <ChevronLeft size={14} />
              <span>Zurück</span>
            </button>
            <span className="font-bold text-xs text-text-primary">
              {new Date(selectedMonthForWeekPicker.year, selectedMonthForWeekPicker.month).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
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
                    "py-2.5 px-3 rounded-xl text-left font-semibold text-xs transition-all",
                    isFuture
                      ? "opacity-25 cursor-not-allowed"
                      : isSelected
                      ? "bg-accent text-bg-primary shadow-sm"
                      : "hover:bg-black/5 dark:hover:bg-white/5 text-text-secondary hover:text-text-primary border border-transparent hover:border-[var(--theme-glass-border)]"
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
      { short: 'Dez', num: 11 }
    ];

    return (
      <div className="flex flex-col gap-4">
        {/* Status / Instructions in range picker mode */}
        {timeRange === 'total' && (
          <div className="text-[10px] font-bold text-accent uppercase tracking-wider mb-1 text-center bg-accent/10 py-1.5 px-2 rounded-lg border border-accent/20">
            {rangePickerStart 
              ? `Start: ${rangePickerStart.toLocaleDateString('de-DE', { month: 'short', year: 'numeric' })} • Bitte End-Monat wählen.`
              : "Bitte Start- und End-Monat wählen."}
          </div>
        )}

        {/* Year Selector */}
        <div className="flex justify-between items-center border-b border-[var(--theme-glass-border)] pb-3">
          <button 
            onClick={() => setPickerYear(p => p - 1)}
            className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-text-secondary hover:text-text-primary transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="font-bold text-sm text-text-primary">{pickerYear}</span>
          <button 
            onClick={() => {
              if (pickerYear < today.getFullYear()) {
                setPickerYear(p => p + 1);
              }
            }}
            disabled={pickerYear >= today.getFullYear()}
            className={cn(
              "p-1 rounded-full transition-all",
              pickerYear >= today.getFullYear() ? "opacity-35 cursor-not-allowed" : "hover:bg-black/5 dark:hover:bg-white/5 text-text-secondary hover:text-text-primary"
            )}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Months Grid */}
        <div className="grid grid-cols-3 gap-2">
          {months.map((m) => {
            const isFuture = pickerYear > today.getFullYear() || (pickerYear === today.getFullYear() && m.num > today.getMonth());
            
            // Selection Highlight depending on mode
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
                    const anchor = (pickerYear === today.getFullYear() && m.num === today.getMonth()) ? today : new Date(pickerYear, m.num + 1, 0);
                    setCurrentPeriodDate(anchor);
                    handleCloseDatePicker();
                  }
                }}
                className={cn(
                  "py-2.5 rounded-xl text-center font-semibold text-xs transition-all",
                  isFuture 
                    ? "opacity-20 cursor-not-allowed"
                    : isSelected
                    ? "bg-accent text-bg-primary shadow-sm"
                    : isWithinRange
                    ? "bg-accent/20 text-text-primary"
                    : "hover:bg-black/5 dark:hover:bg-white/5 text-text-secondary hover:text-text-primary"
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
          className="mt-2 py-2 w-full rounded-xl bg-black/5 dark:bg-white/5 text-text-primary text-xs font-bold hover:bg-black/10 dark:hover:bg-white/10 transition-colors border border-[var(--theme-glass-border)]"
        >
          {timeRange === '7d' 
            ? "Aktuelle Woche (Heute)" 
            : timeRange === 'total' 
            ? "Letzte 6 Monate (Zurücksetzen)" 
            : "Aktueller Monat (Heute)"}
        </button>
      </div>
    );
  };

  const topCategories = useMemo(() => {
    const productsInTimeRange = chartData.flatMap(d => d.products);
    const catMap: Record<string, number> = {};
    productsInTimeRange.forEach(p => {
      const cat = p.mainCat || 'Ohne Kategorie';
      catMap[cat] = (catMap[cat] || 0) + (p.finalPrice || 0);
    });
    return Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, amount]) => ({ name, amount }));
  }, [chartData]);

  const maxCategorySpend = topCategories.length > 0 ? Math.max(topCategories[0].amount, 1) : 1;

  // Determine if over budget
  const isOverBudget = useMemo(() => {
    if (chartData.length === 0) return false;
    const latestItem = actualData[actualData.length - 1];
    if (!latestItem) return false;
    if (timeRange === 'total') {
      return latestItem.dailyValue > settings.monthlyBudget;
    }
    if (chartMode === 'cumulative') {
      const targetVal = getTargetVal(latestItem.dateKey);
      return latestItem.cumulativeValue! > targetVal;
    } else {
      return spentThisMonth > settings.monthlyBudget;
    }
  }, [actualData, chartMode, timeRange, settings.monthlyBudget, spentThisMonth]);

  // Compute curve paths using actualData
  const linePath = useMemo(() => {
    if (actualData.length === 0) return '';
    let path = `M ${getX(0)} ${getY(chartVal(actualData[0]))}`;
    for (let i = 0; i < actualData.length - 1; i++) {
      const prevX = getX(i);
      const prevY = getY(chartVal(actualData[i]));
      const currX = getX(i + 1);
      const currY = getY(chartVal(actualData[i + 1]));
      const cp1x = prevX + (currX - prevX) / 2;
      path += ` C ${cp1x} ${prevY}, ${cp1x} ${currY}, ${currX} ${currY}`;
    }
    return path;
  }, [actualData, chartMode, roundedMax]);

  const areaPath = useMemo(() => {
    if (actualData.length === 0) return '';
    let path = `M ${getX(0)} ${PAD_BOTTOM}`;
    path += ` L ${getX(0)} ${getY(chartVal(actualData[0]))}`;
    for (let i = 0; i < actualData.length - 1; i++) {
      const prevX = getX(i);
      const prevY = getY(chartVal(actualData[i]));
      const currX = getX(i + 1);
      const currY = getY(chartVal(actualData[i + 1]));
      const cp1x = prevX + (currX - prevX) / 2;
      path += ` C ${cp1x} ${prevY}, ${cp1x} ${currY}, ${currX} ${currY}`;
    }
    path += ` L ${getX(actualData.length - 1)} ${PAD_BOTTOM}`;
    path += ' Z';
    return path;
  }, [actualData, chartMode, roundedMax]);

  const groupedTransactions = useMemo(() => {
    if (sortBy === 'price') {
      const sorted = [...activePeriodProducts].sort((a, b) => (b.finalPrice || 0) - (a.finalPrice || 0));
      return [{ monthLabel: 'Nach Preis sortiert', products: sorted }];
    }

    const sorted = [...activePeriodProducts].sort(
      (a, b) => new Date(b.dateBought || b.dateAdded).getTime() - new Date(a.dateBought || a.dateAdded).getTime()
    );
    
    const groups: { monthLabel: string; products: Product[] }[] = [];
    
    sorted.forEach((p) => {
      const d = new Date(p.dateBought || p.dateAdded);
      const monthLabel = d.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
      
      let lastGroup = groups[groups.length - 1];
      if (!lastGroup || lastGroup.monthLabel !== monthLabel) {
        lastGroup = { monthLabel, products: [] };
        groups.push(lastGroup);
      }
      lastGroup.products.push(p);
    });
    
    return groups;
  }, [activePeriodProducts, sortBy]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[calc(100vh-100px)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 md:mb-10 px-2 mt-4">
        <h1 className="text-2xl md:text-3xl font-playfair font-bold">Budget</h1>
        
        <div className="bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-md px-1 py-1 flex items-center rounded-full shadow-sm self-start sm:self-auto">
          {['7d', 'month', 'total'].map((range) => (
            <button
              key={range}
              onClick={() => {
                setTimeRange(range as any);
                if (range === '7d') {
                  setCurrentPeriodDate(getMonday(new Date()));
                }
              }}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 whitespace-nowrap",
                timeRange === range 
                  ? "bg-accent text-bg-primary shadow-md"
                  : "text-text-secondary hover:text-text-primary bg-black/5 dark:bg-white/5"
              )}
            >
              {range === '7d' ? 'Woche' : range === 'month' ? 'Monat' : 'Gesamt'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-xl p-6 rounded-2xl shadow-sm">
          <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">Ausgaben ({timeRangeLabel})</h3>
          <p className="text-2xl font-bold">{timeRangeSpend.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €</p>
        </div>
        <div className="bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-xl p-6 rounded-2xl shadow-sm">
          <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">Ø Preis ({timeRangeLabel})</h3>
          <p className="text-2xl font-bold">{averagePrice.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €</p>
        </div>
        <div className="bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-xl p-6 rounded-2xl shadow-sm">
          <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">Käufe ({timeRangeLabel})</h3>
          <p className="text-2xl font-bold">{timeRangeProductsCount}</p>
        </div>
        <div className="bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-xl p-6 rounded-2xl shadow-sm group transition-all duration-300 hover:shadow-md flex flex-col justify-center">
          <div className="flex justify-between items-center mb-1.5">
            <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Monatsbudget</h3>
            {!isEditingBudget && (
              <button 
                onClick={() => { setIsEditingBudget(true); handleEditModeChange('month'); }} 
                className="opacity-0 group-hover:opacity-100 transition-opacity text-text-secondary hover:text-text-primary p-1 bg-black/5 dark:bg-white/5 rounded"
                title="Budget bearbeiten"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
              </button>
            )}
          </div>
          {isEditingBudget ? (
            <div className="flex flex-col gap-2 animate-in fade-in duration-300">
              <div className="flex bg-black/5 dark:bg-white/5 border border-[var(--theme-glass-border)] p-0.5 rounded-lg text-[9px] font-bold self-start select-none">
                {(['day', 'week', 'month'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleEditModeChange(mode)}
                    className={cn(
                      "px-2 py-0.5 rounded transition-all uppercase",
                      budgetEditMode === mode
                        ? "bg-accent text-bg-primary shadow-sm"
                        : "text-text-secondary hover:text-text-primary"
                    )}
                  >
                    {mode === 'day' ? 'Tag' : mode === 'week' ? 'Woche' : 'Monat'}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <input 
                  type="number" 
                  value={tempBudget}
                  onChange={(e) => setTempBudget(e.target.value)}
                  onBlur={handleBudgetSubmit}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleBudgetSubmit(); }}
                  className="w-20 bg-black/5 dark:bg-white/5 border border-border-primary/50 hover:border-text-secondary focus:border-text-secondary px-2 py-0.5 rounded-lg text-lg font-bold outline-none text-text-primary hover:-translate-y-0.5 focus:-translate-y-0.5 hover:scale-[1.03] focus:scale-[1.03] hover:shadow-md focus:shadow-md transition-all duration-300"
                  autoFocus
                />
                <span className="text-sm font-bold">€</span>
                <button 
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleBudgetSubmit();
                  }}
                  className="ml-auto p-1 bg-accent/15 border border-accent/20 rounded-lg text-accent hover:bg-accent hover:text-bg-primary transition-all duration-300"
                  title="Speichern"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p 
                className="text-2xl font-bold cursor-pointer transition-colors hover:text-accent"
                onClick={() => { setIsEditingBudget(true); handleEditModeChange('month'); }}
              >
                {settings.monthlyBudget.toLocaleString('de-DE')} €
              </p>
              <div className="flex gap-3 mt-1.5 text-[9px] text-text-secondary font-semibold border-t border-[var(--theme-glass-border)]/40 pt-1.5">
                <div>
                  Woche: <span className="text-text-primary font-bold">{Math.round(settings.monthlyBudget / 30 * 7)} €</span>
                </div>
                <div>
                  Tag: <span className="text-text-primary font-bold">{Math.round(settings.monthlyBudget / 30)} €</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 items-start">
        {/* Chart Area */}
        <div className="lg:col-span-2 bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-xl p-6 rounded-3xl shadow-sm flex flex-col min-h-[400px] relative">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start md:items-center gap-4 mb-8">
            <div className="flex flex-col gap-1.5 w-full sm:w-auto">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <h3 className="font-bold text-base md:text-lg shrink-0">Ausgabenverlauf</h3>
                
                {/* Paginator / Time Traveler */}
                <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 border border-[var(--theme-glass-border)] rounded-full px-1.5 py-0.5 shadow-sm text-xs select-none relative">
                  <button 
                    onClick={handlePrevPeriod}
                    className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-text-secondary hover:text-text-primary transition-colors"
                    title="Vorheriger Zeitraum"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  
                  <button
                    onClick={() => {
                      setPickerYear(currentPeriodDate.getFullYear());
                      setIsDatePickerOpen(true);
                    }}
                    className="px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-all flex items-center gap-1.5"
                    title="Monat auswählen"
                  >
                    <span>{formattedActivePeriod}</span>
                    <Calendar size={11} className="opacity-70" />
                  </button>
                  
                  <button 
                    onClick={handleNextPeriod}
                    disabled={isNextDisabled}
                    className={cn(
                      "p-1 rounded-full transition-colors",
                      isNextDisabled
                        ? "opacity-25 cursor-not-allowed"
                        : "hover:bg-black/10 dark:hover:bg-white/10 text-text-secondary hover:text-text-primary"
                    )}
                    title="Nächster Zeitraum"
                  >
                    <ChevronRight size={14} />
                  </button>

                  {/* Desktop Date Selection Popover */}
                  {isDatePickerOpen && (
                    <>
                      <div 
                        className="hidden sm:block fixed inset-0 z-40 bg-transparent" 
                        onClick={handleCloseDatePicker}
                      />
                      <div className="hidden sm:block absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-2xl p-4 rounded-2xl shadow-xl w-[300px]">
                        {renderDatePickerContent()}
                      </div>
                    </>
                  )}
                </div>
              </div>
              {/* Context-aware Chart Legend */}
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 items-center text-[10px] text-text-secondary font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    "w-3 h-1.5 rounded-full inline-block shrink-0 shadow-sm",
                    isOverBudget
                      ? "bg-heart"
                      : settings.isGlassEnabled
                      ? "bg-text-primary"
                      : "bg-accent"
                  )}></span>
                  <span>Ausgaben</span>
                </div>
                {chartMode === 'cumulative' && timeRange !== 'total' && (
                  <div className="flex items-center gap-1.5 animate-in fade-in duration-300">
                    <span className="w-4 border-t-2 border-dashed border-text-secondary/40 h-0 inline-block shrink-0"></span>
                    <span>Soll-Pace</span>
                  </div>
                )}
                {chartMode === 'cumulative' && (timeRange === 'month' || timeRange === '7d') && actualData.length > 0 && (
                  <div className="flex items-center gap-1.5 animate-in fade-in duration-300">
                    <span className={cn(
                      "w-4 border-t-2 border-dashed h-0 inline-block shrink-0",
                      timeRange === '7d'
                        ? (projectedEndWeekSpend > (settings.monthlyBudget / 30) * 7 ? "border-heart" : "border-emerald-500")
                        : (projectedEndSpend > settings.monthlyBudget ? "border-heart" : "border-emerald-500")
                    )}></span>
                    <span>Prognose (Burn-Rate)</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Chart Mode Toggle */}
            {timeRange !== 'total' && (
              <div className="bg-black/5 dark:bg-white/5 border border-[var(--theme-glass-border)] p-0.5 flex items-center rounded-full self-start sm:self-auto shadow-sm">
                <button
                  onClick={() => setChartMode('daily')}
                  className={cn(
                    "p-2 rounded-full transition-all duration-300 flex items-center justify-center",
                    chartMode === 'daily'
                      ? "bg-accent text-bg-primary shadow-sm"
                      : "text-text-secondary hover:text-text-primary bg-transparent"
                  )}
                  title="Tägliche Ausgabenspitzen (Balken)"
                >
                  <BarChart3 size={16} />
                </button>
                <button
                  onClick={() => setChartMode('cumulative')}
                  className={cn(
                    "p-2 rounded-full transition-all duration-300 flex items-center justify-center",
                    chartMode === 'cumulative'
                      ? "bg-accent text-bg-primary shadow-sm"
                      : "text-text-secondary hover:text-text-primary bg-transparent"
                  )}
                  title="Kumulierter Gesamtverlauf (Trend)"
                >
                  <TrendingUp size={16} />
                </button>
              </div>
            )}
          </div>
          
          {/* SVG Area Chart with Integrated Grid */}
          <div className="flex-1 relative mt-4 mx-2 md:mx-6 mb-10 h-[200px] md:h-[250px] overflow-hidden">
            {/* Soft Edge-Mask Scroll Indicators on Mobile */}
            <div className="absolute left-0 top-0 bottom-10 w-6 bg-gradient-to-r from-bg-primary/50 to-transparent pointer-events-none z-10 block md:hidden" />
            <div className="absolute right-0 top-0 bottom-10 w-6 bg-gradient-to-l from-bg-primary/50 to-transparent pointer-events-none z-10 block md:hidden" />
            
            <div 
              ref={scrollContainerRef}
              className="w-full h-full overflow-x-auto scrollbar-none"
            >
              <motion.div
                key={`${timeRange}-${chartMode}-${currentPeriodDate.getTime()}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "h-full relative",
                  timeRange === 'month' 
                    ? "min-w-[750px] md:min-w-0" 
                    : "min-w-[500px] md:min-w-0"
                )}
              >
                <svg 
                  className="w-full h-full overflow-visible" 
                  viewBox="0 0 600 250" 
                  preserveAspectRatio="none"
                  onClick={() => setSelectedDay(null)}
                >
              <defs>
                {/* Bar Fill Gradient */}
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="currentColor"
                    stopOpacity="0.85"
                    className={
                      isOverBudget
                        ? "text-heart"
                        : settings.isGlassEnabled
                        ? "text-text-primary"
                        : "text-accent"
                    }
                  />
                  <stop
                    offset="100%"
                    stopColor="currentColor"
                    stopOpacity="0.15"
                    className={
                      isOverBudget
                        ? "text-heart"
                        : settings.isGlassEnabled
                        ? "text-text-primary"
                        : "text-accent"
                    }
                  />
                </linearGradient>

                {/* Area Fill Gradient */}
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="currentColor"
                    stopOpacity="0.45"
                    className={
                      isOverBudget
                        ? "text-heart"
                        : settings.isGlassEnabled
                        ? "text-text-primary"
                        : "text-accent"
                    }
                  />
                  <stop
                    offset="100%"
                    stopColor="currentColor"
                    stopOpacity="0.0"
                    className={
                      isOverBudget
                        ? "text-heart"
                        : settings.isGlassEnabled
                        ? "text-text-primary"
                        : "text-accent"
                    }
                  />
                </linearGradient>

                {/* Curve Stroke Gradient */}
                <linearGradient id="curveGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop
                    offset="0%"
                    stopColor="currentColor"
                    stopOpacity="0.9"
                    className={
                      isOverBudget
                        ? "text-heart"
                        : settings.isGlassEnabled
                        ? "text-text-primary"
                        : "text-accent"
                    }
                  />
                  <stop
                    offset="100%"
                    stopColor="currentColor"
                    stopOpacity="1.0"
                    className={
                      isOverBudget
                        ? "text-heart"
                        : settings.isGlassEnabled
                        ? "text-text-primary"
                        : "text-accent"
                    }
                  />
                </linearGradient>
              </defs>

              {/* Y-Axis Grid Lines & Labels (Inside SVG for perfect alignment) */}
              <g className="grid-lines">
                {/* Max Line */}
                <line x1={MARGIN_LEFT} y1={getY(roundedMax)} x2="600" y2={getY(roundedMax)} stroke="var(--theme-glass-border)" strokeWidth="1" strokeDasharray="4 4" className="opacity-60" />
                <text x={MARGIN_LEFT - 10} y={getY(roundedMax) + 4} fill="currentColor" fontSize="10" textAnchor="end" className="text-text-secondary font-medium opacity-80">{Math.round(roundedMax).toLocaleString('de-DE')} €</text>

                {/* Middle Line */}
                <line x1={MARGIN_LEFT} y1={getY(roundedMax / 2)} x2="600" y2={getY(roundedMax / 2)} stroke="var(--theme-glass-border)" strokeWidth="1" strokeDasharray="4 4" className="opacity-60" />
                <text x={MARGIN_LEFT - 10} y={getY(roundedMax / 2) + 4} fill="currentColor" fontSize="10" textAnchor="end" className="text-text-secondary font-medium opacity-80">{Math.round(roundedMax / 2).toLocaleString('de-DE')} €</text>

                {/* Origin Line (0 Euro) */}
                <line x1={MARGIN_LEFT} y1={getY(0)} x2="600" y2={getY(0)} stroke="var(--theme-glass-border)" strokeWidth="1.5" />
                <text x={MARGIN_LEFT - 10} y={getY(0) + 4} fill="currentColor" fontSize="10" textAnchor="end" className="text-text-secondary font-medium opacity-80">0 €</text>
              </g>

              {/* Reference Target/Pace Lines */}
              {timeRange !== 'total' && chartMode === 'cumulative' ? (
                chartData.length > 0 && (
                  <line
                    x1={getX(0)}
                    y1={getY(0)}
                    x2={getX(chartData.length - 1)}
                    y2={getY(getSollPaceVal(chartData.length - 1))}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="5 5"
                    className="text-text-secondary/40"
                  />
                )
              ) : null}

              {/* Render Bars for Daily Spikes */}
              {(chartMode === 'daily' || timeRange === 'total') && (
                <g className="chart-bars animate-in fade-in duration-300">
                  {chartData.map((d, i) => {
                    if (d.label === '') return null; // Skip virtual Day 0 / padding days
                    
                    const val = d.dailyValue;
                    if (val === 0) return null; // Hide bars for days with 0 purchases
                    
                    const xPos = getX(i) - barWidth / 2;
                    const yPos = getY(val);
                    const barHeight = PAD_BOTTOM - yPos; // Natural height
                    
                    return (
                      <rect
                        key={i}
                        x={xPos}
                        y={yPos}
                        width={barWidth}
                        height={barHeight}
                        rx={Math.min(barWidth / 2, 6)}
                        fill="currentColor"
                        className={cn(
                          "transition-all duration-300 ease-in-out origin-bottom pointer-events-none",
                          isOverBudget ? "text-heart" : "text-accent",
                          selectedDay
                            ? (selectedDay.dateKey === d.dateKey ? "opacity-100" : "opacity-45")
                            : "opacity-90"
                        )}
                        style={{
                          filter: selectedDay?.dateKey === d.dateKey 
                            ? 'drop-shadow(0 0 10px currentColor)' 
                            : 'none'
                        }}
                      />
                    );
                  })}
                </g>
              )}

              {/* The filled Area */}
              {chartMode === 'cumulative' && timeRange !== 'total' && chartData.length > 0 && (
                <path
                  d={areaPath}
                  fill="url(#areaGradient)"
                  className="transition-all duration-500 ease-in-out pointer-events-none"
                />
              )}

              {/* The Curve line */}
              {chartMode === 'cumulative' && timeRange !== 'total' && chartData.length > 0 && (
                <path
                  d={linePath}
                  stroke="url(#curveGradient)"
                  strokeWidth="3"
                  fill="none"
                  className="transition-all duration-500 ease-in-out pointer-events-none"
                />
              )}

              {/* Forecast Line & Projection Label for Month */}
              {timeRange === 'month' && chartMode === 'cumulative' && isCurrentMonth && actualData.length > 0 && actualData.length < chartData.length && (
                <g>
                  {/* Forecast Line */}
                  <line
                    x1={getX(actualData.length - 1)}
                    y1={getY(latestCumulativeSpend)}
                    x2={getX(chartData.length - 1)}
                    y2={getY(projectedEndSpend)}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    className={projectedEndSpend > settings.monthlyBudget ? "text-heart" : "text-emerald-500"}
                    style={{
                      filter: 'drop-shadow(0 0 4px currentColor)'
                    }}
                  />

                  {/* Projected End Value Dot */}
                  <circle
                    cx={getX(chartData.length - 1)}
                    cy={getY(projectedEndSpend)}
                    r="4"
                    className={projectedEndSpend > settings.monthlyBudget ? "fill-heart text-heart" : "fill-emerald-500 text-emerald-500"}
                  />
                </g>
              )}

              {/* Forecast Line & Projection Label for Week */}
              {timeRange === '7d' && chartMode === 'cumulative' && isCurrentWeek && new Date().getDay() !== 0 && actualData.length > 0 && actualData.length < chartData.length && (
                <g>
                  {/* Forecast Line */}
                  <line
                    x1={getX(actualData.length - 1)}
                    y1={getY(latestCumulativeSpend)}
                    x2={getX(chartData.length - 1)}
                    y2={getY(projectedEndWeekSpend)}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    className={projectedEndWeekSpend > (settings.monthlyBudget / 30) * 7 ? "text-heart" : "text-emerald-500"}
                    style={{
                      filter: 'drop-shadow(0 0 4px currentColor)'
                    }}
                  />

                  {/* Projected End Value Dot */}
                  <circle
                    cx={getX(chartData.length - 1)}
                    cy={getY(projectedEndWeekSpend)}
                    r="4"
                    className={projectedEndWeekSpend > (settings.monthlyBudget / 30) * 7 ? "fill-heart text-heart" : "fill-emerald-500 text-emerald-500"}
                  />
                </g>
              )}

              {/* Invisible touch/hover columns and active markers */}
              {chartData.map((d, i) => {
                const yPos = getY(chartVal(d) || 0);
                const isHovered = hoveredDay?.label === d.label && d.label !== '';

                // Do not allow hovering Day 0 or future days
                if (d.isFuture || d.dateKey.endsWith('-00')) return null;

                return (
                  <g 
                    key={i} 
                    className="group"
                    onMouseEnter={() => setHoveredDay(d as any)}
                    onMouseLeave={() => setHoveredDay(null)}
                    onTouchStart={() => setHoveredDay(d as any)}
                    onClick={(e) => {
                      e.stopPropagation();
                      
                      // Calculate click Y in SVG coordinates
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickYRelative = e.clientY - rect.top;
                      const svgY = (clickYRelative / rect.height) * (DRAW_HEIGHT + 40) + (PAD_TOP - 20);
                      
                      let isClickOnTarget = false;
                      
                      if (chartMode === 'daily' || timeRange === 'total') {
                        // In Bar Mode, target is the bar itself (from yPos to PAD_BOTTOM)
                        // Add 15px top/bottom tolerance for easier interaction
                        const barYStart = getY(d.dailyValue);
                        isClickOnTarget = d.dailyValue > 0 && svgY >= (barYStart - 15) && svgY <= (PAD_BOTTOM + 15);
                      } else {
                        // In Cumulative Mode, target is the point at yPos
                        // Within 25px tolerance
                        const pointY = getY(chartVal(d) || 0);
                        isClickOnTarget = Math.abs(svgY - pointY) <= 25;
                      }
                      
                      if (isClickOnTarget) {
                        if (selectedDay?.dateKey === d.dateKey) {
                          setSelectedDay(null);
                        } else {
                          setSelectedDay(d as any);
                        }
                      } else {
                        // Clicked outside the bar/point -> deselect
                        setSelectedDay(null);
                      }
                    }}
                  >
                    {/* Interaction Area (Invisible) */}
                    <rect 
                      x={getX(i) - BAR_PITCH / 2} 
                      y={PAD_TOP - 20} 
                      width={BAR_PITCH} 
                      height={DRAW_HEIGHT + 40} 
                      fill="transparent"
                      className="cursor-pointer"
                    />

                    {/* Vertical guideline on hover */}
                    {(isHovered || selectedDay?.dateKey === d.dateKey) && (
                      <line
                        x1={getX(i)}
                        y1={PAD_TOP}
                        x2={getX(i)}
                        y2={PAD_BOTTOM}
                        stroke="var(--theme-glass-border)"
                        strokeWidth={selectedDay?.dateKey === d.dateKey ? "1.5" : "1"}
                        strokeDasharray={selectedDay?.dateKey === d.dateKey ? "none" : "3 3"}
                        className="pointer-events-none animate-in fade-in duration-200"
                      />
                    )}

                    {/* Hover & Selection marker dot - only in cumulative mode */}
                    {chartMode === 'cumulative' && timeRange !== 'total' && (isHovered || selectedDay?.dateKey === d.dateKey) && (
                      <circle
                        cx={getX(i)}
                        cy={yPos}
                        r={selectedDay?.dateKey === d.dateKey ? "6" : "5"}
                        className={cn(
                          "pointer-events-none transition-all duration-300",
                          isOverBudget
                            ? "fill-heart text-heart"
                            : settings.isGlassEnabled
                            ? "fill-text-primary text-text-primary"
                            : "fill-accent text-accent"
                        )}
                        style={{
                          filter: selectedDay?.dateKey === d.dateKey 
                            ? 'drop-shadow(0 0 10px currentColor)' 
                            : 'drop-shadow(0 0 6px currentColor)'
                        }}
                      />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* X-Axis Labels (Exact absolute positioning to match SVG points) */}
            <div className="absolute inset-x-0 -bottom-8 h-10 pointer-events-none">
              {chartData.map((day, idx) => {
                const xPercent = (getX(idx) / 600) * 100;
                
                // Hide labels responsively to prevent overlap on mobile/tablet
                const shouldHideOnMobile = chartData.length > 15 && idx % 4 !== 0 && idx !== chartData.length - 1;
                const shouldHideOnTablet = chartData.length > 15 && idx % 2 !== 0 && idx !== chartData.length - 1;
                
                return (
                  <div 
                    key={idx} 
                    className={cn(
                      "absolute flex flex-col items-center top-0 origin-center transition-opacity",
                      shouldHideOnMobile ? "hidden md:flex" : "flex",
                      shouldHideOnTablet ? "md:hidden lg:flex" : "md:flex"
                    )}
                    style={{ left: `${xPercent}%`, transform: 'translateX(-50%)' }}
                  >
                    <div className="w-[1px] h-2 bg-[var(--theme-glass-border)] mb-2"></div>
                    <span className="text-[10px] text-text-secondary font-medium whitespace-nowrap">{day.label}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
        </div>
        
        {/* Right Column */}
        <div className="flex flex-col gap-6 h-full">
          
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Budget Tracker (Half Width) */}
            <div className="bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-xl p-5 rounded-3xl shadow-sm flex flex-col flex-1 relative overflow-hidden group hover:shadow-lg transition-shadow duration-300">
              <div className={cn(
                "absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl transition-all duration-700",
                spentThisMonth > settings.monthlyBudget
                  ? "bg-heart/10 group-hover:bg-heart/20"
                  : "bg-emerald-500/10 group-hover:bg-emerald-500/20"
              )}></div>
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="font-bold text-sm">Budget Tracker</h3>
                  <span className={cn(
                    "text-xs font-bold px-2.5 py-1 rounded-full border transition-colors",
                    spentThisMonth > settings.monthlyBudget
                      ? "bg-heart/10 text-heart border-heart/20"
                      : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  )}>
                    {settings.monthlyBudget > 0 ? Math.round((spentThisMonth / settings.monthlyBudget) * 100) : 0}% genutzt
                  </span>
                </div>
                
                <div className="flex flex-col flex-1 justify-center">
                  <div className="flex flex-col gap-1 mb-6">
                     <span className="text-xs text-text-secondary font-medium uppercase tracking-wider">Ausgegeben</span>
                     <div className="flex items-baseline gap-1.5">
                       <p className="text-4xl font-bold">{spentThisMonth.toLocaleString('de-DE', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</p>
                       <span className="text-xl font-bold text-text-secondary">€</span>
                     </div>
                     {spentThisMonth > settings.monthlyBudget ? (
                      <span className="text-sm font-bold text-heart mt-1 bg-heart/10 w-max px-2 py-1 rounded-md animate-in fade-in duration-300">
                        {(spentThisMonth - settings.monthlyBudget).toLocaleString('de-DE', {minimumFractionDigits: 0, maximumFractionDigits: 0})} € über dem Budget {isCurrentMonth ? '' : 'abgeschlossen'}
                      </span>
                    ) : (
                      <span className="text-sm font-bold text-emerald-500 mt-1 bg-emerald-500/10 w-max px-2 py-1 rounded-md animate-in fade-in duration-300">
                        {isCurrentMonth 
                          ? `Noch ${(settings.monthlyBudget - spentThisMonth).toLocaleString('de-DE', {minimumFractionDigits: 0, maximumFractionDigits: 0})} € übrig`
                          : `Budget-Ergebnis: ${(settings.monthlyBudget - spentThisMonth).toLocaleString('de-DE', {minimumFractionDigits: 0, maximumFractionDigits: 0})} € gespart`
                        }
                      </span>
                    )}
                  </div>
                  
                  {/* Enhanced Progress Bar */}
                  <div className="w-full h-3 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden shadow-inner relative mb-2">
                    <div 
                      className={cn(
                        "absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out overflow-hidden bg-gradient-to-r",
                        spentThisMonth > settings.monthlyBudget
                          ? "from-heart/80 to-heart"
                          : "from-emerald-400 to-emerald-500"
                      )}
                      style={{ width: `${Math.min((spentThisMonth / (settings.monthlyBudget || 1)) * 100, 100)}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-xs text-text-secondary font-bold mt-1">
                    <span>0 €</span>
                    <span>Gesamt: {settings.monthlyBudget.toLocaleString('de-DE')} €</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Kategorien (Half Width) */}
            <div className="bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-xl p-5 rounded-3xl shadow-sm flex flex-col flex-1 relative">
              <h3 className="font-bold mb-6 text-sm">Top Kategorien</h3>
              <div className="flex flex-col gap-5 flex-1 justify-center">
                {topCategories.length > 0 ? (
                  topCategories.map((cat, idx) => (
                    <div key={idx} className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="truncate pr-2 font-semibold text-text-primary">{cat.name}</span>
                        <span className="font-bold shrink-0">{cat.amount.toLocaleString('de-DE', {maximumFractionDigits: 0})} €</span>
                      </div>
                      <div className="w-full h-2 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden flex-shrink-0">
                        <div 
                          className={cn(
                            "h-2.5 rounded-full transition-all duration-1000",
                            settings.isGlassEnabled ? "bg-text-primary" : "bg-accent"
                          )}
                          style={{ width: `${Math.min((cat.amount / maxCategorySpend) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-text-secondary italic">Keine Ausgaben</p>
                )}
              </div>
            </div>
          </div>

          {/* Tag/Monat Details (Interactive click box - Supermarket Receipt Style) */}
          <div className="bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-xl p-6 rounded-3xl shadow-sm flex flex-col h-[390px] relative overflow-hidden group">
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-sm tracking-wide flex items-center gap-2">
                <svg className="w-4 h-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {timeRange === 'total' ? 'MONATSBELEG' : 'TAGESBELEG'}
              </h3>
              {selectedDay && (
                <span className="text-[10px] font-mono font-medium opacity-50 bg-black/5 dark:bg-white/5 px-2 py-1 rounded animate-in fade-in">
                  {timeRange === '7d' 
                    ? `${selectedDay.label}, ${selectedDay.dateLabel}`
                    : selectedDay.dateLabel || selectedDay.label
                  }
                </span>
              )}
            </div>

            {selectedDay ? (
              <div className="flex flex-col h-full flex-1 min-h-[150px] animate-in fade-in">
                
                {/* List of Products */}
                <div className="flex flex-col gap-4 overflow-y-auto flex-1 pr-2 mb-6 scrollbar-thin">
                  {selectedDay.products.length > 0 ? (
                    selectedDay.products.map((p, idx) => (
                      <div key={idx} className="flex items-center gap-4 group/item">
                        {p.imgs && p.imgs.length > 0 ? (
                          <img src={p.imgs[p.mainImgIdx || 0]} alt={p.name} className="w-12 h-12 rounded-xl object-cover bg-black/10 dark:bg-white/10 shrink-0 shadow-sm" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-[var(--theme-glass-border)] flex items-center justify-center text-lg font-bold text-text-secondary shrink-0 shadow-sm">
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-sm font-semibold truncate text-text-primary group-hover/item:text-accent transition-colors uppercase tracking-tight">{p.name}</span>
                          <span className="text-[10px] text-text-secondary truncate">{p.mainCat || 'Ohne Kategorie'}</span>
                        </div>
                        <span className="text-sm font-bold font-mono opacity-90 shrink-0">{(p.finalPrice || 0).toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex-grow flex flex-col items-center justify-center opacity-60">
                      <p className="text-xs italic py-4">Keine Einkäufe getätigt</p>
                    </div>
                  )}
                </div>

                {/* Supermarket Receipt Total & Budget Summary */}
                <div className="mt-auto relative pt-5 pb-2 shrink-0">
                  {/* Dashed Line SVG for perfect "Receipt" look */}
                  <div className="absolute top-0 left-0 right-0 h-[2px] w-full" style={{ backgroundImage: 'linear-gradient(to right, var(--text-dark) 40%, transparent 40%)', backgroundSize: '8px 1px', backgroundRepeat: 'repeat-x', opacity: 0.2 }}></div>
                  
                  {/* The receipt cut-out circles at the edges to simulate tape roll */}
                  <div className="absolute -left-8 -top-[7px] w-4 h-4 bg-[var(--bg-color)] rounded-full shadow-inner"></div>
                  <div className="absolute -right-8 -top-[7px] w-4 h-4 bg-[var(--bg-color)] rounded-full shadow-inner"></div>
                  
                  <div className="flex justify-between items-end mb-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-text-secondary uppercase tracking-widest font-bold mb-1">Endsumme</span>
                      <span className="text-[10px] text-text-secondary">{selectedDay.products.length} {selectedDay.products.length === 1 ? 'Position' : 'Positionen'}</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-bold text-text-secondary">€</span>
                      <span className="text-3xl font-bold font-mono tracking-tight text-text-primary group-hover:text-accent transition-colors duration-500">
                        {selectedDay.dailyValue.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </span>
                    </div>
                  </div>

                  {/* Supermarket Receipt Budget Summary */}
                  {(() => {
                    const budgetLimit = timeRange === 'total' ? settings.monthlyBudget : settings.monthlyBudget / 30;
                    const diffVal = selectedDay.dailyValue - budgetLimit;
                    return (
                      <div className="pt-3 border-t border-dashed border-text-secondary/20 flex flex-col gap-1 text-[10px] text-text-secondary font-mono">
                        <div className="flex justify-between">
                          <span>{timeRange === 'total' ? 'MONATSBUDGET:' : 'TAGESBUDGET:'}</span>
                          <span>{budgetLimit.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span>{diffVal > 0 ? 'ÜBERSCHREITUNG:' : 'ERSPARNIS:'}</span>
                          <span className={diffVal > 0 ? "text-heart" : "text-emerald-500"}>
                            {diffVal > 0 ? '+' : ''}{Math.abs(diffVal).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 opacity-40 animate-in fade-in">
                <div className="w-16 h-16 mb-4 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center">
                  <svg className="w-8 h-8 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-xs italic font-medium max-w-[180px] text-center">
                  {timeRange === 'total'
                    ? "Wähle einen Monat im Diagramm aus, um den Beleg anzuzeigen."
                    : "Wähle einen Tag im Diagramm aus, um den Beleg anzuzeigen."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Transactions */}
      <div className="mt-4">
        <div className="flex justify-between items-center mb-6 px-2">
          <h3 className="font-bold text-xl tracking-wide">Transaktionen</h3>
          
          {/* Sort By Toggle */}
          <div className="bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-md px-1 py-1 flex items-center rounded-full shadow-sm text-xs">
            <button
              onClick={() => setSortBy('date')}
              className={cn(
                "px-3 py-1.5 rounded-full font-bold transition-all duration-300",
                sortBy === 'date'
                  ? "bg-accent text-bg-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary bg-black/5 dark:bg-white/5"
              )}
            >
              Datum
            </button>
            <button
              onClick={() => setSortBy('price')}
              className={cn(
                "px-3 py-1.5 rounded-full font-bold transition-all duration-300",
                sortBy === 'price'
                  ? "bg-accent text-bg-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary bg-black/5 dark:bg-white/5"
              )}
            >
              Preis
            </button>
          </div>
        </div>
        <div className="flex flex-col px-2 mb-8">
          {groupedTransactions.length > 0 ? (
            groupedTransactions.map((group, gIdx) => (
              <div key={gIdx} className="mb-8 last:mb-0">
                {/* Month Separator */}
                <div className="flex items-center gap-4 mb-4 opacity-80">
                  <h4 className="font-bold text-sm text-text-secondary uppercase tracking-widest">{group.monthLabel}</h4>
                  <div className="flex-1 h-[1px] bg-[var(--theme-glass-border)]"></div>
                </div>
                
                <div className="flex flex-col gap-4">
                  {group.products.map(p => {
                    const dateObj = new Date(p.dateBought || p.dateAdded);
                    const dateStr = dateObj.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    
                    return (
                      <div 
                        key={p.id} 
                        onClick={() => {
                          setView('products');
                          setStatusFilter('bought');
                          setSearchQuery(p.name);
                        }}
                        className="bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-xl p-4 md:p-5 rounded-3xl shadow-sm flex items-center gap-5 cursor-pointer hover:shadow-lg hover:border-accent/50 transition-all duration-300 group"
                      >
                        {p.imgs && p.imgs.length > 0 ? (
                          <img src={p.imgs[p.mainImgIdx || 0]} alt={p.name} className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover shadow-sm bg-black/10 dark:bg-white/10 shrink-0" />
                        ) : (
                          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-[var(--theme-glass-border)] flex items-center justify-center text-2xl font-bold text-text-secondary shrink-0 shadow-sm">
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex flex-col flex-1 min-w-0 justify-center">
                          <span className={cn(
                            "text-lg md:text-xl font-bold truncate text-text-primary transition-colors",
                            settings.isGlassEnabled 
                              ? "group-hover:text-text-primary" 
                              : "group-hover:text-accent"
                          )}>
                            {p.name}
                          </span>
                          <span className="text-xs md:text-sm text-text-secondary mt-1 font-medium">{dateStr} {p.mainCat ? `• ${p.mainCat}` : ''}</span>
                        </div>
                        <span className="text-xl md:text-2xl font-bold font-mono tracking-tight shrink-0 whitespace-nowrap pr-2 md:pr-4 text-text-primary">{(p.finalPrice || 0).toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-text-secondary italic">Keine kürzlichen Transaktionen vorhanden.</p>
          )}
        </div>
      </div>

      {/* Mobile Date Picker Drawer */}
      <AnimatePresence>
        {isDatePickerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseDatePicker}
              className="sm:hidden fixed inset-0 z-50 bg-black"
            />
            {/* Bottom Drawer */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-[var(--theme-glass-bg)] border-t border-[var(--theme-glass-border)] backdrop-blur-2xl rounded-t-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="w-12 h-1.5 bg-text-secondary/20 rounded-full mx-auto mb-6" />
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-bold text-base text-text-primary">Zeitraum auswählen</h4>
                <button 
                  onClick={handleCloseDatePicker}
                  className="p-1.5 rounded-full bg-black/5 dark:bg-white/5 text-text-secondary hover:text-text-primary"
                >
                  <X size={16} />
                </button>
              </div>
              
              <div>
                {renderDatePickerContent()}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// Removed old StatCard
