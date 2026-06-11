'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn, formatBytes, storagePercentage } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { useWorkspaceStore } from '@/store/workspace.store';
import { Avatar } from '../ui/Avatar';
import { Tooltip } from '../ui/Tooltip';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

const PLATFORM_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/files',
    label: 'Files',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
  },
  {
    href: '/workspaces',
    label: 'Workspaces',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    href: '/shared',
    label: 'Shared Links',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
    ),
  },
  {
    href: '/file-requests',
    label: 'File Requests',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
      </svg>
    ),
  },
  {
    href: '/connectors',
    label: 'Connectors',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
  {
    href: '/search',
    label: 'Search',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    href: '/activity',
    label: 'Activity',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    href: '/notifications',
    label: 'Notifications',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    href: '/tasks',
    label: 'Tasks',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    href: '/social',
    label: 'Social',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    ),
  },
  {
    href: '/recycle-bin',
    label: 'Recycle Bin',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
  },
];

const ADMIN_ITEMS: NavItem[] = [
  {
    href: '/admin/files',
    label: 'All Files',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    href: '/admin/users',
    label: 'User Management',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    href: '/admin/analytics',
    label: 'Analytics',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    href: '/settings/organization',
    label: 'Organization',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    href: '/settings/billing',
    label: 'Billing',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
];

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`));
  return (
    <Link
      href={item.href}
      className={cn(
        isActive ? 'sidebar-item-active' : 'sidebar-item',
        'relative group'
      )}
    >
      <span className={cn(
        'transition-colors duration-150',
        isActive ? 'text-brand-black' : 'text-brand-gray-dark group-hover:text-brand-black'
      )}>
        {item.icon}
      </span>
      <span>{item.label}</span>
      {item.badge !== undefined && item.badge > 0 && (
        <span className="ml-auto text-[9px] font-bold bg-brand-red text-white px-1.5 py-0.5 rounded-full">
          {item.badge}
        </span>
      )}
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-brand-red rounded-r-full" />
      )}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { workspaces } = useWorkspaceStore();
  const [signingOut, setSigningOut] = useState(false);

  const handleLogout = async () => {
    setSigningOut(true);
    await logout();
    router.replace('/login');
  };

  const storageUsed = user?.storageUsed ?? 0;
  const storageQuota = user?.storageQuota ?? 10737418240;
  const storagePct = storagePercentage(storageUsed, storageQuota);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  return (
    <aside className="w-60 bg-white dark:bg-dark-surface-1 border-r border-brand-gray dark:border-dark-border flex flex-col h-full shadow-sidebar">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-brand-gray dark:border-dark-border flex-shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-brand-black rounded-lg flex items-center justify-center transition-transform duration-150 group-hover:scale-110">
            <div className="w-3 h-3 bg-brand-red rounded-sm" />
          </div>
          <span className="font-bold text-base text-brand-black tracking-tight">
            Lamid FileShare
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5 scrollbar-thin">
        {/* Platform section */}
        <p className="px-3 text-[10px] font-semibold text-brand-gray-dark uppercase tracking-widest mb-1.5 mt-1">
          Platform
        </p>
        {PLATFORM_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}

        {/* Admin section */}
        {isAdmin && (
          <div className="pt-3">
            <p className="px-3 text-[10px] font-semibold text-brand-gray-dark uppercase tracking-widest mb-1.5">
              Admin
            </p>
            {ADMIN_ITEMS.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
        )}

        {/* Workspaces section */}
        {workspaces.length > 0 && (
          <div className="pt-3">
            <p className="px-3 text-[10px] font-semibold text-brand-gray-dark uppercase tracking-widest mb-1.5">
              Workspaces
            </p>
            {workspaces.slice(0, 5).map((ws) => (
              <Link
                key={ws.id}
                href={`/workspaces/${ws.id}`}
                className={cn(
                  pathname === `/workspaces/${ws.id}` ? 'sidebar-item-active' : 'sidebar-item'
                )}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0 bg-brand-red"
                  ref={(el) => { if (el && ws.color) el.style.setProperty('background-color', ws.color); }}
                />
                <span className="truncate">{ws.name}</span>
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Upgrade CTA */}
      <div className="px-3 pb-2">
        <Link
          href="/upgrade"
          className={cn(
            'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold w-full',
            'bg-gradient-to-r from-brand-red/10 to-brand-red/5',
            'border border-brand-red/20 text-brand-red',
            'hover:from-brand-red/20 hover:to-brand-red/10 hover:border-brand-red/40',
            'transition-all duration-150 group'
          )}
        >
          <svg className="w-3.5 h-3.5 flex-shrink-0 transition-transform duration-150 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Upgrade Plan
        </Link>
      </div>

      {/* Storage meter */}
      <div className="px-4 py-3 border-t border-brand-gray">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-brand-gray-dark font-medium">Storage</span>
          <span className="text-xs text-brand-black font-semibold">{storagePct}%</span>
        </div>
        <div className="w-full h-1.5 bg-brand-gray rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              storagePct > 80 ? 'bg-brand-red' : storagePct > 60 ? 'bg-amber-400' : 'bg-brand-black'
            )}
            ref={(el) => { if (el) el.style.setProperty('width', `${storagePct}%`); }}
          />
        </div>
        <p className="text-[10px] text-brand-gray-dark mt-1">
          {formatBytes(storageUsed)} of {formatBytes(storageQuota)} used
        </p>
      </div>

      {/* User footer */}
      {user && (
        <div className="px-3 py-3 border-t border-brand-gray flex items-center gap-2.5">
          <Link href="/profile" className="flex-shrink-0">
            <Avatar name={user.name} src={user.avatar} size="sm" />
          </Link>
          <div className="flex-1 min-w-0">
            <Link href="/profile">
              <p className="text-xs font-semibold text-brand-black truncate hover:text-brand-red transition-colors">{user.name}</p>
              <p className="text-[10px] text-brand-gray-dark truncate capitalize">{user.role?.toLowerCase().replace('_', ' ')}</p>
            </Link>
          </div>
          <div className="flex items-center gap-1">
            <Tooltip content="Settings" side="top">
              <Link
                href="/settings"
                className="icon-btn w-6 h-6 p-0 hover:bg-brand-gray rounded transition-colors duration-150"
                aria-label="Settings"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
            </Tooltip>

            <Tooltip content="Sign out" side="top">
              <button
                type="button"
                aria-label="Sign out"
                disabled={signingOut}
                onClick={handleLogout}
                className="icon-btn w-6 h-6 p-0 hover:bg-red-50 hover:text-brand-red rounded transition-colors duration-150 disabled:opacity-40"
              >
                {signingOut ? (
                  <div className="w-3 h-3 rounded-full border-2 border-brand-gray-dark border-t-transparent animate-spin" />
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                )}
              </button>
            </Tooltip>
          </div>
        </div>
      )}
    </aside>
  );
}
