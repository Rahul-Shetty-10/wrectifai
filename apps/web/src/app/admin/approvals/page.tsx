import { AdminDashboardShell } from '@/components/admin/admin-dashboard-shell';
import { ApprovalsClient } from './approvals-client';
import { getAdminPageContent } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function AdminApprovalsPage() {
  const content = await getAdminPageContent('approvals');
  return (
    <AdminDashboardShell activeItem="approvals">
      <ApprovalsClient content={content} />
    </AdminDashboardShell>
  );
}
