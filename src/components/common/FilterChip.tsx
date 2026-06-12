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
          'px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border cursor-pointer select-none whitespace-nowrap hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed',
          active 
            ? 'bg-accent/15 text-accent border-accent/30 shadow-sm hover:shadow-md'
            : 'bg-inactive-btn-bg text-inactive-btn-text border-border-primary hover:text-text-primary hover:shadow-md',
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
