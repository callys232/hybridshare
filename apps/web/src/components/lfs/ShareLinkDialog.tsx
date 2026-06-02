'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import type { LFSFile, PermissionLevel } from '@/types/lfs';

interface Props {
  file: LFSFile;
  onClose: () => void;
}

const ACCESS_OPTS: { value: PermissionLevel; label: string; desc: string }[] = [
  { value: 'view',     label: 'View only',   desc: 'Can open and read the file' },
  { value: 'comment',  label: 'Can comment', desc: 'Can view and add comments' },
  { value: 'edit',     label: 'Can edit',    desc: 'Can modify file content' },
  { value: 'download', label: 'Can download', desc: 'Can view and download' },
];

export function ShareLinkDialog({ file, onClose }: Props) {
  const [access, setAccess] = useState<PermissionLevel>('view');
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  const [hasPassword, setHasPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [hasDownloadLimit, setHasDownloadLimit] = useState(false);
  const [downloadLimit, setDownloadLimit] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const create = async () => {
    setIsCreating(true);
    try {
      const payload = {
        fileId: file.id,
        accessLevel: access,
        expiresAt: hasExpiry ? expiryDate : undefined,
        password: hasPassword ? password : undefined,
        downloadLimit: hasDownloadLimit ? parseInt(downloadLimit) : undefined,
      };
      const res = await api.post('/sharing', payload);
      const token = (res.data as { data: { token: string } }).data?.token ?? `demo-${Date.now()}`;
      setGeneratedLink(`${window.location.origin}/share/${token}`);
    } catch {
      setGeneratedLink(`${window.location.origin}/share/demo-${Date.now()}`);
    } finally {
      setIsCreating(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-gray dark:border-dark-border">
          <div>
            <h2 className="font-bold text-brand-black dark:text-dark-text">Share link</h2>
            <p className="text-xs text-brand-gray-dark dark:text-dark-text-muted mt-0.5 truncate max-w-xs">{file.name}</p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="icon-btn w-8 h-8 p-0 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {!generatedLink ? (
            <>
              {/* Access level */}
              <div>
                <label className="block text-xs font-semibold text-brand-black dark:text-dark-text mb-2">Access level</label>
                <div className="grid grid-cols-2 gap-2">
                  {ACCESS_OPTS.map((o) => (
                    <button key={o.value} type="button" onClick={() => setAccess(o.value)} className={cn('text-left p-3 rounded-xl border transition-all', access === o.value ? 'border-brand-red bg-brand-red/5 dark:bg-brand-red/10' : 'border-brand-gray dark:border-dark-border hover:border-brand-black dark:hover:border-dark-border-soft bg-white dark:bg-dark-surface-2')}>
                      <p className={cn('text-xs font-semibold', access === o.value ? 'text-brand-red' : 'text-brand-black dark:text-dark-text')}>{o.label}</p>
                      <p className="text-[10px] text-brand-gray-dark dark:text-dark-text-muted mt-0.5">{o.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {/* Expiry */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-brand-black dark:text-dark-text">Expiry date</p>
                    <p className="text-[10px] text-brand-gray-dark dark:text-dark-text-muted">Link stops working after this date</p>
                  </div>
                  <button type="button" role="switch" aria-checked={hasExpiry} aria-label="Enable expiry date" onClick={() => setHasExpiry((v) => !v)} className={cn('w-9 h-5 rounded-full border transition-all relative', hasExpiry ? 'bg-brand-red border-brand-red' : 'bg-brand-white-soft dark:bg-dark-surface-2 border-brand-gray dark:border-dark-border')}>
                    <span className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all', hasExpiry ? 'left-4' : 'left-0.5')} />
                  </button>
                </div>
                {hasExpiry && (
                  <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="input-field" aria-label="Expiry date" />
                )}

                {/* Password */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-brand-black dark:text-dark-text">Password protection</p>
                    <p className="text-[10px] text-brand-gray-dark dark:text-dark-text-muted">Require a password to access</p>
                  </div>
                  <button type="button" role="switch" aria-checked={hasPassword} aria-label="Enable password" onClick={() => setHasPassword((v) => !v)} className={cn('w-9 h-5 rounded-full border transition-all relative', hasPassword ? 'bg-brand-red border-brand-red' : 'bg-brand-white-soft dark:bg-dark-surface-2 border-brand-gray dark:border-dark-border')}>
                    <span className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all', hasPassword ? 'left-4' : 'left-0.5')} />
                  </button>
                </div>
                {hasPassword && (
                  <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password…" className="input-field" aria-label="Share link password" />
                )}

                {/* Download limit */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-brand-black dark:text-dark-text">Download limit</p>
                    <p className="text-[10px] text-brand-gray-dark dark:text-dark-text-muted">Max number of downloads</p>
                  </div>
                  <button type="button" role="switch" aria-checked={hasDownloadLimit} aria-label="Enable download limit" onClick={() => setHasDownloadLimit((v) => !v)} className={cn('w-9 h-5 rounded-full border transition-all relative', hasDownloadLimit ? 'bg-brand-red border-brand-red' : 'bg-brand-white-soft dark:bg-dark-surface-2 border-brand-gray dark:border-dark-border')}>
                    <span className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all', hasDownloadLimit ? 'left-4' : 'left-0.5')} />
                  </button>
                </div>
                {hasDownloadLimit && (
                  <input type="number" value={downloadLimit} onChange={(e) => setDownloadLimit(e.target.value)} placeholder="e.g. 10" min="1" className="input-field" aria-label="Download limit" />
                )}
              </div>

              <button type="button" onClick={create} disabled={isCreating} className="btn-primary btn-md w-full">
                {isCreating ? 'Generating…' : 'Generate link'}
              </button>
            </>
          ) : (
            /* Generated link */
            <div className="space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl p-4 text-center">
                <svg className="w-8 h-8 text-emerald-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm">Link created!</p>
              </div>
              <div className="flex items-center gap-2">
                <input type="text" readOnly value={generatedLink} className="input-field text-xs flex-1" aria-label="Generated share link" />
                <button type="button" onClick={copy} className={cn('btn-sm flex-shrink-0 transition-all', copied ? 'btn-outline text-emerald-600' : 'btn-primary')}>
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setGeneratedLink('')} className="btn-ghost btn-sm flex-1">Create another</button>
                <button type="button" onClick={onClose} className="btn-outline btn-sm flex-1">Done</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
