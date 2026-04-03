import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { ProductCard } from '../components/features/ProductCard';
import { Bell } from 'lucide-react';
import type { Product } from '../types';

export const DealsView: React.FC = () => {
  const { products } = useAppStore();
  
  // Deals are defined as products that are reduced (discount > 0 or status === 'reduced')
  const dealProducts = products.filter((p: Product) => p.discount > 0 || p.status === 'reduced');

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-playfair font-bold flex items-center gap-3">
          Price Alerts <Bell className="text-heart" size={28} />
        </h1>
        <p className="text-text-secondary mt-2">Aktuelle Preissenkungen in deiner Liste.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {dealProducts.map((product: Product) => (
          <ProductCard key={product.id} product={product} />
        ))}

        {dealProducts.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-text-secondary">
            <div className="text-4xl mb-4 text-heart opacity-50">🔔</div>
            <p className="text-lg">Aktuell keine Preissenkungen bei deinen Artikeln.</p>
          </div>
        )}
      </div>
    </div>
  );
};
