import React from 'react';
import { cn } from '../../utils/cn';

import { useAppStore } from '../../store/useAppStore';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const isGlassEnabled = useAppStore(state => state.settings.isGlassEnabled);
    
    const variants = {
      primary: isGlassEnabled
        ? 'bg-text-primary text-bg-primary hover:bg-opacity-90 font-bold shadow-md shadow-black/10 dark:shadow-white/5'
        : 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 font-bold shadow-md shadow-blue-500/20',
      secondary: 'bg-border-primary text-text-primary hover:bg-opacity-80',
      danger: 'bg-heart text-white hover:bg-opacity-90',
      ghost: 'bg-transparent text-text-secondary hover:text-text-primary',
      glass: 'glass-panel text-text-primary hover:bg-opacity-80'
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs rounded-lg',
      md: 'px-5 py-2.5 text-sm rounded-xl',
      lg: 'px-6 py-3 text-base rounded-2xl',
      icon: 'p-2 rounded-lg flex items-center justify-center'
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-ring',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
