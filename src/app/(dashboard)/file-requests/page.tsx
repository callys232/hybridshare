'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { GridPattern } from '@/components/ui/BackgroundPattern';
import { BreadcrumbNav } from '@/components/lfs/BreadcrumbNav';

interface FileRequest {
  id: string;
  title: string;
  description?: string;
  token: string;
  createdAt: string;
  expiresAt?: string;
  maxFiles?: number;
  filesReceived: number;
  status: 'active' | 'closed' | 'expired';
  lastActivity?: string;
}

const MOCK_REQUESTS: FileRequest[] = [
  {
    id: '1',
    title: 'Q4 Financial Documents',
    description: 'Q4 financials, tax returns, and supporting documentation.',
    token: 'req-abc123',
    createdAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    expiresAt: new Date(Date.now() + 5 * 86_400_000).toISOString(),
    maxFiles: 10,
    filesReceived: 3,
    status: 'active',
    lastActivity: new Date(Date.now() - 3_600_000).toISOString(),
  },
  {
    id: '2',
    title: 'Due Diligence Package — Acme Corp',
    description: 'Corporate structure, contracts, and IP documentation.',
    token: 'req-def456',
    createdAt: new Date(Date.now() - 7 * 86_400_000).toISOString(),
    expiresAt: new Date(Date.now() + 1 * 86_400_000).toISOString(),
    maxFiles: 25,
    filesReceived: 12,
    status: 'active',
    lastActivity: new Date(Date.now() - 7_200_000).toISOString(),
  },
  {
    id: '3',
    title: 'Onboarding Documents — New Client',
    token: 'req-ghi789',
    createdAt: new Date(Date.now() - 14 * 86_400_000).toISOString(),
    filesReceived: 5,
    status: 'closed',
    lastActivity: new Date(Date.now() - 5 * 86_400_000).toISOString(),
  },
  {
    id: '4',
    title: 'Compliance Audit — FY2025',
    token: 'req-jkl012',
    createdAt: new Date(Date.now() - 30 * 86_400_000).toISOString(),
    expiresAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    filesReceived: 8,
    status: 'expired',
  },
];

interface NewRequestForm {
  title: string;
  description: string;
  maxFiles: string;
  expiryDays: string;
  allowedTypes: string;
}

const INITIAL_FORM: NewRequestForm = { title: '', description: '', maxFiles: '10', expiryDays: '14', allowedTypes: '' };

function statusBadge(status: FileRequest['status']) {
  if (status === 'active') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'closed') return 'bg-zinc-100 text-zinc-600 border-zinc-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
}

function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

export default function FileRequestsPage() {
  const [requests, setRequests] = useState<FileRequest[]>(MOCK_REQUESTS);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<NewRequestForm>(INITIAL_FORM);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyLink = (token: string, id: string) => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/request/${token}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const closeRequest = (id: string) => {
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: 'closed' as const } : r));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setCreating(true);
    await new Promise((r) => setTimeout(r, 800));
    const token = `req-${Math.random().toString(36).slice(2, 9)}`;
    const newReq: FileRequest = {
      id: `${Date.now()}`,
      title: form.title,
      description: form.description || undefined,
      token,
      createdAt: new Date().toISOString(),
      expiresAt: form.expiryDays ? new Date(Date.now() + parseInt(form.expiryDays) * 86_400_000).toISOString() : undefined,
      maxFiles: form.maxFiles ? parseInt(form.maxFiles) : undefined,
      filesReceived: 0,
      status: 'active',
    };
    setRequests((prev) => [newReq, ...prev]);
    setForm(INITIAL_FORM);
    setShowCreate(false);
    setCreating(false);
  };

  const activeCount = requests.filter((r) => r.status === 'active').length;
  const totalFilesReceived = requests.reduce((s, r) => s + r.filesReceived, 0);

  return (
    <div className="relative space-y-0 animate-fade-in -m-6">
      <GridPattern opacity={0.55} />
      <div className="relative z-10 p-6 space-y-6">
        <BreadcrumbNav crumbs={[{ label: 'File Requests' }]} />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="page-title">File Requests</h1>
            <p className="text-sm text-brand-gray-dark mt-1">
              Request files from clients — they upload directly to you via a secure link.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="btn-primary btn-md flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Request
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Active requests', value: activeCount, color: 'text-emerald-600' },
            { label: 'Total files received', value: totalFilesReceived, color: 'text-brand-black' },
            { label: 'Total requests', value: requests.length, color: 'text-brand-black' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white border border-brand-gray rounded-xl p-4 shadow-card">
              <p className={cn('text-2xl font-black', stat.color)}>{stat.value}</p>
              <p className="text-xs text-brand-gray-dark mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Requests list */}
        <div className="bg-white border border-brand-gray rounded-2xl overflow-hidden shadow-card">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[1fr_80px_90px_100px_100px_40px] gap-3 px-4 py-2.5 bg-brand-white-soft border-b border-brand-gray text-[11px] font-semibold text-brand-gray-dark uppercase tracking-wider">
            <span>Request</span>
            <span className="text-center">Files</span>
            <span>Expires</span>
            <span>Status</span>
            <span>Link</span>
            <span />
          </div>

          {requests.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 rounded-2xl bg-brand-white-soft flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-brand-gray-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="font-semibold text-brand-black">No file requests yet</p>
              <p className="text-sm text-brand-gray-dark mt-1">Create a request and share the link with a client.</p>
            </div>
          ) : (
            requests.map((req) => {
              const days = daysUntil(req.expiresAt);
              return (
                <div key={req.id} className="flex items-center gap-3 px-4 py-4 border-b border-brand-gray last:border-0 hover:bg-brand-white-soft transition-colors">
                  {/* Title + description */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-brand-black truncate">{req.title}</p>
                    {req.description && (
                      <p className="text-xs text-brand-gray-dark truncate mt-0.5">{req.description}</p>
                    )}
                    <p className="text-[10px] text-brand-gray-dark mt-1">
                      Created {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {req.lastActivity && (
                        <> · Last activity {new Date(req.lastActivity).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</>
                      )}
                    </p>
                  </div>

                  {/* Files received */}
                  <div className="w-16 text-center flex-shrink-0">
                    <p className="text-sm font-bold text-brand-black">{req.filesReceived}</p>
                    <p className="text-[10px] text-brand-gray-dark">received</p>
                  </div>

                  {/* Expires */}
                  <div className="w-20 flex-shrink-0">
                    {days !== null ? (
                      <span className={cn(
                        'text-xs font-medium',
                        days <= 1 ? 'text-red-600' : days <= 3 ? 'text-amber-600' : 'text-brand-gray-dark'
                      )}>
                        {days <= 0 ? 'Today' : `${days}d left`}
                      </span>
                    ) : (
                      <span className="text-xs text-brand-gray-dark">No expiry</span>
                    )}
                  </div>

                  {/* Status badge */}
                  <div className="w-20 flex-shrink-0">
                    <span className={cn('text-[10px] font-semibold border rounded-full px-2 py-0.5 capitalize', statusBadge(req.status))}>
                      {req.status}
                    </span>
                  </div>

                  {/* Copy link */}
                  <div className="w-24 flex-shrink-0">
                    {req.status === 'active' ? (
                      <button
                        type="button"
                        onClick={() => copyLink(req.token, req.id)}
                        className={cn(
                          'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg border transition-colors',
                          copiedId === req.id
                            ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                            : 'border-brand-gray text-brand-black hover:border-brand-gray-dark'
                        )}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        {copiedId === req.id ? 'Copied!' : 'Copy link'}
                      </button>
                    ) : (
                      <span className="text-xs text-brand-gray-dark">—</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0">
                    {req.status === 'active' && (
                      <button
                        type="button"
                        onClick={() => closeRequest(req.id)}
                        title="Close request"
                        className="p-1.5 rounded-lg text-brand-gray-dark hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Create request modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-brand-gray animate-fade-in">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-brand-gray">
              <h2 className="text-base font-bold text-brand-black">New File Request</h2>
              <button type="button" onClick={() => setShowCreate(false)} className="icon-btn">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-black mb-1.5" htmlFor="new-req-title">
                  Request title <span className="text-red-500">*</span>
                </label>
                <input
                  id="new-req-title"
                  type="text"
                  required
                  placeholder="e.g. Q4 Financial Documents"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-brand-gray rounded-lg text-sm focus:outline-none focus:border-brand-black transition-colors"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-black mb-1.5" htmlFor="new-req-desc">
                  Instructions (optional)
                </label>
                <textarea
                  id="new-req-desc"
                  placeholder="Tell the client what to upload…"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-brand-gray rounded-lg text-sm focus:outline-none focus:border-brand-black transition-colors resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-brand-black mb-1.5" htmlFor="new-req-maxfiles">
                    Max files
                  </label>
                  <input
                    id="new-req-maxfiles"
                    type="number"
                    min={1}
                    max={100}
                    value={form.maxFiles}
                    onChange={(e) => setForm((f) => ({ ...f, maxFiles: e.target.value }))}
                    className="w-full px-3 py-2 border border-brand-gray rounded-lg text-sm focus:outline-none focus:border-brand-black transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-black mb-1.5" htmlFor="new-req-expiry">
                    Expires after (days)
                  </label>
                  <input
                    id="new-req-expiry"
                    type="number"
                    min={1}
                    max={90}
                    value={form.expiryDays}
                    onChange={(e) => setForm((f) => ({ ...f, expiryDays: e.target.value }))}
                    className="w-full px-3 py-2 border border-brand-gray rounded-lg text-sm focus:outline-none focus:border-brand-black transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-black mb-1.5" htmlFor="new-req-types">
                  Allowed file types (optional)
                </label>
                <input
                  id="new-req-types"
                  type="text"
                  placeholder="PDF, DOCX, XLSX — leave blank for all"
                  value={form.allowedTypes}
                  onChange={(e) => setForm((f) => ({ ...f, allowedTypes: e.target.value }))}
                  className="w-full px-3 py-2 border border-brand-gray rounded-lg text-sm focus:outline-none focus:border-brand-black transition-colors"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 border border-brand-gray text-sm font-medium text-brand-black rounded-xl hover:bg-brand-white-soft transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 bg-brand-black text-white text-sm font-semibold rounded-xl hover:bg-brand-red transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {creating && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {creating ? 'Creating…' : 'Create &amp; copy link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
