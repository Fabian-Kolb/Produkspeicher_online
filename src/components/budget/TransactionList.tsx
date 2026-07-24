import React from 'react';
import type { Product } from '../../types';
import { cn } from '../../utils/cn';

interface TransactionGroup {
  monthLabel: string;
  products: Product[];
}

interface TransactionListProps {
  groupedTransactions: TransactionGroup[];
  sortBy: 'date' | 'price';
  setSortBy: (s: 'date' | 'price') => void;
  onProductClick: (p: Product) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  groupedTransactions,
  sortBy,
  setSortBy,
  onProductClick,
}) => {
  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-6 px-2">
        <h3 className="font-bold text-xl tracking-wide">Transaktionen</h3>

        {/* Sort By Toggle */}
        <div className="bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-md px-1 py-1 flex items-center rounded-full shadow-sm text-xs">
          <button
            onClick={() => setSortBy('date')}
            className={cn(
              'px-3 py-1.5 rounded-full font-bold transition-all duration-300 cursor-pointer',
              sortBy === 'date'
                ? 'bg-accent text-bg-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary bg-text-primary/5'
            )}
          >
            Datum
          </button>
          <button
            onClick={() => setSortBy('price')}
            className={cn(
              'px-3 py-1.5 rounded-full font-bold transition-all duration-300 cursor-pointer',
              sortBy === 'price'
                ? 'bg-accent text-bg-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary bg-text-primary/5'
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
                {group.products.map((p) => {
                  const dateObj = new Date(p.dateBought || p.dateAdded);
                  const dateStr = dateObj.toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  });

                  return (
                    <div
                      key={p.id}
                      onClick={() => onProductClick(p)}
                      className="bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-xl p-4 md:p-5 rounded-3xl shadow-sm flex items-center gap-5 cursor-pointer hover:shadow-lg hover:border-accent/50 transition-all duration-300 group"
                    >
                      {p.imgs && p.imgs.length > 0 ? (
                        <img
                          src={p.imgs[p.mainImgIdx || 0]}
                          alt={p.name}
                          className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover shadow-sm bg-text-primary/10 shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-[var(--theme-glass-border)] flex items-center justify-center text-2xl font-bold text-text-secondary shrink-0 shadow-sm">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex flex-col flex-1 min-w-0 justify-center">
                        <span className="text-lg md:text-xl font-bold truncate text-text-primary transition-colors group-hover:text-accent">
                          {p.name}
                        </span>
                        <span className="text-xs md:text-sm text-text-secondary mt-1 font-medium">
                          {dateStr} {p.mainCat ? `• ${p.mainCat}` : ''}
                        </span>
                      </div>
                      <span className="text-xl md:text-2xl font-bold font-mono tracking-tight shrink-0 whitespace-nowrap pr-2 md:pr-4 text-text-primary">
                        {(p.finalPrice || 0).toLocaleString('de-DE', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        €
                      </span>
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
  );
};
