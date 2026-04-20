import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Heart, Layers, Wallet, Tag } from 'lucide-react';
import { cn } from '../../utils/cn';

const navItems = [
  { to: '/',          label: 'Start',     Icon: LayoutDashboard },
  { to: '/katalog',   label: 'Katalog',   Icon: BookOpen         },
  { to: '/favoriten', label: 'Favoriten', Icon: Heart            },
  { to: '/bundles',   label: 'Bundles',   Icon: Layers           },
  { to: '/budget',    label: 'Budget',    Icon: Wallet           },
  { to: '/deals',     label: 'Deals',     Icon: Tag              },
];

export const BottomNav: React.FC = () => {
  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 md:hidden',
        'bg-[var(--theme-glass-bg)] backdrop-blur-xl border-t border-[var(--theme-glass-border)]',
        'flex items-stretch'
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {navItems.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 px-1',
              'text-[10px] font-semibold transition-all duration-200 min-w-0',
              isActive
                ? 'text-text-primary'
                : 'text-text-secondary hover:text-text-primary'
            )
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={cn(
                  'flex items-center justify-center w-8 h-6 rounded-full transition-all duration-200',
                  isActive && 'bg-text-primary/10 scale-110'
                )}
              >
                <Icon
                  size={isActive ? 20 : 18}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
              </span>
              <span className="truncate w-full text-center leading-none">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};
