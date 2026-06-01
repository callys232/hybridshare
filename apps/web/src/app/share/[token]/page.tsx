'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, type ApiResponse } from '@/lib/api';
import { cn } from '@/lib/utils';

interface SharedFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  url: string;
  previewUrl?: string;
  sharedBy: { name: string; avatar?: string };
  sharedAt: string;
  expiresAt?: string;
  downloadEnabled: boolean;
  message?: string;
}

type Status = 'loading' | 'ready' | 'expired' | 'error';

const MIME_ICON: Record<string, string> = {
  'image/':        'ðŸ–¼ï¸',
  'video/':        'ðŸŽ¬',
  'audio/':        'ðŸŽµ',
  'application/pdf': 'ðŸ“„',
  'application/zip': 'ðŸ—œï¸',
  'text/':         'ðŸ“',
  'application/vnd.ms-excel':                               'ðŸ“Š',
  'application/vnd.openxmlformats-officedocument.spreadsheetml': 'ðŸ“Š',
  'application/vnd.ms-powerpoint':                          'ðŸ“Š',
  'application/msword':                                     'ðŸ“',
};

function getIcon(mime: string): string {
  for (const [prefix, icon] of Object.entries(MIME_ICON)) {
    if (mime.startsWith(prefix)) return icon;
  }
  return 'ðŸ“';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

function isPreviewable(mime: string): boolean {
  return mime.startsWith('image/') || mime === 'application/pdf' || mime.startsWith('video/');
}

// Mock for dev fallback
const MOCK_FILE: SharedFile = {
  id: 'f-1',
  name: 'HybridShare_Project_Brief.pdf',
  mimeType: 'application/pdf',
  size: 2_340_000,
  url: '#',
  sharedBy: { name: 'Alex Carter' },
  sharedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  downloadEnabled: true,
  message: 'Hey! Here\'s the project brief we discussed. Let me know if you have any questions.',
};

export default function SharedFilePage({ params }: { params: { token: string } }) {
  const [status, setStatus] = useState<Status>('loading');
  const [file, setFile] = useState<SharedFile | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get<ApiResponse<SharedFile>>(`/files/share/${params.token}`)
      .then((res) => {
        const data = res.data.data!;
        if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
          setStatus('expired');
        } else {
          setFile(data);
          setStatus('ready');
        }
      })
      .catch(() => {
        // Dev fallback
        setFile(MOCK_FILE);
        setStatus('ready');
      });
  }, [params.token]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // â”€â”€ Loading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-brand-white-off flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-brand-gray-dark">Loading shared fileâ€¦</p>
        </div>
      </div>
    );
  }

  // â”€â”€ Expired â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (status === 'expired') {
    return (
      <div className="min-h-screen bg-brand-white-off flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-brand-black mb-2">This link has expired</h1>
          <p className="text-sm text-brand-gray-dark mb-6">The shared file is no longer available. Please contact the sender for a new link.</p>
          <Link href="/" className="btn-primary text-sm px-6">Go to HybridShare</Link>
        </div>
      </div>
    );
  }

  // â”€â”€ Error â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (status === 'error' || !file) {
    return (
      <div className="min-h-screen bg-brand-white-off flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-brand-black mb-2">File not found</h1>
          <p className="text-sm text-brand-gray-dark mb-6">This link may be invalid or the file may have been removed.</p>
          <Link href="/" className="btn-primary text-sm px-6">Go to HybridShare</Link>
        </div>
      </div>
    );
  }

  const icon = getIcon(file.mimeType);
  const canPreview = isPreviewable(file.mimeType);

  // â”€â”€ Ready â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div className="min-h-screen bg-brand-white-off">
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-white border-b border-brand-gray px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-brand-black rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
            <div className="w-3 h-3 bg-brand-red rounded-sm" />
          </div>
          <span className="font-bold text-brand-black text-sm hidden sm:block">HybridShare</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-brand-gray text-xs font-medium text-brand-black rounded-button hover:bg-brand-white-soft transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {copied ? 'Copied!' : 'Copy link'}
          </button>
          <Link
            href="/auth/register"
            className="btn-primary text-xs px-4 py-1.5"
          >
            Sign up free
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-2xl mx-auto px-4 py-12 animate-fade-in">
        {/* Shared-by banner */}
        <div className="flex items-center gap-3 mb-8 p-4 bg-white border border-brand-gray rounded-xl shadow-card">
          <div className="w-10 h-10 bg-brand-red rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
            {file.sharedBy.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-brand-black">
              <span className="text-brand-red">{file.sharedBy.name}</span> shared a file with you
            </p>
            {file.message && (
              <p className="text-xs text-brand-gray-dark mt-0.5 line-clamp-2">&ldquo;{file.message}&rdquo;</p>
            )}
          </div>
        </div>

        {/* File card */}
        <div className="bg-white border border-brand-gray rounded-2xl shadow-card overflow-hidden">
          {/* Preview area */}
          {canPreview && previewing ? (
            <div className="w-full bg-brand-black aspect-video flex items-center justify-center">
              {file.mimeType.startsWith('image/') && file.previewUrl && (
                <img src={file.previewUrl} alt={file.name} className="max-h-full max-w-full object-contain" />
              )}
              {file.mimeType.startsWith('video/') && (
                <video src={file.url} controls className="w-full h-full" />
              )}
              {file.mimeType === 'application/pdf' && file.previewUrl && (
                <iframe src={file.previewUrl} title={file.name} className="w-full h-full border-0" />
              )}
            </div>
          ) : (
            <div className="w-full aspect-video bg-gradient-to-br from-brand-white-soft to-brand-gray flex flex-col items-center justify-center gap-3">
              <span className="text-7xl">{icon}</span>
              {canPreview && (
                <button
                  type="button"
                  onClick={() => setPreviewing(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-brand-black text-white text-xs font-semibold rounded-button hover:bg-brand-red transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                  Preview
                </button>
              )}
            </div>
          )}

          {/* File info */}
          <div className="p-6">
            <h1 className="text-lg font-bold text-brand-black mb-1 break-all">{file.name}</h1>
            <div className="flex flex-wrap gap-3 text-xs text-brand-gray-dark mb-6">
              <span>{formatBytes(file.size)}</span>
              <span>Â·</span>
              <span>{file.mimeType}</span>
              <span>Â·</span>
              <span>Shared {new Date(file.sharedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              {file.expiresAt && (
                <>
                  <span>Â·</span>
                  <span className="text-amber-600">Expires {new Date(file.expiresAt).toLocaleDateString()}</span>
                </>
              )}
            </div>

            <div className="flex gap-3">
              {file.downloadEnabled && (
                <a
                  href={file.url}
                  download={file.name}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-brand-black text-white text-sm font-semibold rounded-button hover:bg-brand-red transition-colors duration-150"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </a>
              )}
              <button
                type="button"
                onClick={copyLink}
                className={cn(
                  'flex items-center justify-center gap-2 py-3 px-5 border text-sm font-medium rounded-button transition-colors duration-150',
                  copied
                    ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                    : 'border-brand-gray text-brand-black hover:border-brand-gray-dark hover:bg-brand-white-soft'
                )}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {copied ? 'Copied!' : 'Copy link'}
              </button>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 p-6 bg-white border border-brand-gray rounded-xl text-center">
          <p className="text-sm font-semibold text-brand-black mb-1">Want to share your own files?</p>
          <p className="text-xs text-brand-gray-dark mb-4">HybridShare is free to use â€” store, share, and learn in one place.</p>
          <Link href="/auth/register" className="btn-primary text-sm px-8">
            Create a free account
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-brand-gray py-6 text-center text-xs text-brand-gray-dark">
        <Link href="/" className="font-semibold text-brand-black hover:text-brand-red transition-colors">HybridShare</Link>
        {' Â· '}
        <Link href="/privacy" className="hover:underline">Privacy</Link>
        {' Â· '}
        <Link href="/terms" className="hover:underline">Terms</Link>
      </footer>
    </div>
  );
}
