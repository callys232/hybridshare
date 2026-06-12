import Link from 'next/link';
import { cn } from '@/lib/utils';

const SIZES = {
  sm: { outer: 'w-8 h-8 rounded-lg',  inner: 'w-3 h-3', text: 'text-base' },
  md: { outer: 'w-10 h-10 rounded-xl', inner: 'w-4 h-4', text: 'text-xl' },
  lg: { outer: 'w-12 h-12 rounded-xl', inner: 'w-5 h-5', text: 'text-2xl' },
} as const;

interface LogoMarkProps {
  size?: keyof typeof SIZES;
  className?: string;
  animate?: boolean;
}

/** Just the square icon mark — no link, no wordmark. */
export function LogoMark({ size = 'md', className, animate }: LogoMarkProps) {
  const s = SIZES[size];
  return (
    <div className={cn(
      s.outer,
      'bg-brand-black dark:bg-dark-border flex items-center justify-center flex-shrink-0',
      animate && 'animate-pulse',
      className,
    )}>
      <div className={cn(s.inner, 'bg-brand-red rounded-sm')} />
    </div>
  );
}

interface LogoProps {
  size?: keyof typeof SIZES;
  href?: string;
  wordmark?: boolean;
  /** Extra classes on the outer flex container */
  className?: string;
  /** Extra classes on the text span */
  textClassName?: string;
  /** Extra classes on the mark div */
  markClassName?: string;
}

/**
 * Full logo: square mark + "Lamid FileShare" wordmark.
 * Wrap in a Link when `href` is provided.
 */
export function Logo({
  size = 'md',
  href,
  wordmark = true,
  className,
  textClassName,
  markClassName,
}: LogoProps) {
  const s = SIZES[size];

  const inner = (
    <span className={cn('flex items-center gap-2.5 group', className)}>
      <span className={cn(
        s.outer,
        'bg-brand-black dark:bg-dark-border flex items-center justify-center flex-shrink-0',
        'transition-transform duration-150 group-hover:scale-110',
        markClassName,
      )}>
        <span className={cn(s.inner, 'bg-brand-red rounded-sm')} />
      </span>
      {wordmark && (
        <span className={cn(
          s.text,
          'font-bold text-brand-black dark:text-dark-text tracking-tight',
          textClassName,
        )}>
          Lamid FileShare
        </span>
      )}
    </span>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}
