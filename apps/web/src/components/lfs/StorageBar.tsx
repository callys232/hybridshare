import { cn } from '@/lib/utils';
import { formatBytes } from './FileSizeLabel';

interface Props {
  used: number;
  quota: number;
  className?: string;
  showLabel?: boolean;
}

export function StorageBar({ used, quota, className, showLabel = true }: Props) {
  const pct = quota > 0 ? Math.min(100, (used / quota) * 100) : 0;
  const color = pct >= 90 ? 'bg-brand-red' : pct >= 75 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className={cn('space-y-1.5', className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs text-brand-gray-dark">
          <span>{formatBytes(used)} used</span>
          <span>{formatBytes(quota)} total</span>
        </div>
      )}
      <div className="h-1.5 bg-brand-gray rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${pct}%` }} />
      </div>
      {pct >= 75 && showLabel && (
        <p className={cn('text-xs font-semibold', pct >= 90 ? 'text-brand-red' : 'text-amber-600')}>
          {pct >= 90 ? `Storage nearly full (${Math.round(pct)}%)` : `${Math.round(pct)}% used`}
        </p>
      )}
    </div>
  );
}
