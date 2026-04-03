import React from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {icon && (
          <div className="absolute left-3 text-text-secondary pointer-events-none">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full bg-bg-card border border-border-primary text-text-primary rounded-xl',
            'focus:outline-none focus:border-text-secondary transition-colors',
            icon ? 'pl-10 pr-4 py-2.5' : 'px-4 py-2.5',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = 'Input';
