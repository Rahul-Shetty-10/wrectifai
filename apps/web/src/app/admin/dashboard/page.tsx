import { AdminDashboardShell } from '@/components/admin/admin-dashboard-shell';
import { AdminAnalyticsDashboardClient } from './dashboard-client';
import { getAdminPageContent } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const content = await getAdminPageContent('dashboard');
  return (
    <AdminDashboardShell activeItem="dashboard">
      <AdminAnalyticsDashboardClient content={content} />
    </AdminDashboardShell>
  );
}
