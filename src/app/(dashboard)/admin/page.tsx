'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { MOCK_SYSTEM_STATS, MOCK_STORAGE_DATA, MOCK_USERS } from '@/mocks';

function formatBytes(bytes: number): string {
  if (bytes >= 1099511627776) return `${(bytes / 1099511627776).toFixed(1)} TB`;
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

const STAT_CARDS = [
  {
    label: 'Total Users',
    value: MOCK_SYSTEM_STATS.users,
    href: '/admin/users',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
  },
  {
    label: 'Total Files',
    value: MOCK_SYSTEM_STATS.files.toLocaleString(),
    href: '/admin/files',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
      </svg>
    ),
    color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20',
  },
  {
    label: 'Workspaces',
    value: MOCK_SYSTEM_STATS.workspaces,
    href: '/workspaces',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
  },
  {
    label: 'Storage Used',
    value: formatBytes(MOCK_SYSTEM_STATS.storageUsed),
    href: '/admin/analytics',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
      </svg>
    ),
    color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
  },
];

const QUICK_LINKS = [
  { href: '/admin/users', label: 'Manage Users', desc: 'Create accounts, set roles and permissions', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { href: '/admin/analytics', label: 'Analytics', desc: 'Storage usage, activity trends, file breakdown', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { href: '/admin/files', label: 'All Files', desc: 'Browse and manage every file in the organisation', icon: 'M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z' },
  { href: '/settings/organization', label: 'Organisation', desc: 'Domain, branding, and workspace settings', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { href: '/settings/billing', label: 'Billing', desc: 'Subscription plan, usage limits and invoices', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { href: '/connectors', label: 'Connectors', desc: 'Manage database, cloud, and CRM integrations', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
];

const recentUsers = MOCK_USERS.slice(0, 3);

export default function AdminHomePage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-brand-black dark:text-dark-text">Admin Overview</h1>
        <p className="text-sm text-brand-gray-dark dark:text-dark-text-muted mt-0.5">Organisation health at a glance</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="card p-4 hover:border-brand-black dark:hover:border-dark-border-soft transition-colors group"
          >
            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-3', stat.color)}>
              {stat.icon}
            </div>
            <p className="text-2xl font-bold text-brand-black dark:text-dark-text group-hover:text-brand-red transition-colors">
              {stat.value}
            </p>
            <p className="text-xs text-brand-gray-dark dark:text-dark-text-muted mt-0.5">{stat.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick links */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-brand-black dark:text-dark-text mb-3">Quick access</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-start gap-3 p-4 rounded-xl border border-brand-gray dark:border-dark-border bg-white dark:bg-dark-surface-1 hover:border-brand-black dark:hover:border-dark-border-soft hover:bg-brand-white-soft dark:hover:bg-dark-surface-2 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-brand-white-soft dark:bg-dark-surface-2 border border-brand-gray dark:border-dark-border flex items-center justify-center flex-shrink-0 group-hover:border-brand-black dark:group-hover:border-dark-border-soft transition-colors">
                  <svg className="w-4 h-4 text-brand-gray-dark dark:text-dark-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={link.icon} />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-brand-black dark:text-dark-text group-hover:text-brand-red transition-colors">{link.label}</p>
                  <p className="text-xs text-brand-gray-dark dark:text-dark-text-muted mt-0.5 leading-relaxed">{link.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right panel — recent users + storage breakdown */}
        <div className="space-y-4">
          {/* Recent users */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-brand-black dark:text-dark-text">Recent users</h2>
              <Link href="/admin/users" className="text-xs text-brand-red hover:underline font-medium">View all</Link>
            </div>
            <div className="space-y-2">
              {recentUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl border border-brand-gray dark:border-dark-border bg-white dark:bg-dark-surface-1">
                  <div className="w-8 h-8 rounded-full bg-brand-black dark:bg-dark-border flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-white">{u.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-brand-black dark:text-dark-text truncate">{u.name}</p>
                    <p className="text-[10px] text-brand-gray-dark dark:text-dark-text-muted capitalize">{String(u.role).toLowerCase().replace('_', ' ')}</p>
                  </div>
                  <span className={cn(
                    'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                    u.isActive
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                      : 'bg-brand-gray/30 text-brand-gray-dark border-brand-gray'
                  )}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Storage by workspace */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-brand-black dark:text-dark-text">Storage by workspace</h2>
              <Link href="/admin/analytics" className="text-xs text-brand-red hover:underline font-medium">Details</Link>
            </div>
            <div className="space-y-3">
              {MOCK_STORAGE_DATA.byWorkspace.map((ws) => {
                const pct = Math.round((ws.storageUsed / ws.storageQuota) * 100);
                return (
                  <div key={ws.id}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-brand-black dark:text-dark-text truncate max-w-[60%]">{ws.name}</p>
                      <p className="text-[10px] text-brand-gray-dark dark:text-dark-text-muted">{formatBytes(ws.storageUsed)}</p>
                    </div>
                    <div className="w-full h-1.5 bg-brand-gray dark:bg-dark-surface-2 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', pct > 80 ? 'bg-brand-red' : pct > 60 ? 'bg-amber-400' : 'bg-brand-black dark:bg-dark-border')}
                        ref={(el) => { if (el) el.style.setProperty('width', `${pct}%`); }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
