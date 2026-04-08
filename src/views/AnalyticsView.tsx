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
      .filter((p: Product) => {
        const date = p.dateBought || p.dateAdded;
        const d = new Date(date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum: number, p: Product) => sum + (p.finalPrice || 0), 0);
  }, [boughtProducts, currentMonth, currentYear]);

  // Chart data calculation
  const chartData = useMemo(() => {
    const data = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
      
      const dayProducts = boughtProducts.filter(p => {
        const pDate = new Date(p.dateBought || p.dateAdded);
        return pDate.getDate() === d.getDate() && 
               pDate.getMonth() === d.getMonth() && 
               pDate.getFullYear() === d.getFullYear();
      });
      
      const dayTotal = dayProducts.reduce((sum, p) => sum + (p.finalPrice || 0), 0);
        
      data.push({ 
        label: dayStr, 
        value: dayTotal, 
        products: dayProducts 
      });
    }
    return data;
  }, [boughtProducts]);

  const maxChartVal = Math.max(...chartData.map(d => d.value), 100);

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
          <p className="text-2xl font-bold">{chartData.reduce((sum, d) => sum + d.value, 0).toLocaleString('de-DE', {minimumFractionDigits: 2})} €</p>
        </div>
        <div className="bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-xl p-6 rounded-2xl shadow-sm">
          <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">Käufe (Gesamt)</h3>
          <p className="text-2xl font-bold">{boughtProducts.length}</p>
        </div>
        <div className="bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-xl p-6 rounded-2xl shadow-sm">
          <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">Monatsbudget</h3>
          <p className="text-2xl font-bold">{settings.monthlyBudget.toLocaleString('de-DE')} €</p>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Chart Area */}
        <div className="lg:col-span-2 bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-xl p-6 rounded-3xl shadow-sm flex flex-col min-h-[400px] relative overflow-hidden">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold">Ausgabenverlauf</h3>
            <span className="text-xs text-text-secondary">Ausgaben (€)</span>
          </div>
          
          {/* New SVG Line Chart */}
          <div className="flex-1 relative mt-4 mx-6 mb-10 h-[250px]">
            <svg 
              className="w-full h-full overflow-visible" 
              viewBox="0 0 600 250" 
              preserveAspectRatio="none"
            >
              {/* Definitions for Gradients */}
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--text-dark)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="var(--text-dark)" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Area Fill */}
              <path
                d={`
                  M 0,250
                  ${chartData.map((d, i) => `L ${i * 100},${250 - (d.value / maxChartVal) * 220}`).join(' ')}
                  L 600,250
                  Z
                `}
                fill="url(#chartGradient)"
                className="transition-all duration-1000 ease-in-out"
              />

              {/* Line */}
              <path
                d={`
                  M 0,${250 - (chartData[0].value / maxChartVal) * 220}
                  ${chartData.slice(1).map((d, i) => `L ${(i + 1) * 100},${250 - (d.value / maxChartVal) * 220}`).join(' ')}
                `}
                fill="none"
                stroke="var(--text-dark)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-1000 ease-in-out"
              />

              {/* Data Points */}
              {chartData.map((d, i) => (
                <g key={i} className="group cursor-pointer">
                  <circle
                    cx={i * 100}
                    cy={250 - (d.value / maxChartVal) * 220}
                    r="5"
                    fill="var(--bg-color)"
                    stroke="var(--text-dark)"
                    strokeWidth="2.5"
                    className="transition-all duration-300 group-hover:r-[7px]"
                  />
                  {/* Tooltip on Hover */}
                  <foreignObject
                    x={i * 100 - 90}
                    y={250 - (d.value / maxChartVal) * 220 - (d.products.length > 0 ? (d.products.length * 25 + 60) : 50)}
                    width="180"
                    height={d.products.length > 0 ? (d.products.length * 25 + 60) : 50}
                    className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50 overflow-visible"
                  >
                    <div className="bg-text-primary/95 text-bg-primary backdrop-blur-md p-3 rounded-xl shadow-2xl flex flex-col gap-1 w-full animate-in zoom-in-95 duration-200">
                      <div className="flex justify-between items-center border-b border-bg-primary/20 pb-1 mb-1">
                        <span className="text-[10px] font-bold opacity-70">{d.label}</span>
                        <span className="text-[10px] font-bold">{d.value.toLocaleString('de-DE')} €</span>
                      </div>
                      <div className="flex flex-col gap-1 max-h-[150px] overflow-y-auto pr-1">
                        {d.products.length > 0 ? (
                          d.products.map((p, pIdx) => (
                            <div key={pIdx} className="flex justify-between items-center text-[9px]">
                              <span className="truncate flex-1 mr-2">{p.name}</span>
                              <span className="font-bold">{(p.finalPrice || 0).toLocaleString('de-DE')} €</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-[9px] opacity-60 italic">Keine Käufe</span>
                        )}
                      </div>
                      {d.products.length > 1 && (
                        <div className="border-t border-bg-primary/20 pt-1 mt-1 flex justify-between text-[10px] font-bold">
                          <span>Gesamt</span>
                          <span>{d.value.toLocaleString('de-DE')} €</span>
                        </div>
                      )}
                    </div>
                  </foreignObject>
                </g>
              ))}
            </svg>

            {/* X-Axis Labels (Sync with SVG by using absolute positioning based on interval width) */}
            <div className="absolute inset-x-0 -bottom-8 flex justify-between">
              {chartData.map((day, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1">
                  <div className="w-[1px] h-2 bg-[var(--theme-glass-border)] mb-1"></div>
                  <span className="text-[10px] text-text-secondary font-medium whitespace-nowrap">{day.label}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Y-Axis Grid Lines & Labels */}
          <div className="absolute inset-x-6 top-[100px] bottom-[100px] pointer-events-none">
            <div className="border-t border-[var(--theme-glass-border)] w-full h-1/2 absolute top-0 flex items-center">
              <span className="text-[9px] text-text-secondary -ml-4">{maxChartVal.toLocaleString('de-DE')} €</span>
            </div>
            <div className="border-t border-[var(--theme-glass-border)] w-full h-1/2 absolute top-1/2 flex items-center">
              <span className="text-[9px] text-text-secondary -ml-4">{(maxChartVal/2).toLocaleString('de-DE')} €</span>
            </div>
            <div className="border-t border-[var(--theme-glass-border)] w-full absolute bottom-0 flex items-center">
              <span className="text-[9px] text-text-secondary -ml-4">0 €</span>
            </div>
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
