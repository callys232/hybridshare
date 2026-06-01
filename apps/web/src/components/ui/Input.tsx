'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
  error?: boolean;
  inputSize?: 'sm' | 'md' | 'lg';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ leftAddon, rightAddon, error, inputSize = 'md', className, ...props }, ref) => {
    const hasWrapper = leftAddon || rightAddon;

    const base = cn(
      'w-full rounded-button border bg-white dark:bg-dark-surface-2 text-brand-black dark:text-white',
      'placeholder:text-brand-gray-dark transition-all duration-150 outline-none',
      'focus:ring-2 focus:ring-brand-black/10 dark:focus:ring-white/10',
      error
        ? 'border-red-400 focus:border-red-500'
        : 'border-brand-gray focus:border-brand-black dark:border-dark-border dark:focus:border-white/40',
      inputSize === 'sm' && 'text-xs px-3 py-2',
      inputSize === 'md' && 'text-sm px-3 py-2.5',
      inputSize === 'lg' && 'text-sm px-4 py-3',
      leftAddon && 'pl-9',
      rightAddon && 'pr-9',
      props.disabled && 'opacity-50 cursor-not-allowed bg-brand-gray/30',
      className
    );

    if (!hasWrapper) {
      return <input ref={ref} className={base} {...props} />;
    }

    return (
      <div className="relative">
        {leftAddon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray-dark pointer-events-none">
            {leftAddon}
          </span>
        )}
        <input ref={ref} className={base} {...props} />
        {rightAddon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-gray-dark">
            {rightAddon}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
