'use client';

import { useState } from 'react';
import { Button } from '@/component/ui/Button';
import { Input } from '@/component/ui/Input';
import { FormField } from '@/component/ui/FormField';
import { Tabs } from '@/component/ui/Tabs';
import { Tooltip } from '@/component/ui/Tooltip';
import { ToastProvider, useToast } from '@/component/ui/Toast';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

const SECURITY_TABS = [
  { id: 'password' as const, label: 'Password' },
  { id: 'two_factor' as const, label: '2FA' },
  { id: 'sessions' as const, label: 'Sessions' },
] as const;
type SecurityTab = typeof SECURITY_TABS[number]['id'];

// ── Password ──────────────────────────────────────────────────────────────────

function PasswordSection() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const strength = (() => {
    const p = form.next;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#3b82f6', '#10b981'][strength];

  const EyeToggle = () => (
    <button type="button" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow((v) => !v)}
      className="text-brand-gray-dark hover:text-brand-black transition-colors duration-150">
      {show
        ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
        : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
      }
    </button>
  );

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.current) errs.current = 'Required';
    if (form.next.length < 8) errs.next = 'Must be at least 8 characters';
    if (form.next !== form.confirm) errs.confirm = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await api.put('/auth/change-password', { currentPassword: form.current, newPassword: form.next });
      toastSuccess('Password updated successfully');
      setForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      toastError((err as Error).message ?? 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-md">
      <div>
        <h2 className="text-base font-semibold text-brand-black dark:text-white">Change password</h2>
        <p className="text-xs text-brand-gray-dark mt-0.5">Use a strong, unique password you don&apos;t use elsewhere.</p>
      </div>

      <FormField label="Current password" error={errors.current}>
        <Input type={show ? 'text' : 'password'} value={form.current}
          onChange={(e) => setForm((p) => ({ ...p, current: e.target.value }))}
          placeholder="Enter current password" autoComplete="current-password"
          suffix={<EyeToggle />} error={!!errors.current} />
      </FormField>

      <FormField label="New password" error={errors.next}>
        <Input type={show ? 'text' : 'password'} value={form.next}
          onChange={(e) => setForm((p) => ({ ...p, next: e.target.value }))}
          placeholder="Min. 8 characters" autoComplete="new-password"
          suffix={<EyeToggle />} error={!!errors.next} />
        {form.next.length > 0 && (
          <div className="mt-2 space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                  style={{ backgroundColor: i <= strength ? strengthColor : '#e5e7eb' }} />
              ))}
            </div>
            <p className="text-[10px] font-medium" style={{ color: strengthColor }}>{strengthLabel}</p>
          </div>
        )}
      </FormField>

      <FormField label="Confirm new password" error={errors.confirm}>
        <Input type={show ? 'text' : 'password'} value={form.confirm}
          onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))}
          placeholder="Re-enter new password" autoComplete="new-password"
          error={!!errors.confirm} />
      </FormField>

      <Button variant="primary" onClick={handleSave} loading={saving}>Update password</Button>
    </div>
  );
}

// ── Two-Factor Auth ───────────────────────────────────────────────────────────

function TwoFactorSection() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [enabled] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'idle' | 'setup' | 'verify'>('idle');
  const [loading, setLoading] = useState(false);

  const startSetup = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/2fa/setup');
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setStep('setup');
    } catch { toastError('Could not start 2FA setup'); }
    finally { setLoading(false); }
  };

  const verify = async () => {
    setLoading(true);
    try {
      await api.post('/auth/2fa/verify', { code });
      toastSuccess('Two-factor authentication enabled');
      setStep('idle');
    } catch { toastError('Invalid code — please try again'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-5 max-w-md">
      <div className="flex items-start gap-3">
        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
          enabled ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-50 text-amber-500')}>
          {enabled
            ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          }
        </div>
        <div>
          <h2 className="text-base font-semibold text-brand-black dark:text-white">
            Two-factor authentication
            <span className={cn('ml-2 text-xs font-bold px-1.5 py-0.5 rounded-full',
              enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>
              {enabled ? 'Enabled' : 'Disabled'}
            </span>
          </h2>
          <p className="text-xs text-brand-gray-dark mt-0.5">
            Add an extra layer of security with a time-based one-time password (TOTP).
          </p>
        </div>
      </div>

      {step === 'idle' && !enabled && (
        <Button variant="secondary" onClick={startSetup} loading={loading}>
          Set up 2FA
        </Button>
      )}

      {step === 'setup' && qrCode && (
        <div className="space-y-4 p-4 rounded-xl bg-brand-gray/20 border border-brand-gray">
          <p className="text-sm font-medium text-brand-black dark:text-white">
            1. Scan this QR code with your authenticator app
          </p>
          <div className="flex justify-center">
            <img src={qrCode} alt="2FA QR code" className="w-40 h-40 rounded-lg border border-brand-gray" />
          </div>
          <div>
            <p className="text-xs text-brand-gray-dark mb-1">Or enter this key manually:</p>
            <code className="block text-xs font-mono bg-white dark:bg-dark-surface-2 border border-brand-gray rounded px-3 py-2 break-all select-all">
              {secret}
            </code>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setStep('verify')}>
            I&apos;ve scanned the code →
          </Button>
        </div>
      )}

      {step === 'verify' && (
        <div className="space-y-4">
          <FormField label="Enter the 6-digit code from your app">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="text-center text-xl tracking-[0.4em] font-mono"
              maxLength={6}
              autoFocus
            />
          </FormField>
          <div className="flex gap-3">
            <Button variant="primary" onClick={verify} loading={loading} disabled={code.length !== 6}>
              Verify &amp; enable
            </Button>
            <Button variant="ghost" onClick={() => setStep('idle')}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Active Sessions ───────────────────────────────────────────────────────────

const MOCK_SESSIONS = [
  { id: '1', device: 'Chrome on macOS', location: 'Lagos, NG', ip: '41.58.x.x', lastSeen: 'Active now', current: true },
  { id: '2', device: 'Firefox on Windows', location: 'Abuja, NG', ip: '105.113.x.x', lastSeen: '2 hours ago', current: false },
  { id: '3', device: 'HybridShare iOS App', location: 'Port Harcourt, NG', ip: '197.210.x.x', lastSeen: 'Yesterday', current: false },
];

function SessionsSection() {
  const { success: toastSuccess } = useToast();
  const [sessions, setSessions] = useState(MOCK_SESSIONS);
  const [revoking, setRevoking] = useState<string | null>(null);

  const revoke = async (id: string) => {
    setRevoking(id);
    await new Promise((r) => setTimeout(r, 600));
    setSessions((s) => s.filter((sess) => sess.id !== id));
    toastSuccess('Session revoked');
    setRevoking(null);
  };

  const revokeAll = async () => {
    setRevoking('all');
    await new Promise((r) => setTimeout(r, 800));
    setSessions((s) => s.filter((sess) => sess.current));
    toastSuccess('All other sessions revoked');
    setRevoking(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-brand-black dark:text-white">Active sessions</h2>
          <p className="text-xs text-brand-gray-dark mt-0.5">Devices currently signed in to your account.</p>
        </div>
        {sessions.filter((s) => !s.current).length > 0 && (
          <Button variant="danger" size="sm" onClick={revokeAll} loading={revoking === 'all'}>
            Revoke all others
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {sessions.map((sess) => (
          <div key={sess.id}
            className={cn('card p-4 flex items-center gap-4 transition-all duration-150',
              sess.current && 'ring-1 ring-brand-black dark:ring-white/20')}>
            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
              sess.current ? 'bg-brand-black text-white' : 'bg-brand-gray text-brand-gray-dark')}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-brand-black dark:text-white truncate">{sess.device}</p>
                {sess.current && (
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full flex-shrink-0">
                    This device
                  </span>
                )}
              </div>
              <p className="text-xs text-brand-gray-dark">{sess.location} · {sess.ip} · {sess.lastSeen}</p>
            </div>
            {!sess.current && (
              <Tooltip content="Revoke this session" side="left">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => revoke(sess.id)}
                  loading={revoking === sess.id}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  Revoke
                </Button>
              </Tooltip>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

function SecurityContent() {
  const [tab, setTab] = useState<SecurityTab>('password');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-brand-black dark:text-white">Security</h1>
        <p className="text-sm text-brand-gray-dark mt-1">Manage your password, two-factor authentication, and active sessions.</p>
      </div>

      <Tabs tabs={[...SECURITY_TABS]} active={tab} onChange={setTab} variant="boxed" />

      <div className="card p-6">
        {tab === 'password' && <PasswordSection />}
        {tab === 'two_factor' && <TwoFactorSection />}
        {tab === 'sessions' && <SessionsSection />}
      </div>
    </div>
  );
}

export default function SecurityPage() {
  return (
    <ToastProvider>
      <SecurityContent />
    </ToastProvider>
  );
}
