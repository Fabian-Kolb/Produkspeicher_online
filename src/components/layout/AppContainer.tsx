import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TopNav } from './TopNav';
import { cn } from '../../utils/cn';
import { MainMenuSidebar } from './MainMenuSidebar';
import { BottomNav } from './BottomNav';
import { ThemeCreatorModal } from '../features/ThemeCreatorModal';
import { ProductModal } from '../features/ProductModal';
import { ProductDetailModal } from '../features/ProductDetailModal';
import { AppInfoModal } from '../features/AppInfoModal';
import { ProfileSettingsModal } from '../auth/ProfileSettingsModal';
import { useAppStore } from '../../store/useAppStore';
import { useUIStore } from '../../store/useUIStore';
import { applyGlobalTheme, applyBaseMode, THEME_PRESETS } from '../../utils/themeHelpers';
import { triggerHaptic } from '../../utils/haptics';

// View Imports
import { DashboardView } from '../../views/DashboardView';
import { KatalogView } from '../../views/KatalogView';
import { FavoritenView } from '../../views/FavoritenView';
import { BundlesView } from '../../views/BundlesView';
import { BudgetView } from '../../views/BudgetView';
import { DealsView } from '../../views/DealsView';

const ROUTES = ['/', '/katalog', '/favoriten', '/bundles', '/budget', '/deals'];

export const AppContainer: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { settings } = useAppStore();
  const carouselRef = useRef<HTMLDivElement>(null);
  const { openProductModal, activeBundleId, setActiveBundleId, setBundleDraft } = useUIStore();

  const getFabConfig = () => {
    if (location.pathname === '/katalog' || location.pathname === '/favoriten') {
      return {
        key: 'add-product',
        title: 'Produkt hinzufügen',
        icon: <Plus size={22} strokeWidth={2.5} />,
        label: null,
        onClick: () => {
          triggerHaptic(15);
          openProductModal();
        },
        className: 'w-12 h-12 rounded-full justify-center px-0'
      };
    }
    if (location.pathname === '/bundles') {
      if (activeBundleId) {
        return {
          key: 'cancel-bundle',
          title: 'Bundle-Editor schließen',
          icon: <X size={22} strokeWidth={2.5} />,
          label: null,
          onClick: () => {
            triggerHaptic(15);
            setBundleDraft(null);
            setActiveBundleId(null);
          },
          className: 'w-12 h-12 rounded-full justify-center px-0'
        };
      }
      return {
        key: 'new-bundle',
        title: 'Neues Bundle erstellen',
        icon: <Plus size={18} strokeWidth={2.5} />,
        label: 'Neues Bundle',
        onClick: () => {
          triggerHaptic(15);
          setActiveBundleId('new');
        },
        className: 'h-12 px-4 rounded-full justify-center gap-2 font-bold text-xs sm:text-sm'
      };
    }
    return null;
  };

  const fabConfig = getFabConfig();

  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const lastScrollY = useRef(0);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollY = e.currentTarget.scrollTop;
    if (currentScrollY > lastScrollY.current + 10 && currentScrollY > 50) {
      setIsScrollingDown(true);
    } else if (currentScrollY < lastScrollY.current - 10 || currentScrollY <= 10) {
      setIsScrollingDown(false);
    }
    lastScrollY.current = currentScrollY;
  };

  // Apply theme on load and when settings change
  useEffect(() => {
    let applied = false;
    if (settings.activeThemeId && settings.activeThemeId !== 'default') {
      const customTheme = settings.customThemes.find(t => t.id === settings.activeThemeId);
      if (customTheme) {
        applyGlobalTheme(customTheme.colors, customTheme.isDark);
        applied = true;
      } else {
        const preset = THEME_PRESETS.find(p => p.id === settings.activeThemeId);
        if (preset) {
          applyGlobalTheme(preset.colors, preset.isDark);
          applied = true;
        }
      }
    }
    
    if (!applied) {
      applyBaseMode(settings.theme);
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

  const updateHeaderTransforms = (carouselOffsetPx: number, isDrag: boolean = false) => {
    if (!carouselRef.current) return;
    const pageWidth = window.innerWidth;
    if (!pageWidth) return;

    const currentUnit = -carouselOffsetPx / pageWidth;

    let katalogX = 0;
    let favoritenX = 0;

    if (currentUnit <= 1.0) {
      katalogX = 0;
      favoritenX = -pageWidth;
    } else if (currentUnit >= 2.0) {
      katalogX = pageWidth;
      favoritenX = 0;
    } else {
      const t = currentUnit - 1.0;
      katalogX = t * pageWidth;
      favoritenX = (t - 1.0) * pageWidth;
    }

    if (isDrag) {
      carouselRef.current.style.setProperty('--header-transition', 'none');
    } else {
      carouselRef.current.style.setProperty('--header-transition', 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)');
    }

    carouselRef.current.style.setProperty('--katalog-header-x', `${katalogX}px`);
    carouselRef.current.style.setProperty('--favoriten-header-x', `${favoritenX}px`);
  };

  // Sync carousel translation with active index on location change (only if not actively dragging)
  useEffect(() => {
    if (carouselRef.current && !isDragging.current) {
      carouselRef.current.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
      carouselRef.current.style.transform = `translateX(-${currentIndex * (100 / 6)}%)`;
      updateHeaderTransforms(-currentIndex * window.innerWidth, false);
    }
    setIsScrollingDown(false);
    lastScrollY.current = 0;
  }, [currentIndex]);

  // Recalculate header transforms on window resize
  useEffect(() => {
    const handleResize = () => {
      updateHeaderTransforms(-currentIndex * window.innerWidth, false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentIndex]);

  // Touch Gesture Variables for Mobile Swiping
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const dragDirection = useRef<'horizontal' | 'vertical' | null>(null);
  const touchStartInNavbar = useRef<boolean>(false);
  const hasSwipedNavbar = useRef<boolean>(false);
  const preventNextClick = useRef<boolean>(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCenteredPage = useRef<number>(-1);
  const isDragging = useRef<boolean>(false);
  const hasNavigatedInSession = useRef<boolean>(false);
  const startIndex = useRef<number>(0);

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

    const target = e.target as HTMLElement;
    
    // Check if swipe started in top header or bottom nav
    const isNavbar = !!(target.closest('nav') || target.closest('header'));
    touchStartInNavbar.current = isNavbar;
    hasSwipedNavbar.current = false;
    lastCenteredPage.current = currentIndex;
    startIndex.current = currentIndex; // Save starting page index
    hasNavigatedInSession.current = false;

    // 2. Ignore swipe gestures starting inside scrollable panels/widgets or input elements
    // (Bypass this check for navbar gestures so navbar buttons/links can be swiped)
    if (!isNavbar && (
      target.closest('.no-scrollbar') ||
      target.closest('.overflow-x-auto') ||
      target.closest('input') ||
      target.closest('select') ||
      target.closest('textarea')
    )) {
      return;
    }

    // Record starting coordinates
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
    dragDirection.current = null;

    // Trigger subtle click vibration if user touches and holds in the navbar area
    if (isNavbar) {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      longPressTimer.current = setTimeout(() => {
        triggerHaptic(20);
      }, 200);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart.current || !carouselRef.current) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;

    const dx = currentX - touchStart.current.x;
    const dy = currentY - touchStart.current.y;

    // Cancel long-press feedback if thumb moved significantly early
    if (longPressTimer.current && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // Detect and lock swipe direction
    if (dragDirection.current === null) {
      if (touchStartInNavbar.current) {
        // Eagerly lock horizontal drag when swiping in navbar to prevent vertical interference
        if (Math.abs(dx) > 5) {
          dragDirection.current = 'horizontal';
        }
      } else {
        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
          if (Math.abs(dx) > Math.abs(dy) * 1.5) {
            dragDirection.current = 'horizontal';
          } else {
            dragDirection.current = 'vertical';
          }
        }
      }
    }

    // Handle horizontal page drag
    if (dragDirection.current === 'horizontal') {
      if (e.cancelable) e.preventDefault(); // Prevent native vertical scrolling
      isDragging.current = true; // Mark as dragging to prevent location-sync snapping

      // Apply higher sensitivity scaling for navbar gestures (6.5x speed to scroll multiple pages)
      const sensitivity = touchStartInNavbar.current ? 6.5 : 1.0;
      const directionMultiplier = touchStartInNavbar.current ? -1.0 : 1.0;
      const scaledDx = dx * sensitivity * directionMultiplier;

      if (touchStartInNavbar.current && Math.abs(dx) > 5) {
        hasSwipedNavbar.current = true;
      }

      // Advanced rubber-banding based on absolute viewport position boundaries
      const pageWidth = window.innerWidth;
      const currentOffset = -startIndex.current * pageWidth;
      const targetOffset = currentOffset + scaledDx;

      // Real-time haptic tick feedback & Live category/tab navigation as pages are crossed in the carousel
      const currentCenteredPage = Math.max(0, Math.min(ROUTES.length - 1, Math.round(-targetOffset / pageWidth)));
      if (currentCenteredPage !== lastCenteredPage.current) {
        lastCenteredPage.current = currentCenteredPage;
        
        if (touchStartInNavbar.current) {
          triggerHaptic(12); // Short vibration click
          
          // Live-navigate to update active indicators in TopNav/BottomNav in real-time
          if (!hasNavigatedInSession.current) {
            hasNavigatedInSession.current = true;
            navigate(ROUTES[currentCenteredPage]); // First change is a push
          } else {
            navigate(ROUTES[currentCenteredPage], { replace: true }); // Subsequent changes are replacements
          }
        }
      }

      let finalDx = scaledDx;

      if (targetOffset > 0) {
        // Dragging past the first page (left boundary)
        const allowedDrag = -currentOffset;
        const excess = targetOffset;
        finalDx = allowedDrag + excess * 0.25;
      } else if (targetOffset < -(ROUTES.length - 1) * pageWidth) {
        // Dragging past the last page (right boundary)
        const minOffset = -(ROUTES.length - 1) * pageWidth;
        const allowedDrag = minOffset - currentOffset;
        const excess = targetOffset - minOffset;
        finalDx = allowedDrag + excess * 0.25;
      }

      carouselRef.current.style.transition = 'none';
      const actualOffsetPx = currentOffset + finalDx;
      carouselRef.current.style.transform = `translateX(calc(-${startIndex.current * (100 / 6)}% + ${finalDx}px))`;
      updateHeaderTransforms(actualOffsetPx, true);
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (!touchStart.current || !carouselRef.current) {
      isDragging.current = false;
      return;
    }

    const currentX = e.changedTouches[0].clientX;
    const dx = currentX - touchStart.current.x;

    if (dragDirection.current === 'horizontal') {
      const sensitivity = touchStartInNavbar.current ? 6.5 : 1.0;
      const directionMultiplier = touchStartInNavbar.current ? -1.0 : 1.0;
      const scaledDx = dx * sensitivity * directionMultiplier;

      const pageWidth = window.innerWidth;
      const snapThreshold = pageWidth * 0.25; // 25% of page width threshold for snapping

      // Calculate number of full pages shifted + fractional remainder snapping
      const pagesShifted = Math.trunc(scaledDx / pageWidth);
      const remainder = scaledDx % pageWidth;

      let finalPagesShifted = pagesShifted;
      if (Math.abs(remainder) > snapThreshold) {
        finalPagesShifted += Math.sign(remainder);
      }

      let targetIndex = startIndex.current - finalPagesShifted;
      targetIndex = Math.max(0, Math.min(ROUTES.length - 1, targetIndex));

      // Mark dragging finished before we perform the final snapping
      isDragging.current = false;

      // Animate the carousel smoothly to its resting position.
      carouselRef.current.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
      carouselRef.current.offsetHeight; // Force reflow
      carouselRef.current.style.transform = `translateX(-${targetIndex * (100 / 6)}%)`;
      updateHeaderTransforms(-targetIndex * pageWidth, false);

      // If we didn't navigate yet, or if the final target is different from where we are currently centered
      if (targetIndex !== currentIndex) {
        if (!hasNavigatedInSession.current) {
          navigate(ROUTES[targetIndex]);
        } else {
          navigate(ROUTES[targetIndex], { replace: true });
        }
      }
    } else {
      isDragging.current = false;
    }

    if (hasSwipedNavbar.current) {
      preventNextClick.current = true;
      // Reset preventNextClick flag after a small timeout to let the click event register
      setTimeout(() => {
        preventNextClick.current = false;
      }, 300);
    }

    // Reset touch variables
    touchStart.current = null;
    dragDirection.current = null;
    touchStartInNavbar.current = false;
    hasSwipedNavbar.current = false;
  };

  const onClickCapture = (e: React.MouseEvent) => {
    if (preventNextClick.current) {
      e.preventDefault();
      e.stopPropagation();
      preventNextClick.current = false;
    }
  };

  return (
    <div 
      className="h-screen w-screen text-text-primary overflow-hidden relative bg-transparent flex flex-col"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClickCapture={onClickCapture}
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

      {/* Mobile Floating Action Button (FAB) */}
      <AnimatePresence mode="wait">
        {fabConfig && !isScrollingDown && (
          <motion.button
            key={fabConfig.key}
            initial={{ opacity: 0, scale: 0.85, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            onClick={fabConfig.onClick}
            className={cn(
              "md:hidden fixed bottom-24 right-5 z-40 bg-accent text-bg-primary shadow-xl shadow-accent/25 flex items-center hover:bg-accent-hover cursor-pointer border border-accent-hover/30 transform-gpu origin-center select-none",
              fabConfig.className
            )}
            title={fabConfig.title}
          >
            {fabConfig.icon}
            {fabConfig.label && <span>{fabConfig.label}</span>}
          </motion.button>
        )}
      </AnimatePresence>
      
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
                onScroll={handleScroll}
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
