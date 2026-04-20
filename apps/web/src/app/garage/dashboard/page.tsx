import { GarageDashboardShell } from '@/components/garage/garage-dashboard-shell';
import { DashboardClient } from './dashboard-client';
import { getGaragePageContent } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function GarageDashboardPage() {
  const content = await getGaragePageContent('dashboard');
  return (
    <GarageDashboardShell activeItem="dashboard">
      <DashboardClient content={content} />
    </GarageDashboardShell>
  );
}
