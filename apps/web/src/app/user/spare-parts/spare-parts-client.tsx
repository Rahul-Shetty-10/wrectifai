'use client';

import { useEffect, useState } from 'react';
import { SessionGuard } from '@/components/auth/session-guard';
import { UserSidebar, UserSidebarMobile } from '@/components/dashboard/user-sidebar';
import { UserTopLogoHeader } from '@/components/dashboard/user-top-logo-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  fetchPartOrders,
  fetchSpareParts,
  placePartOrder,
  type PartOrder,
  type SparePartItem,
  type UserSidebarContent,
} from '@/lib/api';

type Props = { sidebar: UserSidebarContent };

export function SparePartsClient({ sidebar }: Props) {
  const [parts, setParts] = useState<SparePartItem[]>([]);
  const [orders, setOrders] = useState<PartOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderingPartId, setOrderingPartId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const [partsData, ordersData] = await Promise.all([fetchSpareParts(), fetchPartOrders()]);
      setParts(partsData);
      setOrders(ordersData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load spare parts');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onOrder(partId: string) {
    try {
      setOrderingPartId(partId);
      setError(null);
      await placePartOrder(partId, 1);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to place order');
    } finally {
      setOrderingPartId(null);
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <SessionGuard requiredRole="user" />
      <UserSidebarMobile activeItem="spare-parts" content={sidebar} />
      <div className="hidden lg:block">
        <UserSidebar activeItem="spare-parts" content={sidebar} />
      </div>
      <section className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-6xl p-6">
          <UserTopLogoHeader sidebar={sidebar} />
          {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Spare Parts Catalog</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <p className="text-sm text-muted-foreground">Loading parts...</p> : null}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {parts.map((part) => (
                  <div key={part.id} className="rounded-lg border border-border p-4">
                    <p className="font-medium">{part.name}</p>
                    <p className="text-xs text-muted-foreground">{part.category}</p>
                    <p className="mt-2 text-lg font-semibold">${part.price.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{part.supplier}</p>
                    <Button
                      className="mt-3 w-full"
                      disabled={!part.inStock || orderingPartId === part.id}
                      onClick={() => onOrder(part.id)}
                    >
                      {orderingPartId === part.id ? 'Ordering...' : part.inStock ? 'Order' : 'Out of Stock'}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>My Part Orders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {orders.length === 0 ? <p className="text-sm text-muted-foreground">No part orders yet.</p> : null}
              {orders.map((order) => (
                <div key={order.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{order.partName}</p>
                    <p className="text-xs uppercase text-muted-foreground">{order.status}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Qty: {order.qty} | Total: ${order.totalAmount.toFixed(2)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
