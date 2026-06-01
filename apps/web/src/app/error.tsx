'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-brand-white-off flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-brand-black mb-2">Something went wrong</h1>
          <p className="text-brand-gray-dark text-sm mb-8 leading-relaxed">
            An unexpected error occurred. Our team has been notified.
            {error.digest && <span className="block text-[11px] font-mono mt-1 text-brand-gray-dark">Error ID: {error.digest}</span>}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="px-6 py-2.5 bg-brand-black text-white text-sm font-semibold rounded-button hover:bg-brand-red transition-colors duration-150"
            >
              Try again
            </button>
            <Link
              href="/dashboard"
              className="px-6 py-2.5 border border-brand-gray text-brand-black text-sm font-medium rounded-button hover:bg-brand-white-soft transition-colors duration-150"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
