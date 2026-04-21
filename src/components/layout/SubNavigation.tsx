 import { Settings } from 'lucide-react';
 import { useUIStore } from '../../store/useUIStore';
 import { useAppStore } from '../../store/useAppStore';
 import { CategoryMenu } from '../features/CategoryMenu';
 import React, { useRef } from 'react';

 export const SubNavigation: React.FC<{
   categories: string[];
 }> = ({ categories }) => {
   const { mainCat, setMainCat, toggleCategoryMenu, isCategoryMenuOpen } = useUIStore();
   const isGlassEnabled = useAppStore(state => state.settings.isGlassEnabled);
   const settingsBtnRef = useRef<HTMLButtonElement>(null);
 
   const activeClass = isGlassEnabled
     ? "bg-text-primary text-bg-primary shadow-lg scale-110"
     : "bg-blue-600 dark:bg-blue-500 text-white shadow-lg scale-110";

  return (
    <div className="w-full mt-2 mb-6 md:mb-12 flex justify-center px-0">
      <div className="bg-[var(--theme-glass-bg)] border border-[var(--theme-glass-border)] backdrop-blur-md px-4 py-1 md:px-1.5 md:py-1.5 flex items-center gap-1 md:gap-2 rounded-full overflow-x-auto no-scrollbar shadow-sm w-full md:w-auto pb-1.5 md:pb-1">
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

         <div className="w-[1px] h-6 md:h-7 bg-border-primary/50 mx-0.5 md:mx-1 shrink-0"></div>
 
         <div className="relative shrink-0">
           <button 
             ref={settingsBtnRef}
             onClick={toggleCategoryMenu}
              className={`w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full transition-all mr-1 ${
                isCategoryMenuOpen 
                  ? activeClass 
                  : 'text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5'
              }`}
           >
             <Settings size={17} className="md:w-[18px] md:h-[18px]" />
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
  const isGlassEnabled = useAppStore(state => state.settings.isGlassEnabled);
  const activeClass = isGlassEnabled
    ? 'bg-text-primary text-bg-primary shadow-md font-bold'
    : 'bg-blue-600 dark:bg-blue-500 text-white shadow-md font-bold';

  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-2 md:px-5 md:py-2.5 rounded-full text-xs md:text-sm font-medium transition-all duration-300 whitespace-nowrap outline-none flex items-center justify-center shrink-0 ${
        active 
          ? activeClass 
          : 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5 hover:scale-105'
      } ${className}`}
    >
      {children}
    </button>
  );
};
