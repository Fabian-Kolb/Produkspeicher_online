import React from 'react';
import { cn } from '../../utils/cn';

interface FilterChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  shaking?: boolean;
  editable?: boolean;
}

export const FilterChip = React.forwardRef<HTMLButtonElement, FilterChipProps>(
  ({ className, active, shaking, editable, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 border cursor-pointer select-none whitespace-nowrap hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed transform-gpu',
          active 
            ? 'bg-accent text-bg-primary border-accent shadow-md hover:bg-accent-hover'
            : 'bg-bg-card text-text-primary border-border-primary/80 shadow-sm hover:border-text-secondary hover:shadow-md hover:bg-text-primary/5',
          shaking && 'animate-[wiggle_0.3s_ease-in-out_infinite] border-heart text-heart',
          editable && 'border-dashed border-text-secondary hover:border-text-primary',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
FilterChip.displayName = 'FilterChip';
