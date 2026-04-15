import { getUserSidebarContent, getUserPaymentsContent } from '@/lib/api';
import { PaymentsClient } from './payments-client';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const [sidebar, content] = await Promise.all([
    getUserSidebarContent(),
    getUserPaymentsContent(),
  ]);

  return <PaymentsClient sidebar={sidebar} content={content} />;
}
