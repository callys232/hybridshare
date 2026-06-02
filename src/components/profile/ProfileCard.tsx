'use client';

import Link from 'next/link';
import { cn, formatBytes, storagePercentage } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import type { User } from '@/shared/user';

interface ProfileCardProps {
  user: User;
  className?: string;
  /** Show storage meter and quick-nav actions */
  extended?: boolean;
}

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-brand-red/10 text-brand-red border-brand-red/20',
  ADMIN:       'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
  MANAGER:     'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  MEMBER:      'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  VIEWER:      'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  GUEST:       'bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700',
};

export function ProfileCard({ user, className, extended = false }: ProfileCardProps) {
  const storagePct = storagePercentage(user.storageUsed, user.storageQuota);
  const roleColor = ROLE_COLORS[user.role] ?? ROLE_COLORS.MEMBER;

  return (
    <div className={cn('card p-5', className)}>
      {/* Avatar + identity */}
      <div className="flex items-start gap-4">
        <div className="relative flex-shrink-0">
          <Avatar name={user.name} src={user.avatar} size="xl" />
          {user.isActive && (
            <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-dark-surface-1" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-brand-black dark:text-white truncate">{user.name}</p>
          <p className="text-xs text-brand-gray-dark truncate">{user.email}</p>
          {user.jobTitle && (
            <p className="text-xs text-brand-gray-dark mt-0.5 truncate">{user.jobTitle}</p>
          )}
          <span className={cn('inline-flex items-center mt-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border', roleColor)}>
            {user.role.replace('_', ' ')}
          </span>
        </div>
        <Link href="/settings/profile"
          className="flex-shrink-0 p-1.5 rounded-lg text-brand-gray-dark hover:text-brand-black hover:bg-brand-gray transition-colors duration-150"
          title="Edit profile">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </Link>
      </div>

      {/* Bio */}
      {user.bio && (
        <p className="text-xs text-brand-gray-dark mt-3 leading-relaxed line-clamp-2">{user.bio}</p>
      )}

      {extended && (
        <>
          {/* Storage meter */}
          <div className="mt-4 pt-4 border-t border-brand-gray dark:border-dark-border">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-semibold text-brand-black dark:text-white">Storage</span>
              <span className={cn('text-xs font-bold', storagePct > 80 ? 'text-brand-red' : 'text-brand-gray-dark')}>
                {storagePct}%
              </span>
            </div>
            <div className="h-1.5 bg-brand-gray dark:bg-dark-surface-2 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-500', storagePct > 80 ? 'bg-brand-red' : storagePct > 60 ? 'bg-amber-400' : 'bg-brand-black dark:bg-white')}
                style={{ width: `${storagePct}%` }}
              />
            </div>
            <p className="text-[10px] text-brand-gray-dark mt-1">
              {formatBytes(user.storageUsed)} of {formatBytes(user.storageQuota)} used
            </p>
          </div>

          {/* Quick links */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { href: '/files',       label: 'Files',    icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
              { href: '/workspaces',  label: 'Spaces',   icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
              { href: '/settings',    label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
            ].map(({ href, label, icon }) => (
              <Link key={href} href={href}
                className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-brand-white-soft dark:hover:bg-dark-surface-2 transition-colors duration-150 group">
                <svg className="w-4 h-4 text-brand-gray-dark group-hover:text-brand-black dark:group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={icon} />
                </svg>
                <span className="text-[9px] font-medium text-brand-gray-dark group-hover:text-brand-black dark:group-hover:text-white transition-colors">{label}</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
