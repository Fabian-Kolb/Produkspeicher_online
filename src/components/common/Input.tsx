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
          <div className="absolute left-3 text-text-secondary pointer-events-none z-10">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full bg-bg-card border border-border-primary text-text-primary rounded-xl outline-none',
            'hover:border-text-secondary focus:border-text-secondary',
            'hover:-translate-y-0.5 focus:-translate-y-0.5 hover:scale-[1.015] focus:scale-[1.015]',
            'hover:shadow-md focus:shadow-md',
            'transition-all duration-500 ease-out transform-gpu origin-center',
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
