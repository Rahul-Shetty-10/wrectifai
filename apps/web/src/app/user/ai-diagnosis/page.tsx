import { getUserSidebarContent } from '@/lib/api';
import { AiDiagnosisClient } from './ai-diagnosis-client';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const sidebar = await getUserSidebarContent();
  return <AiDiagnosisClient sidebar={sidebar} />;
}
