import { create } from 'zustand';
import { api, type ApiResponse } from '@/lib/api';
import { MOCK_NOTIFICATIONS } from '@/mocks';

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  resourceType?: string;
  resourceId?: string;
  isRead: boolean;
  readAt: Date | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;

  fetchNotifications: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  dismiss: (id: string) => Promise<void>;
  addNotification: (notification: Notification) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get<ApiResponse<Notification[]> & { unreadCount?: number }>('/notifications');
      const data = response.data.data ?? [];
      const unreadCount = data.filter((n) => !n.isRead).length;
      set({ notifications: data, unreadCount, isLoading: false });
    } catch {
      if (process.env.NODE_ENV === 'development') {
        const mocked = MOCK_NOTIFICATIONS as Notification[];
        set({ notifications: mocked, unreadCount: mocked.filter((n) => !n.isRead).length, isLoading: false });
      } else {
        set({ notifications: [], unreadCount: 0, isLoading: false });
      }
    }
  },

  markRead: async (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true, readAt: new Date() } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
    try {
      await api.put(`/notifications/${id}/read`);
    } catch {
      await get().fetchNotifications();
    }
  },

  markAllRead: async () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true, readAt: new Date() })),
      unreadCount: 0,
    }));
    try {
      await api.put('/notifications/read-all');
    } catch {
      await get().fetchNotifications();
    }
  },

  dismiss: async (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
      unreadCount: state.notifications.find((n) => n.id === id && !n.isRead)
        ? Math.max(0, state.unreadCount - 1)
        : state.unreadCount,
    }));
    try {
      await api.delete(`/notifications/${id}`);
    } catch {
      await get().fetchNotifications();
    }
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + (notification.isRead ? 0 : 1),
    }));
  },
}));
