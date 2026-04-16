import { AdminDashboardShell } from '@/components/admin/admin-dashboard-shell';
import { BookingsClient } from './bookings-client';

export const dynamic = 'force-dynamic';

export default function AdminBookingsPage() {
  return (
    <AdminDashboardShell activeItem="bookings">
      <BookingsClient />
    </AdminDashboardShell>
  );
}
