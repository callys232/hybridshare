import { AdminGuard } from '@/component/auth/AdminGuard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminGuard>{children}</AdminGuard>;
}
