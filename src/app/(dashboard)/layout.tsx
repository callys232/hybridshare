'use client';

import { useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { UpgradeProvider } from '@/context/UpgradeContext';
import { useAuthStore } from '@/store/auth.store';
import { useWorkspaceStore } from '@/store/workspace.store';
import { useNotificationStore } from '@/store/notification.store';
import { connectSocket, onNotification } from '@/lib/socket';

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuthStore();
  const { fetchWorkspaces } = useWorkspaceStore();
  const { fetchNotifications, addNotification } = useNotificationStore();

  useEffect(() => {
    fetchWorkspaces();
    fetchNotifications();
  }, []);

  useEffect(() => {
    const token = accessToken || localStorage.getItem('accessToken');
    if (!token) return;
    connectSocket(token);
    const unsubscribe = onNotification((n) => {
      addNotification(n as Parameters<typeof addNotification>[0]);
    });
    return () => { unsubscribe(); };
  }, [accessToken]);

  return (
    <div className="flex h-screen overflow-hidden bg-brand-white-off dark:bg-dark-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-screen-2xl mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthGuard>
        <UpgradeProvider>
          <DashboardShell>{children}</DashboardShell>
        </UpgradeProvider>
      </AuthGuard>
    </ToastProvider>
  );
}
