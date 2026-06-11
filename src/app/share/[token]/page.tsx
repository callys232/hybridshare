'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { isMockMode } from '@/mocks';

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
  requireEmailVerification?: boolean;
  requireNda?: boolean;
  ndaText?: string;
  watermarkEnabled?: boolean;
}

type Status = 'loading' | 'email-gate' | 'verify-code' | 'nda-gate' | 'ready' | 'expired' | 'error';

const MIME_ICON: Record<string, string> = {
  'image/':        '🖼️',
  'video/':        '🎬',
  'audio/':        '🎵',
  'application/pdf': '📄',
  'application/zip': '🗜️',
  'text/':         '📝',
  'application/vnd.ms-excel': '📊',
  'application/vnd.openxmlformats-officedocument.spreadsheetml': '📊',
  'application/vnd.ms-powerpoint': '📊',
  'application/msword': '📝',
};

function getIcon(mime: string): string {
  for (const [prefix, icon] of Object.entries(MIME_ICON)) {
    if (mime.startsWith(prefix)) return icon;
  }
  return '📁';
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

const MOCK_FILE: SharedFile = {
  id: 'demo',
  name: 'Client NDA 2026.pdf',
  mimeType: 'application/pdf',
  size: 3_251_200,
  url: '#',
  sharedBy: { name: 'James Adeyemi' },
  sharedAt: new Date().toISOString(),
  downloadEnabled: true,
  message: 'Please review and accept the NDA before proceeding with our engagement.',
  requireEmailVerification: true,
  requireNda: true,
  ndaText: `NON-DISCLOSURE AGREEMENT\n\nThis Non-Disclosure Agreement ("Agreement") is entered into as of the date of acceptance below by the undersigned party ("Recipient") and the disclosing party identified above ("Discloser").\n\n1. CONFIDENTIAL INFORMATION\n"Confidential Information" means any and all information disclosed by Discloser to Recipient, directly or indirectly, in writing, orally or by inspection of tangible objects, including but not limited to: business plans, client lists, financial projections, technical data, trade secrets, and proprietary methodologies.\n\n2. OBLIGATIONS OF RECIPIENT\nRecipient agrees to: (a) hold the Confidential Information in strict confidence using at least the same degree of care it uses to protect its own confidential information; (b) not disclose the Confidential Information to any third parties without prior written consent of Discloser; (c) use the Confidential Information solely for evaluating a potential business relationship.\n\n3. EXCLUSIONS FROM CONFIDENTIALITY\nThis Agreement does not apply to information that: (a) is or becomes publicly known through no breach of this Agreement; (b) was rightfully in Recipient's possession prior to disclosure; (c) is independently developed without reference to the Confidential Information.\n\n4. TERM AND TERMINATION\nThis Agreement shall remain in effect for three (3) years from the date of first disclosure. Either party may terminate this Agreement upon thirty (30) days written notice.\n\n5. GOVERNING LAW\nThis Agreement shall be governed by the laws of the jurisdiction in which Discloser is incorporated.`,
  watermarkEnabled: true,
};

function WatermarkOverlay({ email }: { email: string }) {
  const text = email || 'Protected · Lamid FileShare';
  return (
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none select-none overflow-hidden z-10"
    >
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="wm" x="0" y="0" width="280" height="110" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">
            <text x="10" y="55" fill="rgba(0,0,0,0.07)" fontSize="11" fontFamily="system-ui, sans-serif" fontWeight="600" letterSpacing="0.5">
              {text}
            </text>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#wm)" />
      </svg>
    </div>
  );
}

function GateLayout({ children, sharedBy, fileName }: { children: React.ReactNode; sharedBy?: string; fileName?: string }) {
  return (
    <div className="min-h-screen bg-brand-white-off flex flex-col">
      <header className="bg-white border-b border-brand-gray px-4 py-3 flex items-center">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-brand-black rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
            <div className="w-3 h-3 bg-brand-red rounded-sm" />
          </div>
          <span className="font-bold text-brand-black text-sm">Lamid FileShare</span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {sharedBy && fileName && (
            <div className="mb-5 p-4 bg-white border border-brand-gray rounded-xl text-center">
              <p className="text-xs text-brand-gray-dark">
                <strong className="text-brand-black">{sharedBy}</strong> wants to share{' '}
                <strong className="text-brand-black">{fileName}</strong> with you
              </p>
            </div>
          )}
          <div className="bg-white border border-brand-gray rounded-2xl shadow-card p-8">
            {children}
          </div>
        </div>
      </main>
      <footer className="py-4 text-center text-xs text-brand-gray-dark">
        Protected by{' '}
        <Link href="/" className="font-semibold text-brand-black hover:text-brand-red transition-colors">Lamid FileShare</Link>
        {' · '}
        <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
      </footer>
    </div>
  );
}

export default function SharedFilePage({ params }: { params: { token: string } }) {
  const [status, setStatus] = useState<Status>('loading');
  const [file, setFile] = useState<SharedFile | null>(null);
  const [email, setEmail] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');
  const [ndaScrolled, setNdaScrolled] = useState(false);
  const [ndaAccepted, setNdaAccepted] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const ndaRef = useRef<HTMLDivElement>(null);

  function advanceFromFile(f: SharedFile) {
    if (f.requireEmailVerification) {
      setStatus('email-gate');
    } else if (f.requireNda) {
      setStatus('nda-gate');
    } else {
      setStatus('ready');
    }
  }

  useEffect(() => {
    const fetchShare = async () => {
      if (isMockMode()) {
        await new Promise((r) => setTimeout(r, 700));
        setFile(MOCK_FILE);
        advanceFromFile(MOCK_FILE);
        return;
      }
      try {
        const res = await api.get<{ data: SharedFile }>(`/files/share/${params.token}`);
        const data = res.data.data;
        if (!data) { setStatus('error'); return; }
        if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
          setStatus('expired');
          return;
        }
        setFile(data);
        advanceFromFile(data);
      } catch {
        setStatus('error');
      }
    };
    fetchShare();
  }, [params.token]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setSubmitting(true);
    try {
      if (!isMockMode()) {
        await api.post(`/files/share/${params.token}/verify/send`, { email: emailInput });
      } else {
        await new Promise((r) => setTimeout(r, 700));
      }
      setEmail(emailInput);
      setStatus('verify-code');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeInput.trim()) return;
    setSubmitting(true);
    setCodeError('');
    try {
      if (!isMockMode()) {
        await api.post(`/files/share/${params.token}/verify/confirm`, { email, code: codeInput });
      } else {
        await new Promise((r) => setTimeout(r, 500));
        if (codeInput !== '123456') {
          setCodeError('Invalid code. Use 123456 in demo mode.');
          setSubmitting(false);
          return;
        }
      }
      if (file?.requireNda) {
        setStatus('nda-gate');
      } else {
        setStatus('ready');
      }
    } catch {
      setCodeError("That code didn't match. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ─── Loading ─────────────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-brand-white-off flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-brand-gray-dark">Loading shared file…</p>
        </div>
      </div>
    );
  }

  // ─── Expired ─────────────────────────────────────────────────────────────────
  if (status === 'expired') {
    return (
      <GateLayout>
        <div className="text-center">
          <div className="w-14 h-14 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-brand-black mb-2">This link has expired</h1>
          <p className="text-sm text-brand-gray-dark mb-6">Contact the sender for a new link.</p>
          <Link href="/" className="btn-primary text-sm px-6">Go to Lamid FileShare</Link>
        </div>
      </GateLayout>
    );
  }

  // ─── Error ────────────────────────────────────────────────────────────────────
  if (status === 'error' || !file) {
    return (
      <GateLayout>
        <div className="text-center">
          <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-brand-black mb-2">File not found</h1>
          <p className="text-sm text-brand-gray-dark mb-6">This link may be invalid or the file has been removed.</p>
          <Link href="/" className="btn-primary text-sm px-6">Go to Lamid FileShare</Link>
        </div>
      </GateLayout>
    );
  }

  // ─── Email gate ───────────────────────────────────────────────────────────────
  if (status === 'email-gate') {
    return (
      <GateLayout sharedBy={file.sharedBy.name} fileName={file.name}>
        <div className="w-full">
          <div className="w-12 h-12 bg-brand-black rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-brand-black text-center mb-1">Verify your email</h2>
          <p className="text-sm text-brand-gray-dark text-center mb-6">
            The sender requires email verification before accessing this file.
          </p>
          {isMockMode() && (
            <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
              Demo mode — enter any email to continue
            </div>
          )}
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <input
              type="email"
              required
              placeholder="your@email.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full px-4 py-3 border border-brand-gray rounded-xl text-sm focus:outline-none focus:border-brand-black transition-colors"
              autoFocus
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-brand-black text-white font-semibold text-sm rounded-xl hover:bg-brand-red transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {submitting ? 'Sending…' : 'Send verification code'}
            </button>
          </form>
        </div>
      </GateLayout>
    );
  }

  // ─── Verify code ──────────────────────────────────────────────────────────────
  if (status === 'verify-code') {
    return (
      <GateLayout sharedBy={file.sharedBy.name} fileName={file.name}>
        <div className="w-full">
          <div className="w-12 h-12 bg-brand-black rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-brand-black text-center mb-1">Enter verification code</h2>
          <p className="text-sm text-brand-gray-dark text-center mb-6">
            We sent a 6-digit code to <strong>{email}</strong>
          </p>
          {isMockMode() && (
            <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
              Demo mode — use code <strong>123456</strong>
            </div>
          )}
          <form onSubmit={handleCodeSubmit} className="space-y-3">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={codeInput}
              onChange={(e) => { setCodeInput(e.target.value.replace(/\D/g, '')); setCodeError(''); }}
              className={cn(
                'w-full px-4 py-3 border rounded-xl text-center text-2xl font-mono tracking-[0.4em] focus:outline-none transition-colors',
                codeError ? 'border-red-400' : 'border-brand-gray focus:border-brand-black'
              )}
              autoFocus
            />
            {codeError && <p className="text-xs text-red-600 text-center">{codeError}</p>}
            <button
              type="submit"
              disabled={submitting || codeInput.length < 6}
              className="w-full py-3 bg-brand-black text-white font-semibold text-sm rounded-xl hover:bg-brand-red transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {submitting ? 'Verifying…' : 'Verify'}
            </button>
            <button
              type="button"
              onClick={() => { setStatus('email-gate'); setCodeInput(''); setCodeError(''); }}
              className="w-full py-2 text-sm text-brand-gray-dark hover:text-brand-black transition-colors"
            >
              Change email address
            </button>
          </form>
        </div>
      </GateLayout>
    );
  }

  // ─── NDA gate ─────────────────────────────────────────────────────────────────
  if (status === 'nda-gate') {
    const ndaText = file.ndaText ?? 'By proceeding, you agree to keep all shared information confidential and not share it with any third parties without prior written consent.';
    return (
      <GateLayout sharedBy={file.sharedBy.name} fileName={file.name}>
        <div className="w-full">
          <div className="w-12 h-12 bg-brand-black rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-brand-black text-center mb-1">Review &amp; Accept NDA</h2>
          <p className="text-sm text-brand-gray-dark text-center mb-4">
            Accept the Non-Disclosure Agreement to view this file.
          </p>
          <div
            ref={ndaRef}
            onScroll={(e) => {
              const el = e.currentTarget;
              if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) setNdaScrolled(true);
            }}
            className="h-48 overflow-y-auto border border-brand-gray rounded-xl p-4 bg-brand-white-soft text-xs text-brand-gray-dark leading-relaxed mb-3 whitespace-pre-wrap"
          >
            {ndaText}
          </div>
          {!ndaScrolled && (
            <p className="text-[11px] text-amber-600 text-center mb-3">Scroll to the bottom to enable acceptance.</p>
          )}
          <label className={cn(
            'flex items-start gap-3 cursor-pointer mb-4 p-3 rounded-xl border transition-colors',
            ndaAccepted ? 'border-brand-black bg-brand-white-soft' : 'border-brand-gray',
            !ndaScrolled && 'opacity-50 cursor-not-allowed'
          )}>
            <input
              type="checkbox"
              disabled={!ndaScrolled}
              checked={ndaAccepted}
              onChange={(e) => setNdaAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-brand-red flex-shrink-0"
            />
            <span className="text-sm leading-snug">
              I have read and agree to the Non-Disclosure Agreement above.
            </span>
          </label>
          <button
            type="button"
            disabled={!ndaAccepted}
            onClick={() => setStatus('ready')}
            className="w-full py-3 bg-brand-black text-white font-semibold text-sm rounded-xl hover:bg-brand-red transition-colors disabled:opacity-50"
          >
            Accept &amp; View File
          </button>
        </div>
      </GateLayout>
    );
  }

  // ─── Ready ────────────────────────────────────────────────────────────────────
  const icon = getIcon(file.mimeType);
  const canPreview = isPreviewable(file.mimeType);

  return (
    <div
      className={cn('min-h-screen bg-brand-white-off', file.watermarkEnabled && 'select-none')}
      onContextMenu={file.watermarkEnabled ? (e) => e.preventDefault() : undefined}
    >
      {file.watermarkEnabled && (
        <style>{`@media print { body { display: none !important; } }`}</style>
      )}

      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-white border-b border-brand-gray px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-brand-black rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
            <div className="w-3 h-3 bg-brand-red rounded-sm" />
          </div>
          <span className="font-bold text-brand-black text-sm hidden sm:block">Lamid FileShare</span>
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
          <Link href="/register" className="btn-primary text-xs px-4 py-1.5">Sign up free</Link>
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
          {file.watermarkEnabled && (
            <div className="flex-shrink-0 flex items-center gap-1 text-[10px] text-brand-gray-dark border border-brand-gray rounded-full px-2 py-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Protected
            </div>
          )}
        </div>

        {/* File card */}
        <div className="bg-white border border-brand-gray rounded-2xl shadow-card overflow-hidden">
          {/* Preview area */}
          <div className="relative">
            {canPreview && previewing ? (
              <div className="relative w-full bg-brand-black aspect-video flex items-center justify-center">
                {file.mimeType.startsWith('image/') && file.previewUrl && (
                  <img src={file.previewUrl} alt={file.name} className="max-h-full max-w-full object-contain" draggable={false} />
                )}
                {file.mimeType.startsWith('video/') && (
                  <video src={file.url} controls className="w-full h-full" controlsList="nodownload" />
                )}
                {file.mimeType === 'application/pdf' && file.previewUrl && (
                  <iframe src={file.previewUrl} title={file.name} className="w-full h-full border-0" />
                )}
                {file.watermarkEnabled && <WatermarkOverlay email={email} />}
              </div>
            ) : (
              <div className="relative w-full aspect-video bg-gradient-to-br from-brand-white-soft to-brand-gray flex flex-col items-center justify-center gap-3">
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
                {file.watermarkEnabled && <WatermarkOverlay email={email} />}
              </div>
            )}
          </div>

          {/* File info */}
          <div className="p-6">
            <h1 className="text-lg font-bold text-brand-black mb-1 break-all">{file.name}</h1>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-brand-gray-dark mb-6">
              <span>{formatBytes(file.size)}</span>
              <span>·</span>
              <span>{file.mimeType}</span>
              <span>·</span>
              <span>Shared {new Date(file.sharedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              {file.expiresAt && (
                <>
                  <span>·</span>
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

        {/* Security badges */}
        {(file.watermarkEnabled || file.requireEmailVerification || file.requireNda) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {file.requireEmailVerification && (
              <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email verified
              </span>
            )}
            {file.requireNda && (
              <span className="flex items-center gap-1 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                NDA accepted
              </span>
            )}
            {file.watermarkEnabled && (
              <span className="flex items-center gap-1 text-xs text-purple-700 bg-purple-50 border border-purple-200 rounded-full px-2.5 py-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Watermarked
              </span>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="mt-8 p-6 bg-white border border-brand-gray rounded-xl text-center">
          <p className="text-sm font-semibold text-brand-black mb-1">Want to share files this securely?</p>
          <p className="text-xs text-brand-gray-dark mb-4">Lamid FileShare — email gates, NDA acceptance, watermarking &amp; full audit trails, free.</p>
          <Link href="/register" className="btn-primary text-sm px-8">Create a free account</Link>
        </div>
      </main>

      <footer className="border-t border-brand-gray py-6 text-center text-xs text-brand-gray-dark">
        <Link href="/" className="font-semibold text-brand-black hover:text-brand-red transition-colors">Lamid FileShare</Link>
        {' · '}
        <Link href="/privacy" className="hover:underline">Privacy</Link>
        {' · '}
        <Link href="/terms" className="hover:underline">Terms</Link>
      </footer>
    </div>
  );
}
