import { getUserSidebarContent } from '@/lib/api';
import { SparePartsClient } from './spare-parts-client';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const sidebar = await getUserSidebarContent();
  return <SparePartsClient sidebar={sidebar} />;
}
