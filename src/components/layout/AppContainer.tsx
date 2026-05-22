import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TopNav } from './TopNav';
import { MainMenuSidebar } from './MainMenuSidebar';
import { BottomNav } from './BottomNav';
import { ThemeCreatorModal } from '../features/ThemeCreatorModal';
import { ProductModal } from '../features/ProductModal';
import { ProductDetailModal } from '../features/ProductDetailModal';
import { AppInfoModal } from '../features/AppInfoModal';
import { ProfileSettingsModal } from '../auth/ProfileSettingsModal';
import { useAppStore } from '../../store/useAppStore';
import { useUIStore } from '../../store/useUIStore';
import { applyGlobalTheme, applyBaseMode } from '../../utils/themeHelpers';

// View Imports
import { DashboardView } from '../../views/DashboardView';
import { KatalogView } from '../../views/KatalogView';
import { FavoritenView } from '../../views/FavoritenView';
import { BundlesView } from '../../views/BundlesView';
import { BudgetView } from '../../views/BudgetView';
import { DealsView } from '../../views/DealsView';

const ROUTES = ['/', '/katalog', '/favoriten', '/bundles', '/budget', '/deals'];

export const AppContainer: React.FC = () => {
  const settings = useAppStore(state => state.settings);
  const location = useLocation();
  const navigate = useNavigate();
  const carouselRef = useRef<HTMLDivElement>(null);

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

  // Determine active view index
  const routeIndex = ROUTES.indexOf(location.pathname);
  const currentIndex = routeIndex !== -1 ? routeIndex : 0;

  // Sync carousel translation with active index on location change
  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
      carouselRef.current.style.transform = `translateX(-${currentIndex * (100 / 6)}%)`;
    }
  }, [currentIndex]);

  // Touch Gesture Variables for Mobile Swiping
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const dragDirection = useRef<'horizontal' | 'vertical' | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    // 1. Disable swipe gestures if any modal is open
    const uiState = useUIStore.getState();
    if (
      uiState.isMainMenuOpen ||
      uiState.isThemeManagerOpen ||
      uiState.isProfileModalOpen ||
      uiState.isCategoryMenuOpen ||
      uiState.isAppInfoModalOpen ||
      uiState.isProductModalOpen ||
      uiState.isProductDetailModalOpen
    ) {
      return;
    }

    // 2. Ignore swipe gestures starting inside scrollable panels/widgets or input elements
    const target = e.target as HTMLElement;
    if (
      target.closest('.no-scrollbar') ||
      target.closest('.overflow-x-auto') ||
      target.closest('input') ||
      target.closest('select') ||
      target.closest('textarea')
    ) {
      return;
    }

    // Record starting coordinates
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
    dragDirection.current = null;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart.current || !carouselRef.current) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;

    const dx = currentX - touchStart.current.x;
    const dy = currentY - touchStart.current.y;

    // Detect and lock swipe direction
    if (dragDirection.current === null) {
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        if (Math.abs(dx) > Math.abs(dy) * 1.5) {
          dragDirection.current = 'horizontal';
        } else {
          dragDirection.current = 'vertical';
        }
      }
    }

    // Handle horizontal page drag
    if (dragDirection.current === 'horizontal') {
      if (e.cancelable) e.preventDefault(); // Prevent native vertical scrolling

      let finalDx = dx;
      const isAtFirst = currentIndex === 0 && dx > 0;
      const isAtLast = currentIndex === ROUTES.length - 1 && dx < 0;

      // Rubber-banding physics on first/last tab
      if (isAtFirst || isAtLast) {
        finalDx = dx * 0.25;
      }

      carouselRef.current.style.transition = 'none';
      carouselRef.current.style.transform = `translateX(calc(-${currentIndex * (100 / 6)}% + ${finalDx}px))`;
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current || !carouselRef.current) return;

    const currentX = e.changedTouches[0].clientX;
    const dx = currentX - touchStart.current.x;

    if (dragDirection.current === 'horizontal') {
      const threshold = window.innerWidth * 0.2; // 20% swipe threshold

      if (Math.abs(dx) > threshold) {
        if (dx > 0 && currentIndex > 0) {
          // Swipe Right -> Slide to previous route
          navigate(ROUTES[currentIndex - 1]);
        } else if (dx < 0 && currentIndex < ROUTES.length - 1) {
          // Swipe Left -> Slide to next route
          navigate(ROUTES[currentIndex + 1]);
        } else {
          // Dragged boundary -> Snap back
          carouselRef.current.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
          carouselRef.current.style.transform = `translateX(-${currentIndex * (100 / 6)}%)`;
        }
      } else {
        // Did not meet swipe threshold -> Snap back
        carouselRef.current.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
        carouselRef.current.style.transform = `translateX(-${currentIndex * (100 / 6)}%)`;
      }
    }

    // Reset touch variables
    touchStart.current = null;
    dragDirection.current = null;
  };

  return (
    <div 
      className="h-screen w-screen text-text-primary overflow-hidden relative bg-transparent flex flex-col"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
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
      <AppInfoModal />
      <ProfileSettingsModal />
      
      {/* Main Content Area */}
      <main className="flex-1 w-full overflow-hidden relative bg-transparent z-10">
        <div
          ref={carouselRef}
          className="flex h-full"
          style={{
            width: '600%',
            transform: `translateX(-${currentIndex * (100 / 6)}%)`,
            transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {ROUTES.map((route) => {
            let component;
            switch (route) {
              case '/': component = <DashboardView />; break;
              case '/katalog': component = <KatalogView />; break;
              case '/favoriten': component = <FavoritenView />; break;
              case '/bundles': component = <BundlesView />; break;
              case '/budget': component = <BudgetView />; break;
              case '/deals': component = <DealsView />; break;
              default: component = null;
            }
            return (
              <div 
                key={route} 
                className="w-[16.666667%] h-full shrink-0 overflow-y-auto pt-16 md:pt-24 pb-24 md:pb-8 px-4 md:px-8"
              >
                {component}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};
