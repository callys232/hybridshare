'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center py-32">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-brand-black mb-2">Something went wrong</h2>
        <p className="text-sm text-brand-gray-dark mb-6">
          This section failed to load. Try refreshing or return to the dashboard.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2 bg-brand-black text-white text-sm font-semibold rounded-button hover:bg-brand-red transition-colors"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="px-5 py-2 border border-brand-gray text-brand-black text-sm font-medium rounded-button hover:bg-brand-white-soft transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
