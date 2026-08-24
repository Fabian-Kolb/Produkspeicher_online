import React from 'react';
import { Receipt, Calendar, X, MousePointerClick, ShoppingBag, CheckCircle2, AlertCircle } from 'lucide-react';
import type { ChartDataItem } from './BudgetChart';
import { Button } from '../common/Button';
import { triggerHaptic } from '../../utils/haptics';
import { cn } from '../../utils/cn';

interface ReceiptPanelProps {
  timeRange: '7d' | 'month' | 'total' | 'custom';
  selectedDay: ChartDataItem | null;
  monthlyBudget: number;
  onSelectDay?: (day: ChartDataItem | null) => void;
  chartData?: ChartDataItem[];
  actualData?: ChartDataItem[];
}

export const ReceiptPanel: React.FC<ReceiptPanelProps> = ({
  timeRange,
  selectedDay,
  monthlyBudget,
  onSelectDay,
  chartData = [],
  actualData = [],
}) => {
  // Find today's item in chartData, or current active month/period
  const quickSelectDay = React.useMemo(() => {
    const now = new Date();
    if (timeRange === 'total') {
      const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const foundMonth = chartData.find(d => d.dateKey === currentMonthKey);
      return foundMonth || actualData[actualData.length - 1] || chartData[0] || null;
    }

    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    // Find today in chartData (or actualData)
    const foundToday = chartData.find(d => d.dateKey === todayKey);
    if (foundToday) return foundToday;

    // If today is not in this view/month (e.g. viewing a past month/week), select the last day of that period
    if (actualData.length > 0) {
      return actualData[actualData.length - 1];
    }
    return chartData[0] || null;
  }, [actualData, chartData, timeRange]);

  const handleQuickSelect = () => {
    if (quickSelectDay && onSelectDay) {
      triggerHaptic(15);
      onSelectDay(quickSelectDay);
    }
  };

  return (
    <div className="bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-xl p-3.5 sm:p-5 rounded-3xl shadow-sm flex flex-col h-full min-h-[320px] sm:min-h-[350px] md:min-h-[370px] relative overflow-hidden group">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-accent/15 flex items-center justify-center text-accent shadow-sm">
            <Receipt size={16} strokeWidth={2.5} />
          </div>
          <h3 className="font-bold text-sm tracking-wide text-text-primary">
            {timeRange === 'total' ? 'MONATSBELEG' : 'TAGESBELEG'}
          </h3>
        </div>

        {selectedDay && (
          <div className="flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-200">
            <span className="text-[11px] font-semibold text-accent bg-accent/10 border border-accent/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <Calendar size={12} />
              <span>
                {timeRange === '7d'
                  ? `${selectedDay.label}, ${selectedDay.dateLabel}`
                  : selectedDay.dateLabel || selectedDay.label}
              </span>
            </span>
            {onSelectDay && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(10);
                  onSelectDay(null);
                }}
                className="w-6 h-6 flex items-center justify-center rounded-full text-text-secondary hover:text-text-primary hover:bg-text-primary/10 transition-colors cursor-pointer"
                title="Beleg schließen"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {selectedDay ? (
        <div className="flex flex-col h-full flex-1 min-h-[150px] animate-in fade-in duration-300">
          {/* List of Products */}
          <div className="flex flex-col gap-2.5 overflow-y-auto flex-1 pr-1 mb-4 scrollbar-thin">
            {selectedDay.products.length > 0 ? (
              selectedDay.products.map((p, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center gap-3 p-2.5 rounded-2xl bg-text-primary/[0.03] border border-border-primary/10 hover:bg-text-primary/[0.06] transition-colors group/item"
                >
                  {p.imgs && p.imgs.length > 0 ? (
                    <img
                      src={p.imgs[p.mainImgIdx || 0]}
                      alt={p.name}
                      className="w-10 h-10 rounded-xl object-cover bg-text-primary/10 shrink-0 shadow-sm border border-border-primary/10"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center text-sm font-bold shrink-0 shadow-sm">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-xs font-bold truncate text-text-primary group-hover/item:text-accent transition-colors">
                      {p.name}
                    </span>
                    <span className="text-[10px] text-text-secondary truncate">{p.shop || p.mainCat || 'Einkauf'}</span>
                  </div>
                  <span className="text-xs font-extrabold font-mono text-text-primary shrink-0">
                    {(p.finalPrice || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                  </span>
                </div>
              ))
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center py-6 text-center text-text-secondary/70">
                <div className="w-12 h-12 rounded-full bg-text-primary/5 flex items-center justify-center mb-2 text-text-secondary/50">
                  <ShoppingBag size={22} strokeWidth={1.5} />
                </div>
                <p className="text-xs font-semibold text-text-primary">Keine Einkäufe an diesem Tag</p>
                <span className="text-[11px] text-text-secondary mt-0.5">0,00 € Ausgaben verzeichnet</span>
              </div>
            )}
          </div>

          {/* Supermarket Receipt Total & Budget Summary */}
          <div className="mt-auto relative pt-3.5 pb-1 shrink-0 border-t border-dashed border-border-primary/30">
            <div className="flex justify-between items-end mb-3">
              <div className="flex flex-col">
                <span className="text-[10px] text-text-secondary uppercase tracking-wider font-extrabold">
                  Endsumme
                </span>
                <span className="text-[10px] text-text-secondary font-medium">
                  {selectedDay.products.length} {selectedDay.products.length === 1 ? 'Artikel' : 'Artikel'}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black font-mono tracking-tight text-text-primary">
                  {selectedDay.dailyValue.toLocaleString('de-DE', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="text-sm font-bold text-text-secondary">€</span>
              </div>
            </div>

            {/* Budget Limit Comparison */}
            {(() => {
              const budgetLimit = timeRange === 'total' ? monthlyBudget : monthlyBudget / 30;
              const diffVal = selectedDay.dailyValue - budgetLimit;
              const isOver = diffVal > 0;
              return (
                <div className={cn(
                  "p-2.5 rounded-xl flex items-center justify-between text-xs font-semibold border transition-colors",
                  isOver 
                    ? "bg-heart/10 text-heart border-heart/20" 
                    : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                )}>
                  <div className="flex items-center gap-1.5">
                    {isOver ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                    <span>{isOver ? 'Über Tagesbudget:' : 'Unter Tagesbudget:'}</span>
                  </div>
                  <span className="font-bold font-mono">
                    {isOver ? '+' : '-'}
                    {Math.abs(diffVal).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                  </span>
                </div>
              );
            })()}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center flex-1 text-center px-4 py-6 animate-in fade-in duration-300">
          <div className="relative mb-4">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shadow-lg shadow-accent/5">
              <Receipt size={30} strokeWidth={1.8} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-accent text-bg-primary flex items-center justify-center shadow-md animate-bounce">
              <MousePointerClick size={13} strokeWidth={2.5} />
            </div>
          </div>
          <h4 className="text-sm font-bold text-text-primary mb-1">Interaktiver Kassenbeleg</h4>
          <p className="text-xs text-text-secondary mb-5 max-w-[240px] leading-relaxed">
            Klicke im Diagramm links auf einen beliebigen Tag, um alle Details und die Budget-Bilanz anzuzeigen.
          </p>
          {quickSelectDay && onSelectDay && (
            <Button
              variant="secondary"
              onClick={handleQuickSelect}
              className="text-xs font-bold gap-2 py-2 px-4 shadow-sm"
            >
              <Calendar size={13} />
              <span>{timeRange === 'total' ? 'Aktuellen Monat öffnen' : 'Aktuellen Tag öffnen'}</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
