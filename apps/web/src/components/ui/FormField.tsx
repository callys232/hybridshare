'use client';

import { cn } from '@/lib/utils';

interface FormFieldProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function FormField({ label, hint, error, required, className, children }: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="block text-xs font-semibold text-brand-black dark:text-white">
          {label}
          {required && <span className="text-brand-red ml-0.5">*</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <p className="text-[11px] text-brand-gray-dark">{hint}</p>
      )}
      {error && (
        <p className="text-[11px] text-red-500 flex items-center gap-1">
          <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
