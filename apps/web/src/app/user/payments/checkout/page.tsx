import { getUserSidebarContent } from '@/lib/api';
import { PaymentsCheckoutClient } from './payments-checkout-client';

export const dynamic = 'force-dynamic';

export default async function PaymentsCheckoutPage() {
  const sidebar = await getUserSidebarContent();
  return <PaymentsCheckoutClient sidebar={sidebar} />;
}

