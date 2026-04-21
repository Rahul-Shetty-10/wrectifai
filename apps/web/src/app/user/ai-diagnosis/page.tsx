import { getServiceIntakeContent, getUserSidebarContent } from '@/lib/api';
import { AiDiagnosisClient } from './ai-diagnosis-client';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const [sidebar, intakeContent] = await Promise.all([
    getUserSidebarContent(),
    getServiceIntakeContent(),
  ]);

  return <AiDiagnosisClient sidebar={sidebar} content={intakeContent} />;
}
