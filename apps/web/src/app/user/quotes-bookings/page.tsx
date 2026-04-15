import { getQuotesBookingsContent, getUserSidebarContent } from '@/lib/api';
import { QuotesBookingsClient } from './quotes-bookings-client';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const [sidebar, content] = await Promise.all([
    getUserSidebarContent(),
    getQuotesBookingsContent(),
  ]);

  return <QuotesBookingsClient sidebar={sidebar} content={content} />;
}
