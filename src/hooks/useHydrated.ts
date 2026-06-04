import { useEffect, useState } from 'react';

/**
 * Returns true after the first client-side effect fires.
 * Guarantees SSR and first client render both start with `false`,
 * eliminating hydration mismatches and Zustand persist flash.
 *
 * Zustand's persist middleware hydrates synchronously from localStorage
 * inside the first useEffect tick, so once `mounted` is true the store
 * state is guaranteed to reflect what was in localStorage.
 */
export function useHydrated(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  return mounted;
}
