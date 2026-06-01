'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading, loadUser } = useAuthStore();
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    const token = localStorage.getItem('accessToken');
    if (token) {
      loadUser().finally(() => setReady(true));
    } else {
      setReady(true);
    }
  }, [loadUser]);

  useEffect(() => {
    if (ready && !isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [ready, isLoading, isAuthenticated, router]);

  if (!ready || isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-brand-white-off dark:bg-dark-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 bg-brand-black rounded-xl flex items-center justify-center animate-pulse">
            <div className="w-4 h-4 bg-brand-red rounded-sm" />
          </div>
          <div className="flex gap-1.5 items-center">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-gray-dark animate-bounce [animation-delay:-0.3s]" />
            <div className="w-1.5 h-1.5 rounded-full bg-brand-gray-dark animate-bounce [animation-delay:-0.15s]" />
            <div className="w-1.5 h-1.5 rounded-full bg-brand-gray-dark animate-bounce" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
