import React, { useMemo, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { Product } from '../types';

export const BudgetView: React.FC = () => {
  const { products, settings } = useAppStore();
  const [timeRange, setTimeRange] = useState<'7d' | 'month' | 'total'>('7d');

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

  // Chart data calculation based on timeRange
  const chartData = useMemo(() => {
    const today = new Date();
    const dateMap: Record<string, { label: string, value: number, products: Product[] }> = {};
    
    if (timeRange === '7d') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateKey = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
        dateMap[dateKey] = { label, value: 0, products: [] };
      }
    } else if (timeRange === 'month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      for (let d = new Date(firstDay); d <= today; d.setDate(d.getDate() + 1)) {
        const dateKey = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('de-DE', { day: '2-digit' });
        dateMap[dateKey] = { label, value: 0, products: [] };
      }
    } else if (timeRange === 'total') {
      // Show last 6 months
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('de-DE', { month: 'short' });
        dateMap[dateKey] = { label, value: 0, products: [] };
      }
    }

    boughtProducts.forEach(p => {
      const pDate = new Date(p.dateBought || p.dateAdded);
      let pKey = '';
      
      if (timeRange === 'total') {
        pKey = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, '0')}`;
      } else {
        pKey = pDate.toISOString().split('T')[0];
      }

      if (dateMap[pKey]) {
        dateMap[pKey].value += (p.finalPrice || 0);
        dateMap[pKey].products.push(p);
      }
    });

    return Object.values(dateMap).sort((a, b) => {
      if (timeRange === 'total') {
        // Simple string sort for "2024-01" keys is fine
        return Object.keys(dateMap).find(k => dateMap[k] === a)!.localeCompare(
          Object.keys(dateMap).find(k => dateMap[k] === b)!
        );
      }
      const [dayA, monthA] = a.label.includes('.') ? a.label.split('.') : [a.label, '0'];
      const [dayB, monthB] = b.label.includes('.') ? b.label.split('.') : [b.label, '0'];
      return Number(monthA + dayA) - Number(monthB + dayB);
    });
  }, [boughtProducts, timeRange]);

  // Coordinate Constants for Unified Mapping
  const PAD_TOP = 40;
  const PAD_BOTTOM = 220;
  const MARGIN_LEFT = 50; // New gutter for Y-axis labels
  const DRAW_HEIGHT = PAD_BOTTOM - PAD_TOP;
  const DRAW_WIDTH = 600 - MARGIN_LEFT;

  const roundedMax = useMemo(() => {
    const rawMax = Math.max(...chartData.map(d => d.value), 10);
    if (rawMax <= 100) return Math.ceil(rawMax / 10) * 10;
    if (rawMax <= 300) return 300; // Consistent with user's example
    if (rawMax <= 500) return 500;
    if (rawMax <= 1000) return 1000;
    return Math.ceil(rawMax / 250) * 250;
  }, [chartData]);

  const getY = (val: number) => PAD_BOTTOM - (val / roundedMax) * DRAW_HEIGHT;
  const getX = (i: number) => MARGIN_LEFT + (i * (DRAW_WIDTH / (chartData.length - 1 || 1)));

  // Calculate tangents/angles for thickening segments
  const pointAngles = useMemo(() => {
    return chartData.map((_, i) => {
      const prevX = i === 0 ? getX(i) : getX(i - 1);
      const prevY = i === 0 ? getY(chartData[i].value) : getY(chartData[i - 1].value);
      const nextX = i === chartData.length - 1 ? getX(i) : getX(i + 1);
      const nextY = i === chartData.length - 1 ? getY(chartData[i].value) : getY(chartData[i + 1].value);
      
      const dx = nextX - prevX;
      const dy = nextY - prevY;
      
      if (dx === 0) return 0;
      return Math.atan2(dy, dx) * (180 / Math.PI);
    });
  }, [chartData, roundedMax]);



  // Bezier curve helper
  const getCurvePath = (data: any[]) => {
    if (data.length < 2) return "";
    
    // First point
    let path = `M ${getX(0)},${getY(data[0].value)}`;
    
    for (let i = 0; i < data.length - 1; i++) {
      const x1 = getX(i);
      const y1 = getY(data[i].value);
      const x2 = getX(i + 1);
      const y2 = getY(data[i + 1].value);
      
      // Control points (simple horizontal offset for smooth look)
      const cp1x = x1 + (x2 - x1) / 2;
      const cp1y = y1;
      const cp2x = x1 + (x2 - x1) / 2;
      const cp2y = y2;
      
      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${x2},${y2}`;
    }
    
    return path;
  };

  const curveData = useMemo(() => getCurvePath(chartData), [chartData, roundedMax]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[calc(100vh-100px)]">
      {/* Header */}
      <div className="flex justify-between items-center mb-10 px-2 mt-4">
        <h1 className="text-3xl font-playfair font-bold">Budget</h1>
        
        <div className="bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-md px-1 py-1 flex items-center rounded-full shadow-sm">
          <button 
            onClick={() => setTimeRange('7d')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold ${timeRange === '7d' ? 'bg-text-primary text-bg-primary shadow-md' : 'text-text-secondary hover:text-text-primary'}`}
          >
            7 Tage
          </button>
          <button 
            onClick={() => setTimeRange('month')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold ${timeRange === 'month' ? 'bg-text-primary text-bg-primary shadow-md' : 'text-text-secondary hover:text-text-primary'}`}
          >
            Dieser Monat
          </button>
          <button 
            onClick={() => setTimeRange('total')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold ${timeRange === 'total' ? 'bg-text-primary text-bg-primary shadow-md' : 'text-text-secondary hover:text-text-primary'}`}
          >
            Gesamt
          </button>
          <button className="px-4 py-1.5 rounded-full text-text-secondary hover:text-text-primary text-xs font-bold">Benutzerdefiniert</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-xl p-6 rounded-2xl shadow-sm">
          <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">Ausgaben ({timeRange === '7d' ? '7 Tage' : timeRange === 'month' ? 'Dieser Monat' : 'Gesamt'})</h3>
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
        <div className="lg:col-span-2 bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-xl p-6 rounded-3xl shadow-sm flex flex-col min-h-[400px] relative">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold">Ausgabenverlauf</h3>
            <span className="text-xs text-text-secondary">Ausgaben (€)</span>
          </div>
          
          {/* SVG Line Chart with Integrated Grid */}
          <div className="flex-1 relative mt-4 mx-6 mb-10 h-[250px]">
            <svg 
              className="w-full h-full overflow-visible" 
              viewBox="0 0 600 250" 
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--text-dark)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="var(--text-dark)" stopOpacity="0" />
                </linearGradient>

                {/* Filter for smooth mask transitions */}
                <filter id="maskBlur">
                  <feGaussianBlur stdDeviation="3" />
                </filter>

                {/* Mask for perfect curve-aligned organic thickening */}
                <mask id="thickPathMask">
                  <rect x="0" y="0" width="600" height="250" fill="black" />
                  <g filter="url(#maskBlur)">
                    {chartData.map((_, i) => (
                      <ellipse 
                        key={i} 
                        cx={getX(i)} 
                        cy={getY(chartData[i].value)} 
                        rx="18" 
                        ry="12" 
                        fill="white" 
                        transform={`rotate(${pointAngles[i]} ${getX(i)} ${getY(chartData[i].value)})`}
                      />
                    ))}
                  </g>
                </mask>
              </defs>

              {/* Y-Axis Grid Lines & Labels (Inside SVG for perfect alignment) */}
              <g className="grid-lines">
                {/* Max Line */}
                <line x1={MARGIN_LEFT} y1={getY(roundedMax)} x2="600" y2={getY(roundedMax)} stroke="var(--theme-glass-border)" strokeWidth="1" />
                <text x={MARGIN_LEFT - 10} y={getY(roundedMax) + 4} fill="white" fontSize="9" textAnchor="end" className="font-medium opacity-80">{Math.round(roundedMax).toLocaleString('de-DE')} €</text>

                {/* Middle Line */}
                <line x1={MARGIN_LEFT} y1={getY(roundedMax / 2)} x2="600" y2={getY(roundedMax / 2)} stroke="var(--theme-glass-border)" strokeWidth="1" />
                <text x={MARGIN_LEFT - 10} y={getY(roundedMax / 2) + 4} fill="white" fontSize="9" textAnchor="end" className="font-medium opacity-80">{Math.round(roundedMax / 2).toLocaleString('de-DE')} €</text>

                {/* Origin Line (0 Euro) */}
                <line x1={MARGIN_LEFT} y1={getY(0)} x2="600" y2={getY(0)} stroke="var(--theme-glass-border)" strokeWidth="1.5" />
                <text x={MARGIN_LEFT - 10} y={getY(0) + 4} fill="white" fontSize="9" textAnchor="end" className="font-medium">0 €</text>
              </g>

              {/* Area Fill */}
              <path
                d={`
                  ${curveData}
                  L ${getX(chartData.length - 1)},${getY(0)}
                  L ${MARGIN_LEFT},${getY(0)}
                  Z
                `}
                fill="url(#chartGradient)"
              />

              {/* Thicker Curve Nodes (via Mask) */}
              <path
                d={curveData}
                fill="none"
                stroke="var(--text-dark)"
                strokeWidth="4"
                strokeLinecap="round"
                mask="url(#thickPathMask)"
              />

              {/* Line */}
              <path
                d={curveData}
                fill="none"
                stroke="var(--text-dark)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data Points */}
              {chartData.map((d, i) => (
                <g key={i} className="group cursor-pointer">
                  {/* Vertical Guide Line */}
                  <line 
                    x1={getX(i)} y1={PAD_TOP} x2={getX(i)} y2={getY(0)} 
                    stroke="var(--theme-glass-border)" 
                    strokeWidth="1" 
                    strokeDasharray="4 4"
                    className="opacity-20 group-hover:opacity-100"
                  />
                  
                  {/* Invisible larger hover area for tooltips */}
                  <rect
                    x={getX(i) - 15}
                    y={getY(d.value) - 15}
                    width="30"
                    height="30"
                    fill="transparent"
                  />
                  {/* Tooltip on Hover */}
                  <foreignObject
                    x={getX(i) - 90}
                    y={getY(d.value) - (d.products.length > 0 ? (d.products.length * 25 + 60) : 50)}
                    width="180"
                    height={d.products.length > 0 ? (d.products.length * 25 + 60) : 50}
                    className="pointer-events-none opacity-0 group-hover:opacity-100 z-50 overflow-visible"
                  >
                    <div className="bg-text-primary/95 text-bg-primary backdrop-blur-md p-3 rounded-xl shadow-2xl flex flex-col gap-1 w-full">
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

            {/* X-Axis Labels (Exact absolute positioning to match SVG points) */}
            <div className="absolute inset-x-0 -bottom-8 h-10 pointer-events-none">
              {chartData.map((day, idx) => {
                const xPercent = (getX(idx) / 600) * 100;
                return (
                  <div 
                    key={idx} 
                    className="absolute flex flex-col items-center top-0 origin-center"
                    style={{ left: `${xPercent}%`, transform: 'translateX(-50%)' }}
                  >
                    <div className="w-[1px] h-2 bg-[var(--theme-glass-border)] mb-2"></div>
                    <span className="text-[10px] text-text-secondary font-medium whitespace-nowrap">{day.label}</span>
                  </div>
                );
              })}
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
