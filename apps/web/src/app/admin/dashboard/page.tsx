import { AdminDashboardShell } from '@/components/admin/admin-dashboard-shell';
import { AdminAnalyticsDashboardClient } from './dashboard-client';

export const dynamic = 'force-dynamic';

export default function AdminDashboardPage() {
  return (
    <AdminDashboardShell activeItem="dashboard">
      <AdminAnalyticsDashboardClient />
    </AdminDashboardShell>
  );
}
