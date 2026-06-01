'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, type ApiResponse } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useFileStore } from '@/store/file.store';
import { useWorkspaceStore } from '@/store/workspace.store';
import { StickmanPattern } from '@/components/ui/BackgroundPattern';
import { cn, formatBytes, formatRelativeTime, storagePercentage } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { FileCard } from '@/components/files/FileCard';
import { WorkspaceCard } from '@/components/workspace/WorkspaceCard';
import { FileUploader } from '@/components/files/FileUploader';
import { LockedButton } from '@/components/ui/PlanGate';
import { MOCK_SYSTEM_STATS, MOCK_ACTIVITY_TIMELINE } from '@/mock/mockfile';
import type { FileMetadata } from '@hybridshare/shared/types/file';

interface DashboardStats {
  users: number;
  files: number;
  workspaces: number;
  storageUsed: number;
}

interface ActivityItem {
  id: string;
  actor: string;
  action: string;
  resource: string;
  createdAt: string;
}

function getGreeting(): string {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
}

function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="card p-12 text-center">
      <div className="w-12 h-12 bg-brand-white-soft rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-6 h-6 text-brand-gray-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-brand-black dark:text-white mb-1">{title}</p>
      <p className="text-sm text-brand-gray-dark mb-4">{description}</p>
      {action}
    </div>
  );
}

// ── Quick action card ─────────────────────────────────────────────────────────
function QuickAction({ icon, label, description, onClick, href, locked }: {
  icon: React.ReactNode; label: string; description: string;
  onClick?: () => void; href?: string; locked?: boolean;
}) {
  const inner = (
    <div className={cn(
      'card p-4 flex items-start gap-3 group transition-all duration-150',
      'hover:border-brand-gray-dark hover:shadow-card-hover',
      locked && 'opacity-70'
    )}>
      <div className="w-9 h-9 bg-brand-gray/50 dark:bg-dark-surface-2 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-brand-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-brand-black transition-colors duration-150">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-brand-black dark:text-white truncate">{label}</p>
        <p className="text-xs text-brand-gray-dark mt-0.5">{description}</p>
      </div>
      {locked && (
        <svg className="w-3.5 h-3.5 text-brand-red ml-auto flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )}
    </div>
  );

  if (href) return <Link href={href}>{inner}</Link>;
  return <button type="button" className="text-left w-full" onClick={onClick}>{inner}</button>;
}

// ── Storage ring ──────────────────────────────────────────────────────────────
function StorageRing({ used, quota }: { used: number; quota: number }) {
  const pct = storagePercentage(used, quota);
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="relative w-24 h-24 flex-shrink-0">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="currentColor" strokeWidth="7" className="text-brand-gray dark:text-dark-surface-2" />
        <circle cx="48" cy="48" r={r} fill="none"
          stroke={pct > 80 ? '#c12129' : pct > 60 ? '#f59e0b' : '#111'}
          strokeWidth="7"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          className="[transition:stroke-dasharray_0.8s_ease]"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-black text-brand-black dark:text-white leading-none">{pct}%</span>
        <span className="text-[9px] text-brand-gray-dark leading-none mt-0.5">used</span>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuthStore();
  const { files, fetchFiles } = useFileStore();
  const { workspaces, fetchWorkspaces } = useWorkspaceStore();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [showUploader, setShowUploader] = useState(false);

  useEffect(() => {
    fetchFiles({ limit: '8', sortBy: 'createdAt', sortOrder: 'desc' });
    fetchWorkspaces();

    api.get<ApiResponse<DashboardStats>>('/analytics/storage')
      .then((r) => setStats(r.data.data ?? null))
      .catch(() => setStats(MOCK_SYSTEM_STATS))
      .finally(() => setIsLoadingStats(false));

    api.get('/activity?limit=5')
      .then((r) => setActivity((r.data as { data: ActivityItem[] }).data ?? []))
      .catch(() => setActivity([]));
  }, []);

  const recentFiles = files.slice(0, 6);
  const storageUsed = user?.storageUsed ?? 0;
  const storageQuota = user?.storageQuota ?? 10_737_418_240;

  const statCards = [
    {
      label: 'Total Files',
      value: stats?.files.toLocaleString() ?? '—',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
      href: '/files',
      accent: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600',
    },
    {
      label: 'Workspaces',
      value: stats?.workspaces.toLocaleString() ?? '—',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>,
      href: '/workspaces',
      accent: 'bg-violet-50 dark:bg-violet-950/30 text-violet-600',
    },
    {
      label: 'Total Storage',
      value: formatBytes(stats?.storageUsed ?? 0),
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>,
      href: '/analytics',
      accent: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600',
    },
    {
      label: 'Team Members',
      value: stats?.users.toLocaleString() ?? '—',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      href: '/admin/users',
      accent: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600',
    },
  ];

  return (
    <div className="relative space-y-8 animate-fade-in">
      <StickmanPattern opacity={0.45} />

      {/* Header */}
      <div className="relative z-10 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">
            Good {getGreeting()},{' '}
            <span className="text-brand-red">{user?.name?.split(' ')[0] ?? 'there'}</span>
          </h1>
          <p className="text-sm text-brand-gray-dark mt-1">
            Here&apos;s what&apos;s happening across your workspaces today.
          </p>
        </div>
        <LockedButton feature="upload_file" onClick={() => setShowUploader(true)}>
          <Button variant="primary" size="md"
            iconLeft={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>}>
            Upload Files
          </Button>
        </LockedButton>
      </div>

      {/* Stat cards */}
      <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Link key={card.label} href={card.href} className="stat-card group">
            <div className="flex items-start justify-between">
              <div className={cn('p-2.5 rounded-lg', card.accent)}>
                {card.icon}
              </div>
              <svg className="w-4 h-4 text-brand-gray-dark opacity-0 group-hover:opacity-100 transition-opacity duration-150" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            {isLoadingStats
              ? <div className="h-7 w-16 bg-brand-gray animate-pulse rounded" />
              : <p className="text-2xl font-bold text-brand-black dark:text-white">{card.value}</p>}
            <p className="text-xs text-brand-gray-dark font-medium">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Mid row: storage + quick actions + recent activity */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Storage meter */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-brand-black dark:text-white">My Storage</h3>
            <Link href="/settings" className="text-xs text-brand-red hover:underline font-medium">Manage</Link>
          </div>
          <div className="flex items-center gap-4">
            <StorageRing used={storageUsed} quota={storageQuota} />
            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-brand-gray-dark">Used</span>
                  <span className="font-semibold text-brand-black dark:text-white">{formatBytes(storageUsed)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-brand-gray-dark">Total</span>
                  <span className="font-semibold text-brand-black dark:text-white">{formatBytes(storageQuota)}</span>
                </div>
              </div>
              {storagePercentage(storageUsed, storageQuota) > 80 && (
                <div className="flex items-center gap-1.5 text-[11px] text-brand-red font-medium">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Storage almost full
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-brand-black dark:text-white mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <QuickAction
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>}
              label="Upload Files"
              description="Add files to a workspace"
              onClick={() => setShowUploader(true)}
            />
            <QuickAction
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}
              label="New Workspace"
              description="Create a team or project space"
              href="/workspaces"
            />
            <QuickAction
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>}
              label="Add Connector"
              description="Connect Google Drive, OneDrive…"
              href="/connectors"
            />
          </div>
        </div>

        {/* Recent activity ticker */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-brand-black dark:text-white">Recent Activity</h3>
            <Link href="/activity" className="text-xs text-brand-red hover:underline font-medium">View all</Link>
          </div>
          {activity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <svg className="w-8 h-8 text-brand-gray-dark mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <p className="text-xs text-brand-gray-dark">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activity.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center gap-2.5">
                  <Avatar name={item.actor} size="xs" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-brand-black dark:text-white truncate">
                      <span className="font-semibold">{item.actor}</span> {item.action}{' '}
                      <span className="font-medium">{item.resource}</span>
                    </p>
                    <p className="text-[10px] text-brand-gray-dark">
                      {formatRelativeTime(new Date(item.createdAt))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent files */}
      <section className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Recent Files</h2>
          <Link href="/files" className="text-sm text-brand-red font-medium hover:underline">View all</Link>
        </div>
        {files.length === 0 ? (
          <EmptyState
            title="No files yet"
            description="Upload your first file to get started."
            action={<Button variant="primary" size="sm" onClick={() => setShowUploader(true)}>Upload File</Button>}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
            {recentFiles.map((file) => (
              <FileCard key={file.id} file={file as FileMetadata} />
            ))}
          </div>
        )}
      </section>

      {/* Workspaces */}
      <section className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Your Workspaces</h2>
          <Link href="/workspaces" className="text-sm text-brand-red font-medium hover:underline">View all</Link>
        </div>
        {workspaces.length === 0 ? (
          <EmptyState
            title="No workspaces yet"
            description="Create a workspace to organise files for your team."
            action={<Link href="/workspaces"><Button variant="secondary" size="sm">Create workspace</Button></Link>}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspaces.slice(0, 6).map((ws) => (
              <WorkspaceCard key={ws.id} workspace={ws as never} />
            ))}
          </div>
        )}
      </section>

      {showUploader && (
        <FileUploader
          onClose={() => setShowUploader(false)}
          onSuccess={() => {
            setShowUploader(false);
            fetchFiles({ limit: '8', sortBy: 'createdAt', sortOrder: 'desc' });
          }}
        />
      )}
    </div>
  );
}
