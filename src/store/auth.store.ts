import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api, type ApiResponse } from '@/lib/api';
import type { User } from '@/shared/user';

// ── Dev-only mock credentials (removed automatically in production) ────────────
const DEV_USERS: Record<string, Omit<User, 'createdAt' | 'updatedAt'> & { password: string }> = {
  'admin@hybridshare.io': {
    id: 'dev-admin-001', email: 'admin@hybridshare.io', name: 'Admin User',
    avatar: null, role: 'ADMIN' as never, provider: 'LOCAL' as never,
    isEmailVerified: true, isTwoFactorEnabled: false, isActive: true,
    lastLoginAt: new Date(), storageUsed: 536870912, storageQuota: 107374182400,
    bio: 'Platform administrator', jobTitle: 'Platform Admin',
    website: null, linkedinUrl: null, twitterHandle: null,
    timezone: 'UTC', language: 'en',
    planType: 'ENTERPRISE' as never, subscriptionStatus: 'ACTIVE' as never,
    xpPoints: 0, streakDays: 0, longestStreak: 0,
    password: 'Admin@1234!',
  },
  'member@hybridshare.io': {
    id: 'dev-member-001', email: 'member@hybridshare.io', name: 'Test Member',
    avatar: null, role: 'MEMBER' as never, provider: 'LOCAL' as never,
    isEmailVerified: true, isTwoFactorEnabled: false, isActive: true,
    lastLoginAt: new Date(), storageUsed: 104857600, storageQuota: 53687091200,
    bio: 'Regular team member', jobTitle: 'Team Member',
    website: null, linkedinUrl: null, twitterHandle: null,
    timezone: 'UTC', language: 'en',
    planType: 'STARTER' as never, subscriptionStatus: 'ACTIVE' as never,
    xpPoints: 0, streakDays: 0, longestStreak: 0,
    password: 'Member@1234!',
  },
};

function devMockLogin(email: string, password: string) {
  if (process.env.NODE_ENV !== 'development') return null;
  const u = DEV_USERS[email.toLowerCase()];
  if (!u || u.password !== password) return null;
  const { password: _, ...user } = u;
  return { user, accessToken: `dev-token-${user.id}`, refreshToken: `dev-refresh-${user.id}` };
}

interface ProfileUpdateData {
  name?: string;
  bio?: string;
  jobTitle?: string;
  website?: string;
  linkedinUrl?: string;
  twitterHandle?: string;
  timezone?: string;
  language?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string, totpCode?: string) => Promise<{ requiresTwoFactor?: boolean; userId?: string }>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  updateProfile: (data: ProfileUpdateData) => Promise<void>;
  updateAvatar: (file: File) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  clearError: () => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password, totpCode) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post<ApiResponse<{
            accessToken?: string;
            refreshToken?: string;
            expiresIn?: number;
            requiresTwoFactor?: boolean;
            userId?: string;
          }>>('/auth/login', { email, password, totpCode });

          const data = response.data.data!;

          if (data.requiresTwoFactor) {
            set({ isLoading: false });
            return { requiresTwoFactor: true, userId: data.userId };
          }

          if (data.accessToken) {
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken ?? '');
            set({ accessToken: data.accessToken, refreshToken: data.refreshToken ?? null, isLoading: false });
            await get().loadUser();
          }

          return {};
        } catch (err) {
          // ── Dev mock fallback: fires when API is unreachable (no database yet) ──
          const isNetworkErr = !(err as { response?: unknown }).response;
          if (isNetworkErr && !totpCode) {
            const mock = devMockLogin(email, password);
            if (mock) {
              localStorage.setItem('accessToken', mock.accessToken);
              localStorage.setItem('refreshToken', mock.refreshToken);
              set({ user: mock.user as User, accessToken: mock.accessToken, refreshToken: mock.refreshToken, isAuthenticated: true, isLoading: false, error: null });
              return {};
            }
          }
          const message = (err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Login failed. Check your credentials or ensure the API server is running.';
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true, error: null });
        try {
          await api.post('/auth/register', { name, email, password });
          set({ isLoading: false });
        } catch (err) {
          const message = (err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Registration failed';
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      logout: async () => {
        const { accessToken, refreshToken } = get();
        try {
          await api.post('/auth/logout', { refreshToken }, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
        } catch {
          // Ignore logout errors
        }
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      forgotPassword: async (email) => {
        set({ isLoading: true, error: null });
        try {
          await api.post('/auth/forgot-password', { email });
        } catch {
          // Silently succeed to avoid email enumeration
        } finally {
          set({ isLoading: false });
        }
      },

      resetPassword: async (token, password) => {
        set({ isLoading: true, error: null });
        try {
          await api.post('/auth/reset-password', { token, password });
          set({ isLoading: false });
        } catch (err) {
          const message = (err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Reset failed. The link may have expired.';
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      verifyEmail: async (token) => {
        set({ isLoading: true, error: null });
        try {
          await api.post('/auth/verify-email', { token });
          set({ isLoading: false });
        } catch (err) {
          const message = (err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Verification failed. The link may have expired.';
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      loadUser: async () => {
        set({ isLoading: true });

        // If we already have a mock user in state (dev mode), keep it
        const existing = get().user;
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        if (token?.startsWith('dev-token-') && existing) {
          set({ isAuthenticated: true, isLoading: false });
          return;
        }

        try {
          const response = await api.get<ApiResponse<User>>('/users/me');
          set({ user: response.data.data, isAuthenticated: true, isLoading: false });
        } catch {
          // Dev mode: restore user from mock token if API is down
          if (process.env.NODE_ENV === 'development' && token?.startsWith('dev-token-')) {
            const mockUser = Object.values(DEV_USERS).find((u) => `dev-token-${u.id}` === token);
            if (mockUser) {
              const { password: _, ...user } = mockUser;
              set({ user: user as User, isAuthenticated: true, isLoading: false });
              return;
            }
          }
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isLoading: false });
        }
      },

      updateProfile: async (data) => {
        const res = await api.put<ApiResponse<User>>('/users/me', data);
        set({ user: res.data.data! });
      },

      updateAvatar: async (file) => {
        const form = new FormData();
        form.append('avatar', file);
        const res = await api.post<ApiResponse<{ avatar: string }>>('/users/me/avatar', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        set((s) => ({ user: s.user ? { ...s.user, avatar: res.data.data!.avatar } : null }));
      },

      changePassword: async (currentPassword, newPassword) => {
        await api.put('/users/me/password', { currentPassword, newPassword });
      },

      clearError: () => set({ error: null }),

      setTokens: (accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({ accessToken, refreshToken, isAuthenticated: true });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
