import { AdminDashboardShell } from '@/components/admin/admin-dashboard-shell';
import { PaymentsClient } from './payments-client';
import { getAdminPageContent } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function AdminPaymentsPage() {
  const content = await getAdminPageContent('payments');
  return (
    <AdminDashboardShell activeItem="payments">
      <PaymentsClient content={content} />
    </AdminDashboardShell>
  );
}
