'use client';

import { useTheme } from './ThemeProvider';
import { cn } from '@/lib/utils';

interface Props { className?: string; size?: 'sm' | 'md' }

export function ThemeToggle({ className, size = 'md' }: Props) {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggle}
      className={cn(
        'relative rounded-full border transition-all duration-300 flex items-center flex-shrink-0',
        size === 'sm' ? 'w-9 h-5 p-0.5' : 'w-11 h-6 p-0.5',
        isDark
          ? 'bg-brand-black border-dark-border'
          : 'bg-brand-white-soft border-brand-gray hover:border-brand-gray-dark',
        className,
      )}
    >
      {/* Track icons */}
      <span className={cn('absolute left-1.5 transition-opacity duration-200', isDark ? 'opacity-100' : 'opacity-0')}>
        <svg className={cn(size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3', 'text-brand-gray-dark')} fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      </span>
      <span className={cn('absolute right-1.5 transition-opacity duration-200', isDark ? 'opacity-0' : 'opacity-100')}>
        <svg className={cn(size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3', 'text-amber-500')} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
        </svg>
      </span>
      {/* Thumb */}
      <span
        className={cn(
          'rounded-full shadow-sm transition-all duration-300 flex-shrink-0',
          size === 'sm' ? 'w-4 h-4' : 'w-5 h-5',
          isDark ? 'bg-white translate-x-full' : 'bg-brand-black translate-x-0',
        )}
        style={{ transform: isDark ? `translateX(${size === 'sm' ? '16px' : '20px'})` : 'translateX(0)' }}
      />
    </button>
  );
}
