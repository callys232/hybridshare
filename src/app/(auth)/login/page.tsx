'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/Button';
import { ToastProvider, useToast } from '@/components/ui/Toast';
import { CirclesPattern } from '@/components/ui/BackgroundPattern';

function LoginForm() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuthStore();
  const { error: toastError } = useToast();

  // Redirect already-authenticated users away from the login page
  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, router]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [userId, setUserId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await login(email, password, requiresTwoFactor ? totpCode : undefined);

      if (result.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        setUserId(result.userId ?? '');
        setIsLoading(false);
        return;
      }

      router.push('/dashboard');
    } catch (err) {
      toastError((err as Error).message ?? 'Login failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-brand-white-off flex items-center justify-center p-4 overflow-hidden">
      <CirclesPattern opacity={0.6} />
      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 bg-brand-black rounded-xl flex items-center justify-center transition-transform duration-150 group-hover:scale-110 shadow-button">
              <div className="w-4 h-4 bg-brand-red rounded-sm" />
            </div>
            <span className="font-bold text-xl text-brand-black tracking-tight">HybridShare</span>
          </Link>
        </div>

        {/* Dev credentials banner — remove before production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs">
            <p className="font-bold text-amber-800 mb-2 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Dev credentials (remove in production)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { role: 'Admin',   email: 'admin@hybridshare.io',  password: 'Admin@1234!' },
                { role: 'Member',  email: 'member@hybridshare.io', password: 'Member@1234!' },
              ].map(({ role, email, password }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => { setEmail(email); setPassword(password); }}
                  className="text-left px-2.5 py-2 rounded-lg bg-white border border-amber-200 hover:border-amber-400 hover:bg-amber-50/50 transition-colors"
                >
                  <p className="font-bold text-amber-900 text-[10px] uppercase tracking-wider">{role}</p>
                  <p className="text-amber-700 text-[10px] truncate">{email}</p>
                  <p className="text-amber-500 text-[10px] font-mono">{password}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Card */}
        <div className="card p-8 animate-slide-up">
          <h1 className="text-2xl font-bold text-brand-black mb-1">
            {requiresTwoFactor ? 'Two-factor auth' : 'Welcome back'}
          </h1>
          <p className="text-sm text-brand-gray-dark mb-6">
            {requiresTwoFactor
              ? 'Enter the 6-digit code from your authenticator app.'
              : 'Sign in to your HybridShare workspace.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!requiresTwoFactor ? (
              <>
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-brand-black mb-1.5">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="input-field"
                    required
                    autoFocus
                    autoComplete="email"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="password" className="block text-xs font-semibold text-brand-black">
                      Password
                    </label>
                    <Link href="/forgot-password" className="text-xs text-brand-red hover:underline font-medium">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="input-field pr-10"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-gray-dark hover:text-brand-black transition-colors duration-150"
                      onClick={() => setShowPassword((v) => !v)}
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label htmlFor="totp" className="block text-xs font-semibold text-brand-black mb-1.5">
                  Authenticator code
                </label>
                <input
                  id="totp"
                  type="text"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="input-field text-center text-xl tracking-[0.4em] font-mono"
                  maxLength={6}
                  autoFocus
                  required
                />
                <p className="text-xs text-brand-gray-dark mt-2">
                  <button
                    type="button"
                    className="text-brand-red hover:underline font-medium"
                    onClick={() => setRequiresTwoFactor(false)}
                  >
                    ← Back to login
                  </button>
                </p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isLoading}
              className="w-full"
            >
              {requiresTwoFactor ? 'Verify' : 'Sign in'}
            </Button>
          </form>

          {!requiresTwoFactor && (
            <>
              <div className="my-5 flex items-center gap-3">
                <div className="flex-1 h-px bg-brand-gray" />
                <span className="text-xs text-brand-gray-dark">or continue with</span>
                <div className="flex-1 h-px bg-brand-gray" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <a
                  href="/api/auth/oauth/google"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-button border border-brand-gray text-sm font-medium text-brand-black hover:bg-brand-white-soft hover:border-brand-gray-dark transition-all duration-150 active:scale-95"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google
                </a>
                <a
                  href="/api/auth/oauth/microsoft"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-button border border-brand-gray text-sm font-medium text-brand-black hover:bg-brand-white-soft hover:border-brand-gray-dark transition-all duration-150 active:scale-95"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#f25022" d="M1 1h10v10H1z" />
                    <path fill="#00a4ef" d="M13 1h10v10H13z" />
                    <path fill="#7fba00" d="M1 13h10v10H1z" />
                    <path fill="#ffb900" d="M13 13h10v10H13z" />
                  </svg>
                  Microsoft
                </a>
              </div>
            </>
          )}

          <p className="text-center text-xs text-brand-gray-dark mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-brand-red font-semibold hover:underline">
              Sign up for free
            </Link>
          </p>
        </div>

        <p className="text-center text-[10px] text-brand-gray-dark mt-6">
          Protected by HybridShare security. <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
        </p>

        {/* Admin portal link — separated visually at the very bottom */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <div className="h-px w-16 bg-brand-gray" />
          <Link
            href="/admin/login"
            className="group flex items-center gap-1.5 text-[10px] font-medium text-brand-gray-dark hover:text-brand-black transition-colors duration-150"
          >
            <svg className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Administrator portal
          </Link>
          <div className="h-px w-16 bg-brand-gray" />
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <ToastProvider>
      <LoginForm />
    </ToastProvider>
  );
}
