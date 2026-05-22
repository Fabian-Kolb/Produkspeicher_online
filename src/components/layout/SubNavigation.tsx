import { Settings } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useAppStore } from '../../store/useAppStore';
import { CategoryEditMenu } from '../features/CategoryEditMenu';
import React, { useRef } from 'react';
import { cn } from '../../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

 export const SubNavigation: React.FC<{
   categories: string[];
 }> = ({ categories }) => {
   const { mainCat, setMainCat, toggleCategoryMenu, isCategoryMenuOpen } = useUIStore();
   const isGlassEnabled = useAppStore(state => state.settings.isGlassEnabled);
   const settingsBtnRef = useRef<HTMLButtonElement>(null);
   const activeClass = "bg-accent text-bg-primary shadow-lg scale-110";

  return (
    <div className="w-full mt-2 mb-6 md:mb-12 flex flex-col items-center justify-center px-0">
      <div className={cn(
        "px-4 py-1 md:px-1.5 md:py-1.5 flex items-center gap-1 md:gap-2 rounded-full overflow-x-auto no-scrollbar shadow-sm w-full md:w-auto pb-1.5 md:pb-1 border transition-all duration-300",
        isGlassEnabled ? "bg-[var(--theme-glass-bg)] border-[var(--theme-glass-border)] backdrop-blur-md" : "bg-bg-card border-border-primary"
      )}>
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
              className={`w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full transition-all mr-1 cursor-pointer ${
                isCategoryMenuOpen 
                  ? activeClass 
                  : 'text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5'
              }`}
           >
             <Settings size={17} className={`md:w-[18px] md:h-[18px] transition-transform duration-500 ${isCategoryMenuOpen ? 'rotate-180' : 'rotate-0'}`} />
           </button>
         </div>
       </div>

      <AnimatePresence>
        {isCategoryMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden w-full flex justify-center z-10"
          >
            <div className="w-full max-w-2xl px-4 md:px-0">
              <CategoryEditMenu />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
  const activeClass = 'bg-accent text-bg-primary shadow-md font-bold';

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
