'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { GridPattern } from '@/component/ui/BackgroundPattern';
import { LockedButton } from '@/component/ui/PlanGate';
import { api } from '@/lib/api';
import { FileGridCard } from '@/component/lfs/FileGridCard';
import { FileListRow } from '@/component/lfs/FileListRow';
import { UploadDropzone } from '@/component/lfs/UploadDropzone';
import { UploadQueue } from '@/component/lfs/UploadQueue';
import { BreadcrumbNav } from '@/component/lfs/BreadcrumbNav';
import { GuestBanner } from '@/component/lfs/GuestBanner';
import { Spinner } from '@/component/ui/Spinner';
import type { LFSFile, LFSUploadJob, LibraryView, SortField, SortDir } from '@/types/lfs';

const MOCK_FILES: LFSFile[] = [
  { id: 'f1', libraryId: 'l1', name: 'Q4 Brand Guidelines.pdf', extension: 'pdf', mimeType: 'application/pdf', fileType: 'pdf', sizeBytes: 4500000, status: 'ready', isStarred: true, isLocked: false, version: 3, tags: ['brand', 'design'], metadata: {}, createdBy: { id: 'u1', name: 'Amara Okonkwo', email: 'amara@example.com', role: 'admin' }, updatedBy: { id: 'u2', name: 'Chidi Eze', email: 'chidi@example.com', role: 'member' }, createdAt: new Date(Date.now() - 86400000 * 30).toISOString(), updatedAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 'f2', libraryId: 'l1', name: 'Product Roadmap 2026.xlsx', extension: 'xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', fileType: 'xlsx', sizeBytes: 890000, status: 'ready', isStarred: false, isLocked: true, lockedBy: 'Chidi Eze', version: 5, tags: ['strategy', 'planning'], metadata: {}, createdBy: { id: 'u2', name: 'Chidi Eze', email: 'chidi@example.com', role: 'member' }, createdAt: new Date(Date.now() - 86400000 * 14).toISOString(), updatedAt: new Date(Date.now() - 86400000 * 1).toISOString() },
  { id: 'f3', libraryId: 'l1', name: 'Investor Pitch Deck.pptx', extension: 'pptx', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', fileType: 'pptx', sizeBytes: 22000000, status: 'ready', isStarred: true, isLocked: false, version: 2, tags: ['investor', 'pitch'], metadata: {}, createdBy: { id: 'u1', name: 'Amara Okonkwo', email: 'amara@example.com', role: 'admin' }, createdAt: new Date(Date.now() - 86400000 * 7).toISOString(), updatedAt: new Date(Date.now() - 3600000 * 4).toISOString() },
  { id: 'f4', libraryId: 'l1', name: 'Team Photo — Lagos Summit.jpg', extension: 'jpg', mimeType: 'image/jpeg', fileType: 'image', sizeBytes: 3200000, status: 'ready', thumbnailUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400', isStarred: false, isLocked: false, version: 1, tags: ['photos', 'event'], metadata: {}, createdBy: { id: 'u3', name: 'Ngozi Adaora', email: 'ngozi@example.com', role: 'member' }, createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), updatedAt: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: 'f5', libraryId: 'l1', name: 'Onboarding Video — Welcome.mp4', extension: 'mp4', mimeType: 'video/mp4', fileType: 'video', sizeBytes: 185000000, status: 'ready', isStarred: false, isLocked: false, version: 1, tags: ['hr', 'onboarding'], metadata: {}, createdBy: { id: 'u1', name: 'Amara Okonkwo', email: 'amara@example.com', role: 'admin' }, createdAt: new Date(Date.now() - 86400000 * 10).toISOString(), updatedAt: new Date(Date.now() - 86400000 * 10).toISOString() },
  { id: 'f6', libraryId: 'l1', name: 'Service Agreement — Acme Corp.docx', extension: 'docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', fileType: 'docx', sizeBytes: 540000, status: 'ready', isStarred: false, isLocked: false, version: 4, tags: ['legal', 'contract'], metadata: {}, createdBy: { id: 'u2', name: 'Chidi Eze', email: 'chidi@example.com', role: 'member' }, createdAt: new Date(Date.now() - 86400000 * 21).toISOString(), updatedAt: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: 'f7', libraryId: 'l1', name: 'Analytics Export May 2026.csv', extension: 'csv', mimeType: 'text/csv', fileType: 'csv', sizeBytes: 120000, status: 'ready', isStarred: false, isLocked: false, version: 1, tags: ['analytics', 'data'], metadata: {}, createdBy: { id: 'u3', name: 'Ngozi Adaora', email: 'ngozi@example.com', role: 'member' }, createdAt: new Date(Date.now() - 86400000 * 1).toISOString(), updatedAt: new Date(Date.now() - 86400000 * 1).toISOString() },
  { id: 'f8', libraryId: 'l1', name: 'Architecture Diagram v3.png', extension: 'png', mimeType: 'image/png', fileType: 'image', sizeBytes: 1800000, status: 'ready', isStarred: false, isLocked: false, version: 3, tags: ['tech', 'architecture'], metadata: {}, createdBy: { id: 'u1', name: 'Amara Okonkwo', email: 'amara@example.com', role: 'admin' }, createdAt: new Date(Date.now() - 86400000 * 6).toISOString(), updatedAt: new Date(Date.now() - 86400000 * 2).toISOString() },
];

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'updatedAt', label: 'Last modified' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'size', label: 'File size' },
  { value: 'createdAt', label: 'Date created' },
];

const TYPE_FILTERS = ['All', 'PDF', 'Document', 'Spreadsheet', 'Presentation', 'Image', 'Video', 'Audio', 'Other'];

export default function FilesPage() {
  const { user } = useAuthStore();
  const isGuest = !user;

  const [files, setFiles] = useState<LFSFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<LibraryView>('list');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortDir] = useState<SortDir>('desc');
  const [uploadJobs, setUploadJobs] = useState<LFSUploadJob[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [starredOnly, setStarredOnly] = useState(false);

  useEffect(() => {
    api.get('/files')
      .then((r) => setFiles((r.data as { data: LFSFile[] }).data ?? MOCK_FILES))
      .catch(() => setFiles(MOCK_FILES))
      .finally(() => setIsLoading(false));
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleStar = useCallback((id: string) => {
    setFiles((prev) => prev.map((f) => f.id === id ? { ...f, isStarred: !f.isStarred } : f));
    api.patch(`/files/${id}/star`).catch(() => {});
  }, []);

  const handleUploadFiles = (jobs: LFSUploadJob[]) => {
    setUploadJobs((prev) => [...prev, ...jobs]);
    setShowUpload(false);
  };

  const filtered = files
    .filter((f) => {
      if (starredOnly && !f.isStarred) return false;
      if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (typeFilter !== 'All') {
        const map: Record<string, string[]> = {
          PDF: ['pdf'], Document: ['docx'], Spreadsheet: ['xlsx'], Presentation: ['pptx'],
          Image: ['image'], Video: ['video'], Audio: ['audio'], Other: ['zip', 'csv', 'txt', 'other'],
        };
        if (!map[typeFilter]?.includes(f.fileType)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'size') cmp = a.sizeBytes - b.sizeBytes;
      else if (sortField === 'createdAt') cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      else cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const selectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((f) => f.id)));
  };

  return (
    <div className="relative space-y-0 animate-fade-in -m-6">
      <GridPattern opacity={0.55} />
      {isGuest && <GuestBanner />}
      <div className="relative z-10 p-6 space-y-6">
        <BreadcrumbNav crumbs={[{ label: 'Files' }]} />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="page-title">Files</h1>
            <p className="text-sm text-brand-gray-dark mt-1">{files.length} files · {SORT_OPTIONS.find((o) => o.value === sortField)?.label}</p>
          </div>
          <div className="flex items-center gap-2">
            {selected.size > 0 && (
              <div className="flex items-center gap-2 bg-brand-black text-white rounded-lg px-3 py-2">
                <span className="text-xs font-bold">{selected.size} selected</span>
                <button type="button" className="text-xs text-zinc-400 hover:text-white transition-colors">Download</button>
                <button type="button" className="text-xs text-zinc-400 hover:text-white transition-colors">Move</button>
                <button type="button" className="text-xs text-red-400 hover:text-red-300 transition-colors">Delete</button>
              </div>
            )}
            {!isGuest ? (
              <LockedButton feature="upload_file" onClick={() => setShowUpload((v) => !v)}>
              <button type="button" className="btn-primary btn-md flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                Upload
              </button>
              </LockedButton>
            ) : (
              <Link href="/register" className="btn-primary btn-md">Sign up to upload</Link>
            )}
          </div>
        </div>

        {showUpload && <UploadDropzone onFiles={handleUploadFiles} requiresAuth={isGuest} onAuthRequired={() => setShowUpload(false)} />}
        <UploadQueue jobs={uploadJobs} onRemove={(id) => setUploadJobs((prev) => prev.filter((j) => j.id !== id))} />

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-48 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Search files…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-brand-gray rounded-lg text-sm focus:outline-none focus:border-brand-black transition-colors bg-white" aria-label="Search files" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {TYPE_FILTERS.map((t) => (
              <button key={t} type="button" onClick={() => setTypeFilter(t)} className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border flex-shrink-0', typeFilter === t ? 'bg-brand-black text-white border-brand-black' : 'bg-white text-brand-gray-dark border-brand-gray hover:border-brand-black')}>{t}</button>
            ))}
          </div>
          <select aria-label="Sort files" value={sortField} onChange={(e) => setSortField(e.target.value as SortField)} className="text-sm border border-brand-gray rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-brand-black">
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button type="button" aria-label="Toggle starred" onClick={() => setStarredOnly((v) => !v)} className={cn('p-2 rounded-lg border transition-all', starredOnly ? 'bg-amber-50 border-amber-400 text-amber-500' : 'bg-white border-brand-gray text-brand-gray-dark hover:border-brand-black')}>
            <svg className="w-4 h-4" fill={starredOnly ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
          </button>
          <div className="flex border border-brand-gray rounded-lg overflow-hidden">
            <button type="button" aria-label="List view" onClick={() => setView('list')} className={cn('p-2 transition-colors', view === 'list' ? 'bg-brand-black text-white' : 'bg-white text-brand-gray-dark hover:bg-brand-white-soft')}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
            </button>
            <button type="button" aria-label="Grid view" onClick={() => setView('grid')} className={cn('p-2 transition-colors', view === 'grid' ? 'bg-brand-black text-white' : 'bg-white text-brand-gray-dark hover:bg-brand-white-soft')}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            </button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-brand-white-soft flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-brand-gray-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
            </div>
            <p className="font-semibold text-brand-black">No files found</p>
            <p className="text-sm text-brand-gray-dark mt-1">{search ? 'Try a different search term' : 'Upload your first file to get started'}</p>
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filtered.map((f) => <FileGridCard key={f.id} file={f} isSelected={selected.has(f.id)} onSelect={toggleSelect} onStar={toggleStar} requiresAuth={isGuest} />)}
          </div>
        ) : (
          <div className="bg-white border border-brand-gray rounded-2xl overflow-hidden hover:border-brand-black transition-colors">
            <div className="flex items-center gap-3 px-4 py-2.5 bg-brand-white-soft border-b border-brand-gray">
              <button type="button" aria-label="Select all" onClick={selectAll} className={cn('w-4 h-4 rounded border-2 flex-shrink-0', selected.size === filtered.length && filtered.length > 0 ? 'bg-brand-red border-brand-red' : 'border-brand-gray')} />
              <span className="flex-1 text-[11px] font-semibold text-brand-gray-dark uppercase tracking-wider">Name</span>
              <span className="text-[11px] font-semibold text-brand-gray-dark uppercase tracking-wider w-10 text-center hidden lg:block">Ver</span>
              <span className="text-[11px] font-semibold text-brand-gray-dark uppercase tracking-wider w-32 hidden md:block">Modified by</span>
              <span className="text-[11px] font-semibold text-brand-gray-dark uppercase tracking-wider w-16 text-right hidden sm:block">Size</span>
              <span className="text-[11px] font-semibold text-brand-gray-dark uppercase tracking-wider w-20 text-right">Modified</span>
              <span className="w-20 flex-shrink-0" />
            </div>
            {filtered.map((f) => <FileListRow key={f.id} file={f} isSelected={selected.has(f.id)} onSelect={toggleSelect} requiresAuth={isGuest} />)}
          </div>
        )}
      </div>
    </div>
  );
}
