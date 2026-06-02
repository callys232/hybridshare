'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { ToastProvider } from '@/components/ui/Toast';

type State = 'pending' | 'verifying' | 'success' | 'error' | 'sent';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const sent = searchParams.get('sent') === '1';
  const email = searchParams.get('email') ?? '';
  const { verifyEmail } = useAuthStore();

  const [state, setState] = useState<State>(sent ? 'sent' : token ? 'verifying' : 'pending');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) return;
    setState('verifying');
    verifyEmail(token)
      .then(() => {
        setState('success');
        setTimeout(() => router.push('/auth/onboarding'), 2500);
      })
      .catch((err: Error) => {
        setErrorMsg(err.message);
        setState('error');
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-brand-white-off flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 bg-brand-black rounded-xl flex items-center justify-center transition-transform duration-150 group-hover:scale-110 shadow-button">
              <div className="w-4 h-4 bg-brand-red rounded-sm" />
            </div>
            <span className="font-bold text-xl text-brand-black tracking-tight">HybridShare</span>
          </Link>
        </div>

        <div className="card p-8 animate-slide-up text-center">
          {/* Sent (post-registration) */}
          {state === 'sent' && (
            <>
              <div className="w-14 h-14 bg-blue-50 border border-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-brand-black mb-2">Verify your email</h1>
              <p className="text-sm text-brand-gray-dark mb-1">We sent a verification link to</p>
              {email && <p className="text-sm font-semibold text-brand-black mb-4">{email}</p>}
              <p className="text-xs text-brand-gray-dark mb-6 leading-relaxed">
                Click the link in your email to activate your account. Check your spam folder if you don&apos;t see it.
              </p>
              <div className="space-y-2">
                <Link
                  href="/login"
                  className="block w-full py-2.5 px-4 bg-brand-black text-white text-sm font-semibold rounded-button hover:bg-brand-red transition-colors duration-150"
                >
                  I&apos;ll verify later — sign in
                </Link>
              </div>
            </>
          )}

          {/* Verifying in progress */}
          {state === 'verifying' && (
            <>
              <div className="w-14 h-14 bg-brand-white-soft border border-brand-gray rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-6 h-6 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
              </div>
              <h1 className="text-xl font-bold text-brand-black mb-2">Verifying your email…</h1>
              <p className="text-sm text-brand-gray-dark">Just a moment.</p>
            </>
          )}

          {/* Success */}
          {state === 'success' && (
            <>
              <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-brand-black mb-2">Email verified!</h1>
              <p className="text-sm text-brand-gray-dark mb-4">Your account is active. Taking you to setup…</p>
              <div className="w-full h-1 bg-brand-gray rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full animate-[grow_2.5s_linear_forwards]" />
              </div>
            </>
          )}

          {/* Error */}
          {state === 'error' && (
            <>
              <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-brand-black mb-2">Verification failed</h1>
              <p className="text-sm text-brand-gray-dark mb-6">
                {errorMsg || 'This link may have expired or already been used.'}
              </p>
              <div className="space-y-2">
                <Link
                  href="/login"
                  className="block w-full py-2.5 px-4 bg-brand-black text-white text-sm font-semibold rounded-button hover:bg-brand-red transition-colors duration-150"
                >
                  Back to sign in
                </Link>
                <Link
                  href="/auth/register"
                  className="block w-full py-2.5 px-4 border border-brand-gray text-brand-black text-sm font-medium rounded-button hover:bg-brand-white-soft transition-colors duration-150"
                >
                  Create a new account
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <ToastProvider>
      <Suspense fallback={
        <div className="min-h-screen bg-brand-white-off flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <VerifyEmailContent />
      </Suspense>
    </ToastProvider>
  );
}
