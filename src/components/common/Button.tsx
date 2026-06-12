import React from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const variants = {
      primary: 'bg-accent hover:bg-accent-hover text-bg-primary font-bold shadow-md hover:shadow-lg',
      secondary: 'bg-inactive-btn-bg text-inactive-btn-text hover:opacity-90 shadow-sm hover:shadow-md',
      danger: 'bg-heart text-white hover:bg-opacity-90 shadow-sm hover:shadow-md',
      ghost: 'bg-transparent text-text-secondary hover:text-text-primary',
      glass: 'glass-panel text-text-primary hover:bg-opacity-80 shadow-md hover:shadow-lg'
    };

    const sizes = {
      sm: 'px-4 py-1.5 text-xs rounded-full',
      md: 'px-6 py-2.5 text-sm rounded-full',
      lg: 'px-8 py-3.5 text-base rounded-full',
      icon: 'p-2.5 rounded-full flex items-center justify-center'
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed focus-ring',
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
