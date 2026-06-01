'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import type { LFSFile } from '@/types/lfs';

interface Props {
  file: LFSFile;
  onClose?: () => void;
}

export function DocumentViewer({ file, onClose }: Props) {
  const { user } = useAuthStore();
  const isGuest = !user;
  const [zoom, setZoom] = useState(100);
  const isVideo = file.fileType === 'video';
  const isImage = file.fileType === 'image';
  const isPreviewable = ['pdf', 'image', 'video', 'audio', 'txt', 'csv'].includes(file.fileType);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col animate-fade-in">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-dark-surface-1 border-b border-dark-border flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <p className="font-semibold text-white text-sm truncate">{file.name}</p>
          <span className="text-xs text-dark-text-muted flex-shrink-0">{file.extension.toUpperCase()} · v{file.version}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Zoom controls (non-video/audio) */}
          {!isVideo && file.fileType !== 'audio' && (
            <div className="hidden sm:flex items-center gap-1 bg-dark-surface-2 rounded-lg px-2 py-1">
              <button type="button" aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(50, z - 10))} className="text-dark-text-muted hover:text-white transition-colors text-sm w-6 h-6 flex items-center justify-center">−</button>
              <span className="text-xs text-dark-text-muted w-10 text-center">{zoom}%</span>
              <button type="button" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(200, z + 10))} className="text-dark-text-muted hover:text-white transition-colors text-sm w-6 h-6 flex items-center justify-center">+</button>
            </div>
          )}
          {!isGuest && (
            <a href={file.downloadUrl ?? '#'} download={file.name} className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-surface-2 text-dark-text hover:bg-dark-surface-3 rounded-lg text-xs font-semibold transition-colors border border-dark-border">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Download
            </a>
          )}
          {onClose && (
            <button type="button" aria-label="Close viewer" onClick={onClose} className="icon-btn text-dark-text-muted hover:text-white w-8 h-8 p-0 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-zinc-950">
        {isVideo && isGuest ? (
          /* Guest gate for video */
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-full bg-dark-surface-2 border border-dark-border flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-dark-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <p className="text-white font-bold mb-2">Sign in to watch this video</p>
            <p className="text-dark-text-muted text-sm mb-6">Create a free account to play videos and access all file previews.</p>
            <div className="flex flex-col gap-2">
              <Link href="/register" className="w-full py-2.5 bg-brand-red text-white text-sm font-bold rounded-lg hover:bg-brand-red-dark transition-colors text-center">Sign up free</Link>
              <Link href="/login" className="w-full py-2.5 bg-dark-surface-2 text-white text-sm font-semibold rounded-lg border border-dark-border hover:bg-dark-surface-3 transition-colors text-center">Log in</Link>
            </div>
          </div>
        ) : isVideo ? (
          <video src={file.previewUrl ?? file.downloadUrl ?? ''} controls className="max-w-full max-h-full rounded-lg" style={{ maxHeight: 'calc(100vh - 120px)' }} />
        ) : file.fileType === 'audio' ? (
          <div className="w-full max-w-md">
            <div className="bg-dark-surface-1 border border-dark-border rounded-2xl p-8 text-center">
              <div className="text-6xl mb-4">🎵</div>
              <p className="text-white font-semibold mb-4">{file.name}</p>
              <audio src={file.previewUrl ?? file.downloadUrl ?? ''} controls className="w-full" />
            </div>
          </div>
        ) : isImage ? (
          <img
            src={file.previewUrl ?? file.thumbnailUrl ?? ''}
            alt={file.name}
            className="rounded-lg shadow-2xl transition-all duration-200"
            style={{ transform: `scale(${zoom / 100})`, maxHeight: 'calc(100vh - 120px)', maxWidth: '100%' }}
          />
        ) : file.fileType === 'pdf' && file.previewUrl ? (
          <iframe
            src={`${file.previewUrl}#toolbar=0`}
            title={file.name}
            className="w-full rounded-lg shadow-2xl"
            style={{ height: 'calc(100vh - 120px)', transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          />
        ) : isPreviewable ? (
          <div className="bg-dark-surface-1 border border-dark-border rounded-2xl p-8 text-center max-w-sm">
            <div className="text-5xl mb-4">📄</div>
            <p className="text-white font-semibold mb-2">{file.name}</p>
            <p className="text-dark-text-muted text-sm mb-6">Preview not available for this file type in the browser.</p>
            {!isGuest && (
              <a href={file.downloadUrl ?? '#'} download className="btn-primary btn-sm">Download to view</a>
            )}
          </div>
        ) : (
          <div className="bg-dark-surface-1 border border-dark-border rounded-2xl p-8 text-center max-w-sm">
            <div className="text-5xl mb-4">📦</div>
            <p className="text-white font-semibold mb-2">{file.name}</p>
            <p className="text-dark-text-muted text-sm">This file cannot be previewed in the browser.</p>
          </div>
        )}
      </div>
    </div>
  );
}
