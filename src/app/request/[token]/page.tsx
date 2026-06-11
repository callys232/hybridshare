'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { isMockMode } from '@/mocks';

interface FileRequest {
  id: string;
  title: string;
  description?: string;
  requestedBy: { name: string };
  expiresAt?: string;
  maxFiles?: number;
  allowedTypes?: string[];
  filesReceived: number;
}

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  errorMsg?: string;
}

type Status = 'loading' | 'ready' | 'submitted' | 'expired' | 'error';

const MOCK_REQUEST: FileRequest = {
  id: 'demo-req',
  title: 'Q4 Financial Documents',
  description: 'Please upload your Q4 financial statements, tax returns, and any supporting documentation for our review.',
  requestedBy: { name: 'Sarah Chen' },
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  maxFiles: 10,
  allowedTypes: ['PDF', 'XLSX', 'DOCX', 'CSV'],
  filesReceived: 2,
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

export default function FileRequestPage({ params }: { params: { token: string } }) {
  const [status, setStatus] = useState<Status>('loading');
  const [request, setRequest] = useState<FileRequest | null>(null);
  const [uploads, setUploads] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [note, setNote] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  useEffect(() => {
    const load = async () => {
      if (isMockMode()) {
        await new Promise((r) => setTimeout(r, 600));
        setRequest(MOCK_REQUEST);
        setStatus('ready');
        return;
      }
      try {
        const res = await api.get<{ data: FileRequest }>(`/file-requests/${params.token}/public`);
        const data = res.data.data;
        if (!data) { setStatus('error'); return; }
        if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
          setStatus('expired'); return;
        }
        setRequest(data);
        setStatus('ready');
      } catch {
        setStatus('error');
      }
    };
    load();
  }, [params.token]);

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files);
    const newUploads: UploadFile[] = arr.map((f) => ({
      id: `${f.name}-${Date.now()}-${Math.random()}`,
      file: f,
      progress: 0,
      status: 'pending',
    }));
    setUploads((prev) => {
      const max = request?.maxFiles ?? 20;
      return [...prev, ...newUploads].slice(0, max);
    });
  }, [request?.maxFiles]);

  const removeUpload = (id: string) => setUploads((prev) => prev.filter((u) => u.id !== id));

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const simulateUpload = async (upload: UploadFile): Promise<void> => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 25;
        if (progress >= 100) {
          clearInterval(interval);
          setUploads((prev) => prev.map((u) => u.id === upload.id ? { ...u, progress: 100, status: 'done' } : u));
          resolve();
        } else {
          setUploads((prev) => prev.map((u) => u.id === upload.id ? { ...u, progress: Math.min(progress, 99), status: 'uploading' } : u));
        }
      }, 150);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploads.length) return;
    setSubmitting(true);

    if (isMockMode()) {
      setUploads((prev) => prev.map((u) => ({ ...u, status: 'uploading' as const })));
      await Promise.all(uploads.map(simulateUpload));
      setStatus('submitted');
      setSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('senderName', senderName);
      formData.append('senderEmail', senderEmail);
      formData.append('note', note);
      uploads.forEach((u) => formData.append('files', u.file));

      await api.post(`/file-requests/${params.token}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setStatus('submitted');
    } catch {
      setUploads((prev) => prev.map((u) => u.status === 'uploading' ? { ...u, status: 'error', errorMsg: 'Upload failed' } : u));
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Loading ──────────────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-brand-white-off flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-brand-gray-dark">Loading file request…</p>
        </div>
      </div>
    );
  }

  // ─── Expired ──────────────────────────────────────────────────────────────────
  if (status === 'expired') {
    return <StatusPage icon="clock" title="Request has expired" desc="This file request link is no longer active. Contact the sender for a new one." />;
  }

  // ─── Error ────────────────────────────────────────────────────────────────────
  if (status === 'error' || !request) {
    return <StatusPage icon="x" title="Request not found" desc="This link may be invalid or the request has been closed." />;
  }

  // ─── Submitted ────────────────────────────────────────────────────────────────
  if (status === 'submitted') {
    return (
      <PageShell>
        <div className="max-w-sm mx-auto text-center py-12">
          <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-brand-black mb-2">Files submitted!</h2>
          <p className="text-sm text-brand-gray-dark mb-2">
            Your {uploads.length} file{uploads.length !== 1 ? 's' : ''} have been securely sent to{' '}
            <strong>{request.requestedBy.name}</strong>.
          </p>
          <p className="text-xs text-brand-gray-dark mb-8">You will receive a confirmation once they have been reviewed.</p>
          <Link href="/" className="btn-primary text-sm px-8">Go to Lamid FileShare</Link>
        </div>
      </PageShell>
    );
  }

  // ─── Ready ────────────────────────────────────────────────────────────────────
  const daysLeft = request.expiresAt
    ? Math.ceil((new Date(request.expiresAt).getTime() - Date.now()) / 86_400_000)
    : null;

  return (
    <PageShell>
      <div className="max-w-xl mx-auto animate-fade-in">
        {/* Request header */}
        <div className="bg-white border border-brand-gray rounded-2xl p-6 mb-4 shadow-card">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-brand-red rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              {request.requestedBy.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-brand-gray-dark mb-0.5">
                <strong className="text-brand-black">{request.requestedBy.name}</strong> is requesting files from you
              </p>
              <h1 className="text-lg font-bold text-brand-black mb-1">{request.title}</h1>
              {request.description && (
                <p className="text-sm text-brand-gray-dark leading-relaxed">{request.description}</p>
              )}
            </div>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-brand-gray">
            {daysLeft !== null && (
              <span className={cn(
                'flex items-center gap-1 text-xs font-medium rounded-full px-2.5 py-1',
                daysLeft <= 2 ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
              )}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
              </span>
            )}
            {request.maxFiles && (
              <span className="flex items-center gap-1 text-xs text-brand-gray-dark border border-brand-gray rounded-full px-2.5 py-1">
                Up to {request.maxFiles} files
              </span>
            )}
            {request.allowedTypes && request.allowedTypes.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-brand-gray-dark border border-brand-gray rounded-full px-2.5 py-1">
                {request.allowedTypes.join(', ')}
              </span>
            )}
          </div>
        </div>

        {/* Upload form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Your details */}
          <div className="bg-white border border-brand-gray rounded-2xl p-5 shadow-card">
            <h3 className="text-sm font-semibold text-brand-black mb-3">Your details</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-brand-gray-dark mb-1" htmlFor="req-name">Name</label>
                <input
                  id="req-name"
                  type="text"
                  placeholder="Jane Smith"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full px-3 py-2 border border-brand-gray rounded-lg text-sm focus:outline-none focus:border-brand-black transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-brand-gray-dark mb-1" htmlFor="req-email">Email</label>
                <input
                  id="req-email"
                  type="email"
                  placeholder="jane@example.com"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-brand-gray rounded-lg text-sm focus:outline-none focus:border-brand-black transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-brand-gray-dark mb-1" htmlFor="req-note">Note (optional)</label>
              <textarea
                id="req-note"
                placeholder="Add a note for the recipient…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-brand-gray rounded-lg text-sm focus:outline-none focus:border-brand-black transition-colors resize-none"
              />
            </div>
          </div>

          {/* Drop zone */}
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200',
              isDragging
                ? 'border-brand-red bg-red-50'
                : 'border-brand-gray hover:border-brand-gray-dark hover:bg-brand-white-soft bg-white'
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
            <div className="w-12 h-12 rounded-xl bg-brand-white-soft border border-brand-gray flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-brand-gray-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-brand-black mb-1">
              {isDragging ? 'Drop files here' : 'Drag files here or click to browse'}
            </p>
            <p className="text-xs text-brand-gray-dark">
              {request.allowedTypes ? request.allowedTypes.join(', ') : 'All file types accepted'}
              {request.maxFiles ? ` · Up to ${request.maxFiles} files` : ''}
            </p>
          </div>

          {/* Upload queue */}
          {uploads.length > 0 && (
            <div className="bg-white border border-brand-gray rounded-2xl overflow-hidden shadow-card">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-brand-gray bg-brand-white-soft">
                <span className="text-xs font-semibold text-brand-black">{uploads.length} file{uploads.length !== 1 ? 's' : ''} selected</span>
                {!submitting && (
                  <button type="button" onClick={() => setUploads([])} className="text-xs text-brand-gray-dark hover:text-brand-black transition-colors">
                    Clear all
                  </button>
                )}
              </div>
              {uploads.map((u) => (
                <div key={u.id} className="flex items-center gap-3 px-4 py-3 border-b border-brand-gray last:border-0">
                  <div className="w-8 h-8 rounded-lg bg-brand-white-soft border border-brand-gray flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-brand-gray-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-brand-black truncate">{u.file.name}</p>
                    <p className="text-[10px] text-brand-gray-dark">{formatBytes(u.file.size)}</p>
                    {u.status === 'uploading' && (
                      <div className="mt-1 h-1 bg-brand-gray rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-red rounded-full transition-all duration-200"
                          style={{ width: `${u.progress}%` }}
                        />
                      </div>
                    )}
                    {u.errorMsg && <p className="text-[10px] text-red-600 mt-0.5">{u.errorMsg}</p>}
                  </div>
                  <div className="flex-shrink-0">
                    {u.status === 'done' && (
                      <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {u.status === 'error' && (
                      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    {(u.status === 'pending' || u.status === 'uploading') && !submitting && (
                      <button type="button" onClick={() => removeUpload(u.id)} className="text-brand-gray-dark hover:text-brand-black transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || uploads.length === 0}
            className="w-full py-3.5 bg-brand-black text-white font-semibold text-sm rounded-xl hover:bg-brand-red transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {submitting ? 'Uploading…' : `Submit ${uploads.length || ''} file${uploads.length !== 1 ? 's' : ''}`}
          </button>

          <p className="text-center text-xs text-brand-gray-dark">
            Files are encrypted in transit and at rest. Only {request.requestedBy.name} can access them.
          </p>
        </form>
      </div>
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-white-off flex flex-col">
      <header className="bg-white border-b border-brand-gray px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-brand-black rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
            <div className="w-3 h-3 bg-brand-red rounded-sm" />
          </div>
          <span className="font-bold text-brand-black text-sm">Lamid FileShare</span>
        </Link>
        <Link href="/register" className="btn-primary text-xs px-4 py-1.5">Sign up free</Link>
      </header>
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-10">
        {children}
      </main>
      <footer className="py-4 text-center text-xs text-brand-gray-dark border-t border-brand-gray">
        <Link href="/" className="font-semibold text-brand-black hover:text-brand-red transition-colors">Lamid FileShare</Link>
        {' · '}
        <Link href="/privacy" className="hover:underline">Privacy</Link>
        {' · '}
        <Link href="/terms" className="hover:underline">Terms</Link>
      </footer>
    </div>
  );
}

function StatusPage({ icon, title, desc }: { icon: 'clock' | 'x'; title: string; desc: string }) {
  return (
    <PageShell>
      <div className="text-center py-12">
        <div className={cn(
          'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border',
          icon === 'clock' ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'
        )}>
          {icon === 'clock' ? (
            <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
        <h1 className="text-xl font-bold text-brand-black mb-2">{title}</h1>
        <p className="text-sm text-brand-gray-dark mb-6">{desc}</p>
        <Link href="/" className="btn-primary text-sm px-6">Go to Lamid FileShare</Link>
      </div>
    </PageShell>
  );
}
