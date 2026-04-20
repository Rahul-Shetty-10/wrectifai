import { getAppIdentityConfig, getServiceIntakeContent, getUserSidebarContent } from '@/lib/api';
import { AiDiagnosisClient } from './ai-diagnosis-client';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const [sidebar, intakeContent, appIdentity] = await Promise.all([
    getUserSidebarContent(),
    getServiceIntakeContent(),
    getAppIdentityConfig(),
  ]);

  return <AiDiagnosisClient sidebar={sidebar} content={intakeContent} appLogoUrl={appIdentity.logoUrl} />;
}
