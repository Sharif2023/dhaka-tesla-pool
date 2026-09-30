/**
 * Auth Store — Zustand state management for user authentication
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, authApi } from '@/lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (data: { name: string; phone: string; email?: string; password: string; role: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,

      login: async (phone, password) => {
        set({ isLoading: true });
        try {
          const res = await authApi.login(phone, password);
          localStorage.setItem('dtp_token', res.data.token);
          set({ user: res.data.user, token: res.data.token, isLoading: false });
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
          set({ user: res.data.user, token: res.data.token, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('dtp_token');
        set({ user: null, token: null });
      },

      refreshUser: async () => {
        const token = get().token;
        if (!token) return;
        try {
          const res = await authApi.getMe();
          set({ user: res.data.user });
        } catch {
          get().logout();
        }
      },
    }),
    {
      name: 'dhaka-tesla-pool-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
