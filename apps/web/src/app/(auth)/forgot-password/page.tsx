'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/Button';
import { ToastProvider, useToast } from '@/components/ui/Toast';

function ForgotPasswordForm() {
  const { forgotPassword } = useAuthStore();
  const { error: toastError } = useToast();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch {
      toastError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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

        <div className="card p-8 animate-slide-up">
          {sent ? (
            <div className="text-center">
              <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-brand-black mb-2">Check your email</h1>
              <p className="text-sm text-brand-gray-dark mb-1">
                We sent a reset link to
              </p>
              <p className="text-sm font-semibold text-brand-black mb-6">{email}</p>
              <p className="text-xs text-brand-gray-dark mb-6">
                Didn&apos;t receive it? Check your spam folder or{' '}
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="text-brand-red font-semibold hover:underline"
                >
                  try again
                </button>
                .
              </p>
              <Link
                href="/login"
                className="block w-full text-center py-2.5 px-4 rounded-button border border-brand-gray text-sm font-medium text-brand-black hover:bg-brand-white-soft transition-colors duration-150"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-brand-black mb-1">Reset your password</h1>
                <p className="text-sm text-brand-gray-dark">
                  Enter the email address on your account and we&apos;ll send a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
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

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={isLoading}
                  className="w-full"
                >
                  Send reset link
                </Button>
              </form>

              <p className="text-center text-xs text-brand-gray-dark mt-6">
                <Link href="/login" className="text-brand-red font-semibold hover:underline">
                  â† Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <ToastProvider>
      <ForgotPasswordForm />
    </ToastProvider>
  );
}
