import { AdminDashboardShell } from '@/components/admin/admin-dashboard-shell';
import { BookingsClient } from './bookings-client';
import { getAdminPageContent } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function AdminBookingsPage() {
  const content = await getAdminPageContent('bookings');
  return (
    <AdminDashboardShell activeItem="bookings">
      <BookingsClient content={content} />
    </AdminDashboardShell>
  );
}
