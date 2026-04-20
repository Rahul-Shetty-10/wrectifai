import { getUserSidebarContent, getUserSupportContent } from '@/lib/api';
import { SupportClient } from './support-client';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const [sidebar, content] = await Promise.all([getUserSidebarContent(), getUserSupportContent()]);
  return <SupportClient sidebar={sidebar} content={content} />;
}
