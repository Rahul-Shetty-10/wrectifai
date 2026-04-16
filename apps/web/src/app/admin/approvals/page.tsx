import { AdminDashboardShell } from '@/components/admin/admin-dashboard-shell';
import { ApprovalsClient } from './approvals-client';

export const dynamic = 'force-dynamic';

export default function AdminApprovalsPage() {
  return (
    <AdminDashboardShell activeItem="approvals">
      <ApprovalsClient />
    </AdminDashboardShell>
  );
}
