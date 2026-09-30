'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { User } from '@/lib/api';

/**
 * useAuthGuard - Prevents auto-logout on refresh by waiting for
 * localStorage and Zustand hydration before redirecting.
 */
export function useAuthGuard(requiredRole?: 'DRIVER' | 'PASSENGER') {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const setHydrated = useAuthStore((s) => s.setHydrated);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Synchronously check and restore from localStorage if needed
    if (!useAuthStore.getState().isHydrated) {
      try {
        const raw = localStorage.getItem('dhaka-tesla-pool-auth');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.state?.user && parsed?.state?.token) {
            useAuthStore.setState({
              user: parsed.state.user as User,
              token: parsed.state.token as string,
              isHydrated: true,
            });
            return;
          }
        }
      } catch {
        // ignore parse error
      }
      setHydrated(true);
    }
  }, [setHydrated]);

  useEffect(() => {
    // CRITICAL: Never redirect before client mounting & hydration complete
    if (!mounted || !isHydrated) return;

    if (!user) {
      router.replace('/auth/login');
      return;
    }

    if (requiredRole && user.role !== requiredRole) {
      router.replace(user.role === 'DRIVER' ? '/driver' : '/passenger');
    }
  }, [user, isHydrated, mounted, requiredRole, router]);

  const isReady = mounted && isHydrated && !!user && (!requiredRole || user.role === requiredRole);

  return { user, isReady };
}
