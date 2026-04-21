import React from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, Moon, Sun, LogOut } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useAppStore } from '../../store/useAppStore';
import { supabase } from '../../lib/supabase';
import { cn } from '../../utils/cn';
import logoDark from '../../assets/logo/logo_dark.png';
import logoWhite from '../../assets/logo/logo_white.png';

export const TopNav: React.FC = () => {
  const toggleMainMenu = useUIStore((s) => s.toggleMainMenu);
  const { settings, updateSettings } = useAppStore();
  const isGlassEnabled = settings.isGlassEnabled;
  const activeClass = isGlassEnabled
    ? "bg-text-primary text-bg-primary shadow-md"
    : "bg-blue-600 dark:bg-blue-500 text-white shadow-md";

  const navItems = [
    { to: '/', label: 'Dashboard' },
    { to: '/katalog', label: 'Katalog' },
    { to: '/favoriten', label: 'Favoriten' },
    { to: '/bundles', label: 'Bundles' },
    { to: '/budget', label: 'Budget' },
    { to: '/deals', label: 'Deals' },
  ];

  return (
    <header className="fixed top-0 w-full z-50 px-4 md:px-6 py-2 md:py-3 flex items-center justify-between backdrop-blur-xl bg-[var(--theme-glass-bg)] border-b border-[var(--theme-glass-border)] transition-colors duration-300">
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
      <nav className="hidden md:flex items-center gap-1 bg-black/5 dark:bg-white/10 p-1 rounded-full">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                "px-5 py-2 rounded-full text-sm font-medium transition-all duration-300",
                isActive
                  ? activeClass
                  : 'text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5'
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
          onClick={() => updateSettings({ theme: settings.theme === 'light' ? 'dark' : 'light' })}
          className="relative w-12 md:w-14 h-7 md:h-8 rounded-full bg-black/10 dark:bg-white/10 flex items-center px-1 transition-colors"
        >
          <div className={`w-5 md:w-6 h-5 md:h-6 rounded-full bg-bg-primary shadow-md flex items-center justify-center transition-transform duration-300 ${settings.theme === 'dark' ? 'translate-x-5 md:translate-x-6' : 'translate-x-0'}`}>
            {settings.theme === 'dark' ? <Moon size={12} className="text-text-primary" /> : <Sun size={12} className="text-text-primary" />}
          </div>
        </button>

        {/* Logout Button */}
        <button
          onClick={async () => await supabase.auth.signOut()}
          className="w-8 h-8 md:w-10 md:h-10 bg-bg-primary rounded-full shadow-sm flex items-center justify-center hover:bg-red-500/10 text-red-500 transition-colors border border-border-primary/50 group"
          title="Logout"
        >
          <LogOut size={16} className="group-hover:scale-110 transition-transform" />
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
