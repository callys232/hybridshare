'use client';

import { useEffect, useState } from 'react';
import { cn, formatBytes, formatRelativeTime } from '@/lib/utils';
import { api } from '@/lib/api';
import { isMockMode, MOCK_ADMIN_FILES } from '@/mocks';
import type { MockAdminFile } from '@/mocks';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import { GridPattern } from '@/components/ui/BackgroundPattern';
import { Tabs } from '@/components/ui/Tabs';

const VIEW_TABS = [
  { id: 'all'     as const, label: 'All Files'   },
  { id: 'large'   as const, label: 'Large Files'  },
  { id: 'shared'  as const, label: 'Shared'       },
  { id: 'deleted' as const, label: 'Deleted'      },
] as const;
type ViewTab = typeof VIEW_TABS[number]['id'];

const MIME_COLORS: Record<string, string> = {
  'application/pdf':  'bg-red-50 text-red-700 border-red-200',
  'image':            'bg-blue-50 text-blue-700 border-blue-200',
  'video':            'bg-purple-50 text-purple-700 border-purple-200',
  'application/zip':  'bg-amber-50 text-amber-700 border-amber-200',
  'text':             'bg-zinc-50 text-zinc-700 border-zinc-200',
  'spreadsheet':      'bg-emerald-50 text-emerald-700 border-emerald-200',
};

function mimeColor(mime: string): string {
  for (const [key, val] of Object.entries(MIME_COLORS)) {
    if (mime.includes(key)) return val;
  }
  return 'bg-zinc-50 text-zinc-600 border-zinc-200';
}

type AdminFile = MockAdminFile;

function ext(name: string) {
  return name.split('.').pop()?.toUpperCase() ?? '?';
}

export default function AdminFilesPage() {
  const [files, setFiles] = useState<AdminFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<ViewTab>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isMockMode()) {
      setFiles(MOCK_ADMIN_FILES);
      setIsLoading(false);
      return;
    }
    api.get('/admin/files')
      .then((r) => setFiles(r.data.data ?? MOCK_ADMIN_FILES))
      .catch(() => setFiles(MOCK_ADMIN_FILES))
      .finally(() => setIsLoading(false));
  }, []);

  const visible = files.filter((f) => {
    if (tab === 'large')   return f.size > 50_000_000 && !f.isDeleted;
    if (tab === 'shared')  return f.isShared && !f.isDeleted;
    if (tab === 'deleted') return f.isDeleted;
    return !f.isDeleted;
  }).filter((f) => !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.workspaceName.toLowerCase().includes(search.toLowerCase()));

  const totalSize = visible.reduce((s, f) => s + f.size, 0);

  const toggleSelect = (id: string) =>
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allSelected = visible.length > 0 && visible.every((f) => selected.has(f.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(visible.map((f) => f.id)));

  const handleBulkDelete = () => {
    setFiles((prev) => prev.map((f) => selected.has(f.id) ? { ...f, isDeleted: true } : f));
    selected.forEach((id) => api.delete(`/admin/files/${id}`).catch(() => null));
    setSelected(new Set());
  };

  return (
    <div className="relative space-y-6 animate-fade-in">
      <GridPattern opacity={0.4} />

      {/* Header */}
      <div className="relative z-10 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">All Files</h1>
          <p className="text-sm text-brand-gray-dark mt-1">
            Platform-wide file management — {files.filter((f) => !f.isDeleted).length} files · {formatBytes(files.reduce((s, f) => s + f.size, 0))} total
          </p>
        </div>

        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-brand-gray-dark">{selected.size} selected</span>
            <button type="button" onClick={handleBulkDelete}
              className="flex items-center gap-1.5 text-xs font-semibold text-white bg-brand-red hover:bg-red-700 px-3 py-1.5 rounded-lg transition-all duration-150 active:scale-95">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete selected
            </button>
            <button type="button" onClick={() => setSelected(new Set())}
              className="text-xs text-brand-gray-dark hover:text-brand-black transition-colors">
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Summary strip */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total files',   value: files.filter((f) => !f.isDeleted).length.toString(),                     icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',                color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/30'   },
          { label: 'Shared links',  value: files.filter((f) => f.isShared).length.toString(),                        icon: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z', color: 'bg-violet-50 text-violet-600 dark:bg-violet-950/30'},
          { label: 'Deleted files', value: files.filter((f) => f.isDeleted).length.toString(),                       icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',              color: 'bg-red-50 text-red-600 dark:bg-red-950/30'      },
          { label: 'Storage used',  value: formatBytes(files.reduce((s, f) => s + f.size, 0)),                        icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4',                               color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className={cn('flex items-center gap-3 p-4 rounded-xl border border-brand-gray dark:border-dark-border bg-white dark:bg-dark-surface-1')}>
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', color)}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={icon} />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-brand-black dark:text-white">{value}</p>
              <p className="text-[11px] text-brand-gray-dark">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters row */}
      <div className="relative z-10 flex items-center gap-3 flex-wrap">
        <Tabs tabs={[...VIEW_TABS]} active={tab} onChange={setTab} variant="pill" size="sm" className="flex-shrink-0" />
        <div className="flex-1 min-w-44 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-gray-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Search files or workspaces…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-brand-gray dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-surface-2 dark:text-white focus:outline-none focus:border-brand-black transition-colors" />
        </div>
        <p className="text-xs text-brand-gray-dark flex-shrink-0">
          {visible.length} files · {formatBytes(totalSize)}
        </p>
      </div>

      {/* File table */}
      <div className="relative z-10 bg-white dark:bg-dark-surface-1 border border-brand-gray dark:border-dark-border rounded-2xl overflow-hidden">

        {/* Table header */}
        <div className="grid grid-cols-[auto_auto_1fr_auto_auto_auto_auto] items-center gap-3 px-5 py-3 bg-brand-white-soft dark:bg-dark-surface-2 border-b border-brand-gray dark:border-dark-border">
          <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all files"
            className="w-4 h-4 rounded border-brand-gray text-brand-black cursor-pointer" />
          <div className="w-8" />
          <div className="text-[11px] font-semibold text-brand-gray-dark uppercase tracking-wider">File</div>
          <div className="text-[11px] font-semibold text-brand-gray-dark uppercase tracking-wider hidden md:block">Workspace</div>
          <div className="text-[11px] font-semibold text-brand-gray-dark uppercase tracking-wider hidden lg:block">Uploader</div>
          <div className="text-[11px] font-semibold text-brand-gray-dark uppercase tracking-wider hidden lg:block">Size</div>
          <div className="text-[11px] font-semibold text-brand-gray-dark uppercase tracking-wider hidden lg:block">Modified</div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : visible.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 bg-brand-gray dark:bg-dark-surface-2 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-brand-gray-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="font-semibold text-brand-black dark:text-white mb-1">No files found</p>
            <p className="text-sm text-brand-gray-dark">Try a different filter or search term</p>
          </div>
        ) : (
          visible.map((file) => (
            <div key={file.id}
              className={cn(
                'grid grid-cols-[auto_auto_1fr_auto_auto_auto_auto] items-center gap-3 px-5 py-3 border-b border-brand-gray dark:border-dark-border last:border-0',
                'hover:bg-brand-white-soft dark:hover:bg-dark-surface-2 transition-colors group',
                selected.has(file.id) && 'bg-blue-50/50 dark:bg-blue-950/20'
              )}>
              <input type="checkbox" checked={selected.has(file.id)} onChange={() => toggleSelect(file.id)}
                aria-label={`Select ${file.name}`}
                className="w-4 h-4 rounded border-brand-gray text-brand-black cursor-pointer" />

              {/* Extension badge */}
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-black border flex-shrink-0', mimeColor(file.mimeType))}>
                {ext(file.name)}
              </div>

              {/* Name + shared badge */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <p className={cn('text-sm font-medium truncate', file.isDeleted ? 'line-through text-brand-gray-dark' : 'text-brand-black dark:text-white')}>
                    {file.name}
                  </p>
                  {file.isShared && (
                    <span className="flex-shrink-0 text-[10px] font-bold text-violet-600 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 px-1.5 py-0.5 rounded-full">
                      Shared
                    </span>
                  )}
                  {file.isDeleted && (
                    <span className="flex-shrink-0 text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-1.5 py-0.5 rounded-full">
                      Deleted
                    </span>
                  )}
                </div>
              </div>

              {/* Workspace */}
              <div className="hidden md:block">
                <span className="text-xs text-brand-gray-dark bg-brand-gray/50 dark:bg-dark-surface-2 px-2 py-0.5 rounded-md">
                  {file.workspaceName}
                </span>
              </div>

              {/* Uploader */}
              <div className="hidden lg:flex items-center gap-2">
                <Avatar name={file.uploaderName} src={file.uploaderAvatar} size="xs" />
                <span className="text-xs text-brand-gray-dark truncate max-w-24">{file.uploaderName.split(' ')[0]}</span>
              </div>

              {/* Size */}
              <div className="hidden lg:block text-xs text-brand-gray-dark whitespace-nowrap">
                {formatBytes(file.size)}
              </div>

              {/* Modified */}
              <div className="hidden lg:block text-xs text-brand-gray-dark whitespace-nowrap">
                {formatRelativeTime(new Date(file.updatedAt))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
