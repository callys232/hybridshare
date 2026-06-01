'use client';

import { cn } from '@/lib/utils';

interface Tab<T extends string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface TabsProps<T extends string> {
  tabs: Tab<T>[];
  active: T;
  onChange: (id: T) => void;
  variant?: 'line' | 'pill' | 'boxed';
  size?: 'sm' | 'md';
  className?: string;
}

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
  variant = 'line',
  size = 'md',
  className,
}: TabsProps<T>) {
  return (
    <div
      className={cn(
        'flex',
        variant === 'line' && 'border-b border-brand-gray gap-1',
        variant === 'pill' && 'gap-1 p-1 bg-brand-gray/40 rounded-xl',
        variant === 'boxed' && 'gap-0 border border-brand-gray rounded-lg overflow-hidden',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center gap-1.5 font-medium transition-all duration-150 whitespace-nowrap focus:outline-none',
              size === 'sm' ? 'text-xs px-3 py-1.5' : 'text-sm px-4 py-2.5',

              // Line variant
              variant === 'line' && [
                'border-b-2 -mb-px rounded-t-sm',
                isActive
                  ? 'border-brand-red text-brand-black dark:text-white'
                  : 'border-transparent text-brand-gray-dark hover:text-brand-black hover:border-brand-gray dark:hover:text-white',
              ],

              // Pill variant
              variant === 'pill' && [
                'rounded-lg',
                isActive
                  ? 'bg-white dark:bg-dark-surface-2 text-brand-black dark:text-white shadow-sm'
                  : 'text-brand-gray-dark hover:text-brand-black dark:hover:text-white',
              ],

              // Boxed variant
              variant === 'boxed' && [
                'border-r border-brand-gray last:border-r-0 flex-1 justify-center',
                isActive
                  ? 'bg-brand-black text-white'
                  : 'bg-white text-brand-gray-dark hover:bg-brand-gray/30 dark:bg-dark-surface-1 dark:text-zinc-400',
              ],
            )}
          >
            {tab.icon && (
              <span className={cn(isActive ? 'opacity-100' : 'opacity-60')}>{tab.icon}</span>
            )}
            {tab.label}
            {tab.badge !== undefined && (
              <span className={cn(
                'text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none',
                isActive ? 'bg-brand-red text-white' : 'bg-brand-gray text-brand-gray-dark'
              )}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
