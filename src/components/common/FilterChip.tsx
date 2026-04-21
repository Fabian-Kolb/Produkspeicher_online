import React from 'react';
import { cn } from '../../utils/cn';

import { useAppStore } from '../../store/useAppStore';

interface FilterChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  shaking?: boolean;
  editable?: boolean;
}

export const FilterChip = React.forwardRef<HTMLButtonElement, FilterChipProps>(
  ({ className, active, shaking, editable, children, ...props }, ref) => {
    const isGlassEnabled = useAppStore(state => state.settings.isGlassEnabled);

    return (
      <button
        ref={ref}
        className={cn(
          'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border cursor-pointer select-none whitespace-nowrap',
          active 
            ? (isGlassEnabled 
                ? 'bg-text-primary text-bg-primary border-transparent shadow-md' 
                : 'bg-blue-600 dark:bg-blue-500 text-white border-transparent shadow-md focus:ring-blue-400')
            : 'bg-bg-primary text-text-secondary border-border-primary hover:text-text-primary',
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
