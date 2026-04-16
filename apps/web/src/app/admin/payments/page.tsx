import { AdminDashboardShell } from '@/components/admin/admin-dashboard-shell';
import { PaymentsClient } from './payments-client';

export const dynamic = 'force-dynamic';

export default function AdminPaymentsPage() {
  return (
    <AdminDashboardShell activeItem="payments">
      <PaymentsClient />
    </AdminDashboardShell>
  );
}
