'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { Avatar } from '@/component/ui/Avatar';
import { GuestBanner } from '@/component/lfs/GuestBanner';
import { BreadcrumbNav } from '@/component/lfs/BreadcrumbNav';
import { Spinner } from '@/component/ui/Spinner';
import { WavesPattern } from '@/component/ui/BackgroundPattern';
import type { LFSAuditLog } from '@/types/lfs';

// ── SVG action icons — no emojis ──────────────────────────────────────────────

const ACTION_ICONS: Record<string, React.ReactNode> = {
  upload: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  ),
  download: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  edit: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  delete: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  restore: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  share: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  ),
  comment: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
    </svg>
  ),
  approve: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  reject: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  move: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  ),
  rename: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  ),
  view: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
};

const DEFAULT_ICON = (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const ACTION_CONFIG: Record<string, { label: string; color: string; iconBg: string }> = {
  upload:   { label: 'uploaded',     color: 'text-blue-600 dark:text-blue-400',    iconBg: 'bg-blue-100 dark:bg-blue-900/40'    },
  download: { label: 'downloaded',   color: 'text-zinc-500 dark:text-zinc-400',    iconBg: 'bg-zinc-100 dark:bg-zinc-800'       },
  edit:     { label: 'edited',       color: 'text-amber-600 dark:text-amber-400',  iconBg: 'bg-amber-100 dark:bg-amber-900/40'  },
  delete:   { label: 'deleted',      color: 'text-brand-red',                      iconBg: 'bg-red-100 dark:bg-red-900/40'      },
  restore:  { label: 'restored',     color: 'text-emerald-600 dark:text-emerald-400', iconBg: 'bg-emerald-100 dark:bg-emerald-900/40' },
  share:    { label: 'shared',       color: 'text-purple-600 dark:text-purple-400',iconBg: 'bg-purple-100 dark:bg-purple-900/40'},
  comment:  { label: 'commented on', color: 'text-indigo-600 dark:text-indigo-400',iconBg: 'bg-indigo-100 dark:bg-indigo-900/40'},
  approve:  { label: 'approved',     color: 'text-emerald-600 dark:text-emerald-400', iconBg: 'bg-emerald-100 dark:bg-emerald-900/40' },
  reject:   { label: 'rejected',     color: 'text-brand-red',                      iconBg: 'bg-red-100 dark:bg-red-900/40'      },
  move:     { label: 'moved',        color: 'text-orange-600 dark:text-orange-400',iconBg: 'bg-orange-100 dark:bg-orange-900/40'},
  rename:   { label: 'renamed',      color: 'text-zinc-500 dark:text-zinc-400',    iconBg: 'bg-zinc-100 dark:bg-zinc-800'       },
  view:     { label: 'viewed',       color: 'text-zinc-500 dark:text-zinc-400',    iconBg: 'bg-zinc-100 dark:bg-zinc-800'       },
};

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_LOGS: LFSAuditLog[] = [
  { id: 'a1', action: 'upload',   resourceType: 'file', resourceId: 'f1', resourceName: 'Q4 Brand Guidelines.pdf',           actor: { id: 'u1', name: 'Amara Okonkwo', email: 'amara@example.com', role: 'admin'  }, ip: '41.58.12.4', createdAt: new Date(Date.now() - 1800000).toISOString() },
  { id: 'a2', action: 'share',    resourceType: 'file', resourceId: 'f3', resourceName: 'Investor Pitch Deck.pptx',          actor: { id: 'u2', name: 'Chidi Eze',     email: 'chidi@example.com',  role: 'member' }, ip: '41.58.12.5', metadata: { sharedWith: 'external' }, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'a3', action: 'comment',  resourceType: 'file', resourceId: 'f2', resourceName: 'Product Roadmap 2026.xlsx',         actor: { id: 'u3', name: 'Ngozi Adaora',  email: 'ngozi@example.com',  role: 'member' }, createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 'a4', action: 'edit',     resourceType: 'file', resourceId: 'f6', resourceName: 'Service Agreement — Acme Corp.docx',actor: { id: 'u2', name: 'Chidi Eze',     email: 'chidi@example.com',  role: 'member' }, ip: '41.58.12.5', createdAt: new Date(Date.now() - 86400000 * 0.5).toISOString() },
  { id: 'a5', action: 'approve',  resourceType: 'file', resourceId: 'f1', resourceName: 'Q4 Brand Guidelines.pdf',           actor: { id: 'u1', name: 'Amara Okonkwo', email: 'amara@example.com', role: 'admin'  }, createdAt: new Date(Date.now() - 86400000 * 1).toISOString() },
  { id: 'a6', action: 'upload',   resourceType: 'file', resourceId: 'f8', resourceName: 'Architecture Diagram v3.png',       actor: { id: 'u1', name: 'Amara Okonkwo', email: 'amara@example.com', role: 'admin'  }, createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 'a7', action: 'delete',   resourceType: 'file', resourceId: 'd1', resourceName: 'Old Marketing Brief.docx',          actor: { id: 'u1', name: 'Amara Okonkwo', email: 'amara@example.com', role: 'admin'  }, createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: 'a8', action: 'rename',   resourceType: 'file', resourceId: 'f4', resourceName: 'Team Photo — Lagos Summit.jpg',     actor: { id: 'u3', name: 'Ngozi Adaora',  email: 'ngozi@example.com',  role: 'member' }, metadata: { oldName: 'IMG_2048.jpg' }, createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function groupByDate(logs: LFSAuditLog[]) {
  const groups: Record<string, LFSAuditLog[]> = {};
  logs.forEach((l) => {
    const d = new Date(l.createdAt);
    const today = new Date();
    const yesterday = new Date(Date.now() - 86400000);
    const key =
      d.toDateString() === today.toDateString()     ? 'Today' :
      d.toDateString() === yesterday.toDateString() ? 'Yesterday' :
      d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    groups[key] = [...(groups[key] ?? []), l];
  });
  return groups;
}

const ACTION_FILTERS = ['All', 'upload', 'edit', 'share', 'comment', 'approve', 'delete'];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ActivityPage() {
  const { user } = useAuthStore();
  const isGuest = !user;
  const [logs, setLogs] = useState<LFSAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    api.get('/activity')
      .then((r) => setLogs((r.data as { data: LFSAuditLog[] }).data ?? MOCK_LOGS))
      .catch(() => setLogs(MOCK_LOGS))
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = filter === 'All' ? logs : logs.filter((l) => l.action === filter);
  const groups = groupByDate(filtered);

  return (
    <div className="relative space-y-0 animate-fade-in -m-6">
      <WavesPattern opacity={0.4} />
      {isGuest && <GuestBanner />}

      <div className="relative z-10 p-6 space-y-6">
        <BreadcrumbNav crumbs={[{ label: 'Activity' }]} />

        <div>
          <h1 className="page-title">Activity Feed</h1>
          <p className="text-sm text-brand-gray-dark dark:text-dark-text-muted mt-1">
            All file and workspace activity across your organisation
          </p>
        </div>

        {/* Action filter pills */}
        <div className="flex gap-2 flex-wrap">
          {ACTION_FILTERS.map((f) => {
            const ac = ACTION_CONFIG[f];
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all capitalize',
                  filter === f
                    ? 'bg-brand-black dark:bg-white text-white dark:text-brand-black border-brand-black dark:border-white'
                    : 'bg-white dark:bg-dark-surface-2 text-brand-gray-dark dark:text-dark-text-muted border-brand-gray dark:border-dark-border hover:border-brand-black dark:hover:border-dark-border-soft'
                )}
              >
                {f !== 'All' && (
                  <span className={cn('opacity-70', filter === f && 'opacity-100 text-white dark:text-brand-black')}>
                    {ACTION_ICONS[f] ?? DEFAULT_ICON}
                  </span>
                )}
                {f === 'All' ? `All (${logs.length})` : f}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 bg-brand-gray dark:bg-dark-surface-2 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-brand-gray-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="font-semibold text-brand-black dark:text-dark-text mb-1">No activity yet</p>
            <p className="text-sm text-brand-gray-dark">Actions on files and workspaces will appear here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groups).map(([date, entries]) => (
              <div key={date}>
                <p className="text-xs font-bold text-brand-gray-dark dark:text-dark-text-muted uppercase tracking-widest mb-3">
                  {date}
                </p>
                <div className="bg-white dark:bg-dark-surface-1 border border-brand-gray dark:border-dark-border rounded-2xl overflow-hidden hover:border-brand-black dark:hover:border-dark-border-soft transition-colors">
                  {entries.map((log, i) => {
                    const ac = ACTION_CONFIG[log.action] ?? { label: log.action, color: 'text-brand-gray-dark', iconBg: 'bg-zinc-100' };
                    const icon = ACTION_ICONS[log.action] ?? DEFAULT_ICON;
                    return (
                      <div
                        key={log.id}
                        className={cn(
                          'flex items-start gap-3 px-5 py-3.5 hover:bg-brand-white-soft dark:hover:bg-dark-surface-2 transition-colors',
                          i > 0 && 'border-t border-brand-gray dark:border-dark-border'
                        )}
                      >
                        <Avatar name={log.actor.name} size="sm" className="flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-brand-black dark:text-dark-text">
                            <span className="font-semibold">{log.actor.name}</span>
                            {' '}
                            <span className={cn('font-medium', ac.color)}>{ac.label}</span>
                            {' '}
                            <span className="font-medium">{log.resourceName}</span>
                          </p>
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <p className="text-xs text-brand-gray-dark dark:text-dark-text-muted mt-0.5">
                              {log.metadata.oldName ? `Renamed from "${log.metadata.oldName}"` : ''}
                              {log.metadata.sharedWith ? `Shared with ${log.metadata.sharedWith} users` : ''}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-brand-gray-dark dark:text-dark-text-muted">
                            <span className="capitalize">{log.resourceType}</span>
                            {log.ip && <><span>·</span><span>{log.ip}</span></>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 flex-shrink-0">
                          {/* SVG icon badge */}
                          <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', ac.iconBg, ac.color)}>
                            {icon}
                          </div>
                          <span className="text-[10px] text-brand-gray-dark dark:text-dark-text-muted whitespace-nowrap">
                            {timeAgo(log.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
