'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { BreadcrumbNav } from '@/components/lfs/BreadcrumbNav';
import { GuestBanner } from '@/components/lfs/GuestBanner';
import { StorageBar } from '@/components/lfs/StorageBar';
import { Spinner } from '@/components/ui/Spinner';
import { isMockMode } from '@/mocks';
import type { LFSLibrary, LFSWorkspace, WorkspacePillar } from '@/types/lfs';

const PILLAR_CONFIG: Record<WorkspacePillar, { color: string; bg: string }> = {
  BIZ:         { color: 'text-blue-700',   bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900' },
  HCD:         { color: 'text-emerald-700', bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900' },
  SDC:         { color: 'text-purple-700', bg: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900' },
  MARKETPLACE: { color: 'text-amber-700',  bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900' },
  PERSONAL:    { color: 'text-brand-gray-dark', bg: 'bg-brand-white-soft dark:bg-dark-surface-2 border-brand-gray dark:border-dark-border' },
};

const MOCK_WS: LFSWorkspace = { id: 'w1', orgId: 'o1', name: 'Acme Business Hub', pillar: 'BIZ', description: 'Central workspace for all BIZ pillar documents, proposals, and reports.', memberCount: 12, libraryCount: 6, createdAt: new Date(Date.now() - 86400000 * 60).toISOString() };

const MOCK_LIBS: LFSLibrary[] = [
  { id: 'l1', workspaceId: 'w1', name: 'Business Proposals', description: 'Client proposals, pitch decks, and RFP responses', fileCount: 34, storageUsed: 1200000000, contentType: 'Business Proposal', updatedAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'l2', workspaceId: 'w1', name: 'Contracts & Agreements', description: 'NDAs, service agreements, and partnership contracts', fileCount: 18, storageUsed: 450000000, contentType: 'Contract', updatedAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 'l3', workspaceId: 'w1', name: 'Financial Reports', description: 'Quarterly and annual financial reports', fileCount: 22, storageUsed: 890000000, contentType: 'Diagnostic Report', updatedAt: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: 'l4', workspaceId: 'w1', name: 'Project Charters', description: 'Project initiation documents and charters', fileCount: 11, storageUsed: 220000000, contentType: 'Project Charter', updatedAt: new Date(Date.now() - 86400000 * 7).toISOString() },
  { id: 'l5', workspaceId: 'w1', name: 'Brand Assets', description: 'Logos, guidelines, and marketing materials', fileCount: 67, storageUsed: 3400000000, contentType: 'Media', updatedAt: new Date(Date.now() - 86400000 * 1).toISOString() },
  { id: 'l6', workspaceId: 'w1', name: 'Meeting Notes', description: 'Board minutes, team meetings, and client calls', fileCount: 45, storageUsed: 180000000, contentType: 'Document', updatedAt: new Date(Date.now() - 7200000).toISOString() },
];

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 ** 3) return `${(b / 1024 ** 2).toFixed(1)} MB`;
  return `${(b / 1024 ** 3).toFixed(1)} GB`;
}

export default function WorkspaceDetailPage() {
  const { id } = useParams<{ id: string }>() ?? { id: '' };
  const { user } = useAuthStore();
  const isGuest = !user;

  const [workspace, setWorkspace] = useState<LFSWorkspace | null>(null);
  const [libraries, setLibraries] = useState<LFSLibrary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newLibName, setNewLibName] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (isMockMode()) {
      setWorkspace(MOCK_WS);
      setLibraries(MOCK_LIBS);
      setIsLoading(false);
      return;
    }
    Promise.all([
      api.get(`/workspaces/${id}`),
      api.get(`/workspaces/${id}/libraries`),
    ]).then(([wsRes, libRes]) => {
      setWorkspace((wsRes.data as { data: LFSWorkspace }).data ?? MOCK_WS);
      setLibraries((libRes.data as { data: LFSLibrary[] }).data ?? MOCK_LIBS);
    }).catch(() => {
      setWorkspace(MOCK_WS);
      setLibraries(MOCK_LIBS);
    }).finally(() => setIsLoading(false));
  }, [id]);

  const handleCreate = () => {
    if (!newLibName.trim() || isGuest) return;
    const lib: LFSLibrary = { id: `l-${Date.now()}`, workspaceId: id, name: newLibName, fileCount: 0, storageUsed: 0, updatedAt: new Date().toISOString() };
    setLibraries((prev) => [lib, ...prev]);
    setNewLibName(''); setShowCreate(false);
    api.post(`/workspaces/${id}/libraries`, { name: newLibName }).catch(() => {});
  };

  const pc = workspace ? PILLAR_CONFIG[workspace.pillar] : PILLAR_CONFIG.BIZ;
  const totalStorage = libraries.reduce((s, l) => s + l.storageUsed, 0);
  const totalFiles = libraries.reduce((s, l) => s + l.fileCount, 0);

  return (
    <div className="space-y-0 animate-fade-in -m-6">
      {isGuest && <GuestBanner />}
      <div className="p-6 space-y-6">
        <BreadcrumbNav crumbs={[{ label: 'Workspaces', href: '/workspaces' }, { label: workspace?.name ?? '…' }]} />

        {isLoading ? (
          <div className="flex justify-center py-24"><Spinner size="lg" /></div>
        ) : (
          <>
            {/* Workspace header */}
            <div className="bg-white dark:bg-dark-surface-1 border border-brand-gray dark:border-dark-border rounded-2xl p-6 hover:border-brand-black dark:hover:border-dark-border-soft transition-colors">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center border', pc.bg)}>
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h1 className="text-xl font-black text-brand-black dark:text-dark-text">{workspace?.name}</h1>
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', pc.bg, pc.color)}>{workspace?.pillar}</span>
                    </div>
                    <p className="text-sm text-brand-gray-dark dark:text-dark-text-muted">{workspace?.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-brand-gray-dark dark:text-dark-text-muted">
                  <span>{workspace?.memberCount} members</span>
                  <span className="text-brand-gray dark:text-dark-border">·</span>
                  <span>{totalFiles} files</span>
                  <span className="text-brand-gray dark:text-dark-border">·</span>
                  <span>{formatBytes(totalStorage)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h2 className="font-bold text-brand-black dark:text-dark-text text-lg">Document Libraries</h2>
              <div className="flex items-center gap-2">
                <div className="flex border border-brand-gray dark:border-dark-border rounded-lg overflow-hidden">
                  <button type="button" aria-label="Grid view" onClick={() => setView('grid')} className={cn('p-2 transition-colors', view === 'grid' ? 'bg-brand-black text-white' : 'bg-white dark:bg-dark-surface-2 text-brand-gray-dark dark:text-dark-text-muted hover:bg-brand-white-soft dark:hover:bg-dark-surface-3')}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                  </button>
                  <button type="button" aria-label="List view" onClick={() => setView('list')} className={cn('p-2 transition-colors', view === 'list' ? 'bg-brand-black text-white' : 'bg-white dark:bg-dark-surface-2 text-brand-gray-dark dark:text-dark-text-muted hover:bg-brand-white-soft dark:hover:bg-dark-surface-3')}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                  </button>
                </div>
                {!isGuest ? (
                  <button type="button" onClick={() => setShowCreate(true)} className="btn-primary btn-md flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    New Library
                  </button>
                ) : (
                  <Link href="/register" className="btn-primary btn-md">Sign up to create</Link>
                )}
              </div>
            </div>

            {/* Create library form */}
            {showCreate && !isGuest && (
              <div className="bg-white dark:bg-dark-surface-1 border border-brand-gray dark:border-dark-border rounded-xl p-4 flex items-center gap-3 animate-slide-up">
                <input type="text" value={newLibName} onChange={(e) => setNewLibName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreate()} placeholder="Library name…" className="input-field flex-1" autoFocus aria-label="New library name" />
                <button type="button" onClick={handleCreate} disabled={!newLibName.trim()} className="btn-primary btn-sm">Create</button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-ghost btn-sm">Cancel</button>
              </div>
            )}

            {/* Libraries */}
            {view === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {libraries.map((lib) => (
                  <Link key={lib.id} href={`/workspaces/${id}/libraries/${lib.id}`} className="block group">
                    <div className="bg-white dark:bg-dark-surface-1 border border-brand-gray dark:border-dark-border rounded-2xl p-5 hover:border-brand-black dark:hover:border-dark-border-soft hover:shadow-card-hover transition-all duration-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-9 h-9 rounded-xl bg-brand-white-soft dark:bg-dark-surface-2 border border-brand-gray dark:border-dark-border flex items-center justify-center">
                          <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
                        </div>
                        {lib.contentType && (
                          <span className="text-[10px] font-semibold text-brand-gray-dark dark:text-dark-text-muted bg-brand-white-soft dark:bg-dark-surface-2 border border-brand-gray dark:border-dark-border px-2 py-0.5 rounded-full">{lib.contentType}</span>
                        )}
                      </div>
                      <h3 className="font-bold text-brand-black dark:text-dark-text mb-1 group-hover:text-brand-red transition-colors">{lib.name}</h3>
                      {lib.description && <p className="text-xs text-brand-gray-dark dark:text-dark-text-muted mb-3 line-clamp-2">{lib.description}</p>}
                      <div className="flex items-center justify-between text-xs text-brand-gray-dark dark:text-dark-text-muted mt-auto pt-2 border-t border-brand-gray dark:border-dark-border">
                        <span>{lib.fileCount} files</span>
                        <span>{formatBytes(lib.storageUsed)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-dark-surface-1 border border-brand-gray dark:border-dark-border rounded-2xl overflow-hidden hover:border-brand-black dark:hover:border-dark-border-soft transition-colors">
                {libraries.map((lib, i) => (
                  <Link key={lib.id} href={`/workspaces/${id}/libraries/${lib.id}`} className={cn('flex items-center gap-4 px-5 py-3.5 hover:bg-brand-white-soft dark:hover:bg-dark-surface-2 transition-colors group', i > 0 && 'border-t border-brand-gray dark:border-dark-border')}>
                    <div className="w-8 h-8 rounded-lg bg-brand-white-soft dark:bg-dark-surface-2 border border-brand-gray dark:border-dark-border flex items-center justify-center flex-shrink-0"><svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-brand-black dark:text-dark-text group-hover:text-brand-red transition-colors truncate">{lib.name}</p>
                      {lib.description && <p className="text-xs text-brand-gray-dark dark:text-dark-text-muted truncate">{lib.description}</p>}
                    </div>
                    <span className="text-xs text-brand-gray-dark dark:text-dark-text-muted hidden md:block">{lib.fileCount} files</span>
                    <span className="text-xs text-brand-gray-dark dark:text-dark-text-muted hidden sm:block w-16 text-right">{formatBytes(lib.storageUsed)}</span>
                    <span className="text-xs text-brand-gray-dark dark:text-dark-text-muted hidden lg:block w-28 text-right">{new Date(lib.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                    <svg className="w-4 h-4 text-brand-gray-dark dark:text-dark-text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
