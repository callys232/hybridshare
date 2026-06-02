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
    const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
      primary:   'btn-primary',
      secondary: 'btn-outline',
      danger:    'btn-danger',
      ghost:     'btn-ghost',
      outline:   'btn-outline',
      link:      'btn text-brand-red underline-offset-4 hover:underline bg-transparent p-0 h-auto',
    };

    const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
      sm:   'btn-sm h-7',
      md:   'btn-md h-9',
      lg:   'btn-lg h-11',
      icon: 'p-2 h-9 w-9',
    };

    return (
      <button
        ref={ref}
        className={cn(
          variantClasses[variant],
          sizeClasses[size],
          'relative overflow-hidden group',
          'transition-all duration-150 ease-out',
          'hover:scale-[1.02] hover:-translate-y-px active:scale-[0.97] active:translate-y-0',
          variant === 'primary' && 'hover:shadow-[0_6px_20px_rgba(0,0,0,0.18)]',
          variant === 'danger'  && 'hover:shadow-[0_6px_20px_rgba(193,33,41,0.35)]',
          loading && 'cursor-wait',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Spinner size="sm" className={variant === 'primary' || variant === 'danger' ? 'text-white' : 'text-brand-black'} />
        ) : (
          iconLeft && (
            <span className="transition-transform duration-150 group-hover:-translate-x-0.5">
              {iconLeft}
            </span>
          )
        )}
        {children && <span>{children}</span>}
        {!loading && iconRight && (
          <span className="transition-transform duration-150 group-hover:translate-x-0.5">
            {iconRight}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
