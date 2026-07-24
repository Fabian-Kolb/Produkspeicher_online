import React from 'react';
import type { ChartDataItem } from './BudgetChart';

interface ReceiptPanelProps {
  timeRange: '7d' | 'month' | 'total';
  selectedDay: ChartDataItem | null;
  monthlyBudget: number;
}

export const ReceiptPanel: React.FC<ReceiptPanelProps> = ({
  timeRange,
  selectedDay,
  monthlyBudget,
}) => {
  return (
    <div className="bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-xl p-4 sm:p-6 rounded-3xl shadow-sm flex flex-col h-[390px] relative overflow-hidden group order-1 lg:order-2">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-sm tracking-wide flex items-center gap-2">
          <svg className="w-4 h-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          {timeRange === 'total' ? 'MONATSBELEG' : 'TAGESBELEG'}
        </h3>
        {selectedDay && (
          <span className="text-[10px] font-mono font-medium opacity-50 bg-text-primary/5 px-2 py-1 rounded animate-in fade-in">
            {timeRange === '7d'
              ? `${selectedDay.label}, ${selectedDay.dateLabel}`
              : selectedDay.dateLabel || selectedDay.label}
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
                    <img
                      src={p.imgs[p.mainImgIdx || 0]}
                      alt={p.name}
                      className="w-12 h-12 rounded-xl object-cover bg-text-primary/10 shrink-0 shadow-sm"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-[var(--theme-glass-border)] flex items-center justify-center text-lg font-bold text-text-secondary shrink-0 shadow-sm">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm font-semibold truncate text-text-primary group-hover/item:text-accent transition-colors uppercase tracking-tight">
                      {p.name}
                    </span>
                    <span className="text-[10px] text-text-secondary truncate">{p.mainCat || 'Ohne Kategorie'}</span>
                  </div>
                  <span className="text-sm font-bold font-mono opacity-90 shrink-0">
                    {(p.finalPrice || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                  </span>
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
            {/* Dashed Line SVG for "Receipt" look */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px] w-full"
              style={{
                backgroundImage: 'linear-gradient(to right, var(--text-dark) 40%, transparent 40%)',
                backgroundSize: '8px 1px',
                backgroundRepeat: 'repeat-x',
                opacity: 0.2,
              }}
            ></div>

            {/* Cut-out circles at the edges */}
            <div className="absolute -left-8 -top-[7px] w-4 h-4 bg-[var(--bg-color)] rounded-full shadow-inner"></div>
            <div className="absolute -right-8 -top-[7px] w-4 h-4 bg-[var(--bg-color)] rounded-full shadow-inner"></div>

            <div className="flex justify-between items-end mb-4">
              <div className="flex flex-col">
                <span className="text-[10px] text-text-secondary uppercase tracking-widest font-bold mb-1">
                  Endsumme
                </span>
                <span className="text-[10px] text-text-secondary">
                  {selectedDay.products.length} {selectedDay.products.length === 1 ? 'Position' : 'Positionen'}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold text-text-secondary">€</span>
                <span className="text-3xl font-bold font-mono tracking-tight text-text-primary group-hover:text-accent transition-colors duration-500">
                  {selectedDay.dailyValue.toLocaleString('de-DE', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            {/* Supermarket Receipt Budget Summary */}
            {(() => {
              const budgetLimit = timeRange === 'total' ? monthlyBudget : monthlyBudget / 30;
              const diffVal = selectedDay.dailyValue - budgetLimit;
              return (
                <div className="pt-3 border-t border-dashed border-text-secondary/20 flex flex-col gap-1 text-[10px] text-text-secondary font-mono">
                  <div className="flex justify-between">
                    <span>{timeRange === 'total' ? 'MONATSBUDGET:' : 'TAGESBUDGET:'}</span>
                    <span>
                      {budgetLimit.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>{diffVal > 0 ? 'ÜBERSCHREITUNG:' : 'ERSPARNIS:'}</span>
                    <span className={diffVal > 0 ? 'text-heart' : 'text-emerald-500'}>
                      {diffVal > 0 ? '+' : ''}
                      {Math.abs(diffVal).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 opacity-40 animate-in fade-in">
          <div className="w-16 h-16 mb-4 rounded-2xl bg-text-primary/5 flex items-center justify-center">
            <svg className="w-8 h-8 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="text-xs italic font-medium max-w-[180px] text-center">
            {timeRange === 'total'
              ? 'Wähle einen Monat im Diagramm aus, um den Beleg anzuzeigen.'
              : 'Wähle einen Tag im Diagramm aus, um den Beleg anzuzeigen.'}
          </p>
        </div>
      )}
    </div>
  );
};
