import { getUserSidebarContent, getUserSparePartsContent } from '@/lib/api';
import { SparePartsClient } from './spare-parts-client';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const [sidebar, content] = await Promise.all([getUserSidebarContent(), getUserSparePartsContent()]);
  return <SparePartsClient sidebar={sidebar} content={content} />;
}
