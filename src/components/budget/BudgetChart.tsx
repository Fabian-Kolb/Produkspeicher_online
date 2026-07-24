import React, { useMemo, useState, useRef, useEffect } from 'react';
import type { Product } from '../../types';
import { cn } from '../../utils/cn';
import { BarChart3, TrendingUp, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

export interface ChartDataItem {
  dateKey: string;
  label: string;
  dateLabel: string;
  dailyValue: number;
  cumulativeValue: number | null;
  isFuture: boolean;
  products: Product[];
}

interface BudgetChartProps {
  timeRange: '7d' | 'month' | 'total';
  chartMode: 'daily' | 'cumulative';
  setChartMode: (mode: 'daily' | 'cumulative') => void;
  currentPeriodDate: Date;
  chartData: ChartDataItem[];
  actualData: ChartDataItem[];
  selectedDay: ChartDataItem | null;
  onSelectDay: (day: ChartDataItem | null) => void;
  hoveredDay: ChartDataItem | null;
  onHoverDay: (day: ChartDataItem | null) => void;
  monthlyBudget: number;
  projectedEndSpend: number;
  projectedEndWeekSpend: number;
  isOverBudget: boolean;
  isCurrentMonth: boolean;
  isCurrentWeek: boolean;
  formattedActivePeriod: string;
  handlePrevPeriod: () => void;
  handleNextPeriod: () => void;
  isNextDisabled: boolean;
  onOpenDatePicker: () => void;
  getSollPaceVal: (i: number) => number;
  getTargetVal: (dateKey: string) => number;
}

export const BudgetChart: React.FC<BudgetChartProps> = ({
  timeRange,
  chartMode,
  setChartMode,
  currentPeriodDate,
  chartData,
  actualData,
  selectedDay,
  onSelectDay,
  hoveredDay,
  onHoverDay,
  monthlyBudget,
  projectedEndSpend,
  projectedEndWeekSpend,
  isOverBudget,
  isCurrentMonth,
  isCurrentWeek,
  formattedActivePeriod,
  handlePrevPeriod,
  handleNextPeriod,
  isNextDisabled,
  onOpenDatePicker,
  getSollPaceVal,
}) => {
  // Zoom States & Gesture Refs
  const [zoomX, setZoomX] = useState(1.0);
  const [zoomY, setZoomY] = useState(1.0);

  const zoomXRef = useRef(zoomX);
  const zoomYRef = useRef(zoomY);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const touchStartRef = useRef<{
    distanceX: number;
    distanceY: number;
    zoomX: number;
    zoomY: number;
  } | null>(null);

  useEffect(() => {
    zoomXRef.current = zoomX;
  }, [zoomX]);

  useEffect(() => {
    zoomYRef.current = zoomY;
  }, [zoomY]);

  // Reset zoom on period change
  useEffect(() => {
    setZoomX(1.0);
    setZoomY(1.0);
  }, [timeRange, currentPeriodDate]);

  // Auto-scroll mobile month view to the right
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, [timeRange, currentPeriodDate, chartMode]);

  // Touch pinch-to-zoom (X and Y independently zoomable)
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dx = Math.abs(t2.clientX - t1.clientX);
        const dy = Math.abs(t2.clientY - t1.clientY);
        touchStartRef.current = {
          distanceX: dx,
          distanceY: dy,
          zoomX: zoomXRef.current,
          zoomY: zoomYRef.current,
        };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && touchStartRef.current) {
        if (e.cancelable) {
          e.preventDefault();
        }
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dx = Math.abs(t2.clientX - t1.clientX);
        const dy = Math.abs(t2.clientY - t1.clientY);

        const { distanceX, distanceY, zoomX: startZoomX, zoomY: startZoomY } = touchStartRef.current;
        const threshold = 15;

        let newZoomX = startZoomX;
        if (distanceX > threshold && dx > threshold) {
          const ratioX = dx / distanceX;
          newZoomX = Math.max(0.4, Math.min(4.0, startZoomX * ratioX));
        }

        let newZoomY = startZoomY;
        if (distanceY > threshold && dy > threshold) {
          const ratioY = dy / distanceY;
          newZoomY = Math.max(0.4, Math.min(4.0, startZoomY * ratioY));
        }

        setZoomX(newZoomX);
        setZoomY(newZoomY);
      }
    };

    const handleTouchEnd = () => {
      touchStartRef.current = null;
    };

    // Desktop Wheel Zoom Handler (Ctrl+Wheel or Pinch gesture on touchpad)
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const zoomDelta = e.deltaY < 0 ? 1.1 : 0.9;
        if (e.shiftKey) {
          setZoomY((prevY) => Math.max(0.4, Math.min(4.0, prevY * zoomDelta)));
        } else {
          setZoomX((prevX) => Math.max(0.4, Math.min(4.0, prevX * zoomDelta)));
        }
      }
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchEnd);
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Coordinate Constants for SVG Mapping
  const PAD_TOP = 40;
  const PAD_BOTTOM = 220;
  const MARGIN_LEFT = 50;
  const MARGIN_RIGHT = 20;
  const DRAW_HEIGHT = PAD_BOTTOM - PAD_TOP;
  const DRAW_WIDTH_BASE = 600 - MARGIN_LEFT - MARGIN_RIGHT;
  const DRAW_WIDTH = DRAW_WIDTH_BASE * zoomX;
  const viewBoxWidth = MARGIN_LEFT + DRAW_WIDTH + MARGIN_RIGHT;

  const chartVal = (d: ChartDataItem) =>
    chartMode === 'cumulative' && timeRange !== 'total' ? d.cumulativeValue : d.dailyValue;

  const roundedMax = useMemo(() => {
    let limit = 10;
    if (timeRange === 'total') {
      limit = monthlyBudget;
    } else if (chartMode === 'cumulative') {
      if (chartData.length > 0) {
        if (timeRange === '7d') {
          limit = Math.max((monthlyBudget / 30) * 7, projectedEndWeekSpend);
        } else {
          const lastDateKey = chartData[chartData.length - 1].dateKey;
          const parts = lastDateKey.split('-');
          const dim = new Date(Number(parts[0]), Number(parts[1]), 0).getDate();
          const targetVal = (monthlyBudget / dim) * Number(parts[2]);
          limit = Math.max(targetVal, projectedEndSpend);
        }
      }
    } else {
      limit = monthlyBudget / 30;
    }

    const rawMax = Math.max(...chartData.map((d) => chartVal(d) || 0), limit, 10);
    if (rawMax <= 100) return Math.ceil(rawMax / 10) * 10;
    if (rawMax <= 300) return 300;
    if (rawMax <= 500) return 500;
    if (rawMax <= 1000) return 1000;
    return Math.ceil(rawMax / 250) * 250;
  }, [chartData, chartMode, timeRange, monthlyBudget, projectedEndSpend, projectedEndWeekSpend]);

  const effectiveMax = roundedMax / zoomY;

  const getY = (val: number) => PAD_BOTTOM - (val / effectiveMax) * DRAW_HEIGHT;
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
    if (timeRange === '7d') return 48 * zoomX;
    if (timeRange === 'month') return Math.max(pitch * 0.6, 6);
    return Math.max(pitch * 0.6, 12);
  }, [chartData.length, timeRange, DRAW_WIDTH, zoomX]);

  // Compute curve paths using actualData
  const linePath = useMemo(() => {
    if (actualData.length === 0) return '';
    let path = `M ${getX(0)} ${getY(chartVal(actualData[0]) || 0)}`;
    for (let i = 0; i < actualData.length - 1; i++) {
      const prevX = getX(i);
      const prevY = getY(chartVal(actualData[i]) || 0);
      const currX = getX(i + 1);
      const currY = getY(chartVal(actualData[i + 1]) || 0);
      const cp1x = prevX + (currX - prevX) / 2;
      path += ` C ${cp1x} ${prevY}, ${cp1x} ${currY}, ${currX} ${currY}`;
    }
    return path;
  }, [actualData, chartMode, roundedMax, zoomX, zoomY]);

  const areaPath = useMemo(() => {
    if (actualData.length === 0) return '';
    let path = `M ${getX(0)} ${PAD_BOTTOM}`;
    path += ` L ${getX(0)} ${getY(chartVal(actualData[0]) || 0)}`;
    for (let i = 0; i < actualData.length - 1; i++) {
      const prevX = getX(i);
      const prevY = getY(chartVal(actualData[i]) || 0);
      const currX = getX(i + 1);
      const currY = getY(chartVal(actualData[i + 1]) || 0);
      const cp1x = prevX + (currX - prevX) / 2;
      path += ` C ${cp1x} ${prevY}, ${cp1x} ${currY}, ${currX} ${currY}`;
    }
    path += ` L ${getX(actualData.length - 1)} ${PAD_BOTTOM}`;
    path += ' Z';
    return path;
  }, [actualData, chartMode, roundedMax, zoomX, zoomY]);

  const latestCumulativeSpend = useMemo(() => {
    if (actualData.length === 0) return 0;
    return actualData[actualData.length - 1].cumulativeValue || 0;
  }, [actualData]);

  return (
    <div className="lg:col-span-2 bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-xl p-6 rounded-3xl shadow-sm flex flex-col min-h-[400px] relative">
      <div className="flex flex-col gap-3 mb-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 w-full">
          <h3 className="font-bold text-base md:text-lg shrink-0">Ausgabenverlauf</h3>

          {/* Paginator / Time Traveler */}
          <div className="flex items-center gap-1 bg-text-primary/5 border border-[var(--theme-glass-border)] rounded-full px-1.5 py-0.5 shadow-sm text-xs select-none relative">
            <button
              onClick={handlePrevPeriod}
              className="p-1 rounded-full hover:bg-text-primary/10 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              title="Vorheriger Zeitraum"
            >
              <ChevronLeft size={14} />
            </button>

            <button
              onClick={onOpenDatePicker}
              className="px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider text-text-secondary hover:text-text-primary hover:bg-text-primary/5 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Monat auswählen"
            >
              <span>{formattedActivePeriod}</span>
              <Calendar size={11} className="opacity-70" />
            </button>

            <button
              onClick={handleNextPeriod}
              disabled={isNextDisabled}
              className={cn(
                'p-1 rounded-full transition-colors',
                isNextDisabled
                  ? 'opacity-25 cursor-not-allowed'
                  : 'hover:bg-text-primary/10 text-text-secondary hover:text-text-primary cursor-pointer'
              )}
              title="Nächster Zeitraum"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Chart Mode Toggle */}
          {timeRange !== 'total' && (
            <div className="bg-text-primary/5 border border-[var(--theme-glass-border)] p-0.5 flex items-center rounded-full shadow-sm shrink-0">
              <button
                onClick={() => setChartMode('daily')}
                className={cn(
                  'p-1.5 rounded-full transition-all duration-300 flex items-center justify-center cursor-pointer',
                  chartMode === 'daily'
                    ? 'bg-accent text-bg-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary bg-transparent'
                )}
                title="Tägliche Ausgabenspitzen (Balken)"
              >
                <BarChart3 size={12} />
              </button>
              <button
                onClick={() => setChartMode('cumulative')}
                className={cn(
                  'p-1.5 rounded-full transition-all duration-300 flex items-center justify-center cursor-pointer',
                  chartMode === 'cumulative'
                    ? 'bg-accent text-bg-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary bg-transparent'
                )}
                title="Kumulierter Gesamtverlauf (Trend)"
              >
                <TrendingUp size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Context-aware Chart Legend */}
        <div className="flex flex-wrap gap-x-2.5 gap-y-1 items-center text-[9px] text-text-secondary font-semibold">
          <div className="flex items-center gap-1">
            <span
              className={cn(
                'w-2.5 h-1.5 rounded-full inline-block shrink-0 shadow-sm',
                isOverBudget ? 'bg-heart' : 'bg-text-primary'
              )}
            ></span>
            <span>Ausgaben</span>
          </div>
          {chartMode === 'cumulative' && timeRange !== 'total' && (
            <div className="flex items-center gap-1 animate-in fade-in duration-300">
              <span className="w-3 border-t-[1.5px] border-dashed border-text-secondary/40 h-0 inline-block shrink-0"></span>
              <span>Soll-Pace</span>
            </div>
          )}
          {chartMode === 'cumulative' && (timeRange === 'month' || timeRange === '7d') && actualData.length > 0 && (
            <div className="flex items-center gap-1 animate-in fade-in duration-300">
              <span
                className={cn(
                  'w-3 border-t-[1.5px] border-dashed h-0 inline-block shrink-0',
                  timeRange === '7d'
                    ? projectedEndWeekSpend > (monthlyBudget / 30) * 7
                      ? 'border-heart'
                      : 'border-emerald-500'
                    : projectedEndSpend > monthlyBudget
                    ? 'border-heart'
                    : 'border-emerald-500'
                )}
              ></span>
              <span>Prognose (Burn-Rate)</span>
            </div>
          )}
        </div>
      </div>

      {/* SVG Area Chart with Integrated Grid */}
      <div
        ref={chartContainerRef}
        className="flex-1 relative mt-4 mx-2 md:mx-6 mb-10 h-[200px] md:h-[250px] overflow-hidden select-none"
      >
        {/* Soft Edge-Mask Scroll Indicators on Mobile */}
        <div className="absolute left-0 top-0 bottom-10 w-6 bg-gradient-to-r from-bg-primary/50 to-transparent pointer-events-none z-10 block md:hidden" />
        <div className="absolute right-0 top-0 bottom-10 w-6 bg-gradient-to-l from-bg-primary/50 to-transparent pointer-events-none z-10 block md:hidden" />

        {/* Reset Zoom Button Overlay */}
        {(zoomX !== 1.0 || zoomY !== 1.0) && (
          <button
            onClick={() => {
              setZoomX(1.0);
              setZoomY(1.0);
            }}
            className="absolute top-2 right-2 z-25 px-2.5 py-1 rounded-full bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] text-[10px] font-bold text-text-secondary hover:text-text-primary backdrop-blur-md shadow-sm transition-all flex items-center gap-1 hover:scale-105 active:scale-95 animate-in fade-in zoom-in-95 duration-200 cursor-pointer"
            title="Zoom zurücksetzen"
          >
            <svg
              className="w-3 h-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 16h5v5" />
            </svg>
            <span>Zoom zurücksetzen</span>
          </button>
        )}

        <div ref={scrollContainerRef} className="w-full h-full overflow-x-auto overflow-y-hidden scrollbar-premium pb-6">
          <motion.div
            key={`${timeRange}-${chartMode}-${currentPeriodDate.getTime()}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="h-full relative"
            style={{
              width: `${(timeRange === 'month' ? 750 : 500) * zoomX}px`,
              minWidth: `${(timeRange === 'month' ? 750 : 500) * zoomX}px`,
            }}
          >
            <svg
              className="w-full h-full overflow-visible"
              viewBox={`0 0 ${viewBoxWidth} 250`}
              preserveAspectRatio="none"
              onClick={() => onSelectDay(null)}
            >
              <defs>
                {/* Clipping Path */}
                <clipPath id="chartClip">
                  <rect x={MARGIN_LEFT} y={PAD_TOP} width={DRAW_WIDTH} height={DRAW_HEIGHT} />
                </clipPath>

                {/* Bar Fill Gradient */}
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="currentColor"
                    stopOpacity="0.85"
                    className={isOverBudget ? 'text-heart' : 'text-text-primary'}
                  />
                  <stop
                    offset="100%"
                    stopColor="currentColor"
                    stopOpacity="0.15"
                    className={isOverBudget ? 'text-heart' : 'text-text-primary'}
                  />
                </linearGradient>

                {/* Area Fill Gradient */}
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="currentColor"
                    stopOpacity="0.45"
                    className={isOverBudget ? 'text-heart' : 'text-text-primary'}
                  />
                  <stop
                    offset="100%"
                    stopColor="currentColor"
                    stopOpacity="0.0"
                    className={isOverBudget ? 'text-heart' : 'text-text-primary'}
                  />
                </linearGradient>

                {/* Curve Stroke Gradient */}
                <linearGradient id="curveGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop
                    offset="0%"
                    stopColor="currentColor"
                    stopOpacity="0.9"
                    className={isOverBudget ? 'text-heart' : 'text-text-primary'}
                  />
                  <stop
                    offset="100%"
                    stopColor="currentColor"
                    stopOpacity="1.0"
                    className={isOverBudget ? 'text-heart' : 'text-text-primary'}
                  />
                </linearGradient>
              </defs>

              {/* Y-Axis Grid Lines & Labels */}
              <g className="grid-lines">
                {/* Max Line */}
                <line
                  x1={MARGIN_LEFT}
                  y1={getY(effectiveMax)}
                  x2={viewBoxWidth - MARGIN_RIGHT}
                  y2={getY(effectiveMax)}
                  stroke="var(--theme-glass-border)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  className="opacity-60"
                />
                <text
                  x={MARGIN_LEFT - 10}
                  y={getY(effectiveMax) + 4}
                  fill="currentColor"
                  fontSize="10"
                  textAnchor="end"
                  className="text-text-secondary font-medium opacity-80"
                >
                  {Math.round(effectiveMax).toLocaleString('de-DE')} €
                </text>

                {/* Middle Line */}
                <line
                  x1={MARGIN_LEFT}
                  y1={getY(effectiveMax / 2)}
                  x2={viewBoxWidth - MARGIN_RIGHT}
                  y2={getY(effectiveMax / 2)}
                  stroke="var(--theme-glass-border)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  className="opacity-60"
                />
                <text
                  x={MARGIN_LEFT - 10}
                  y={getY(effectiveMax / 2) + 4}
                  fill="currentColor"
                  fontSize="10"
                  textAnchor="end"
                  className="text-text-secondary font-medium opacity-80"
                >
                  {Math.round(effectiveMax / 2).toLocaleString('de-DE')} €
                </text>

                {/* Origin Line (0 Euro) */}
                <line
                  x1={MARGIN_LEFT}
                  y1={getY(0)}
                  x2={viewBoxWidth - MARGIN_RIGHT}
                  y2={getY(0)}
                  stroke="var(--theme-glass-border)"
                  strokeWidth="1.5"
                />
                <text
                  x={MARGIN_LEFT - 10}
                  y={getY(0) + 4}
                  fill="currentColor"
                  fontSize="10"
                  textAnchor="end"
                  className="text-text-secondary font-medium opacity-80"
                >
                  0 €
                </text>
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
                    clipPath="url(#chartClip)"
                    className="text-text-secondary/40"
                  />
                )
              ) : null}

              {/* Render Bars for Daily Spikes */}
              {(chartMode === 'daily' || timeRange === 'total') && (
                <g className="chart-bars animate-in fade-in duration-300" clipPath="url(#chartClip)">
                  {chartData.map((d, i) => {
                    if (d.label === '') return null;
                    const val = d.dailyValue;
                    if (val === 0) return null;

                    const xPos = getX(i) - barWidth / 2;
                    const yPos = getY(val);
                    const barHeight = PAD_BOTTOM - yPos;

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
                          'transition-all duration-300 ease-in-out origin-bottom pointer-events-none',
                          isOverBudget ? 'text-heart' : 'text-accent',
                          selectedDay
                            ? selectedDay.dateKey === d.dateKey
                              ? 'opacity-100'
                              : 'opacity-45'
                            : 'opacity-90'
                        )}
                        style={{
                          filter:
                            selectedDay?.dateKey === d.dateKey ? 'drop-shadow(0 0 10px currentColor)' : 'none',
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
                  clipPath="url(#chartClip)"
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
                  clipPath="url(#chartClip)"
                  className="transition-all duration-500 ease-in-out pointer-events-none"
                />
              )}

              {/* Forecast Line & Projection Label for Month */}
              {timeRange === 'month' &&
                chartMode === 'cumulative' &&
                isCurrentMonth &&
                actualData.length > 0 &&
                actualData.length < chartData.length && (
                  <g clipPath="url(#chartClip)">
                    <line
                      x1={getX(actualData.length - 1)}
                      y1={getY(latestCumulativeSpend)}
                      x2={getX(chartData.length - 1)}
                      y2={getY(projectedEndSpend)}
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      className={projectedEndSpend > monthlyBudget ? 'text-heart' : 'text-emerald-500'}
                      style={{
                        filter: 'drop-shadow(0 0 4px currentColor)',
                      }}
                    />
                    <circle
                      cx={getX(chartData.length - 1)}
                      cy={getY(projectedEndSpend)}
                      r="4"
                      className={
                        projectedEndSpend > monthlyBudget
                          ? 'fill-heart text-heart'
                          : 'fill-emerald-500 text-emerald-500'
                      }
                    />
                  </g>
                )}

              {/* Forecast Line & Projection Label for Week */}
              {timeRange === '7d' &&
                chartMode === 'cumulative' &&
                isCurrentWeek &&
                new Date().getDay() !== 0 &&
                actualData.length > 0 &&
                actualData.length < chartData.length && (
                  <g clipPath="url(#chartClip)">
                    <line
                      x1={getX(actualData.length - 1)}
                      y1={getY(latestCumulativeSpend)}
                      x2={getX(chartData.length - 1)}
                      y2={getY(projectedEndWeekSpend)}
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      className={
                        projectedEndWeekSpend > (monthlyBudget / 30) * 7 ? 'text-heart' : 'text-emerald-500'
                      }
                      style={{
                        filter: 'drop-shadow(0 0 4px currentColor)',
                      }}
                    />
                    <circle
                      cx={getX(chartData.length - 1)}
                      cy={getY(projectedEndWeekSpend)}
                      r="4"
                      className={
                        projectedEndWeekSpend > (monthlyBudget / 30) * 7
                          ? 'fill-heart text-heart'
                          : 'fill-emerald-500 text-emerald-500'
                      }
                    />
                  </g>
                )}

              {/* Invisible touch/hover columns and active markers */}
              {chartData.map((d, i) => {
                const yPos = getY(chartVal(d) || 0);
                const isHovered = hoveredDay?.label === d.label && d.label !== '';

                if (d.isFuture || d.dateKey.endsWith('-00')) return null;

                return (
                  <g
                    key={i}
                    className="group"
                    onMouseEnter={() => onHoverDay(d)}
                    onMouseLeave={() => onHoverDay(null)}
                    onTouchStart={() => onHoverDay(d)}
                    onClick={(e) => {
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickYRelative = e.clientY - rect.top;
                      const svgY = (clickYRelative / rect.height) * (DRAW_HEIGHT + 40) + (PAD_TOP - 20);

                      let isClickOnTarget = false;
                      if (chartMode === 'daily' || timeRange === 'total') {
                        const barYStart = getY(d.dailyValue);
                        isClickOnTarget = d.dailyValue > 0 && svgY >= barYStart - 15 && svgY <= PAD_BOTTOM + 15;
                      } else {
                        const pointY = getY(chartVal(d) || 0);
                        isClickOnTarget = Math.abs(svgY - pointY) <= 25;
                      }

                      if (isClickOnTarget) {
                        if (selectedDay?.dateKey === d.dateKey) {
                          onSelectDay(null);
                        } else {
                          onSelectDay(d);
                        }
                      } else {
                        onSelectDay(null);
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
                        strokeWidth={selectedDay?.dateKey === d.dateKey ? '1.5' : '1'}
                        strokeDasharray={selectedDay?.dateKey === d.dateKey ? 'none' : '3 3'}
                        className="pointer-events-none animate-in fade-in duration-200"
                      />
                    )}

                    {/* Hover & Selection marker dot */}
                    {chartMode === 'cumulative' && timeRange !== 'total' && (isHovered || selectedDay?.dateKey === d.dateKey) && (
                      <circle
                        cx={getX(i)}
                        cy={yPos}
                        r={selectedDay?.dateKey === d.dateKey ? '6' : '5'}
                        className={cn(
                          'pointer-events-none transition-all duration-300',
                          isOverBudget ? 'fill-heart text-heart' : 'fill-text-primary text-text-primary'
                        )}
                        style={{
                          filter:
                            selectedDay?.dateKey === d.dateKey
                              ? 'drop-shadow(0 0 10px currentColor)'
                              : 'drop-shadow(0 0 6px currentColor)',
                        }}
                      />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* X-Axis Labels */}
            <div className="absolute inset-x-0 bottom-0 h-8 pointer-events-none">
              {chartData.map((day, idx) => {
                const xPercent = (getX(idx) / viewBoxWidth) * 100;
                const shouldHideOnMobile = chartData.length > 15 && idx % 4 !== 0 && idx !== chartData.length - 1;
                const shouldHideOnTablet = chartData.length > 15 && idx % 2 !== 0 && idx !== chartData.length - 1;

                return (
                  <div
                    key={idx}
                    className={cn(
                      'absolute flex flex-col items-center top-0 origin-center transition-opacity',
                      shouldHideOnMobile ? 'hidden md:flex' : 'flex',
                      shouldHideOnTablet ? 'md:hidden lg:flex' : 'md:flex'
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
  );
};
