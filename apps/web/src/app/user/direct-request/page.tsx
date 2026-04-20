import { getAppIdentityConfig, getServiceIntakeContent, getUserSidebarContent } from '@/lib/api';
import { DirectRequestClient } from './direct-request-client';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const [sidebar, intakeContent, appIdentity] = await Promise.all([
    getUserSidebarContent(),
    getServiceIntakeContent(),
    getAppIdentityConfig(),
  ]);

  return <DirectRequestClient sidebar={sidebar} content={intakeContent} appLogoUrl={appIdentity.logoUrl} />;
}
