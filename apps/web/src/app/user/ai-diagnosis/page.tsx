import { getAiDiagnosisContent, getUserSidebarContent } from '@/lib/api';
import { AiDiagnosisClient } from './ai-diagnosis-client';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const [sidebar, content] = await Promise.all([
    getUserSidebarContent(),
    getAiDiagnosisContent(),
  ]);

  return <AiDiagnosisClient sidebar={sidebar} content={content} />;
}
