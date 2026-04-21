import { getServiceIntakeContent, getUserSidebarContent } from '@/lib/api';
import { DirectRequestClient } from './direct-request-client';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const [sidebar, intakeContent] = await Promise.all([
    getUserSidebarContent(),
    getServiceIntakeContent(),
  ]);

  return <DirectRequestClient sidebar={sidebar} content={intakeContent} />;
}
