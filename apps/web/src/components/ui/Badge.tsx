'use client';

import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'red' | 'black' | 'green' | 'blue' | 'yellow' | 'outline';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export function Badge({ children, variant = 'default', size = 'md', dot, className }: BadgeProps) {
  const variantClasses = {
    default: 'badge-default',
    red: 'badge-red',
    black: 'badge-black',
    green: 'badge bg-emerald-50 text-emerald-700 border border-emerald-200',
    blue: 'badge bg-blue-50 text-blue-700 border border-blue-200',
    yellow: 'badge bg-amber-50 text-amber-700 border border-amber-200',
    outline: 'badge bg-transparent text-brand-black border border-brand-gray',
  };

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0',
    md: 'text-xs px-2 py-0.5',
  };

  const dotColors = {
    default: 'bg-brand-gray-dark',
    red: 'bg-brand-red',
    black: 'bg-white',
    green: 'bg-emerald-500',
    blue: 'bg-blue-500',
    yellow: 'bg-amber-500',
    outline: 'bg-brand-black',
  };

  return (
    <span className={cn(variantClasses[variant], sizeClasses[size], 'inline-flex items-center gap-1 font-medium rounded-badge', className)}>
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotColors[variant])} />
      )}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    CONNECTED: { label: 'Connected', variant: 'green' },
    DISCONNECTED: { label: 'Disconnected', variant: 'default' },
    ERROR: { label: 'Error', variant: 'red' },
    SYNCING: { label: 'Syncing', variant: 'blue' },
    PENDING: { label: 'Pending', variant: 'yellow' },
    ACTIVE: { label: 'Active', variant: 'green' },
    DELETED: { label: 'Deleted', variant: 'default' },
    PUBLISHED: { label: 'Published', variant: 'green' },
    SCHEDULED: { label: 'Scheduled', variant: 'blue' },
    FAILED: { label: 'Failed', variant: 'red' },
    DRAFT: { label: 'Draft', variant: 'default' },
  };

  const config = statusMap[status] ?? { label: status, variant: 'default' as BadgeProps['variant'] };

  return (
    <Badge variant={config.variant} dot>
      {config.label}
    </Badge>
  );
}
