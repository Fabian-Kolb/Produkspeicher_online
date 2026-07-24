import React, { useMemo, useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useUIStore } from '../store/useUIStore';
import type { Product } from '../types';
import { cn } from '../utils/cn';

import { BudgetKpiCards } from '../components/budget/BudgetKpiCards';
import { BudgetChart, type ChartDataItem } from '../components/budget/BudgetChart';
import { BudgetDatePickerModal } from '../components/budget/BudgetDatePickerModal';
import { BudgetTrackerCard } from '../components/budget/BudgetTrackerCard';
import { TopCategoriesWidget } from '../components/budget/TopCategoriesWidget';
import { ReceiptPanel } from '../components/budget/ReceiptPanel';
import { TransactionList } from '../components/budget/TransactionList';

const getMonday = (d: Date): Date => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

export const BudgetView: React.FC = () => {
  const { products, settings, updateSettings } = useAppStore();
  const { setView, setStatusFilter, setSearchQuery } = useUIStore();

  const [timeRange, setTimeRange] = useState<'7d' | 'month' | 'total'>('month');
  const [chartMode, setChartMode] = useState<'daily' | 'cumulative'>('cumulative');
  const [sortBy, setSortBy] = useState<'date' | 'price'>('date');
  const [hoveredDay, setHoveredDay] = useState<ChartDataItem | null>(null);
  const [selectedDay, setSelectedDay] = useState<ChartDataItem | null>(null);

  // Date range explorer states
  const [currentPeriodDate, setCurrentPeriodDate] = useState<Date>(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState<number>(new Date().getFullYear());

  // Week and custom range picker states
  const [totalStartDate, setTotalStartDate] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() - 5, 1);
  });
  const [totalEndDate, setTotalEndDate] = useState<Date>(() => new Date());
  const [selectedMonthForWeekPicker, setSelectedMonthForWeekPicker] = useState<{ year: number; month: number } | null>(
    null
  );
  const [rangePickerStart, setRangePickerStart] = useState<Date | null>(null);

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

  const getLocalDateKey = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getTargetVal = (dateKey: string) => {
    if (dateKey.endsWith('-00')) return 0;
    const parts = dateKey.split('-');
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);
    const dim = new Date(year, month, 0).getDate();
    return (settings.monthlyBudget / dim) * day;
  };

  const chartData: ChartDataItem[] = useMemo(() => {
    const today = currentPeriodDate;
    const dateMap: Record<string, { label: string; dateLabel: string; value: number; products: Product[] }> = {};

    if (timeRange === '7d') {
      const monday = getMonday(currentPeriodDate);
      const weekdays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(d.getDate() + i);
        const dateKey = getLocalDateKey(d);
        const label = weekdays[i];
        dateMap[dateKey] = {
          label,
          dateLabel: d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
          value: 0,
          products: [],
        };
      }
    } else if (timeRange === 'month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
        const dateKey = getLocalDateKey(d);
        const label = d.toLocaleDateString('de-DE', { day: '2-digit' });
        dateMap[dateKey] = {
          label,
          dateLabel: d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
          value: 0,
          products: [],
        };
      }
    } else if (timeRange === 'total') {
      let current = new Date(totalStartDate.getFullYear(), totalStartDate.getMonth(), 1);
      const endLimit = new Date(totalEndDate.getFullYear(), totalEndDate.getMonth(), 1);

      while (current <= endLimit) {
        const dateKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
        const label = current.toLocaleDateString('de-DE', { month: 'short' });
        dateMap[dateKey] = {
          label,
          dateLabel: current.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }),
          value: 0,
          products: [],
        };

        current.setMonth(current.getMonth() + 1);
      }
    }

    boughtProducts.forEach((p) => {
      const pDate = new Date(p.dateBought || p.dateAdded);
      let pKey = '';

      if (timeRange === 'total') {
        pKey = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, '0')}`;
      } else {
        pKey = getLocalDateKey(pDate);
      }

      if (dateMap[pKey]) {
        dateMap[pKey].value += p.finalPrice || 0;
        dateMap[pKey].products.push(p);
      }
    });

    const realToday = new Date();
    const todayStr = getLocalDateKey(realToday);
    const sortedKeys = Object.keys(dateMap).sort((a, b) => a.localeCompare(b));
    let runningSum = 0;

    return sortedKeys.map((key) => {
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
        products: item.products,
      };
    });
  }, [boughtProducts, timeRange, chartMode, currentPeriodDate, totalStartDate, totalEndDate]);

  const actualData = useMemo(() => chartData.filter((d) => !d.isFuture), [chartData]);

  const latestCumulativeSpend = useMemo(() => {
    if (actualData.length === 0) return 0;
    return actualData[actualData.length - 1].cumulativeValue || 0;
  }, [actualData]);

  const projectedEndSpend = useMemo(() => {
    const activeDaysCount = actualData.length;
    if (activeDaysCount === 0) return 0;
    const dailyAverage = latestCumulativeSpend / activeDaysCount;
    const totalDaysCount = chartData.length;
    return dailyAverage * totalDaysCount;
  }, [actualData, chartData, latestCumulativeSpend]);

  const projectedEndWeekSpend = useMemo(() => {
    if (timeRange !== '7d') return 0;
    const activeDays = actualData.filter((d) => d.label !== '');
    const activeDaysCount = activeDays.length;
    if (activeDaysCount === 0) return 0;
    const dailyAverage = latestCumulativeSpend / activeDaysCount;
    return dailyAverage * 7;
  }, [actualData, timeRange, latestCumulativeSpend]);

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
    const dim = new Date(year, month, 0).getDate();
    return (settings.monthlyBudget / dim) * day;
  };

  const isOverBudget = useMemo(() => {
    if (chartData.length === 0) return false;
    const latestItem = actualData[actualData.length - 1];
    if (!latestItem) return false;
    if (timeRange === 'total') {
      return latestItem.dailyValue > settings.monthlyBudget;
    }
    if (chartMode === 'cumulative') {
      const targetVal = getTargetVal(latestItem.dateKey);
      return (latestItem.cumulativeValue || 0) > targetVal;
    } else {
      return spentThisMonth > settings.monthlyBudget;
    }
  }, [actualData, chartMode, timeRange, settings.monthlyBudget, spentThisMonth]);

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
      if (
        newDate.getFullYear() > today.getFullYear() ||
        (newDate.getFullYear() === today.getFullYear() && newDate.getMonth() > today.getMonth())
      ) {
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
      return (
        totalEndDate.getFullYear() > today.getFullYear() ||
        (totalEndDate.getFullYear() === today.getFullYear() && totalEndDate.getMonth() >= today.getMonth())
      );
    }
    return (
      currentPeriodDate.getFullYear() > today.getFullYear() ||
      (currentPeriodDate.getFullYear() === today.getFullYear() && currentPeriodDate.getMonth() >= today.getMonth())
    );
  }, [currentPeriodDate, timeRange, totalEndDate]);

  const topCategories = useMemo(() => {
    const productsInTimeRange = chartData.flatMap((d) => d.products);
    const catMap: Record<string, number> = {};
    productsInTimeRange.forEach((p) => {
      const cat = p.mainCat || 'Ohne Kategorie';
      catMap[cat] = (catMap[cat] || 0) + (p.finalPrice || 0);
    });
    return Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, amount]) => ({ name, amount }));
  }, [chartData]);

  const maxCategorySpend = topCategories.length > 0 ? Math.max(topCategories[0].amount, 1) : 1;

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

  const handleProductClick = (p: Product) => {
    setView('products');
    setStatusFilter('bought');
    setSearchQuery(p.name);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[calc(100vh-100px)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 md:mb-10 px-2 mt-4">
        <h1 className="text-2xl md:text-3xl font-playfair font-bold">Budget</h1>

        <div className="bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-md px-1 py-1 flex items-center rounded-full shadow-sm self-start sm:self-auto">
          {(['7d', 'month', 'total'] as const).map((range) => (
            <button
              key={range}
              onClick={() => {
                setTimeRange(range);
                if (range === '7d') {
                  setCurrentPeriodDate(getMonday(new Date()));
                }
              }}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 whitespace-nowrap cursor-pointer',
                timeRange === range
                  ? 'bg-accent text-bg-primary shadow-md'
                  : 'text-text-secondary hover:text-text-primary bg-text-primary/5'
              )}
            >
              {range === '7d' ? 'Woche' : range === 'month' ? 'Monat' : 'Gesamt'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <BudgetKpiCards
        timeRangeLabel={timeRangeLabel}
        timeRangeSpend={timeRangeSpend}
        averagePrice={averagePrice}
        timeRangeProductsCount={timeRangeProductsCount}
        monthlyBudget={settings.monthlyBudget}
        onUpdateBudget={(newBudget) => updateSettings({ monthlyBudget: newBudget })}
      />

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 items-start relative">
        {/* SVG Chart Sub-Component */}
        <BudgetChart
          timeRange={timeRange}
          chartMode={chartMode}
          setChartMode={setChartMode}
          currentPeriodDate={currentPeriodDate}
          chartData={chartData}
          actualData={actualData}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          hoveredDay={hoveredDay}
          onHoverDay={setHoveredDay}
          monthlyBudget={settings.monthlyBudget}
          projectedEndSpend={projectedEndSpend}
          projectedEndWeekSpend={projectedEndWeekSpend}
          isOverBudget={isOverBudget}
          isCurrentMonth={isCurrentMonth}
          isCurrentWeek={isCurrentWeek}
          formattedActivePeriod={formattedActivePeriod}
          handlePrevPeriod={handlePrevPeriod}
          handleNextPeriod={handleNextPeriod}
          isNextDisabled={isNextDisabled}
          onOpenDatePicker={() => {
            setPickerYear(currentPeriodDate.getFullYear());
            setIsDatePickerOpen(true);
          }}
          getSollPaceVal={getSollPaceVal}
          getTargetVal={getTargetVal}
        />

        {/* Date Picker Modal / Drawer */}
        <BudgetDatePickerModal
          isOpen={isDatePickerOpen}
          onClose={() => setIsDatePickerOpen(false)}
          timeRange={timeRange}
          currentPeriodDate={currentPeriodDate}
          setCurrentPeriodDate={setCurrentPeriodDate}
          pickerYear={pickerYear}
          setPickerYear={setPickerYear}
          selectedMonthForWeekPicker={selectedMonthForWeekPicker}
          setSelectedMonthForWeekPicker={setSelectedMonthForWeekPicker}
          rangePickerStart={rangePickerStart}
          setRangePickerStart={setRangePickerStart}
          totalStartDate={totalStartDate}
          setTotalStartDate={setTotalStartDate}
          totalEndDate={totalEndDate}
          setTotalEndDate={setTotalEndDate}
        />

        {/* Right Column */}
        <div className="flex flex-col gap-6 h-full">
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 order-2 lg:order-1 min-w-0">
            <BudgetTrackerCard
              spentThisMonth={spentThisMonth}
              monthlyBudget={settings.monthlyBudget}
              isCurrentMonth={isCurrentMonth}
            />

            <TopCategoriesWidget topCategories={topCategories} maxCategorySpend={maxCategorySpend} />
          </div>

          <ReceiptPanel timeRange={timeRange} selectedDay={selectedDay} monthlyBudget={settings.monthlyBudget} />
        </div>
      </div>

      {/* Grouped Transactions List */}
      <TransactionList
        groupedTransactions={groupedTransactions}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onProductClick={handleProductClick}
      />
    </div>
  );
};
