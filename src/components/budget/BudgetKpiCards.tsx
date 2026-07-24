import React, { useState } from 'react';
import { cn } from '../../utils/cn';

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
    } else {
      setTempBudget(String(monthlyBudget));
    }
    setIsEditingBudget(false);
  };

  return (
    <div className="grid grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-6 mb-8">
      {/* Ausgaben */}
      <div className="bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-xl p-3 sm:p-6 rounded-2xl shadow-sm">
        <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">
          Ausgaben<span className="hidden sm:inline"> ({timeRangeLabel})</span>
        </h3>
        <p className="text-sm sm:text-2xl font-bold">
          {timeRangeSpend.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
        </p>
      </div>

      {/* Ø Preis */}
      <div className="bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-xl p-3 sm:p-6 rounded-2xl shadow-sm">
        <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">
          Ø Preis<span className="hidden sm:inline"> ({timeRangeLabel})</span>
        </h3>
        <p className="text-sm sm:text-2xl font-bold">
          {averagePrice.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
        </p>
      </div>

      {/* Käufe */}
      <div className="bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-xl p-3 sm:p-6 rounded-2xl shadow-sm">
        <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">
          Käufe<span className="hidden sm:inline"> ({timeRangeLabel})</span>
        </h3>
        <p className="text-sm sm:text-2xl font-bold">{timeRangeProductsCount}</p>
      </div>

      {/* Monatsbudget */}
      <div className="col-span-3 lg:col-span-1 bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-xl p-3 sm:p-6 rounded-2xl shadow-sm group transition-all duration-300 hover:shadow-md flex flex-col justify-center">
        <div className="flex justify-between items-center mb-1.5">
          <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Monatsbudget</h3>
          {!isEditingBudget && (
            <button
              onClick={() => {
                setIsEditingBudget(true);
                handleEditModeChange('month');
              }}
              className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-text-secondary hover:text-text-primary p-1 bg-text-primary/5 rounded cursor-pointer"
              title="Budget bearbeiten"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                ></path>
              </svg>
            </button>
          )}
        </div>
        {isEditingBudget ? (
          <div className="flex flex-col gap-2 animate-in fade-in duration-300">
            <div className="flex bg-text-primary/5 border border-[var(--theme-glass-border)] p-0.5 rounded-lg text-[9px] font-bold self-start select-none">
              {(['day', 'week', 'month'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleEditModeChange(mode)}
                  className={cn(
                    'px-2 py-0.5 rounded transition-all uppercase cursor-pointer',
                    budgetEditMode === mode
                      ? 'bg-accent text-bg-primary shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleBudgetSubmit();
                }}
                className="w-20 bg-text-primary/5 border border-border-primary/50 hover:border-text-secondary focus:border-text-secondary px-2 py-0.5 rounded-lg text-lg font-bold outline-none text-text-primary hover:-translate-y-0.5 focus:-translate-y-0.5 hover:scale-[1.03] focus:scale-[1.03] hover:shadow-md focus:shadow-md transition-all duration-300"
                autoFocus
              />
              <span className="text-sm font-bold">€</span>
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleBudgetSubmit();
                }}
                className="ml-auto p-1 bg-accent/15 border border-accent/20 rounded-lg text-accent hover:bg-accent hover:text-bg-primary transition-all duration-300 cursor-pointer"
                title="Speichern"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p
              className="text-2xl font-bold cursor-pointer transition-colors hover:text-accent"
              onClick={() => {
                setIsEditingBudget(true);
                handleEditModeChange('month');
              }}
            >
              {monthlyBudget.toLocaleString('de-DE')} €
            </p>
            <div className="flex gap-3 mt-1.5 text-[9px] text-text-secondary font-semibold border-t border-[var(--theme-glass-border)]/40 pt-1.5">
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
