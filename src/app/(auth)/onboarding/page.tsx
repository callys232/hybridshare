'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { ShapesPattern } from '@/components/ui/BackgroundPattern';

const STEPS = ['Your role', 'Use case', 'Finish'] as const;
type Step = 0 | 1 | 2;

const ROLES = [
  { id: 'individual',  label: 'Individual',      desc: 'Personal storage & sharing',        icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { id: 'team_member', label: 'Team Member',      desc: 'Part of a team workspace',          icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { id: 'manager',     label: 'Team Manager',     desc: 'Manage teams and workspaces',       icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
  { id: 'it_admin',    label: 'IT Administrator', desc: 'Manage users, security & storage',  icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

const USE_CASES = [
  { id: 'file_storage',   label: 'Secure file storage',        icon: 'M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z' },
  { id: 'team_collab',    label: 'Team collaboration',         icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { id: 'client_sharing', label: 'Sharing files with clients', icon: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z' },
  { id: 'data_sync',      label: 'Syncing cloud sources',      icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
  { id: 'compliance',     label: 'Compliance & audit trail',   icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { id: 'backup',         label: 'Backup & recovery',          icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
];

const TEAM_SIZES = ['Just me', '2–10', '11–50', '51–200', '200+'];

export default function OnboardingPage() {
  const router = useRouter();
  const { updateProfile } = useAuthStore();
  const [step, setStep]         = useState<Step>(0);
  const [role, setRole]         = useState('');
  const [useCases, setUseCases] = useState<string[]>([]);
  const [teamSize, setTeamSize] = useState('');
  const [saving, setSaving]     = useState(false);

  const toggleUseCase = (id: string) =>
    setUseCases((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const finish = async () => {
    setSaving(true);
    try { await updateProfile({ bio: `Role: ${role} | Team: ${teamSize}` }); } catch { /* non-fatal */ }
    router.replace('/dashboard');
  };

  return (
    <div className="relative min-h-screen bg-brand-white-off flex items-center justify-center p-4 overflow-hidden">
      <ShapesPattern opacity={0.5} />
      <div className="relative z-10 w-full max-w-lg">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-brand-black rounded-xl flex items-center justify-center shadow-button">
              <div className="w-4 h-4 bg-brand-red rounded-sm" />
            </div>
            <span className="font-bold text-xl text-brand-black tracking-tight">Lamid FileShare</span>
          </div>
        </div>

        {/* Step progress */}
        <div className="flex gap-1.5 mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1 flex flex-col items-center gap-1">
              <div className={cn('h-1.5 w-full rounded-full transition-all duration-300',
                i <= step ? 'bg-brand-red' : 'bg-brand-gray')} />
              <span className={cn('text-[10px] font-medium', i === step ? 'text-brand-black' : 'text-brand-gray-dark')}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="card p-7 animate-slide-up">

          {/* Step 0 — Role */}
          {step === 0 && (
            <>
              <h1 className="text-xl font-bold text-brand-black mb-1">What best describes you?</h1>
              <p className="text-sm text-brand-gray-dark mb-5">This helps us set up your workspace.</p>
              <div className="grid grid-cols-2 gap-3">
                {ROLES.map((r) => (
                  <button key={r.id} type="button" onClick={() => setRole(r.id)}
                    className={cn('flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition-all duration-150',
                      role === r.id ? 'border-brand-black bg-brand-white-soft ring-1 ring-brand-black' : 'border-brand-gray hover:border-brand-gray-dark')}>
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center',
                      role === r.id ? 'bg-brand-black text-white' : 'bg-brand-gray/50 text-brand-gray-dark')}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={r.icon} />
                      </svg>
                    </div>
                    <p className="text-xs font-bold text-brand-black">{r.label}</p>
                    <p className="text-[10px] text-brand-gray-dark">{r.desc}</p>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Step 1 — Use cases */}
          {step === 1 && (
            <>
              <h1 className="text-xl font-bold text-brand-black mb-1">How will you use Lamid FileShare?</h1>
              <p className="text-sm text-brand-gray-dark mb-4">Select all that apply.</p>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {USE_CASES.map((u) => {
                  const active = useCases.includes(u.id);
                  return (
                    <button key={u.id} type="button" onClick={() => toggleUseCase(u.id)}
                      className={cn('flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all duration-150',
                        active ? 'border-brand-red bg-brand-red/5 ring-1 ring-brand-red/20' : 'border-brand-gray hover:border-brand-gray-dark')}>
                      <svg className={cn('w-4 h-4 flex-shrink-0', active ? 'text-brand-red' : 'text-brand-gray-dark')}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={u.icon} />
                      </svg>
                      <span className="text-xs font-medium text-brand-black leading-snug">{u.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs font-semibold text-brand-black mb-2">Team size</p>
              <div className="flex gap-2 flex-wrap">
                {TEAM_SIZES.map((s) => (
                  <button key={s} type="button" onClick={() => setTeamSize(s)}
                    className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150',
                      teamSize === s ? 'bg-brand-black text-white border-brand-black' : 'border-brand-gray text-brand-gray-dark hover:border-brand-black hover:text-brand-black')}>
                    {s}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Step 2 — Done */}
          {step === 2 && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-brand-black mb-2">You&apos;re all set!</h1>
              <p className="text-sm text-brand-gray-dark mb-6 max-w-xs mx-auto">
                Your workspace is ready. Upload your first files or create a team workspace to get started.
              </p>
              {[
                { path: 'M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z', text: 'Upload and organise files in workspaces' },
                { path: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z', text: 'Share files securely with anyone' },
                { path: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1', text: 'Connect to Google Drive, S3, and more' },
              ].map(({ path, text }) => (
                <div key={text} className="flex items-center gap-2.5 text-sm text-brand-gray-dark mb-2">
                  <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={path} />
                  </svg>
                  {text}
                </div>
              ))}
            </div>
          )}

          {/* Navigation */}
          <div className={cn('flex mt-6', step === 0 ? 'justify-end' : 'justify-between')}>
            {step > 0 && (
              <button type="button" onClick={() => setStep((s) => Math.max(s - 1, 0) as Step)}
                className="text-sm font-semibold text-brand-gray-dark hover:text-brand-black transition-colors flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            )}
            {step < 2 ? (
              <button type="button" disabled={step === 0 && !role}
                onClick={() => setStep((s) => Math.min(s + 1, 2) as Step)}
                className="btn-primary text-sm px-6 py-2.5 disabled:opacity-50 flex items-center gap-2">
                Continue
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button type="button" onClick={finish} disabled={saving}
                className="btn-primary text-sm px-6 py-2.5 disabled:opacity-50 flex items-center gap-2">
                {saving && <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
                {saving ? 'Setting up…' : 'Go to dashboard'}
                {!saving && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
