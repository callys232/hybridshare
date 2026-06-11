'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn, formatRelativeTime } from '@/lib/utils';
import { useNotificationStore } from '@/store/notification.store';
import { useAuthStore } from '@/store/auth.store';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { ThemeToggle } from '../ui/ThemeToggle';
import { api } from '@/lib/api';

interface SearchResult {
  id: string;
  name: string;
  type: 'file' | 'workspace';
  mimeType?: string;
  href: string;
}

export function TopBar({ title }: { title?: string }) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { notifications, unreadCount, markRead, markAllRead } = useNotificationStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await api.get(`/search?q=${encodeURIComponent(searchQuery)}`);
        const data = response.data.data as { files?: SearchResult[]; workspaces?: SearchResult[] };
        const results: SearchResult[] = [
          ...(data.files ?? []).map((f) => ({ ...f, type: 'file' as const, href: `/files/${f.id}` })),
          ...(data.workspaces ?? []).map((w) => ({ ...w, type: 'workspace' as const, href: `/workspaces/${w.id}` })),
        ];
        setSearchResults(results.slice(0, 8));
        setSearchOpen(true);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <header className="h-16 bg-white dark:bg-dark-surface-1 border-b border-brand-gray dark:border-dark-border flex items-center px-6 gap-4 sticky top-0 z-40">
      {title && (
        <h1 className="text-lg font-bold text-brand-black tracking-tight hidden md:block flex-shrink-0">
          {title}
        </h1>
      )}

      {/* Search */}
      <div ref={searchRef} className="relative flex-1 max-w-lg">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray-dark pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder="Search files, workspaces, connectors…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
              }
            }}
            className="input-field pl-9 pr-4 h-9 text-sm w-full"
            aria-label="Search"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-3.5 h-3.5 rounded-full border-2 border-brand-gray-dark border-t-transparent animate-spin" />
            </div>
          )}
        </div>

        {searchOpen && searchResults.length > 0 && (
          <div className="dropdown-menu absolute top-full left-0 right-0 mt-1 max-h-80 overflow-auto">
            {searchResults.map((result) => (
              <Link
                key={result.id}
                href={result.href}
                className="dropdown-item"
                onClick={() => setSearchOpen(false)}
              >
                <span className="text-brand-gray-dark">
                  {result.type === 'file' ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{result.name}</p>
                  <p className="text-xs text-brand-gray-dark capitalize">{result.type}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 ml-auto">
        {/* Theme toggle */}
        <ThemeToggle size="sm" className="mr-1" />
        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            className="icon-btn relative"
            onClick={() => setNotifOpen((v) => !v)}
            aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-red text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pop">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="dropdown-menu absolute right-0 top-full mt-1 w-80 max-h-96 overflow-auto">
              <div className="flex items-center justify-between px-3 py-2 border-b border-brand-gray">
                <span className="text-sm font-semibold">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    className="text-xs text-brand-red hover:underline font-medium"
                    onClick={markAllRead}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="p-6 text-center text-brand-gray-dark text-sm">
                  No notifications
                </div>
              ) : (
                notifications.slice(0, 10).map((notif) => (
                  <button
                    key={notif.id}
                    className={cn(
                      'w-full text-left px-3 py-3 border-b border-brand-gray/50 hover:bg-brand-white-soft transition-colors duration-100',
                      !notif.isRead && 'bg-brand-red-muted/30'
                    )}
                    onClick={() => markRead(notif.id)}
                  >
                    <div className="flex items-start gap-2.5">
                      {!notif.isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-red flex-shrink-0 mt-1.5" />
                      )}
                      <div className={cn(!notif.isRead ? '' : 'pl-4')}>
                        <p className="text-xs font-semibold text-brand-black">{notif.title}</p>
                        <p className="text-xs text-brand-gray-dark mt-0.5 leading-relaxed">{notif.message}</p>
                        <p className="text-[10px] text-brand-gray-dark mt-1">
                          {formatRelativeTime(notif.createdAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
              <Link
                href="/notifications"
                className="block w-full text-center py-2.5 text-xs font-semibold text-brand-red hover:text-red-700 border-t border-brand-gray transition-colors"
                onClick={() => setNotifOpen(false)}
              >
                View all notifications →
              </Link>
            </div>
          )}
        </div>

        {/* Profile */}
        <div ref={profileRef} className="relative ml-1">
          <button
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-brand-white-soft transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red"
            onClick={() => setProfileOpen((v) => !v)}
          >
            <Avatar name={user?.name ?? 'User'} src={user?.avatar} size="sm" />
            <svg className="w-3.5 h-3.5 text-brand-gray-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {profileOpen && (
            <div className="dropdown-menu absolute right-0 top-full mt-1 w-52">
              <div className="px-3 py-2.5 border-b border-brand-gray">
                <p className="text-sm font-semibold text-brand-black truncate">{user?.name}</p>
                <p className="text-xs text-brand-gray-dark truncate">{user?.email}</p>
              </div>
              <Link href="/settings" className="dropdown-item" onClick={() => setProfileOpen(false)}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </Link>
              {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                <Link href="/admin" className="dropdown-item" onClick={() => setProfileOpen(false)}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Admin
                </Link>
              )}
              <div className="divider my-1" />
              <button
                className="dropdown-item-danger w-full text-left disabled:opacity-50"
                disabled={signingOut}
                onClick={async () => {
                  setSigningOut(true);
                  setProfileOpen(false);
                  await logout();
                  router.replace('/login');
                }}
              >
                {signingOut ? (
                  <div className="w-4 h-4 rounded-full border-2 border-red-400 border-t-transparent animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                )}
                {signingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
