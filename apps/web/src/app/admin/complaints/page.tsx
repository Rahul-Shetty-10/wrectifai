import { AdminDashboardShell } from '@/components/admin/admin-dashboard-shell';
import { ComplaintsClient } from './complaints-client';
import { getAdminPageContent } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function AdminComplaintsPage() {
  const content = await getAdminPageContent('complaints');
  return (
    <AdminDashboardShell activeItem="complaints">
      <ComplaintsClient content={content} />
    </AdminDashboardShell>
  );
}
