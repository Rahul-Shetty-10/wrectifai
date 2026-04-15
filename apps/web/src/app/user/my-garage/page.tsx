import { MyGarageClient } from './my-garage-client';
import { getUserMyGarageContent, getUserSidebarContent } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const [sidebar, content] = await Promise.all([
    getUserSidebarContent(),
    getUserMyGarageContent(),
  ]);

  return <MyGarageClient sidebar={sidebar} content={content} />;
}
