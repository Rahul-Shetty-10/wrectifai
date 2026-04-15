import { getUserSidebarContent } from '@/lib/api';
import { SupportClient } from './support-client';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const sidebar = await getUserSidebarContent();
  return <SupportClient sidebar={sidebar} />;
}
