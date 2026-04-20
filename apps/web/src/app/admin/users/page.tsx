import { AdminDashboardShell } from '@/components/admin/admin-dashboard-shell';
import { UsersClient } from './users-client';
import { getAdminPageContent } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const content = await getAdminPageContent('users');
  return (
    <AdminDashboardShell activeItem="users">
      <UsersClient content={content} />
    </AdminDashboardShell>
  );
}
