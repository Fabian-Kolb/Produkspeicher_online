import React, { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { Product } from '../types';

export const AnalyticsView: React.FC = () => {
  const { products, settings } = useAppStore();

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const boughtProducts = useMemo(() => products.filter((p: Product) => p.status === 'bought'), [products]);
  
  const spentThisMonth = useMemo(() => {
    return boughtProducts
      .filter((p: Product) => new Date(p.dateAdded).getMonth() === currentMonth && new Date(p.dateAdded).getFullYear() === currentYear)
      .reduce((sum: number, p: Product) => sum + p.finalPrice, 0);
  }, [boughtProducts, currentMonth, currentYear]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[calc(100vh-100px)]">
      {/* Header */}
      <div className="flex justify-between items-center mb-10 px-2 mt-4">
        <h1 className="text-3xl font-playfair font-bold">Budget & Analytics</h1>
        
        <div className="bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-md px-1 py-1 flex items-center rounded-full shadow-sm">
          <button className="px-4 py-1.5 rounded-full bg-text-primary text-bg-primary text-xs font-bold shadow-md">7 Tage</button>
          <button className="px-4 py-1.5 rounded-full text-text-secondary hover:text-text-primary text-xs font-bold transition-colors">Dieser Monat</button>
          <button className="px-4 py-1.5 rounded-full text-text-secondary hover:text-text-primary text-xs font-bold transition-colors">Gesamt</button>
          <button className="px-4 py-1.5 rounded-full text-text-secondary hover:text-text-primary text-xs font-bold transition-colors">Benutzerdefiniert</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-xl p-6 rounded-2xl shadow-sm">
          <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">Ausgaben (7 Tage)</h3>
          <p className="text-2xl font-bold">0,00 €</p>
        </div>
        <div className="bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-xl p-6 rounded-2xl shadow-sm">
          <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">Käufe (7 Tage)</h3>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-xl p-6 rounded-2xl shadow-sm">
          <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">Teuerstes (7 Tage)</h3>
          <p className="text-2xl font-bold">-</p>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Chart Area */}
        <div className="lg:col-span-2 bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-xl p-6 rounded-3xl shadow-sm flex flex-col min-h-[400px]">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold">Ausgabenverlauf</h3>
            <span className="text-xs text-text-secondary">Ausgaben (€)</span>
          </div>
          
          {/* Mock Chart */}
          <div className="flex-1 relative border-l border-b border-text-secondary/30 mt-4 mx-4 mb-8">
            <div className="absolute -left-12 bottom-0 text-[10px] text-text-secondary">0,00 €</div>
            <div className="absolute -left-12 bottom-[25%] text-[10px] text-text-secondary">30,00 €</div>
            <div className="absolute -left-12 bottom-[50%] text-[10px] text-text-secondary">60,00 €</div>
            <div className="absolute -left-12 bottom-[75%] text-[10px] text-text-secondary">90,00 €</div>
            <div className="absolute -left-12 top-0 text-[10px] text-text-secondary">120,00 €</div>
            
            <div className="absolute -bottom-6 left-[0%] text-[10px] text-text-secondary">06.03.</div>
            <div className="absolute -bottom-6 left-[20%] text-[10px] text-text-secondary">07.03.</div>
            <div className="absolute -bottom-6 left-[40%] text-[10px] text-text-secondary">08.03.</div>
            <div className="absolute -bottom-6 left-[60%] text-[10px] text-text-secondary">09.03.</div>
            <div className="absolute -bottom-6 left-[80%] text-[10px] text-text-secondary">10.03.</div>
            <div className="absolute -bottom-6 left-[100%] text-[10px] text-text-secondary transform -translate-x-full">11.03.</div>
          </div>
        </div>
        
        {/* Budget Tracker */}
        <div className="bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-xl p-6 rounded-3xl shadow-sm flex flex-col h-fit">
          <h3 className="font-bold mb-6">Budget Tracker</h3>
          <p className="text-3xl font-bold mb-1">{spentThisMonth.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €</p>
          <p className="text-xs text-text-secondary mb-6">von {settings.monthlyBudget.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} € Budget</p>
          
          <div className="w-full h-3 bg-white/30 dark:bg-black/30 rounded-full mb-4 overflow-hidden shadow-inner">
            <div 
              className="h-full bg-emerald-400 rounded-full" 
              style={{ width: `${Math.min((spentThisMonth / settings.monthlyBudget) * 100, 100)}%` }}
            ></div>
          </div>
          
          <p className="text-xs font-medium text-emerald-500">
            Noch {(settings.monthlyBudget - spentThisMonth).toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} € verfügbar
          </p>
        </div>
      </div>
      
      {/* Transactions */}
      <div>
        <h3 className="font-bold mb-4 px-2">Transaktionen</h3>
        <p className="px-2 text-sm text-text-secondary">Keine kürzlichen Transaktionen vorhanden.</p>
      </div>
    </div>
  );
};

// Removed old StatCard
