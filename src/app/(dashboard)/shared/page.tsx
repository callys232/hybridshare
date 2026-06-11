'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { cn, formatDate } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import { CirclesPattern } from '@/components/ui/BackgroundPattern';

interface SharedItem {
  id: string;
  name: string;
  type: 'file' | 'folder' | 'course' | 'workspace';
  sharedBy: { id: string; name: string; avatar: string | null };
  sharedAt: string;
  accessLevel: 'view' | 'edit' | 'admin';
  token: string;
}

const MOCK_SHARED: SharedItem[] = [
  { id: '1', name: 'Q4 Brand Guidelines.pdf', type: 'file', sharedBy: { id: 'u1', name: 'Amara Okonkwo', avatar: null }, sharedAt: new Date(Date.now() - 86400000 * 2).toISOString(), accessLevel: 'view', token: 'tok-1' },
  { id: '2', name: 'Product Roadmap 2026', type: 'folder', sharedBy: { id: 'u2', name: 'Chidi Eze', avatar: null }, sharedAt: new Date(Date.now() - 86400000 * 5).toISOString(), accessLevel: 'edit', token: 'tok-2' },
  { id: '3', name: 'React Masterclass', type: 'course', sharedBy: { id: 'u3', name: 'Ngozi Adaora', avatar: null }, sharedAt: new Date(Date.now() - 86400000 * 1).toISOString(), accessLevel: 'view', token: 'tok-3' },
  { id: '4', name: 'Design Team Workspace', type: 'workspace', sharedBy: { id: 'u4', name: 'Emeka Obi', avatar: null }, sharedAt: new Date(Date.now() - 86400000 * 10).toISOString(), accessLevel: 'edit', token: 'tok-4' },
];

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  file: {
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  folder: {
    color: 'text-amber-600 bg-amber-50 border-amber-200',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
  },
  course: {
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 14l9-5-9-5-9 5 9 5z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
      </svg>
    ),
  },
  workspace: {
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
};

const ACCESS_CONFIG = {
  view: { label: 'View only', color: 'text-brand-gray-dark bg-brand-white-soft border-brand-gray' },
  edit: { label: 'Can edit', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  admin: { label: 'Admin', color: 'text-brand-red bg-red-50 border-red-200' },
};

export default function SharedPage() {
  const [items, setItems] = useState<SharedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | SharedItem['type']>('all');

  useEffect(() => {
    api.get('/shared')
      .then((r) => setItems((r.data as { data: SharedItem[] }).data ?? (process.env.NODE_ENV === 'development' ? MOCK_SHARED : [])))
      .catch(() => { if (process.env.NODE_ENV === 'development') setItems(MOCK_SHARED); else setItems([]); })
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = filter === 'all' ? items : items.filter((i) => i.type === filter);

  return (
    <div className="relative space-y-8 animate-fade-in">
      <CirclesPattern opacity={0.45} />
      <div className="relative z-10 page-header">
        <div>
          <h1 className="page-title">Shared with me</h1>
          <p className="text-sm text-brand-gray-dark mt-1">{items.length} items shared with you</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'file', 'folder', 'course', 'workspace'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setFilter(t)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-semibold transition-all border capitalize',
              filter === t
                ? 'bg-brand-black text-white border-brand-black'
                : 'bg-white text-brand-gray-dark border-brand-gray hover:border-brand-black'
            )}
          >
            {t === 'all' ? `All (${items.length})` : t}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-full bg-brand-white-soft border border-brand-gray flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-brand-gray-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </div>
          <p className="font-semibold text-brand-black">Nothing shared yet</p>
          <p className="text-sm text-brand-gray-dark mt-1">Items shared with you will appear here</p>
        </div>
      ) : (
        <div className="bg-white border border-brand-gray rounded-2xl overflow-hidden hover:border-brand-black transition-colors">
          {filtered.map((item, i) => {
            const tc = TYPE_CONFIG[item.type];
            const ac = ACCESS_CONFIG[item.accessLevel];
            return (
              <div
                key={item.id}
                className={cn('flex items-center gap-4 px-5 py-4 hover:bg-brand-white-soft transition-colors group', i > 0 && 'border-t border-brand-gray')}
              >
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0', tc.color)}>
                  {tc.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-brand-black truncate group-hover:text-brand-red transition-colors">{item.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Avatar name={item.sharedBy.name} src={item.sharedBy.avatar} size="xs" />
                    <span className="text-xs text-brand-gray-dark">{item.sharedBy.name}</span>
                    <span className="text-brand-gray">·</span>
                    <span className="text-xs text-brand-gray-dark">{formatDate(item.sharedAt)}</span>
                  </div>
                </div>
                <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full border hidden sm:block', ac.color)}>
                  {ac.label}
                </span>
                <Link
                  href={`/share/${item.token}`}
                  className="text-xs font-semibold text-brand-black border border-brand-gray rounded-lg px-3 py-1.5 hover:bg-brand-black hover:text-white hover:border-brand-black transition-all opacity-0 group-hover:opacity-100"
                >
                  Open
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
