import React, { useRef, useState, useLayoutEffect, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, Plus, X } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../utils/cn';
import { triggerHaptic } from '../../utils/haptics';
import logoDark from '../../assets/logo/logo_dark.png';
import logoWhite from '../../assets/logo/logo_white.png';
import { motion, AnimatePresence } from 'framer-motion';

export const TopNav: React.FC = () => {
  const { toggleMainMenu, openProductModal, activeBundleId, setActiveBundleId, setBundleDraft } = useUIStore();
  const { settings } = useAppStore();
  const location = useLocation();

  const tabsRef = useRef<{ [key: string]: HTMLAnchorElement | null }>({});
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number; height: number; top: number }>({ left: 0, width: 0, height: 0, top: 0 });

  const navItems = [
    { to: '/', label: 'Dashboard' },
    { to: '/katalog', label: 'Katalog' },
    { to: '/favoriten', label: 'Favoriten' },
    { to: '/bundles',   label: 'Bundles' },
    { to: '/budget',    label: 'Budget' },
    { to: '/deals',     label: 'Deals' },
  ];

  // Find active item based on current path
  const activeItem = navItems.find(item => {
    if (item.to === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(item.to);
  }) || navItems[0];

  useLayoutEffect(() => {
    const activeEl = tabsRef.current[activeItem.to];
    if (activeEl) {
      setIndicatorStyle({
        left: activeEl.offsetLeft,
        width: activeEl.clientWidth,
        height: activeEl.clientHeight,
        top: activeEl.offsetTop
      });
    }
  }, [activeItem.to]);

  useEffect(() => {
    const handleResize = () => {
      const activeEl = tabsRef.current[activeItem.to];
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
  }, [activeItem.to]);

  const handleCancelBundle = () => {
    triggerHaptic(15);
    setBundleDraft(null);
    setActiveBundleId(null);
  };

  const handleNewBundle = () => {
    triggerHaptic(15);
    setActiveBundleId('new');
  };

  // Compute active header action button state based on route & store state
  const getHeaderButtonConfig = () => {
    if (location.pathname === '/katalog' || location.pathname === '/favoriten') {
      return {
        key: 'add-product',
        label: 'Neu',
        icon: <Plus size={16} strokeWidth={2.5} />,
        onClick: () => {
          triggerHaptic(15);
          openProductModal();
        },
        className: 'hidden md:flex'
      };
    }
    if (location.pathname === '/bundles') {
      if (activeBundleId) {
        return {
          key: 'cancel-bundle',
          label: 'Abbrechen',
          icon: <X size={15} strokeWidth={2.5} />,
          onClick: handleCancelBundle,
          className: 'flex'
        };
      }
      return {
        key: 'new-bundle',
        label: 'Neues Bundle',
        icon: <Plus size={15} strokeWidth={2.5} />,
        onClick: handleNewBundle,
        className: 'flex'
      };
    }
    return null;
  };

  const buttonConfig = getHeaderButtonConfig();

  return (
    <header className={cn(
      "fixed top-0 w-full z-50 px-4 md:px-6 py-2 md:py-3 grid grid-cols-[auto_1fr] md:grid-cols-[1fr_auto_1fr] items-center border-b transition-all duration-300",
      settings.isGlassEnabled
        ? "backdrop-blur-xl bg-[var(--theme-glass-bg)] border-[var(--theme-glass-border)]"
        : "bg-bg-card border-border-primary"
    )}>
      {/* Logo */}
      <div className="flex items-center gap-2 md:gap-3 justify-start">
        <img
          src={settings.theme === 'dark' ? logoWhite : logoDark}
          alt="Ventory Logo"
          className="h-7 md:h-8 w-auto object-contain"
        />
        <span className="font-playfair text-lg md:text-xl font-bold tracking-wide">
          Ventory
        </span>
      </div>

      {/* Desktop Nav Pills – hidden on mobile (BottomNav takes over) */}
      <div className="hidden md:flex justify-center">
        <nav 
          className="relative flex items-center gap-1 bg-text-primary/[0.07] border border-text-primary/5 p-1 rounded-full shadow-inner overflow-hidden"
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

          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              ref={el => { tabsRef.current[item.to] = el; }}
              onClick={() => triggerHaptic(15)}
              className={({ isActive }) =>
                cn(
                  "px-5 py-2 rounded-full text-sm font-medium transition-colors duration-300 select-none outline-none cursor-pointer z-10 bg-transparent",
                  isActive
                    ? "text-bg-primary"
                    : 'text-text-secondary hover:text-text-primary hover:bg-text-primary/10'
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 md:gap-4 justify-end">
        {/* Option 1: Sequenced Wait AnimatePresence with instant hover & smooth entrance/exit */}
        <AnimatePresence mode="wait">
          {buttonConfig && (
            <motion.button
              key={buttonConfig.key}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{
                duration: 0.2,
                ease: "easeOut"
              }}
              whileHover={{
                scale: 1.05,
                transition: { type: "spring", stiffness: 600, damping: 25 }
              }}
              whileTap={{
                scale: 0.95,
                transition: { type: "spring", stiffness: 600, damping: 25 }
              }}
              onClick={buttonConfig.onClick}
              className={cn(
                "h-9 md:h-10 items-center justify-center gap-1.5 bg-accent hover:bg-accent-hover text-bg-primary font-bold px-3.5 md:px-5 rounded-full text-xs md:text-sm shadow-md cursor-pointer select-none whitespace-nowrap origin-center transition-colors duration-200 transform-gpu",
                buttonConfig.className
              )}
            >
              {buttonConfig.icon}
              <span>{buttonConfig.label}</span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Hamburger */}
        <button
          onClick={() => {
            triggerHaptic(15);
            toggleMainMenu();
          }}
          className="w-8 h-8 md:w-10 md:h-10 bg-bg-primary rounded-full shadow-sm flex items-center justify-center hover:bg-text-primary/5 transition-colors border border-border-primary/50 shrink-0"
        >
          <Menu size={18} />
        </button>
      </div>
    </header>
  );
};


