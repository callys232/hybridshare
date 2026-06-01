'use client';

import { cn, formatBytes, storagePercentage } from '@/lib/utils';

interface WorkspaceStorage {
  id: string;
  name: string;
  storageUsed: number;
  storageQuota: number;
}

export function StorageChart({ data }: { data: WorkspaceStorage[] }) {
  const max = Math.max(...data.map((d) => d.storageUsed));

  return (
    <div className="space-y-3">
      {data.map((item) => {
        const pct = storagePercentage(item.storageUsed, item.storageQuota);
        return (
          <div key={item.id}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-brand-black truncate max-w-[180px]">{item.name}</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[10px] text-brand-gray-dark">{formatBytes(item.storageUsed)}</span>
                <span className={cn(
                  'text-[10px] font-semibold px-1.5 py-0.5 rounded',
                  pct > 80 ? 'bg-brand-red-muted text-brand-red' : 'bg-brand-white-soft text-brand-gray-dark'
                )}>
                  {pct}%
                </span>
              </div>
            </div>
            <div className="w-full h-2 bg-brand-gray rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  pct > 80 ? 'bg-brand-red' : pct > 60 ? 'bg-amber-400' : 'bg-brand-black'
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
