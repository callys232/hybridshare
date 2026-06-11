'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';

// ── SVG animated background ───────────────────────────────────────────────────
function AdminBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <svg className="absolute w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="ag1" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#111111" stopOpacity="1" />
            <stop offset="100%" stopColor="#000000" stopOpacity="1" />
          </radialGradient>
        </defs>
        <rect width="800" height="600" fill="url(#ag1)" />

        {/* Rotating grid */}
        {Array.from({ length: 14 }, (_, i) =>
          Array.from({ length: 10 }, (_, j) => (
            <rect
              key={`${i}-${j}`}
              x={i * 60 - 30}
              y={j * 65 - 30}
              width="1"
              height="1"
              fill="white"
              fillOpacity="0.08"
            />
          ))
        )}

        {/* Large outline circles */}
        <circle cx="400" cy="300" r="260" fill="none" stroke="white" strokeWidth="0.5" strokeOpacity="0.06">
          <animateTransform attributeName="transform" type="rotate" values="0 400 300;360 400 300" dur="60s" repeatCount="indefinite" />
        </circle>
        <circle cx="400" cy="300" r="180" fill="none" stroke="white" strokeWidth="0.5" strokeOpacity="0.05">
          <animateTransform attributeName="transform" type="rotate" values="360 400 300;0 400 300" dur="40s" repeatCount="indefinite" />
        </circle>

        {/* Corner geometric shapes */}
        <polygon points="0,0 80,0 0,80" fill="white" fillOpacity="0.03">
          <animateTransform attributeName="transform" type="translate" values="0,0;5,5;0,0" dur="8s" repeatCount="indefinite" />
        </polygon>
        <polygon points="800,600 720,600 800,520" fill="white" fillOpacity="0.03">
          <animateTransform attributeName="transform" type="translate" values="0,0;-5,-5;0,0" dur="10s" repeatCount="indefinite" />
        </polygon>

        {/* Scanning line */}
        <line x1="0" y1="0" x2="800" y2="0" stroke="#c12129" strokeWidth="1" strokeOpacity="0.3">
          <animateTransform attributeName="transform" type="translate" values="0,0;0,600" dur="6s" repeatCount="indefinite" />
          <animate attributeName="stroke-opacity" values="0.3;0;0.3" dur="6s" repeatCount="indefinite" />
        </line>
      </svg>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await login(email, password, requiresTwoFactor ? totpCode : undefined);

      if (result.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        setIsLoading(false);
        return;
      }

      // After login, check that the user actually has admin role
      const { useAuthStore: store } = await import('@/store/auth.store');
      const user = store.getState().user;
      if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
        // Not an admin — clear session and show error
        await store.getState().logout();
        setError('This account does not have administrator access. Use the regular sign-in page instead.');
        setIsLoading(false);
        return;
      }

      router.replace('/admin');
    } catch (err) {
      setError((err as Error).message ?? 'Sign in failed. Please check your credentials.');
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-zinc-950">
      <AdminBackground />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-zinc-800 border border-zinc-700 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
            <div className="w-5 h-5 bg-brand-red rounded-sm" />
          </div>
          <span className="font-bold text-lg text-white tracking-tight">Lamid FileShare</span>
          <div className="flex items-center gap-1.5 mt-1.5 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700">
            <svg className="w-3 h-3 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Admin Portal</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-7 shadow-2xl">
          <h1 className="text-xl font-bold text-white mb-1">
            {requiresTwoFactor ? 'Two-factor verification' : 'Administrator sign in'}
          </h1>
          <p className="text-xs text-zinc-400 mb-6">
            {requiresTwoFactor
              ? 'Enter the 6-digit code from your authenticator app.'
              : 'Restricted to authorised administrators only.'}
          </p>

          {error && (
            <div className="flex items-start gap-2.5 bg-red-950/60 border border-red-800 rounded-xl px-3 py-3 mb-4">
              <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-xs text-red-300 leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!requiresTwoFactor ? (
              <>
                <FormField label="Email address">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@hybridshare.io"
                    autoFocus
                    required
                    autoComplete="email"
                    className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all duration-150"
                  />
                </FormField>

                <FormField label="Password">
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      autoComplete="current-password"
                      className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 rounded-lg px-3 py-2.5 pr-10 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all duration-150"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {showPassword
                        ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                        : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      }
                    </button>
                  </div>
                </FormField>
              </>
            ) : (
              <FormField label="Authenticator code">
                <input
                  type="text"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                  required
                  className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 rounded-lg px-3 py-2.5 text-xl font-mono text-center tracking-[0.4em] outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all duration-150"
                />
                <button
                  type="button"
                  className="text-xs text-zinc-400 hover:text-white mt-1 transition-colors"
                  onClick={() => setRequiresTwoFactor(false)}
                >
                  ← Back to sign in
                </button>
              </FormField>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-red hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  {requiresTwoFactor ? 'Verify identity' : 'Sign in to Admin'}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-zinc-800 text-center">
            <p className="text-xs text-zinc-500">
              Not an administrator?{' '}
              <Link href="/login" className="text-zinc-300 hover:text-white font-medium transition-colors">
                Regular sign in →
              </Link>
            </p>
          </div>
        </div>

        {/* Warning notice */}
        <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-950/50 border border-amber-800/50">
          <svg className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-[11px] text-amber-400/80">
            This portal is monitored. Unauthorised access attempts are logged and reported.
          </p>
        </div>
      </div>
    </div>
  );
}
