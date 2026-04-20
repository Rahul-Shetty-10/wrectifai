import { GarageDashboardShell } from '@/components/garage/garage-dashboard-shell';
import { AvailabilityClient } from './availability-client';
import { getGaragePageContent } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function GarageAvailabilityPage() {
  const content = await getGaragePageContent('availability');
  return (
    <GarageDashboardShell activeItem="availability">
      <AvailabilityClient content={content} />
    </GarageDashboardShell>
  );
}
