import React, { useRef, useState, useLayoutEffect, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, Moon, Sun, User } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../utils/cn';
import logoDark from '../../assets/logo/logo_dark.png';
import logoWhite from '../../assets/logo/logo_white.png';
import { motion } from 'framer-motion';

export const TopNav: React.FC = () => {
  const { toggleMainMenu, toggleProfileModal } = useUIStore();
  const { settings, updateSettings, avatarUrl, userName } = useAppStore();
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

  return (
    <header className={cn(
      "fixed top-0 w-full z-50 px-4 md:px-6 py-2 md:py-3 flex items-center justify-between border-b transition-all duration-300",
      settings.isGlassEnabled
        ? "backdrop-blur-xl bg-[var(--theme-glass-bg)] border-[var(--theme-glass-border)]"
        : "bg-bg-card border-border-primary"
    )}>
      {/* Logo */}
      <div className="flex items-center gap-2 md:gap-3">
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
      <nav 
        className="relative hidden md:flex items-center gap-1 bg-black/[0.07] dark:bg-white/10 border border-black/5 dark:border-white/5 p-1 rounded-full shadow-inner"
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
            className={({ isActive }) =>
              cn(
                "px-5 py-2 rounded-full text-sm font-medium transition-colors duration-300 select-none outline-none cursor-pointer z-10 bg-transparent",
                isActive
                  ? "text-bg-primary"
                  : 'text-text-secondary hover:text-text-primary hover:bg-black/10 dark:hover:bg-white/5'
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Right Controls */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Theme Toggle Switch */}
        <button
          onClick={() => {
            const targetTheme = settings.theme === 'light' ? 'dark' : 'light';
            const isGlass = settings.isGlassEnabled;
            const nextThemeId = `default-${targetTheme}-${isGlass ? 'glass' : 'solid'}`;
            updateSettings({
              theme: targetTheme,
              activeThemeId: nextThemeId
            });
          }}
          className="relative w-12 md:w-14 h-7 md:h-8 rounded-full bg-black/10 dark:bg-white/10 flex items-center px-1 transition-colors"
          title={settings.theme === 'light' ? 'Dunkles Design aktivieren' : 'Helles Design aktivieren'}
        >
          <div className={`w-5 md:w-6 h-5 md:h-6 rounded-full bg-bg-primary shadow-md flex items-center justify-center transition-transform duration-300 ${settings.theme === 'dark' ? 'translate-x-5 md:translate-x-6' : 'translate-x-0'}`}>
            {settings.theme === 'dark' ? <Moon size={12} className="text-text-primary" /> : <Sun size={12} className="text-text-primary" />}
          </div>
        </button>

        {/* Profile / Account Button */}
        <button
          onClick={toggleProfileModal}
          className="w-8 h-8 md:w-10 md:h-10 bg-bg-primary rounded-full shadow-sm flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-300 border border-border-primary/50 overflow-hidden cursor-pointer hover:scale-105 active:scale-95"
          title="Profil & Account"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={userName || 'Profil'} className="w-full h-full object-cover" />
          ) : (
            <User size={16} className="text-text-secondary" />
          )}
        </button>

        {/* Hamburger */}
        <button
          onClick={toggleMainMenu}
          className="w-8 h-8 md:w-10 md:h-10 bg-bg-primary rounded-full shadow-sm flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors border border-border-primary/50"
        >
          <Menu size={18} />
        </button>
      </div>
    </header>
  );
};
