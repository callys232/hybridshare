'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useHydrated } from '@/hooks/useHydrated';

function Loader() {
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

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const mounted  = useHydrated();
  const { isAuthenticated, isLoading, loadUser } = useAuthStore();
  const attempted = useRef(false);

  // After mount Zustand has replayed from localStorage.
  // Call loadUser only when we have a token but no user object yet
  // (e.g. hard refresh — token in storage but user cleared from memory).
  useEffect(() => {
    if (!mounted || attempted.current) return;
    attempted.current = true;
    const token = localStorage.getItem('accessToken');
    if (token && !isAuthenticated) {
      loadUser().catch(() => {});
    }
  }, [mounted, isAuthenticated, loadUser]);

  // Redirect once we know the user is not authenticated
  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [mounted, isLoading, isAuthenticated, router]);

  // Show loader while client hasn't mounted or a loadUser is in-flight
  if (!mounted || isLoading) return <Loader />;

  // Mounted + not authenticated → render nothing (redirect fires above)
  if (!isAuthenticated) return null;

  return <>{children}</>;
}
