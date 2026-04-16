import { AdminDashboardShell } from '@/components/admin/admin-dashboard-shell';
import { ProfileClient } from './profile-client';

export const dynamic = 'force-dynamic';

export default async function AdminProfilePage() {
  return (
    <AdminDashboardShell activeItem="profile">
      <ProfileClient />
    </AdminDashboardShell>
  );
}
