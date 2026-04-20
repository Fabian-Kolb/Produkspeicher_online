import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TopNav } from './TopNav';
import { MainMenuSidebar } from './MainMenuSidebar';
import { BottomNav } from './BottomNav';
import { ThemeCreatorModal } from '../features/ThemeCreatorModal';
import { ProductModal } from '../features/ProductModal';
import { ProductDetailModal } from '../features/ProductDetailModal';
import { ProfileSettingsModal } from '../auth/ProfileSettingsModal';
import { useAppStore } from '../../store/useAppStore';
import { applyGlobalTheme, applyBaseMode } from '../../utils/themeHelpers';
import { useSwipe } from '../../hooks/useSwipe';

const ROUTES = ['/', '/katalog', '/favoriten', '/bundles', '/budget', '/deals'];

export const AppContainer: React.FC = () => {
  const settings = useAppStore(state => state.settings);
  const location = useLocation();
  const navigate = useNavigate();
  const [direction, setDirection] = useState(0);

  // Apply theme on load and when settings change
  useEffect(() => {
    applyBaseMode(settings.theme);
    if (settings.activeThemeId && settings.activeThemeId !== 'default') {
      const customTheme = settings.customThemes.find(t => t.id === settings.activeThemeId);
      if (customTheme) {
        applyGlobalTheme(customTheme.colors);
      }
    }
    
    // Toggle glass effects
    if (settings.isGlassEnabled) {
      document.body.classList.add('glass-enabled');
      document.documentElement.classList.add('glass-enabled');
    } else {
      document.body.classList.remove('glass-enabled');
      document.documentElement.classList.remove('glass-enabled');
    }
  }, [settings.theme, settings.activeThemeId, settings.customThemes, settings.isGlassEnabled]);

  const currentIndex = ROUTES.indexOf(location.pathname);

  const handleSwipeNavigation = (navDirection: number) => {
    const nextIndex = currentIndex + navDirection;
    if (nextIndex >= 0 && nextIndex < ROUTES.length) {
      setDirection(navDirection);
      navigate(ROUTES[nextIndex]);
    }
  };

  const swipeHandlers = useSwipe({
    onSwipeLeft: () => handleSwipeNavigation(1),
    onSwipeRight: () => handleSwipeNavigation(-1),
    minSwipeDistance: 70
  });

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
      filter: 'blur(10px)'
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      filter: 'blur(0px)'
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0,
      filter: 'blur(10px)'
    })
  };

  return (
    <div 
      className="min-h-screen text-text-primary overflow-x-hidden relative bg-transparent"
      {...swipeHandlers}
    >
      {/* Abstract Background Blobs */}
      {settings.isGlassEnabled && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-100 z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-violet-600/50 rounded-full blur-[140px]" />
          <div className="absolute top-[10%] right-[-20%] w-[60%] h-[70%] bg-fuchsia-600/50 rounded-full blur-[160px]" />
          <div className="absolute bottom-[-20%] left-[15%] w-[50%] h-[50%] bg-blue-600/50 rounded-full blur-[150px]" />
          <div className="absolute bottom-[20%] right-[10%] w-[40%] h-[40%] bg-pink-500/40 rounded-full blur-[120px]" />
        </div>
      )}

      <TopNav />
      <MainMenuSidebar />
      <BottomNav />
      <ThemeCreatorModal />
      <ProductModal />
      <ProductDetailModal />
      <ProfileSettingsModal />
      
      {/* Main Content Area */}
      <main className="pt-16 md:pt-24 pb-24 md:pb-8 px-4 md:px-8 w-full min-h-screen transition-all duration-300 relative">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={location.pathname}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
              filter: { duration: 0.2 }
            }}
            className="w-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};
