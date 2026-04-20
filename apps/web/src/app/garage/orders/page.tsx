import { GarageDashboardShell } from '@/components/garage/garage-dashboard-shell';
import { OrdersClient } from './orders-client';
import { getGaragePageContent } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function GarageOrdersPage() {
  const content = await getGaragePageContent('orders');
  return (
    <GarageDashboardShell activeItem="orders">
      <OrdersClient content={content} />
    </GarageDashboardShell>
  );
}
