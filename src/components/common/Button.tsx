import React from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const variants = {
      primary: 'bg-accent hover:bg-accent-hover text-bg-primary font-bold shadow-md transition-colors',
      secondary: 'bg-inactive-btn-bg text-inactive-btn-text hover:opacity-90 transition-colors',
      danger: 'bg-heart text-white hover:bg-opacity-90 transition-colors',
      ghost: 'bg-transparent text-text-secondary hover:text-text-primary transition-colors',
      glass: 'glass-panel text-text-primary hover:bg-opacity-80 transition-colors'
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
