/**
 * Auth Store — Zustand state management for user authentication
 * Persistent in localStorage with synchronous hydration & hydration guards
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, authApi } from '@/lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isHydrated: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (data: { name: string; phone: string; email?: string; password: string; role: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setHydrated: (val: boolean) => void;
}

// Synchronously check localStorage if running in browser to avoid null flash on refresh
const getInitialStoredState = () => {
  if (typeof window === 'undefined') {
    return { user: null, token: null, isHydrated: false };
  }
  try {
    const raw = localStorage.getItem('dhaka-tesla-pool-auth');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.state?.user && parsed?.state?.token) {
        return {
          user: parsed.state.user as User,
          token: parsed.state.token as string,
          isHydrated: true,
        };
      }
    }
  } catch {
    // ignore parse error
  }
  return { user: null, token: null, isHydrated: false };
};

const initial = getInitialStoredState();

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: initial.user,
      token: initial.token,
      isLoading: false,
      isHydrated: initial.isHydrated,

      setHydrated: (val: boolean) => set({ isHydrated: val }),

      login: async (phone, password) => {
        set({ isLoading: true });
        try {
          const res = await authApi.login(phone, password);
          localStorage.setItem('dtp_token', res.data.token);
          set({ user: res.data.user, token: res.data.token, isLoading: false, isHydrated: true });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const res = await authApi.register(data);
          localStorage.setItem('dtp_token', res.data.token);
          set({ user: res.data.user, token: res.data.token, isLoading: false, isHydrated: true });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('dtp_token');
          localStorage.removeItem('dhaka-tesla-pool-auth');
        }
        set({ user: null, token: null, isHydrated: true });
      },

      refreshUser: async () => {
        const token = get().token;
        if (!token) return;
        try {
          const res = await authApi.getMe();
          set({ user: res.data.user, isHydrated: true });
        } catch {
          get().logout();
        }
      },
    }),
    {
      name: 'dhaka-tesla-pool-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
