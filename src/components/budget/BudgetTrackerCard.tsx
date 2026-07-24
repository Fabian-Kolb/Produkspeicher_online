import React from 'react';
import { cn } from '../../utils/cn';

interface BudgetTrackerCardProps {
  spentThisMonth: number;
  monthlyBudget: number;
  isCurrentMonth: boolean;
}

export const BudgetTrackerCard: React.FC<BudgetTrackerCardProps> = ({
  spentThisMonth,
  monthlyBudget,
  isCurrentMonth,
}) => {
  const isOverBudget = spentThisMonth > monthlyBudget;

  return (
    <div className="bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-xl p-3.5 xs:p-4 sm:p-5 rounded-3xl shadow-sm flex flex-col relative overflow-hidden group hover:shadow-lg transition-shadow duration-300 min-w-0">
      <div
        className={cn(
          'absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl transition-all duration-700',
          isOverBudget ? 'bg-heart/10 group-hover:bg-heart/20' : 'bg-emerald-500/10 group-hover:bg-emerald-500/20'
        )}
      ></div>

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex flex-wrap justify-between items-center gap-1 mb-3 sm:mb-6">
          <h3 className="font-bold text-xs sm:text-sm truncate">Budget Tracker</h3>
          <span
            className={cn(
              'text-[9px] sm:text-xs font-bold px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full border transition-colors shrink-0',
              isOverBudget ? 'bg-heart/10 text-heart border-heart/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
            )}
          >
            {monthlyBudget > 0 ? Math.round((spentThisMonth / monthlyBudget) * 100) : 0}%
          </span>
        </div>

        <div className="flex flex-col flex-1 justify-center">
          <div className="flex flex-col gap-0.5 mb-3 sm:mb-6">
            <span className="text-[9px] sm:text-xs text-text-secondary font-medium uppercase tracking-wider">
              Ausgegeben
            </span>
            <div className="flex items-baseline gap-1">
              <p className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
                {spentThisMonth.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
              <span className="text-xs sm:text-xl font-bold text-text-secondary">€</span>
            </div>
            {isOverBudget ? (
              <span className="text-[9px] sm:text-xs font-bold text-heart mt-1 bg-heart/10 w-max px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md animate-in fade-in duration-300 truncate max-w-full">
                {(spentThisMonth - monthlyBudget).toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} € drüber
              </span>
            ) : (
              <span className="text-[9px] sm:text-xs font-bold text-emerald-500 mt-1 bg-emerald-500/10 w-max px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md animate-in fade-in duration-300 truncate max-w-full">
                {isCurrentMonth
                  ? `${(monthlyBudget - spentThisMonth).toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} € übrig`
                  : `${(monthlyBudget - spentThisMonth).toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} € gespart`}
              </span>
            )}
          </div>

          {/* Enhanced Progress Bar */}
          <div className="w-full h-2 sm:h-3 bg-text-primary/10 rounded-full overflow-hidden shadow-inner relative mb-1.5">
            <div
              className={cn(
                'absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out overflow-hidden bg-gradient-to-r',
                isOverBudget ? 'from-heart/80 to-heart' : 'from-emerald-400 to-emerald-500'
              )}
              style={{ width: `${Math.min((spentThisMonth / (monthlyBudget || 1)) * 100, 100)}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
            </div>
          </div>

          <div className="flex justify-between text-[9px] sm:text-xs text-text-secondary font-bold mt-0.5">
            <span>0 €</span>
            <span className="truncate">Max: {monthlyBudget.toLocaleString('de-DE')} €</span>
          </div>
        </div>
      </div>
    </div>
  );
};
