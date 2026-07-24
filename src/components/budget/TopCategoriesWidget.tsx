import React from 'react';

interface CategoryItem {
  name: string;
  amount: number;
}

interface TopCategoriesWidgetProps {
  topCategories: CategoryItem[];
  maxCategorySpend: number;
}

export const TopCategoriesWidget: React.FC<TopCategoriesWidgetProps> = ({
  topCategories,
  maxCategorySpend,
}) => {
  return (
    <div className="bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-xl p-3.5 xs:p-4 sm:p-5 rounded-3xl shadow-sm flex flex-col relative min-w-0">
      <h3 className="font-bold text-xs sm:text-sm mb-3 sm:mb-6">Top Kategorien</h3>
      <div className="flex flex-col gap-3 sm:gap-5 flex-1 justify-center">
        {topCategories.length > 0 ? (
          topCategories.map((cat, idx) => (
            <div key={idx} className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-[11px] sm:text-sm">
                <span className="truncate pr-1.5 font-semibold text-text-primary">{cat.name}</span>
                <span className="font-bold shrink-0">
                  {cat.amount.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €
                </span>
              </div>
              <div className="w-full h-1.5 sm:h-2 bg-text-primary/10 rounded-full overflow-hidden flex-shrink-0">
                <div
                  className="h-full rounded-full transition-all duration-1000 bg-text-primary"
                  style={{ width: `${Math.min((cat.amount / maxCategorySpend) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-[11px] sm:text-sm text-text-secondary italic">Keine Ausgaben</p>
        )}
      </div>
    </div>
  );
};
