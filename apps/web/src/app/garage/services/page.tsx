import { GarageDashboardShell } from '@/components/garage/garage-dashboard-shell';
import { ServicesClient } from './services-client';
import { getGaragePageContent } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function GarageServicesPage() {
  const content = await getGaragePageContent('services');
  return (
    <GarageDashboardShell activeItem="services">
      <ServicesClient content={content} />
    </GarageDashboardShell>
  );
}
