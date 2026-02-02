import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, id, ...props }, ref) => {
    const autoId = useId();
    const inputId = id || `input-${autoId}`;
    
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-neural-text mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'w-full px-3 py-2 bg-neural-panel border rounded-md text-neural-text',
            'placeholder:text-neural-text-secondary',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-neural-blue focus:border-transparent',
            {
              'border-neural-border hover:border-neural-blue/50': !error,
              'border-neural-red focus:ring-neural-red': error,
            },
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-neural-red">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
