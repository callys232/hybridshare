'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export function useAuth(options?: { requireAuth?: boolean; redirectTo?: string }) {
  const { user, isAuthenticated, isLoading, loadUser } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      loadUser();
    }
  }, []);

  useEffect(() => {
    if (!isLoading && options?.requireAuth && !isAuthenticated) {
      router.replace(options.redirectTo ?? '/login');
    }
  }, [isLoading, isAuthenticated]);

  return { user, isAuthenticated, isLoading };
}

export function useIsAdmin() {
  const { user } = useAuthStore();
  return user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
}

export function useCurrentUser() {
  return useAuthStore((s) => s.user);
}
