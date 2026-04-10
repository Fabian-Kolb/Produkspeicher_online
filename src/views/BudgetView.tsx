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



  // Geometrical Variable-Stroke Algorithmus (Sampling, Normals & Envelope)
  const { envelopeData, areaData, firstPoint, lastPoint, baseWidth } = useMemo(() => {
    if (chartData.length < 2) return { envelopeData: "", areaData: "" };

    const dataPoints = chartData.map((d, i) => ({ x: getX(i), y: getY(d.value) }));
    
    // 1. Spline Base Generation & High-Res Sampling
    const RESOLUTION = 2; // Pixel sampling distance
    const sampledPoints: {x: number, y: number}[] = [];
    
    const beziers = [];
    for (let i = 0; i < dataPoints.length - 1; i++) {
      const p1 = dataPoints[i];
      const p2 = dataPoints[i + 1];
      // Mathematischer (Monotone-X) Spline verhindert organisches Ausschwingen/Overshoots
      const cp1x = p1.x + (p2.x - p1.x) / 2;
      const cp1y = p1.y;
      
      const cp2x = p1.x + (p2.x - p1.x) / 2;
      const cp2y = p2.y;

      beziers.push({
        p1, 
        cp1: { x: cp1x, y: cp1y },
        cp2: { x: cp2x, y: cp2y },
        p2 
      });
    }

    beziers.forEach((b) => {
      const straightDist = Math.hypot(b.p2.x - b.p1.x, b.p2.y - b.p1.y);
      const steps = Math.max(Math.ceil(straightDist / RESOLUTION), 2);
      for(let j = 0; j < steps; j++) {
        const t = j / steps;
        const mt = 1 - t;
        const x = mt*mt*mt*b.p1.x + 3*mt*mt*t*b.cp1.x + 3*mt*t*t*b.cp2.x + t*t*t*b.p2.x;
        const y = mt*mt*mt*b.p1.y + 3*mt*mt*t*b.cp1.y + 3*mt*t*t*b.cp2.y + t*t*t*b.p2.y;
        sampledPoints.push({ x, y });
      }
    });
    const lastP = beziers[beziers.length-1].p2;
    sampledPoints.push({ x: lastP.x, y: lastP.y });

    // 2. Normals computation & Distance-based Bell Curve Thickness
    const baseWidth = 0.8; // Radius of thin line sections
    const peakWidth = 2.8; // Radius of node swells (Reduced for a more minimal look)
    const falloff = 60;    // Gaussian spread factor (much shorter swelling)
    
    const topEdge: {x: number, y: number}[] = [];
    const bottomEdge: {x: number, y: number}[] = [];
    
    for (let i = 0; i < sampledPoints.length; i++) {
        const pt = sampledPoints[i];
        
        let prev = i > 0 ? sampledPoints[i-1] : pt;
        let next = i < sampledPoints.length-1 ? sampledPoints[i+1] : pt;
        if (i === 0) prev = { x: pt.x - (next.x - pt.x), y: pt.y - (next.y - pt.y) };
        if (i === sampledPoints.length-1) next = { x: pt.x + (pt.x - prev.x), y: pt.y + (pt.y - prev.y) };
        
        let dx = next.x - prev.x;
        let dy = next.y - prev.y;
        const len = Math.hypot(dx, dy);
        if (len > 0) { dx /= len; dy /= len; }
        
        const nx = -dy;
        const ny = dx;
        
        // Find distance to closest INNER data node (skipping first and last)
        let minDistSq = Infinity;
        for (let idx = 1; idx < dataPoints.length - 1; idx++) {
            const dp = dataPoints[idx];
            const dsq = (pt.x - dp.x)**2 + (pt.y - dp.y)**2;
            if (dsq < minDistSq) minDistSq = dsq;
        }
        
        // Gaussian Bell Modulation
        const thickness = baseWidth + (peakWidth - baseWidth) * Math.exp(-minDistSq / falloff);
        
        topEdge.push({ x: pt.x + nx * thickness, y: pt.y + ny * thickness });
        bottomEdge.push({ x: pt.x - nx * thickness, y: pt.y - ny * thickness });
    }

    // 3. Assemble Continuous Envelope Polygon
    let env = `M ${topEdge[0].x},${topEdge[0].y}`;
    for (let i = 1; i < topEdge.length; i++) env += ` L ${topEdge[i].x},${topEdge[i].y}`;
    // Add a semicircular rounded cap at the end? A simple SVG circle element is easier, done in render loop below.
    for (let i = bottomEdge.length - 1; i >= 0; i--) env += ` L ${bottomEdge[i].x},${bottomEdge[i].y}`;
    env += " Z";

    // Background Fill Area
    let area = `M ${sampledPoints[0].x},${sampledPoints[0].y}`;
    for (let i = 1; i < sampledPoints.length; i++) area += ` L ${sampledPoints[i].x},${sampledPoints[i].y}`;
    area += ` L ${sampledPoints[sampledPoints.length-1].x},${getY(0)}`;
    area += ` L ${sampledPoints[0].x},${getY(0)} Z`;

    return { envelopeData: env, areaData: area, firstPoint: sampledPoints[0], lastPoint: sampledPoints[sampledPoints.length - 1], baseWidth };
  }, [chartData, roundedMax]);

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
                d={areaData}
                fill="url(#chartGradient)"
              />

              {/* Algorithmic Variable-Stroke Envelope Polygon */}
              <path
                d={envelopeData}
                fill="white"
              />

              {/* Rounded End Caps */}
              {firstPoint && (
                <>
                  <circle cx={firstPoint.x} cy={firstPoint.y} r={baseWidth} fill="white" />
                  <circle cx={lastPoint.x} cy={lastPoint.y} r={baseWidth} fill="white" />
                </>
              )}

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

                  {/* Organic Variable Stroke completely replaces external nodes. */}
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
