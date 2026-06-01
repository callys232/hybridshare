'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { cn, formatBytes, formatRelativeTime, storagePercentage } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { Avatar } from '@/component/ui/Avatar';
import { ProfileCard } from '@/component/profile/ProfileCard';
import { ToastProvider } from '@/component/ui/Toast';
import { LinesPattern } from '@/component/ui/BackgroundPattern';
import { Spinner } from '@/component/ui/Spinner';

// ── Types ─────────────────────────────────────────────────────────────────────

type TabId = 'overview' | 'activity' | 'workspaces';

interface ActivityItem {
  id: string;
  action: string;
  resourceName: string;
  resourceType: string;
  createdAt: string;
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview',   label: 'Overview'   },
  { id: 'activity',   label: 'Activity'   },
  { id: 'workspaces', label: 'Workspaces' },
];

// ── Main ──────────────────────────────────────────────────────────────────────

function ProfileContent() {
  const { user } = useAuthStore();
  const params = useSearchParams();
  const [tab, setTab] = useState<TabId>((params.get('tab') as TabId) ?? 'overview');
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [workspaces, setWorkspaces] = useState<{ id: string; name: string; memberCount: number; storageUsed: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.allSettled([
      api.get('/activity?limit=10').then((r) => setActivity((r.data as { data: ActivityItem[] }).data ?? [])),
      api.get('/workspaces').then((r) => setWorkspaces((r.data as { data: typeof workspaces }).data ?? [])),
    ]).finally(() => setIsLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const storagePct = storagePercentage(user.storageUsed, user.storageQuota);

  return (
    <div className="relative min-h-full animate-fade-in">
      <LinesPattern opacity={0.4} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Profile card + tabs row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: profile card */}
          <ProfileCard user={user} extended className="lg:sticky lg:top-6 self-start" />

          {/* Right: tab content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Tab bar */}
            <div className="flex gap-1 border-b border-brand-gray dark:border-dark-border">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-all duration-150',
                    tab === t.id
                      ? 'border-brand-red text-brand-black dark:text-white'
                      : 'border-transparent text-brand-gray-dark hover:text-brand-black dark:hover:text-white hover:border-brand-gray'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── Overview ── */}
            {tab === 'overview' && (
              <div className="space-y-4">

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Storage used',  value: formatBytes(user.storageUsed),  sub: `of ${formatBytes(user.storageQuota)}`, icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4' },
                    { label: 'Workspaces',    value: workspaces.length.toString(),   sub: 'active',                                icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
                    { label: 'Plan',           value: user.planType ?? 'Free',        sub: user.subscriptionStatus ?? '',          icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
                  ].map(({ label, value, sub, icon }) => (
                    <div key={label} className="card p-4">
                      <svg className="w-5 h-5 text-brand-gray-dark mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={icon} />
                      </svg>
                      <p className="text-xl font-black text-brand-black dark:text-white">{value}</p>
                      <p className="text-xs text-brand-gray-dark mt-0.5">{label}</p>
                      {sub && <p className="text-[10px] text-brand-gray-dark/70 mt-0.5">{sub}</p>}
                    </div>
                  ))}
                </div>

                {/* Storage bar */}
                <div className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-brand-black dark:text-white">Storage</p>
                    <p className={cn('text-xs font-bold', storagePct > 80 ? 'text-brand-red' : 'text-brand-gray-dark')}>
                      {storagePct}% used
                    </p>
                  </div>
                  <div className="h-2 bg-brand-gray dark:bg-dark-surface-2 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', storagePct > 80 ? 'bg-brand-red' : storagePct > 60 ? 'bg-amber-400' : 'bg-brand-black dark:bg-white')}
                      style={{ width: `${storagePct}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5 text-[10px] text-brand-gray-dark">
                    <span>{formatBytes(user.storageUsed)} used</span>
                    <span>{formatBytes(user.storageQuota)} total</span>
                  </div>
                  {storagePct > 80 && (
                    <Link href="/upgrade" className="mt-2 text-xs font-semibold text-brand-red hover:underline block">
                      Upgrade for more storage →
                    </Link>
                  )}
                </div>

                {/* Quick links */}
                <div className="card p-4">
                  <p className="text-xs font-bold text-brand-black dark:text-white mb-3 uppercase tracking-wider">Quick navigation</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { href: '/files',       label: 'My Files',        icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                      { href: '/workspaces',  label: 'Workspaces',      icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
                      { href: '/shared',      label: 'Shared Links',    icon: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z' },
                      { href: '/settings/profile', label: 'Edit Profile', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
                    ].map(({ href, label, icon }) => (
                      <Link key={href} href={href}
                        className="flex items-center gap-2.5 p-3 rounded-xl border border-brand-gray hover:border-brand-black hover:bg-brand-white-soft dark:hover:bg-dark-surface-2 transition-all duration-150 group">
                        <svg className="w-4 h-4 text-brand-gray-dark group-hover:text-brand-black dark:group-hover:text-white transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={icon} />
                        </svg>
                        <span className="text-xs font-medium text-brand-black dark:text-white">{label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Activity ── */}
            {tab === 'activity' && (
              <div className="space-y-3">
                {isLoading ? (
                  <div className="flex justify-center py-10"><Spinner size="md" /></div>
                ) : activity.length === 0 ? (
                  <div className="card p-12 text-center">
                    <svg className="w-10 h-10 text-brand-gray-dark mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <p className="text-sm font-semibold text-brand-black dark:text-white mb-1">No activity yet</p>
                    <p className="text-xs text-brand-gray-dark">Your file and workspace actions will appear here.</p>
                  </div>
                ) : (
                  activity.map((item) => (
                    <div key={item.id} className="card p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-brand-white-soft dark:bg-dark-surface-2 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-brand-gray-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-brand-black dark:text-white">
                          <span className="font-medium">{item.action}</span>{' '}
                          <span className="font-semibold">{item.resourceName}</span>
                        </p>
                        <p className="text-[10px] text-brand-gray-dark capitalize">{item.resourceType} · {formatRelativeTime(new Date(item.createdAt))}</p>
                      </div>
                    </div>
                  ))
                )}
                <Link href="/activity" className="block text-center text-xs font-semibold text-brand-red hover:underline pt-1">
                  View full activity log →
                </Link>
              </div>
            )}

            {/* ── Workspaces ── */}
            {tab === 'workspaces' && (
              <div className="space-y-3">
                {isLoading ? (
                  <div className="flex justify-center py-10"><Spinner size="md" /></div>
                ) : workspaces.length === 0 ? (
                  <div className="card p-12 text-center">
                    <p className="text-sm font-semibold text-brand-black dark:text-white mb-2">No workspaces yet</p>
                    <Link href="/workspaces" className="text-xs font-semibold text-brand-red hover:underline">
                      Create a workspace →
                    </Link>
                  </div>
                ) : (
                  workspaces.map((ws) => (
                    <Link key={ws.id} href={`/workspaces/${ws.id}`}
                      className="card p-4 flex items-center gap-3 hover:border-brand-black hover:shadow-card-hover transition-all duration-150 group">
                      <div className="w-9 h-9 rounded-xl bg-brand-gray/50 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-brand-gray-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-brand-black dark:text-white group-hover:text-brand-red transition-colors truncate">{ws.name}</p>
                        <p className="text-xs text-brand-gray-dark">{ws.memberCount ?? 0} members · {formatBytes(ws.storageUsed ?? 0)} used</p>
                      </div>
                      <svg className="w-4 h-4 text-brand-gray-dark opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ToastProvider>
      <Suspense fallback={<div className="flex justify-center py-20"><Spinner size="lg" /></div>}>
        <ProfileContent />
      </Suspense>
    </ToastProvider>
  );
}
