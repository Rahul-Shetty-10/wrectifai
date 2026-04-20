import { GarageDashboardShell } from '@/components/garage/garage-dashboard-shell';
import { BookingsClient } from './bookings-client';
import { getGaragePageContent } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function GarageBookingsPage() {
  const content = await getGaragePageContent('bookings');
  return (
    <GarageDashboardShell activeItem="bookings">
      <BookingsClient content={content} />
    </GarageDashboardShell>
  );
}
