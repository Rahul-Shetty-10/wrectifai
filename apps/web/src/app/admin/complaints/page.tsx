import { AdminDashboardShell } from '@/components/admin/admin-dashboard-shell';
import { ComplaintsClient } from './complaints-client';

export const dynamic = 'force-dynamic';

export default function AdminComplaintsPage() {
  return (
    <AdminDashboardShell activeItem="complaints">
      <ComplaintsClient />
    </AdminDashboardShell>
  );
}
