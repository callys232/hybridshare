'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { FileIcon } from '@/components/lfs/FileIcon';
import { FileSizeLabel } from '@/components/lfs/FileSizeLabel';
import { WavesPattern } from '@/components/ui/BackgroundPattern';
import { GuestBanner } from '@/components/lfs/GuestBanner';
import { BreadcrumbNav } from '@/components/lfs/BreadcrumbNav';
import { Spinner } from '@/components/ui/Spinner';

interface DeletedFile {
  id: string;
  name: string;
  extension: string;
  sizeBytes: number;
  deletedBy: string;
  deletedAt: string;
  expiresAt: string;
  location: string;
}

const MOCK_DELETED: DeletedFile[] = [
  { id: 'd1', name: 'Old Marketing Brief.docx', extension: 'docx', sizeBytes: 340000, deletedBy: 'Amara Okonkwo', deletedAt: new Date(Date.now() - 86400000 * 5).toISOString(), expiresAt: new Date(Date.now() + 86400000 * 25).toISOString(), location: 'Brand Assets / Marketing' },
  { id: 'd2', name: 'Draft Proposal v1.pdf', extension: 'pdf', sizeBytes: 1200000, deletedBy: 'Chidi Eze', deletedAt: new Date(Date.now() - 86400000 * 12).toISOString(), expiresAt: new Date(Date.now() + 86400000 * 18).toISOString(), location: 'Business Proposals' },
  { id: 'd3', name: 'Temp Data Export.csv', extension: 'csv', sizeBytes: 45000, deletedBy: 'Ngozi Adaora', deletedAt: new Date(Date.now() - 86400000 * 2).toISOString(), expiresAt: new Date(Date.now() + 86400000 * 28).toISOString(), location: 'Financial Reports' },
  { id: 'd4', name: 'Archive 2024 Q2.zip', extension: 'zip', sizeBytes: 52000000, deletedBy: 'Amara Okonkwo', deletedAt: new Date(Date.now() - 86400000 * 20).toISOString(), expiresAt: new Date(Date.now() + 86400000 * 10).toISOString(), location: 'Shared Files' },
];

function daysUntil(iso: string) {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));
}

export default function RecycleBinPage() {
  const { user } = useAuthStore();
  const isGuest = !user;
  const [items, setItems] = useState<DeletedFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    api.get('/recycle-bin')
      .then((r) => setItems((r.data as { data: DeletedFile[] }).data ?? MOCK_DELETED))
      .catch(() => setItems(MOCK_DELETED))
      .finally(() => setIsLoading(false));
  }, []);

  const restore = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    api.post(`/recycle-bin/${id}/restore`).catch(() => {});
  };

  const deletePermanently = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    api.delete(`/recycle-bin/${id}`).catch(() => {});
  };

  const emptyBin = () => {
    setItems([]);
    api.delete('/recycle-bin').catch(() => {});
  };

  const toggle = (id: string) => setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div className="relative space-y-0 animate-fade-in -m-6">
      <WavesPattern opacity={0.4} />
      {isGuest && <GuestBanner />}
      <div className="relative z-10 p-6 space-y-6">
        <BreadcrumbNav crumbs={[{ label: 'Recycle Bin' }]} />

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="page-title">Recycle Bin</h1>
            <p className="text-sm text-brand-gray-dark dark:text-dark-text-muted mt-1">
              {items.length} item{items.length !== 1 ? 's' : ''} · Deleted files are permanently removed after 30 days
            </p>
          </div>
          {items.length > 0 && !isGuest && (
            <div className="flex items-center gap-2">
              {selected.size > 0 && (
                <>
                  <button type="button" onClick={() => { selected.forEach(restore); setSelected(new Set()); }} className="btn-outline btn-sm">Restore selected</button>
                  <button type="button" onClick={() => { selected.forEach(deletePermanently); setSelected(new Set()); }} className="btn-danger btn-sm">Delete selected</button>
                </>
              )}
              <button type="button" onClick={emptyBin} className="btn-danger btn-sm flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Empty bin
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-brand-white-soft dark:bg-dark-surface-2 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-brand-gray-dark dark:text-dark-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <p className="font-semibold text-brand-black dark:text-dark-text">Recycle bin is empty</p>
            <p className="text-sm text-brand-gray-dark dark:text-dark-text-muted mt-1">Deleted files will appear here for 30 days</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-dark-surface-1 border border-brand-gray dark:border-dark-border rounded-2xl overflow-hidden hover:border-brand-black dark:hover:border-dark-border-soft transition-colors">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-3 bg-brand-white-soft dark:bg-dark-surface-2 border-b border-brand-gray dark:border-dark-border">
              <button type="button" aria-label="Select all" onClick={() => setSelected(selected.size === items.length ? new Set() : new Set(items.map((i) => i.id)))} className={cn('w-4 h-4 rounded border-2 flex-shrink-0', selected.size === items.length ? 'bg-brand-red border-brand-red' : 'border-brand-gray dark:border-dark-border')} />
              <span className="flex-1 text-[11px] font-semibold text-brand-gray-dark dark:text-dark-text-muted uppercase tracking-wider">Name</span>
              <span className="text-[11px] font-semibold text-brand-gray-dark dark:text-dark-text-muted uppercase tracking-wider w-32 hidden md:block">Deleted by</span>
              <span className="text-[11px] font-semibold text-brand-gray-dark dark:text-dark-text-muted uppercase tracking-wider w-16 text-right hidden sm:block">Size</span>
              <span className="text-[11px] font-semibold text-brand-gray-dark dark:text-dark-text-muted uppercase tracking-wider w-24 text-right">Expires in</span>
              <span className="w-24 flex-shrink-0" />
            </div>

            {items.map((item, i) => {
              const days = daysUntil(item.expiresAt);
              const urgent = days <= 3;
              return (
                <div key={item.id} className={cn('flex items-center gap-3 px-5 py-3.5 hover:bg-brand-white-soft dark:hover:bg-dark-surface-2 transition-colors group', i > 0 && 'border-t border-brand-gray dark:border-dark-border')}>
                  <button type="button" aria-label="Select file" onClick={() => toggle(item.id)} className={cn('w-4 h-4 rounded border-2 flex-shrink-0', selected.has(item.id) ? 'bg-brand-red border-brand-red' : 'border-brand-gray dark:border-dark-border')} />
                  <FileIcon extension={item.extension} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-black dark:text-dark-text truncate">{item.name}</p>
                    <p className="text-xs text-brand-gray-dark dark:text-dark-text-muted truncate">{item.location}</p>
                  </div>
                  <span className="text-xs text-brand-gray-dark dark:text-dark-text-muted w-32 hidden md:block truncate">{item.deletedBy}</span>
                  <FileSizeLabel bytes={item.sizeBytes} className="text-xs text-brand-gray-dark dark:text-dark-text-muted w-16 text-right hidden sm:block flex-shrink-0" />
                  <span className={cn('text-xs font-semibold w-24 text-right flex-shrink-0', urgent ? 'text-brand-red' : 'text-brand-gray-dark dark:text-dark-text-muted')}>
                    {days === 0 ? 'Today' : `${days}d`}
                  </span>
                  {!isGuest && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity w-24 flex-shrink-0 justify-end">
                      <button type="button" onClick={() => restore(item.id)} className="text-xs font-semibold text-emerald-600 hover:underline">Restore</button>
                      <span className="text-brand-gray dark:text-dark-border">·</span>
                      <button type="button" onClick={() => deletePermanently(item.id)} className="text-xs font-semibold text-brand-red hover:underline">Delete</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
