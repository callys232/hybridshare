'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  content: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  children: React.ReactElement;
  className?: string;
}

export function Tooltip({ content, side = 'top', delay = 350, children, className }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const show = () => { timer.current = setTimeout(() => setVisible(true), delay); };
  const hide = () => { clearTimeout(timer.current); setVisible(false); };

  useEffect(() => () => clearTimeout(timer.current), []);

  const posClasses: Record<NonNullable<TooltipProps['side']>, string> = {
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left:   'right-full top-1/2 -translate-y-1/2 mr-2',
    right:  'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses: Record<NonNullable<TooltipProps['side']>, string> = {
    top:    'top-full left-1/2 -translate-x-1/2 border-t-zinc-800 dark:border-t-zinc-700',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-zinc-800 dark:border-b-zinc-700',
    left:   'left-full top-1/2 -translate-y-1/2 border-l-zinc-800 dark:border-l-zinc-700',
    right:  'right-full top-1/2 -translate-y-1/2 border-r-zinc-800 dark:border-r-zinc-700',
  };

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && content && (
        <span
          className={cn('absolute z-50 pointer-events-none whitespace-nowrap', posClasses[side])}
          role="tooltip"
        >
          <span className={cn(
            'block rounded-lg bg-zinc-800 dark:bg-zinc-700 text-white text-[11px] font-medium px-2.5 py-1.5 shadow-lg',
            'animate-pop',
            className
          )}>
            {content}
          </span>
          <span className={cn('absolute w-0 h-0 border-4 border-transparent', arrowClasses[side])} />
        </span>
      )}
    </span>
  );
}
