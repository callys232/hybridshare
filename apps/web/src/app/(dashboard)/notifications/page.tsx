'use client';

import { useEffect, useState } from 'react';
import { useNotificationStore } from '@/store/notification.store';
import { cn, formatRelativeTime } from '@/lib/utils';
import { WavesPattern } from '@/components/ui/BackgroundPattern';

type Filter = 'all' | 'unread';

// ── SVG icon map — no emojis ──────────────────────────────────────────────────

function IconShare()    { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>; }
function IconComment()  { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>; }
function IconWorkspace(){ return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>; }
function IconStorage()  { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>; }
function IconUpload()   { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>; }
function IconWarning()  { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>; }
function IconShield()   { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>; }
function IconEye()      { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>; }
function IconLink()     { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>; }
function IconBell()     { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>; }

interface NotifMeta { icon: React.ReactNode; bg: string; ring: string }

const TYPE_META: Record<string, NotifMeta> = {
  file_shared:             { icon: <IconShare />,    bg: 'bg-blue-50 dark:bg-blue-950/40',    ring: 'border-blue-200 dark:border-blue-800    text-blue-600 dark:text-blue-400'    },
  file_commented:          { icon: <IconComment />,  bg: 'bg-zinc-50 dark:bg-zinc-800',        ring: 'border-zinc-200 dark:border-zinc-700    text-zinc-500 dark:text-zinc-400'    },
  'comment.new':           { icon: <IconComment />,  bg: 'bg-zinc-50 dark:bg-zinc-800',        ring: 'border-zinc-200 dark:border-zinc-700    text-zinc-500 dark:text-zinc-400'    },
  workspace_invite:        { icon: <IconWorkspace />,bg: 'bg-violet-50 dark:bg-violet-950/40', ring: 'border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400'},
  'workspace.invite':      { icon: <IconWorkspace />,bg: 'bg-violet-50 dark:bg-violet-950/40', ring: 'border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400'},
  storage_limit:           { icon: <IconStorage />,  bg: 'bg-amber-50 dark:bg-amber-950/40',   ring: 'border-amber-200 dark:border-amber-800  text-amber-600 dark:text-amber-400'  },
  file_version:            { icon: <IconUpload />,   bg: 'bg-emerald-50 dark:bg-emerald-950/40',ring:'border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'},
  connector_error:         { icon: <IconWarning />,  bg: 'bg-red-50 dark:bg-red-950/40',       ring: 'border-red-200 dark:border-red-800      text-red-600 dark:text-red-400'      },
  new_login:               { icon: <IconShield />,   bg: 'bg-indigo-50 dark:bg-indigo-950/40', ring: 'border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400'},
  share_link_viewed:       { icon: <IconEye />,      bg: 'bg-teal-50 dark:bg-teal-950/40',     ring: 'border-teal-200 dark:border-teal-800    text-teal-600 dark:text-teal-400'    },
  share_link_downloaded:   { icon: <IconLink />,     bg: 'bg-sky-50 dark:bg-sky-950/40',       ring: 'border-sky-200 dark:border-sky-800      text-sky-600 dark:text-sky-400'      },
  'file.shared':           { icon: <IconShare />,    bg: 'bg-blue-50 dark:bg-blue-950/40',     ring: 'border-blue-200 dark:border-blue-800    text-blue-600 dark:text-blue-400'    },
};

const DEFAULT_META: NotifMeta = {
  icon: <IconBell />,
  bg:   'bg-brand-white-soft dark:bg-dark-surface-2',
  ring: 'border-brand-gray dark:border-dark-border text-brand-gray-dark',
};

function getNotifMeta(type: string): NotifMeta {
  return TYPE_META[type] ?? DEFAULT_META;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const { notifications, unreadCount, isLoading, fetchNotifications, markRead, markAllRead, dismiss } = useNotificationStore();
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const filtered = filter === 'unread'
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  // Group by relative date
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);

  const groups: { label: string; items: typeof filtered }[] = [];
  const todayItems     = filtered.filter((n) => new Date(n.createdAt) >= today);
  const yesterdayItems = filtered.filter((n) => { const d = new Date(n.createdAt); return d >= yesterday && d < today; });
  const olderItems     = filtered.filter((n) => new Date(n.createdAt) < yesterday);
  if (todayItems.length)     groups.push({ label: 'Today',     items: todayItems });
  if (yesterdayItems.length) groups.push({ label: 'Yesterday', items: yesterdayItems });
  if (olderItems.length)     groups.push({ label: 'Earlier',   items: olderItems });

  return (
    <div className="relative space-y-6 animate-fade-in">
      <WavesPattern opacity={0.5} />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="text-sm text-brand-gray-dark mt-1">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
              : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllRead()}
            className="text-sm font-semibold text-brand-red hover:text-red-700 transition-colors duration-150"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="relative z-10 flex gap-1 border-b border-brand-gray dark:border-dark-border">
        {(['all', 'unread'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px capitalize transition-all duration-150',
              filter === f
                ? 'border-brand-red text-brand-black dark:text-white'
                : 'border-transparent text-brand-gray-dark hover:text-brand-black dark:hover:text-white hover:border-brand-gray'
            )}
          >
            {f}
            {f === 'unread' && unreadCount > 0 && (
              <span className={cn(
                'ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                filter === f ? 'bg-brand-red text-white' : 'bg-brand-gray text-brand-gray-dark'
              )}>
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="card p-4 flex items-start gap-3 animate-pulse">
                <div className="w-10 h-10 bg-brand-gray rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-brand-gray rounded w-2/3" />
                  <div className="h-3 bg-brand-gray rounded w-full" />
                  <div className="h-3 bg-brand-gray rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-brand-white-soft dark:bg-dark-surface-2 rounded-xl border border-brand-gray dark:border-dark-border">
            <div className="w-14 h-14 bg-brand-gray dark:bg-dark-surface-1 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-brand-gray-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="font-semibold text-brand-black dark:text-white mb-1">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
            <p className="text-sm text-brand-gray-dark">
              {filter === 'unread'
                ? "You're all caught up."
                : 'Activity from your files and workspaces will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {groups.map(({ label, items }) => (
              <div key={label}>
                <p className="text-xs font-bold text-brand-gray-dark uppercase tracking-wide px-1 mb-2 mt-5 first:mt-0">
                  {label}
                </p>
                <div className="space-y-1.5">
                  {items.map((n) => {
                    const meta = getNotifMeta(n.type);
                    return (
                      <div
                        key={n.id}
                        className={cn(
                          'card p-4 flex items-start gap-3 transition-all duration-150 group cursor-pointer',
                          'hover:border-brand-gray-dark dark:hover:border-white/30 hover:shadow-card-hover',
                          !n.isRead && 'bg-red-50/40 dark:bg-red-950/20 border-red-100 dark:border-red-900/40'
                        )}
                        onClick={() => { if (!n.isRead) markRead(n.id); }}
                      >
                        {/* Type icon */}
                        <div className={cn(
                          'w-10 h-10 rounded-xl border flex items-center justify-center shrink-0',
                          meta.bg, meta.ring
                        )}>
                          {meta.icon}
                        </div>

                        {/* Body */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <p className={cn(
                                'text-sm font-semibold truncate',
                                !n.isRead ? 'text-brand-black dark:text-white' : 'text-brand-gray-dark'
                              )}>
                                {n.title}
                              </p>
                              {!n.isRead && (
                                <span className="w-2 h-2 bg-brand-red rounded-full shrink-0 flex-none" />
                              )}
                            </div>
                            <span className="text-[11px] text-brand-gray-dark shrink-0 flex-none">
                              {formatRelativeTime(new Date(n.createdAt))}
                            </span>
                          </div>
                          <p className="text-xs text-brand-gray-dark mt-0.5 leading-relaxed line-clamp-2">
                            {n.message}
                          </p>
                        </div>

                        {/* Dismiss */}
                        <button
                          type="button"
                          aria-label="Dismiss notification"
                          onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                          className="shrink-0 w-6 h-6 rounded flex items-center justify-center text-brand-gray-dark opacity-0 group-hover:opacity-100 hover:bg-brand-gray dark:hover:bg-dark-surface-2 hover:text-brand-black dark:hover:text-white transition-all duration-150"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
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
