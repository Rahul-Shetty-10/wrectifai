import { getAppIdentityConfig, getDashboardContent, getUserSidebarContent } from '@/lib/api';
import { DashboardClient } from './dashboard-client';

export const dynamic = 'force-dynamic';

export default async function UserDashboardPage() {
  const [sidebar, content] = await Promise.all([
    getUserSidebarContent(),
    getDashboardContent(),
  ]);

  const appIdentity = await getAppIdentityConfig();
  return (
    <DashboardClient
      sidebar={sidebar}
      content={content}
      appLogoUrl={appIdentity.logoUrl}
    />
  );
}
