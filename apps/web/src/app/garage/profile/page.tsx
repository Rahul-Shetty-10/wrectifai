import { GarageDashboardShell } from '@/components/garage/garage-dashboard-shell';
import { ProfileClient } from './profile-client';
import { getGaragePageContent } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function GarageProfilePage() {
  const content = await getGaragePageContent('profile');
  return (
    <GarageDashboardShell activeItem="profile">
      <ProfileClient content={content} />
    </GarageDashboardShell>
  );
}
