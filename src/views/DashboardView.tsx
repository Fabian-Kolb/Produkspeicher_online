import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { Bell, Euro, Heart } from 'lucide-react';
import type { Product } from '../types';

export const DashboardView: React.FC = () => {
  const navigate = useNavigate();
  const { products, settings } = useAppStore();

  // Helper logic for KPIs
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const spentThisMonth = useMemo(() => {
    return products
      .filter((p: Product) => p.status === 'bought' && new Date(p.dateAdded).getMonth() === currentMonth && new Date(p.dateAdded).getFullYear() === currentYear)
      .reduce((sum: number, p: Product) => sum + p.finalPrice, 0);
  }, [products, currentMonth, currentYear]);

  const savedCount = products.filter((p: Product) => p.isFavorite).length;
  const alertCount = products.filter((p: Product) => p.status === 'reduced').length;

  const budgetPct = Math.min((spentThisMonth / settings.monthlyBudget) * 100, 100);
  const isOverBudget = spentThisMonth > settings.monthlyBudget;

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col items-center justify-center text-center mt-4">
        <h1 className="text-3xl md:text-4xl font-playfair font-bold mb-2">Willkommen zurück</h1>
        <p className="text-text-secondary">
          Hier ist dein Shopping-Überblick für den{' '}
          <input 
            type="date" 
            defaultValue={todayStr} 
            className="bg-transparent border-b border-text-secondary text-text-primary outline-none focus:border-text-primary transition-colors cursor-pointer"
          />
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Budget Widget */}
        <div 
          onClick={() => navigate('/analytics')}
          className="glass-panel p-6 cursor-pointer hover:-translate-y-1 transition-transform duration-300"
        >
          <div className="flex justify-between items-center mb-6 text-text-secondary">
            <span className="font-semibold uppercase text-xs tracking-wider">Monatsbudget</span>
            <Euro size={16} />
          </div>
          <div className="flex flex-col items-center">
            <div className="text-4xl font-bold mb-1">
              {spentThisMonth.toLocaleString('de-DE')} €
            </div>
            <div className="text-xs text-text-secondary mb-4">
              von <span className="font-bold text-text-primary">{settings.monthlyBudget.toLocaleString('de-DE')} €</span> Budget
            </div>
            <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden mb-2 relative">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${isOverBudget ? 'bg-heart' : 'bg-emerald-500'}`}
                style={{ width: `${budgetPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Favorites Widget */}
        <div 
          onClick={() => navigate('/favoriten')}
          className="glass-panel p-6 cursor-pointer hover:-translate-y-1 transition-transform duration-300"
        >
          <div className="flex justify-between items-center mb-6 text-text-secondary">
            <span className="font-semibold uppercase text-xs tracking-wider">Favoriten</span>
            <Heart size={16} />
          </div>
          <div className="flex h-full items-center justify-center pb-8">
            <div className="text-6xl font-bold text-text-primary">
              {savedCount}
            </div>
          </div>
        </div>

        {/* Price Alerts Widget */}
        <div 
          onClick={() => navigate('/deals')}
          className="glass-panel p-6 cursor-pointer hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden"
        >
          <div className="flex justify-between items-center mb-6 text-text-secondary relative z-10">
            <span className="font-semibold uppercase text-xs tracking-wider">Preisalarme</span>
            <div className="relative">
              <Bell size={16} />
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-heart rounded-full animate-ping" />
              )}
            </div>
          </div>
          <div className="flex flex-col h-full items-center justify-center pb-8 relative z-10">
            <div className="text-6xl font-bold text-heart mb-2">
              {alertCount}
            </div>
            <div className="text-xs text-text-secondary">Artikel reduziert</div>
          </div>
          
          {alertCount > 0 && (
            <div className="absolute inset-0 bg-heart/5 mix-blend-screen pointer-events-none" />
          )}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-playfair font-bold mb-6">Deine Shops</h2>
        {/* We will add the Website Grid component here */}
        <div className="text-text-secondary text-sm p-6 glass-panel">
          Shop-Widget Platzhalter (wird in Kürze implementiert)
        </div>
      </div>
    </div>
  );
};
