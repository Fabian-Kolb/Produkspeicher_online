import React, { useState } from 'react';
import { TrendingUp, Tag, ShoppingBag, Pencil, Check } from 'lucide-react';
import { cn } from '../../utils/cn';
import { triggerHaptic } from '../../utils/haptics';

interface BudgetKpiCardsProps {
  timeRangeLabel: string;
  timeRangeSpend: number;
  averagePrice: number;
  timeRangeProductsCount: number;
  monthlyBudget: number;
  onUpdateBudget: (newBudget: number) => void;
}

export const BudgetKpiCards: React.FC<BudgetKpiCardsProps> = ({
  timeRangeLabel,
  timeRangeSpend,
  averagePrice,
  timeRangeProductsCount,
  monthlyBudget,
  onUpdateBudget,
}) => {
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState(String(monthlyBudget));
  const [budgetEditMode, setBudgetEditMode] = useState<'day' | 'week' | 'month'>('month');

  const handleEditModeChange = (mode: 'day' | 'week' | 'month') => {
    triggerHaptic(10);
    setBudgetEditMode(mode);
    if (mode === 'month') {
      setTempBudget(String(monthlyBudget));
    } else if (mode === 'week') {
      setTempBudget(String(Math.round((monthlyBudget / 30) * 7)));
    } else {
      setTempBudget(String(Math.round(monthlyBudget / 30)));
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
      onUpdateBudget(Math.round(finalMonthlyBudget));
      triggerHaptic(15);
    } else {
      setTempBudget(String(monthlyBudget));
    }
    setIsEditingBudget(false);
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-4 sm:mb-5">
      {/* 1. Ausgaben */}
      <div className="bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-xl p-3.5 sm:p-4 rounded-2xl shadow-sm flex flex-col justify-between group hover:border-text-secondary/40 transition-colors">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider">
            Ausgaben ({timeRangeLabel})
          </span>
          <div className="w-7 h-7 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
            <TrendingUp size={14} />
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-text-primary">
            {timeRangeSpend.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-sm sm:text-base font-bold text-text-secondary">€</span>
        </div>
      </div>

      {/* 2. Ø Preis */}
      <div className="bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-xl p-3.5 sm:p-4 rounded-2xl shadow-sm flex flex-col justify-between group hover:border-text-secondary/40 transition-colors">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider">
            Ø Preis ({timeRangeLabel})
          </span>
          <div className="w-7 h-7 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
            <Tag size={14} />
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-text-primary">
            {averagePrice.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-sm sm:text-base font-bold text-text-secondary">€</span>
        </div>
      </div>

      {/* 3. Käufe */}
      <div className="bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-xl p-3.5 sm:p-4 rounded-2xl shadow-sm flex flex-col justify-between group hover:border-text-secondary/40 transition-colors">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider">
            Käufe ({timeRangeLabel})
          </span>
          <div className="w-7 h-7 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
            <ShoppingBag size={14} />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-text-primary">
            {timeRangeProductsCount}
          </span>
          <span className="text-xs font-semibold text-text-secondary">
            {timeRangeProductsCount === 1 ? 'Artikel' : 'Artikel'}
          </span>
        </div>
      </div>

      {/* 4. Monatsbudget */}
      <div className="bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-xl p-3.5 sm:p-4 rounded-2xl shadow-sm flex flex-col justify-between group hover:border-text-secondary/40 transition-colors">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider truncate">
              Monatsbudget
            </span>
          </div>
          {!isEditingBudget && (
            <button
              onClick={() => {
                triggerHaptic(15);
                setIsEditingBudget(true);
                handleEditModeChange('month');
              }}
              className="flex items-center gap-1 text-[10px] font-bold text-accent bg-accent/10 hover:bg-accent/20 border border-accent/25 px-2.5 py-0.5 rounded-full transition-all cursor-pointer select-none"
              title="Budget anpassen"
            >
              <Pencil size={10} />
              <span>Anpassen</span>
            </button>
          )}
        </div>

        {isEditingBudget ? (
          <div className="flex flex-col gap-2 animate-in fade-in duration-200">
            <div className="flex bg-text-primary/5 border border-[var(--theme-glass-border)] p-0.5 rounded-full text-[9px] font-bold self-start select-none">
              {(['day', 'week', 'month'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleEditModeChange(mode)}
                  className={cn(
                    'px-2 py-0.5 rounded-full transition-all uppercase cursor-pointer',
                    budgetEditMode === mode
                      ? 'bg-accent text-bg-primary shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  )}
                >
                  {mode === 'day' ? 'Tag' : mode === 'week' ? 'Woche' : 'Monat'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={tempBudget}
                onChange={(e) => setTempBudget(e.target.value)}
                onBlur={handleBudgetSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleBudgetSubmit();
                }}
                className="w-24 bg-text-primary/10 border border-accent/40 focus:border-accent px-2.5 py-1 rounded-xl text-lg font-extrabold outline-none text-text-primary shadow-sm"
                autoFocus
              />
              <span className="text-base font-bold text-text-secondary">€</span>
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleBudgetSubmit();
                }}
                className="ml-auto p-1.5 bg-accent text-bg-primary rounded-xl hover:opacity-90 transition-all cursor-pointer shadow-sm"
                title="Speichern"
              >
                <Check size={14} strokeWidth={3} />
              </button>
            </div>
          </div>
        ) : (
          <div 
            className="cursor-pointer group/budget"
            onClick={() => {
              triggerHaptic(15);
              setIsEditingBudget(true);
              handleEditModeChange('month');
            }}
          >
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary group-hover/budget:text-accent transition-colors">
                {monthlyBudget.toLocaleString('de-DE')}
              </span>
              <span className="text-base sm:text-lg font-bold text-text-secondary">€</span>
            </div>
            <div className="flex gap-3 mt-1.5 text-[10px] text-text-secondary font-semibold border-t border-border-primary/10 pt-1.5">
              <div>
                Woche: <span className="text-text-primary font-bold">{Math.round((monthlyBudget / 30) * 7)} €</span>
              </div>
              <div>
                Tag: <span className="text-text-primary font-bold">{Math.round(monthlyBudget / 30)} €</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
