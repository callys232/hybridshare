'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Spinner } from './Spinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, iconLeft, iconRight, children, className, disabled, ...props }, ref) => {
    const variantClasses = {
      primary:   'btn-primary',
      secondary: 'btn-outline',   // alias — same styling as outline
      danger:    'btn-danger',
      ghost:     'btn-ghost',
      outline:   'btn-outline',
      link:      'btn text-brand-red underline-offset-4 hover:underline bg-transparent p-0 h-auto',
    };

    const sizeClasses = {
      sm: 'btn-sm h-7',
      md: 'btn-md h-9',
      lg: 'btn-lg h-11',
      icon: 'p-2 h-9 w-9',
    };

    return (
      <button
        ref={ref}
        className={cn(
          variantClasses[variant],
          sizeClasses[size],
          loading && 'cursor-wait',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Spinner size="sm" className={variant === 'primary' || variant === 'danger' ? 'text-white' : 'text-brand-black'} />
        ) : (
          iconLeft
        )}
        {children && <span>{children}</span>}
        {!loading && iconRight}
      </button>
    );
  }
);

Button.displayName = 'Button';
