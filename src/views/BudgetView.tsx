import React, { useMemo, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useUIStore } from '../store/useUIStore';
import type { Product } from '../types';

export const BudgetView: React.FC = () => {
  const { products, settings, updateSettings } = useAppStore();
  const { setView, setStatusFilter, setSearchQuery } = useUIStore();
  const [timeRange, setTimeRange] = useState<'7d' | 'month' | 'total'>('7d');
  const [hoveredDay, setHoveredDay] = useState<{ label: string, value: number, products: Product[] } | null>(null);
  
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState(String(settings.monthlyBudget));

  const handleBudgetSubmit = () => {
    const val = Number(tempBudget);
    if (!isNaN(val) && val >= 0) {
      updateSettings({ monthlyBudget: val });
    } else {
      setTempBudget(String(settings.monthlyBudget));
    }
    setIsEditingBudget(false);
  };

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

  const timeRangeLabel = timeRange === '7d' ? '7 Tage' : timeRange === 'month' ? 'Dieser Monat' : 'Gesamt';
  const timeRangeSpend = chartData.reduce((sum, d) => sum + d.value, 0);
  const timeRangeProductsCount = chartData.reduce((sum, d) => sum + d.products.length, 0);
  const averagePrice = timeRangeProductsCount > 0 ? timeRangeSpend / timeRangeProductsCount : 0;

  const topCategories = useMemo(() => {
    const productsInTimeRange = chartData.flatMap(d => d.products);
    const catMap: Record<string, number> = {};
    productsInTimeRange.forEach(p => {
      const cat = p.mainCat || 'Ohne Kategorie';
      catMap[cat] = (catMap[cat] || 0) + (p.finalPrice || 0);
    });
    return Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, amount]) => ({ name, amount }));
  }, [chartData]);

  const maxCategorySpend = topCategories.length > 0 ? Math.max(topCategories[0].amount, 1) : 1;

  const groupedTransactions = useMemo(() => {
    const sorted = [...boughtProducts].sort(
      (a, b) => new Date(b.dateBought || b.dateAdded).getTime() - new Date(a.dateBought || a.dateAdded).getTime()
    );
    
    const groups: { monthLabel: string; products: Product[] }[] = [];
    
    sorted.forEach((p) => {
      const d = new Date(p.dateBought || p.dateAdded);
      const monthLabel = d.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
      
      let lastGroup = groups[groups.length - 1];
      if (!lastGroup || lastGroup.monthLabel !== monthLabel) {
        lastGroup = { monthLabel, products: [] };
        groups.push(lastGroup);
      }
      lastGroup.products.push(p);
    });
    
    return groups;
  }, [boughtProducts]);

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-xl p-6 rounded-2xl shadow-sm">
          <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">Ausgaben ({timeRangeLabel})</h3>
          <p className="text-2xl font-bold">{timeRangeSpend.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €</p>
        </div>
        <div className="bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-xl p-6 rounded-2xl shadow-sm">
          <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">Ø Preis ({timeRangeLabel})</h3>
          <p className="text-2xl font-bold">{averagePrice.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €</p>
        </div>
        <div className="bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-xl p-6 rounded-2xl shadow-sm">
          <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">Käufe ({timeRangeLabel})</h3>
          <p className="text-2xl font-bold">{timeRangeProductsCount}</p>
        </div>
        <div className="bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-xl p-6 rounded-2xl shadow-sm group transition-all duration-300 hover:shadow-md">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Monatsbudget</h3>
            {!isEditingBudget && (
              <button 
                onClick={() => { setIsEditingBudget(true); setTempBudget(String(settings.monthlyBudget)); }} 
                className="opacity-0 group-hover:opacity-100 transition-opacity text-text-secondary hover:text-text-primary p-1 bg-black/5 dark:bg-white/5 rounded"
                title="Budget bearbeiten"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
              </button>
            )}
          </div>
          {isEditingBudget ? (
            <div className="flex items-center gap-1.5 animate-in fade-in">
              <input 
                type="number" 
                value={tempBudget}
                onChange={(e) => setTempBudget(e.target.value)}
                onBlur={handleBudgetSubmit}
                onKeyDown={(e) => { if (e.key === 'Enter') handleBudgetSubmit(); }}
                className="w-24 bg-black/5 dark:bg-white/5 border border-[var(--theme-glass-border)] px-2 py-1 rounded-lg text-xl font-bold outline-none text-text-primary focus:border-text-primary transition-colors"
                autoFocus
              />
              <span className="text-xl font-bold">€</span>
            </div>
          ) : (
            <p 
              className="text-2xl font-bold cursor-pointer transition-colors hover:text-emerald-500" 
              onClick={() => { setIsEditingBudget(true); setTempBudget(String(settings.monthlyBudget)); }}
            >
              {settings.monthlyBudget.toLocaleString('de-DE')} €
            </p>
          )}
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
                <g 
                  key={i} 
                  className="group cursor-pointer"
                  onMouseEnter={() => setHoveredDay(d)}
                  onMouseLeave={() => setHoveredDay(null)}
                >
                  {/* Vertical Guide Line */}
                  <line 
                    x1={getX(i)} y1={PAD_TOP} x2={getX(i)} y2={getY(0)} 
                    stroke="var(--theme-glass-border)" 
                    strokeWidth="1" 
                    strokeDasharray="4 4"
                    className="opacity-20 group-hover:opacity-100 transition-opacity duration-300"
                  />

                  {/* Glow Effect on Hover */}
                  <circle
                    cx={getX(i)}
                    cy={getY(d.value)}
                    r={16}
                    className="fill-white opacity-0 group-hover:opacity-10 transition-opacity duration-300 blur-md pointer-events-none"
                  />
                  <circle
                    cx={getX(i)}
                    cy={getY(d.value)}
                    r={8}
                    className="fill-white opacity-0 group-hover:opacity-30 transition-opacity duration-300 blur-[3px] pointer-events-none"
                  />

                  {/* Organic Variable Stroke completely replaces external nodes. */}
                  {/* Invisible larger hover area for tooltips */}
                  <rect
                    x={getX(i) - 20}
                    y={getY(d.value) - 20}
                    width="40"
                    height="40"
                    fill="transparent"
                  />

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
        
        {/* Right Column */}
        {/* Right Column */}
        <div className="flex flex-col gap-6 h-full">
          
          <div className="flex gap-4">
            {/* Budget Tracker (Half Width) */}
            <div className="bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-xl p-5 rounded-3xl shadow-sm flex flex-col flex-1 relative overflow-hidden group hover:shadow-lg transition-shadow duration-300">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-700"></div>
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="font-bold text-sm">Budget Tracker</h3>
                  <span className="text-xs font-bold bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    {settings.monthlyBudget > 0 ? Math.round((spentThisMonth / settings.monthlyBudget) * 100) : 0}% genutzt
                  </span>
                </div>
                
                <div className="flex flex-col flex-1 justify-center">
                  <div className="flex flex-col gap-1 mb-6">
                     <span className="text-xs text-text-secondary font-medium uppercase tracking-wider">Ausgegeben</span>
                     <div className="flex items-baseline gap-1.5">
                       <p className="text-4xl font-bold">{spentThisMonth.toLocaleString('de-DE', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</p>
                       <span className="text-xl font-bold text-text-secondary">€</span>
                     </div>
                     <span className="text-sm font-bold text-emerald-500 mt-1 bg-emerald-500/10 w-max px-2 py-1 rounded-md">
                       Noch {(settings.monthlyBudget - spentThisMonth).toLocaleString('de-DE', {minimumFractionDigits: 0, maximumFractionDigits: 0})} € übrig
                     </span>
                  </div>
                  
                  {/* Enhanced Progress Bar */}
                  <div className="w-full h-3 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden shadow-inner relative mb-2">
                    <div 
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-1000 ease-out overflow-hidden" 
                      style={{ width: `${Math.min((spentThisMonth / (settings.monthlyBudget || 1)) * 100, 100)}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-xs text-text-secondary font-bold mt-1">
                    <span>0 €</span>
                    <span>Gesamt: {settings.monthlyBudget.toLocaleString('de-DE')} €</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Kategorien (Half Width) */}
            <div className="bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-xl p-5 rounded-3xl shadow-sm flex flex-col flex-1 relative">
              <h3 className="font-bold mb-6 text-sm">Top Kategorien</h3>
              <div className="flex flex-col gap-5 flex-1 justify-center">
                {topCategories.length > 0 ? (
                  topCategories.map((cat, idx) => (
                    <div key={idx} className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="truncate pr-2 font-semibold text-text-primary">{cat.name}</span>
                        <span className="font-bold shrink-0">{cat.amount.toLocaleString('de-DE', {maximumFractionDigits: 0})} €</span>
                      </div>
                      <div className="w-full h-2 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden flex-shrink-0">
                        <div 
                          className="h-full bg-[var(--text-dark)] rounded-full opacity-60 transition-all duration-1000 ease-out"
                          style={{ width: `${Math.min((cat.amount / maxCategorySpend) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-text-secondary italic">Keine Ausgaben</p>
                )}
              </div>
            </div>
          </div>

          {/* Tag Details (Interactive hover box - Supermarket Receipt Style) */}
          <div className="bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-xl p-6 rounded-3xl shadow-sm flex flex-col flex-1 relative overflow-hidden group">
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-sm tracking-wide flex items-center gap-2">
                <svg className="w-4 h-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                TAGESBELEG
              </h3>
              {hoveredDay && (
                <span className="text-[10px] font-mono font-medium opacity-50 bg-black/5 dark:bg-white/5 px-2 py-1 rounded">
                  {hoveredDay.label}
                </span>
              )}
            </div>

            {hoveredDay ? (
              <div className="flex flex-col h-full flex-1 min-h-[150px] animate-in fade-in">
                
                {/* List of Products */}
                <div className="flex flex-col gap-4 overflow-y-auto flex-1 pr-2 mb-6 scrollbar-thin">
                  {hoveredDay.products.length > 0 ? (
                    hoveredDay.products.map((p, idx) => (
                      <div key={idx} className="flex items-center gap-4 group/item">
                        {p.imgs && p.imgs.length > 0 ? (
                          <img src={p.imgs[p.mainImgIdx || 0]} alt={p.name} className="w-12 h-12 rounded-xl object-cover bg-black/10 dark:bg-white/10 shrink-0 shadow-sm" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-[var(--theme-glass-border)] flex items-center justify-center text-lg font-bold text-text-secondary shrink-0 shadow-sm">
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-sm font-semibold truncate text-text-primary group-hover/item:text-emerald-500 transition-colors">{p.name}</span>
                          <span className="text-[10px] text-text-secondary truncate">{p.mainCat || 'Ohne Kategorie'}</span>
                        </div>
                        <span className="text-sm font-bold font-mono opacity-90 shrink-0">{(p.finalPrice || 0).toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-60">
                      <p className="text-sm italic py-4">Keine Einkäufe getätigt</p>
                    </div>
                  )}
                </div>

                {/* Supermarket Receipt Total Line */}
                {hoveredDay.products.length > 0 && (
                  <div className="mt-auto relative pt-5 pb-2">
                    {/* Dashed Line SVG for perfect "Receipt" look */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] w-full" style={{ backgroundImage: 'linear-gradient(to right, var(--text-dark) 40%, transparent 40%)', backgroundSize: '8px 1px', backgroundRepeat: 'repeat-x', opacity: 0.2 }}></div>
                    
                    {/* The receipt cut-out circles at the edges to simulate tape roll */}
                    <div className="absolute -left-8 -top-[7px] w-4 h-4 bg-[var(--bg-color)] rounded-full shadow-inner"></div>
                    <div className="absolute -right-8 -top-[7px] w-4 h-4 bg-[var(--bg-color)] rounded-full shadow-inner"></div>
                    
                    <div className="flex justify-between items-end">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-text-secondary uppercase tracking-widest font-bold mb-1">Endsumme</span>
                        <span className="text-[10px] text-text-secondary">{hoveredDay.products.length} {hoveredDay.products.length === 1 ? 'Position' : 'Positionen'}</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-bold text-text-secondary">€</span>
                        <span className="text-3xl font-bold font-mono tracking-tight text-text-primary group-hover:text-emerald-500 transition-colors duration-500">
                          {hoveredDay.value.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 opacity-40 animate-in fade-in min-h-[150px]">
                <div className="w-16 h-16 mb-4 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center">
                  <svg className="w-8 h-8 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-xs italic font-medium max-w-[180px] text-center">
                  Berühre einen Tag im Diagramm, um den Beleg zu drucken.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Transactions */}
      <div className="mt-4">
        <h3 className="font-bold mb-6 px-2 text-xl tracking-wide">Transaktionen</h3>
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
                  {group.products.map(p => {
                    const dateObj = new Date(p.dateBought || p.dateAdded);
                    const dateStr = dateObj.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    
                    return (
                      <div 
                        key={p.id} 
                        onClick={() => {
                          setView('products');
                          setStatusFilter('bought');
                          setSearchQuery(p.name);
                        }}
                        className="bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-xl p-4 md:p-5 rounded-3xl shadow-sm flex items-center gap-5 cursor-pointer hover:shadow-md hover:border-emerald-500/50 transition-all duration-300 group"
                      >
                        {p.imgs && p.imgs.length > 0 ? (
                          <img src={p.imgs[p.mainImgIdx || 0]} alt={p.name} className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover shadow-sm bg-black/10 dark:bg-white/10 shrink-0" />
                        ) : (
                          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-[var(--theme-glass-border)] flex items-center justify-center text-2xl font-bold text-text-secondary shrink-0 shadow-sm">
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex flex-col flex-1 min-w-0 justify-center">
                          <span className="text-lg md:text-xl font-bold truncate text-text-primary group-hover:text-emerald-500 transition-colors">{p.name}</span>
                          <span className="text-xs md:text-sm text-text-secondary mt-1 font-medium">{dateStr} {p.mainCat ? `• ${p.mainCat}` : ''}</span>
                        </div>
                        <span className="text-xl md:text-2xl font-bold font-mono tracking-tight shrink-0 whitespace-nowrap pr-2 md:pr-4 text-text-primary">{(p.finalPrice || 0).toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €</span>
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
    </div>
  );
};

// Removed old StatCard
