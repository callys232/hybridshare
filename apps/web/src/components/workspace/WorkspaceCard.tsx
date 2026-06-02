'use client';

import Link from 'next/link';
import { cn, formatBytes, storagePercentage, formatRelativeTime } from '@/lib/utils';
import type { Workspace } from '@hybridshare/shared/types/workspace';
import { AvatarGroup } from '../ui/Avatar';
import { Badge } from '../ui/Badge';

interface WorkspaceCardProps {
  workspace: Workspace & {
    memberCount?: number;
    fileCount?: number;
    members?: Array<{ user: { id: string; name: string; avatar: string | null } }>;
  };
}

export function WorkspaceCard({ workspace }: WorkspaceCardProps) {
  const storagePct = storagePercentage(
    Number(workspace.storageUsed),
    Number(workspace.storageQuota)
  );

  const members = workspace.members?.filter((m) => m.user).map((m) => ({
    id: m.user!.id,
    name: m.user!.name,
    avatar: m.user!.avatar,
  })) ?? [];

  const typeColors: Record<string, string> = {
    PERSONAL: 'bg-violet-50 text-violet-600',
    TEAM: 'bg-blue-50 text-blue-600',
    PROJECT: 'bg-amber-50 text-amber-600',
    DEPARTMENT: 'bg-emerald-50 text-emerald-600',
  };

  return (
    <Link
      href={`/workspaces/${workspace.id}`}
      className="card card-hover group flex flex-col p-5 gap-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-base flex-shrink-0 transition-transform duration-150 group-hover:scale-105"
            style={{ backgroundColor: workspace.color || '#c12129' }}
          >
            {workspace.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-brand-black truncate group-hover:text-brand-red transition-colors duration-150">
              {workspace.name}
            </p>
            <span className={cn('inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-badge mt-0.5', typeColors[workspace.type] ?? 'bg-brand-white-soft text-brand-gray-dark')}>
              {workspace.type}
            </span>
          </div>
        </div>

        <svg
          className="w-4 h-4 text-brand-gray-dark opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity duration-150"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>

      {/* Description */}
      {workspace.description && (
        <p className="text-xs text-brand-gray-dark leading-relaxed truncate-2">
          {workspace.description}
        </p>
      )}

      {/* Storage bar */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[10px] text-brand-gray-dark font-medium">
            {formatBytes(Number(workspace.storageUsed))} / {formatBytes(Number(workspace.storageQuota))}
          </span>
          <span className={cn(
            'text-[10px] font-semibold',
            storagePct > 80 ? 'text-brand-red' : 'text-brand-gray-dark'
          )}>
            {storagePct}%
          </span>
        </div>
        <div className="w-full h-1 bg-brand-gray rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              storagePct > 80 ? 'bg-brand-red' : storagePct > 60 ? 'bg-amber-400' : 'bg-brand-black'
            )}
            style={{ width: `${storagePct}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        {members.length > 0 ? (
          <AvatarGroup users={members} max={4} size="xs" />
        ) : (
          <span className="text-xs text-brand-gray-dark">
            {workspace.memberCount ?? 0} member{(workspace.memberCount ?? 0) !== 1 ? 's' : ''}
          </span>
        )}

        <div className="flex items-center gap-2 text-[10px] text-brand-gray-dark">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>{workspace.fileCount ?? 0} files</span>
        </div>
      </div>
    </Link>
  );
}
