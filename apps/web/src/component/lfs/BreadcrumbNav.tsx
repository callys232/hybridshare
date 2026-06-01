import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface Crumb { label: string; href?: string }

interface Props { crumbs: Crumb[]; className?: string }

export function BreadcrumbNav({ crumbs, className }: Props) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1.5 text-sm flex-wrap', className)}>
      {crumbs.map((c, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && (
              <svg className="w-3.5 h-3.5 text-brand-gray-dark flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
            {isLast || !c.href ? (
              <span className={cn(isLast ? 'text-brand-black font-semibold' : 'text-brand-gray-dark')}>{c.label}</span>
            ) : (
              <Link href={c.href} className="text-brand-gray-dark hover:text-brand-black transition-colors">{c.label}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
