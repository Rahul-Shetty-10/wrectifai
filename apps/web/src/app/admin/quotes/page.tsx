import { AdminDashboardShell } from '@/components/admin/admin-dashboard-shell';
import { QuotesClient } from './quotes-client';
import { getAdminPageContent } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function AdminQuotesPage() {
  const content = await getAdminPageContent('quotes');
  return (
    <AdminDashboardShell activeItem="quotes">
      <QuotesClient content={content} />
    </AdminDashboardShell>
  );
}
