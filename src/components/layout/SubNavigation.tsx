 import { Settings } from 'lucide-react';
 import { useUIStore } from '../../store/useUIStore';
 import { CategoryMenu } from '../features/CategoryMenu';
 import React, { useRef } from 'react';

 export const SubNavigation: React.FC<{
   categories: string[];
 }> = ({ categories }) => {
   const { mainCat, setMainCat, openProductModal, toggleCategoryMenu, isCategoryMenuOpen } = useUIStore();
   const settingsBtnRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="w-full mt-2 mb-6 md:mb-12 flex justify-center -mx-4 px-4 md:mx-0 md:px-0">
      <div className="bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-md px-1.5 py-1.5 flex items-center gap-1 md:gap-2 rounded-full overflow-x-auto no-scrollbar shadow-sm w-full md:w-auto pb-1">
        <NavPill
          active={false}
          onClick={() => openProductModal()}
          className="font-bold text-text-primary mr-2 ml-2"
        >
          Hinzufügen
        </NavPill>
        
        <div className="w-[1px] h-7 bg-border-primary/50 mx-1"></div>

        <NavPill
          active={mainCat === 'Alle'}
          onClick={() => setMainCat('Alle')}
        >
          Alle
        </NavPill>
        {categories.map((cat) => (
          <NavPill
            key={cat}
            active={mainCat === cat}
            onClick={() => setMainCat(cat)}
          >
            {cat}
          </NavPill>
        ))}

         <div className="w-[1px] h-7 bg-border-primary/50 mx-1"></div>
 
         <div className="relative">
           <button 
             ref={settingsBtnRef}
             onClick={toggleCategoryMenu}
             className={`w-10 h-10 flex items-center justify-center rounded-full transition-all mr-1 ${
               isCategoryMenuOpen 
                 ? 'bg-text-primary text-bg-primary scale-110 shadow-lg' 
                 : 'text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5'
             }`}
           >
             <Settings size={18} />
           </button>
 
           {isCategoryMenuOpen && (
             <CategoryMenu anchorRef={settingsBtnRef} />
           )}
         </div>
       </div>
     </div>
  );
};

interface NavPillProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

const NavPill: React.FC<NavPillProps> = ({ active, onClick, children, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap outline-none flex items-center justify-center ${
        active 
          ? 'bg-bg-primary text-text-primary shadow-sm font-bold' 
          : 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5 hover:scale-105'
      } ${className}`}
    >
      {children}
    </button>
  );
};
