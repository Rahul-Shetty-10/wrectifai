import { AdminDashboardShell } from '@/components/admin/admin-dashboard-shell';
import { UsersClient } from './users-client';

export const dynamic = 'force-dynamic';

export default function AdminUsersPage() {
  return (
    <AdminDashboardShell activeItem="users">
      <UsersClient />
    </AdminDashboardShell>
  );
}
