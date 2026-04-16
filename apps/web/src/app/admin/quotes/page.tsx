import { AdminDashboardShell } from '@/components/admin/admin-dashboard-shell';
import { QuotesClient } from './quotes-client';

export const dynamic = 'force-dynamic';

export default function AdminQuotesPage() {
  return (
    <AdminDashboardShell activeItem="quotes">
      <QuotesClient />
    </AdminDashboardShell>
  );
}
