'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { Avatar } from '@/component/ui/Avatar';
import { FileSizeLabel } from './FileSizeLabel';
import type { LFSFileVersion } from '@/types/lfs';

interface Props {
  fileId: string;
  currentVersion: number;
  onClose?: () => void;
  onRestore?: (version: LFSFileVersion) => void;
}

const MOCK_VERSIONS: LFSFileVersion[] = [
  { id: 'v3', fileId: 'f1', version: 3, label: 'Board approved', sizeBytes: 4500000, createdBy: { id: 'u1', name: 'Amara Okonkwo', email: 'a@example.com', role: 'admin' }, createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), comment: 'Final version approved by the board' },
  { id: 'v2', fileId: 'f1', version: 2, sizeBytes: 4200000, createdBy: { id: 'u2', name: 'Chidi Eze', email: 'c@example.com', role: 'member' }, createdAt: new Date(Date.now() - 86400000 * 7).toISOString(), comment: 'Revised typography and spacing' },
  { id: 'v1', fileId: 'f1', version: 1, label: 'First draft', sizeBytes: 3900000, createdBy: { id: 'u1', name: 'Amara Okonkwo', email: 'a@example.com', role: 'admin' }, createdAt: new Date(Date.now() - 86400000 * 21).toISOString() },
];

export function VersionHistoryPanel({ fileId, currentVersion, onClose, onRestore }: Props) {
  const [versions, setVersions] = useState<LFSFileVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get(`/versions/${fileId}`)
      .then((r) => setVersions((r.data as { data: LFSFileVersion[] }).data ?? MOCK_VERSIONS))
      .catch(() => setVersions(MOCK_VERSIONS))
      .finally(() => setIsLoading(false));
  }, [fileId]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-dark-surface-1 border-l border-brand-gray dark:border-dark-border w-80">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-brand-gray dark:border-dark-border flex-shrink-0">
        <h3 className="font-bold text-brand-black dark:text-dark-text text-sm">Version History</h3>
        {onClose && (
          <button type="button" aria-label="Close version history" onClick={onClose} className="icon-btn w-7 h-7 p-0 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      {/* Versions list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-brand-gray border-t-brand-black dark:border-dark-border dark:border-t-white rounded-full animate-spin" />
          </div>
        ) : (
          <div className="divide-y divide-brand-gray dark:divide-dark-border">
            {versions.map((v) => {
              const isCurrent = v.version === currentVersion;
              return (
                <div key={v.id} className={cn('p-4 hover:bg-brand-white-soft dark:hover:bg-dark-surface-2 transition-colors group', isCurrent && 'bg-brand-red/5 dark:bg-brand-red/10')}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className={cn('text-xs font-bold', isCurrent ? 'text-brand-red' : 'text-brand-black dark:text-dark-text')}>v{v.version}</span>
                      {v.label && <span className="text-[10px] bg-brand-white-soft dark:bg-dark-surface-2 border border-brand-gray dark:border-dark-border text-brand-gray-dark dark:text-dark-text-muted px-1.5 py-0.5 rounded-full font-medium">{v.label}</span>}
                      {isCurrent && <span className="text-[10px] bg-brand-red text-white px-1.5 py-0.5 rounded-full font-bold">Current</span>}
                    </div>
                    <FileSizeLabel bytes={v.sizeBytes} className="text-[10px] text-brand-gray-dark dark:text-dark-text-muted flex-shrink-0" />
                  </div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Avatar name={v.createdBy.name} size="xs" />
                    <span className="text-[11px] text-brand-gray-dark dark:text-dark-text-muted">{v.createdBy.name}</span>
                    <span className="text-[10px] text-brand-gray dark:text-dark-border">·</span>
                    <span className="text-[10px] text-brand-gray-dark dark:text-dark-text-muted">
                      {new Date(v.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  {v.comment && <p className="text-[11px] text-brand-gray-dark dark:text-dark-text-muted italic">&ldquo;{v.comment}&rdquo;</p>}
                  {!isCurrent && (
                    <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={() => onRestore?.(v)} className="text-[11px] font-semibold text-brand-red hover:underline">Restore this version</button>
                      <span className="text-brand-gray dark:text-dark-border">·</span>
                      <button type="button" className="text-[11px] font-semibold text-brand-gray-dark dark:text-dark-text-muted hover:text-brand-black dark:hover:text-dark-text hover:underline">Download</button>
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
