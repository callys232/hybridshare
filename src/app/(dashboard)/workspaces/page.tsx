'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { GuestBanner } from '@/components/lfs/GuestBanner';
import { ShapesPattern } from '@/components/ui/BackgroundPattern';
import { Spinner } from '@/components/ui/Spinner';
import { LockedButton } from '@/components/ui/PlanGate';
import { isMockMode } from '@/mocks';
import type { LFSWorkspace, WorkspacePillar } from '@/types/lfs';

const PILLAR_ICONS: Record<WorkspacePillar, React.ReactNode> = {
  BIZ:         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  HCD:         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  SDC:         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  MARKETPLACE: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>,
  PERSONAL:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
};

const PILLAR_CONFIG: Record<WorkspacePillar, { label: string; color: string; bg: string }> = {
  BIZ:         { label: 'Business',      color: 'text-blue-700',        bg: 'bg-blue-50 border-blue-200'              },
  HCD:         { label: 'Human Capital', color: 'text-emerald-700',     bg: 'bg-emerald-50 border-emerald-200'        },
  SDC:         { label: 'Social Dev',    color: 'text-purple-700',      bg: 'bg-purple-50 border-purple-200'          },
  MARKETPLACE: { label: 'Marketplace',   color: 'text-amber-700',       bg: 'bg-amber-50 border-amber-200'            },
  PERSONAL:    { label: 'Personal',      color: 'text-brand-gray-dark', bg: 'bg-brand-white-soft border-brand-gray'  },
};

const MOCK_WORKSPACES: LFSWorkspace[] = [
  { id: 'w1', orgId: 'o1', name: 'Acme Business Hub', pillar: 'BIZ', description: 'Central workspace for all BIZ pillar documents, proposals, and reports.', memberCount: 12, libraryCount: 6, createdAt: new Date(Date.now() - 86400000 * 60).toISOString() },
  { id: 'w2', orgId: 'o1', name: 'Talent & Learning', pillar: 'HCD', description: 'Training materials, certificates, talent portfolios and HR documents.', memberCount: 8, libraryCount: 4, createdAt: new Date(Date.now() - 86400000 * 45).toISOString() },
  { id: 'w3', orgId: 'o1', name: 'Community Impact', pillar: 'SDC', description: 'Grant documents, field reports, and community impact assessments.', memberCount: 5, libraryCount: 3, createdAt: new Date(Date.now() - 86400000 * 30).toISOString() },
  { id: 'w4', orgId: 'o1', name: 'Marketplace Projects', pillar: 'MARKETPLACE', description: 'Project briefs, deliverables, invoices, and contracts.', memberCount: 15, libraryCount: 8, createdAt: new Date(Date.now() - 86400000 * 20).toISOString() },
  { id: 'w5', orgId: 'o1', name: 'My Personal Space', pillar: 'PERSONAL', description: 'Personal files and private documents.', memberCount: 1, libraryCount: 2, createdAt: new Date(Date.now() - 86400000 * 10).toISOString() },
];

export default function WorkspacesPage() {
  const { user } = useAuthStore();
  const isGuest = !user;
  const [workspaces, setWorkspaces] = useState<LFSWorkspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<WorkspacePillar | 'ALL'>('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPillar, setNewPillar] = useState<WorkspacePillar>('BIZ');

  useEffect(() => {
    if (isMockMode()) {
      setWorkspaces(MOCK_WORKSPACES);
      setIsLoading(false);
      return;
    }
    api.get('/workspaces')
      .then((r) => setWorkspaces((r.data as { data: LFSWorkspace[] }).data ?? MOCK_WORKSPACES))
      .catch(() => setWorkspaces(MOCK_WORKSPACES))
      .finally(() => setIsLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!newName.trim() || isGuest) return;
    const ws: LFSWorkspace = { id: `w-${Date.now()}`, orgId: 'o1', name: newName, pillar: newPillar, memberCount: 1, libraryCount: 0, createdAt: new Date().toISOString() };
    setWorkspaces((prev) => [ws, ...prev]);
    setNewName(''); setShowCreate(false);
    api.post('/workspaces', { name: newName, pillar: newPillar }).catch(() => {});
  };

  const filtered = filter === 'ALL' ? workspaces : workspaces.filter((w) => w.pillar === filter);

  return (
    <div className="relative space-y-0 animate-fade-in -m-6">
      <ShapesPattern opacity={0.4} />
      {isGuest && <GuestBanner />}
      <div className="relative z-10 p-6 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="page-title">Workspaces</h1>
            <p className="text-sm text-brand-gray-dark mt-1">{workspaces.length} workspaces across all pillars</p>
          </div>
          {!isGuest ? (
            <LockedButton feature="create_workspace" onClick={() => setShowCreate(true)}>
              <button type="button" className="btn-primary btn-md flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                New Workspace
              </button>
            </LockedButton>
          ) : (
            <Link href="/register" className="btn-primary btn-md">Sign up to create</Link>
          )}
        </div>

        {showCreate && !isGuest && (
          <div className="bg-white border border-brand-gray rounded-2xl p-5 space-y-4 animate-slide-up">
            <h2 className="font-bold text-brand-black">New Workspace</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="ws-name" className="block text-xs font-semibold text-brand-black mb-1.5">Name *</label>
                <input id="ws-name" type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Q4 Projects" className="input-field" autoFocus />
              </div>
              <div>
                <label htmlFor="ws-pillar" className="block text-xs font-semibold text-brand-black mb-1.5">Pillar</label>
                <select id="ws-pillar" value={newPillar} onChange={(e) => setNewPillar(e.target.value as WorkspacePillar)} className="input-field">
                  {(Object.keys(PILLAR_CONFIG) as WorkspacePillar[]).map((p) => (
                    <option key={p} value={p}>{PILLAR_CONFIG[p].label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={handleCreate} disabled={!newName.trim()} className="btn-primary btn-sm">Create</button>
              <button type="button" onClick={() => setShowCreate(false)} className="btn-ghost btn-sm">Cancel</button>
            </div>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          {(['ALL', ...Object.keys(PILLAR_CONFIG)] as ('ALL' | WorkspacePillar)[]).map((p) => (
            <button key={p} type="button" onClick={() => setFilter(p)} className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all', filter === p ? 'bg-brand-black text-white border-brand-black' : 'bg-white text-brand-gray-dark border-brand-gray hover:border-brand-black')}>
              {p === 'ALL' ? `All (${workspaces.length})` : `${PILLAR_CONFIG[p as WorkspacePillar].label} (${workspaces.filter((w) => w.pillar === p).length})`}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 bg-brand-gray rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-brand-gray-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="font-semibold text-brand-black dark:text-white">No workspaces yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((ws) => {
              const pc = PILLAR_CONFIG[ws.pillar];
              return (
                <Link key={ws.id} href={`/workspaces/${ws.id}`} className="block group">
                  <div className="bg-white border border-brand-gray rounded-2xl p-5 hover:border-brand-black hover:shadow-card-hover transition-all duration-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center border', pc.bg, pc.color)}>
                        {PILLAR_ICONS[ws.pillar]}
                      </div>
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', pc.bg, pc.color)}>{pc.label}</span>
                    </div>
                    <h3 className="font-bold text-brand-black mb-1 group-hover:text-brand-red transition-colors">{ws.name}</h3>
                    {ws.description && <p className="text-xs text-brand-gray-dark leading-relaxed mb-4 line-clamp-2">{ws.description}</p>}
                    <div className="flex items-center gap-4 text-xs text-brand-gray-dark">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        {ws.memberCount} members
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        {ws.libraryCount} libraries
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
