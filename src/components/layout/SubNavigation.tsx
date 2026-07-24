import { Settings } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useAppStore } from '../../store/useAppStore';
import { CategoryEditMenu } from '../features/CategoryEditMenu';
import React, { useRef, useState, useLayoutEffect, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { triggerHaptic } from '../../utils/haptics';
import { motion, AnimatePresence } from 'framer-motion';

export const SubNavigation: React.FC<{
  categories: string[];
}> = ({ categories }) => {
  const { mainCat, setMainCat, toggleCategoryMenu, isCategoryMenuOpen, closeCategoryMenu } = useUIStore();
  const { addCategory, deleteCategory, reorderCategories } = useAppStore();
  
  const tabsRef = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number; height: number; top: number }>({ left: 0, width: 0, height: 0, top: 0 });

  useLayoutEffect(() => {
    const activeKey = isCategoryMenuOpen ? 'settings' : mainCat;
    const activeEl = tabsRef.current[activeKey];
    if (activeEl) {
      setIndicatorStyle({
        left: activeEl.offsetLeft,
        width: activeEl.clientWidth,
        height: activeEl.clientHeight,
        top: activeEl.offsetTop
      });
    }
  }, [mainCat, isCategoryMenuOpen, categories]);

  useEffect(() => {
    const handleResize = () => {
      const activeKey = isCategoryMenuOpen ? 'settings' : mainCat;
      const activeEl = tabsRef.current[activeKey];
      if (activeEl) {
        setIndicatorStyle({
          left: activeEl.offsetLeft,
          width: activeEl.clientWidth,
          height: activeEl.clientHeight,
          top: activeEl.offsetTop
        });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mainCat, isCategoryMenuOpen]);

  return (
    <div className="w-full mt-2 mb-6 md:mb-12 flex flex-col items-center justify-center px-0">
      <div 
        className={cn(
          "glass-panel rounded-full relative px-4 py-1 md:px-1.5 md:py-1.5 flex items-center gap-1 md:gap-2 overflow-x-auto no-scrollbar shadow-sm w-full md:w-auto pb-1.5 md:pb-1 transition-all duration-300"
        )}
      >
        {/* Sliding background indicator */}
        {indicatorStyle.width > 0 && (
          <motion.div
            className="absolute top-0 left-0 bg-accent rounded-full shadow-md shadow-accent/15 pointer-events-none"
            animate={{
              x: indicatorStyle.left,
              y: indicatorStyle.top,
              width: indicatorStyle.width,
              height: indicatorStyle.height
            }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        )}

        <button
          ref={el => { tabsRef.current['Alle'] = el; }}
          onClick={() => {
            triggerHaptic(15);
            setMainCat('Alle');
          }}
          className={cn(
            "px-3.5 py-2 md:px-5 md:py-2.5 rounded-full text-xs md:text-sm font-medium transition-colors duration-300 whitespace-nowrap outline-none flex items-center justify-center shrink-0 cursor-pointer select-none z-10 bg-transparent",
            mainCat === 'Alle' && !isCategoryMenuOpen
              ? "text-bg-primary font-medium"
              : "text-text-secondary hover:text-text-primary hover:bg-text-primary/5"
          )}
        >
          Alle
        </button>

        {categories.map((cat) => (
          <button
            key={cat}
            ref={el => { tabsRef.current[cat] = el; }}
            onClick={() => {
              triggerHaptic(15);
              setMainCat(cat);
            }}
            className={cn(
              "px-3.5 py-2 md:px-5 md:py-2.5 rounded-full text-xs md:text-sm font-medium transition-colors duration-300 whitespace-nowrap outline-none flex items-center justify-center shrink-0 cursor-pointer select-none z-10 bg-transparent",
              mainCat === cat && !isCategoryMenuOpen
                ? "text-bg-primary font-medium"
                : "text-text-secondary hover:text-text-primary hover:bg-text-primary/5"
            )}
          >
            {cat}
          </button>
        ))}

        <div className="w-[1px] h-6 md:h-7 bg-border-primary/50 mx-0.5 md:mx-1 shrink-0 z-10"></div>

        <button 
          ref={el => { tabsRef.current['settings'] = el; }}
          onClick={() => {
            triggerHaptic(15);
            toggleCategoryMenu();
          }}
          className={cn(
            "w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full transition-colors duration-300 mr-1 cursor-pointer select-none bg-transparent shrink-0 z-10",
            isCategoryMenuOpen 
              ? "text-bg-primary" 
              : "text-text-secondary hover:text-text-primary hover:bg-text-primary/5"
          )}
        >
          <Settings 
            size={17} 
            className={cn(
              "md:w-[18px] md:h-[18px] transition-transform duration-500",
              isCategoryMenuOpen ? 'rotate-180' : 'rotate-0'
            )} 
          />
        </button>
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
              <CategoryEditMenu
                title="Katalog-Kategorien"
                subtitle="Ändere die Reihenfolge per Drag & Drop oder klicke auf das X zum Löschen."
                categories={categories}
                onAdd={addCategory}
                onDelete={deleteCategory}
                onReorder={reorderCategories}
                onClose={closeCategoryMenu}
                placeholder="Kategorie…"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
