'use client';

import { useEffect, useState } from 'react';
import { UserThemeShell } from '@/components/dashboard/user-theme-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  fetchPartOrders,
  fetchSpareParts,
  placePartOrder,
  type PartOrder,
  type SparePartItem,
  type UserSparePartsContent,
  type UserSidebarContent,
} from '@/lib/api';

type Props = { sidebar: UserSidebarContent; content: UserSparePartsContent };

export function SparePartsClient({ sidebar, content }: Props) {
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
      setError(e instanceof Error ? e.message : content.loadErrorLabel);
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
      setError(e instanceof Error ? e.message : content.orderErrorLabel);
    } finally {
      setOrderingPartId(null);
    }
  }

  return (
    <UserThemeShell activeItem="spare-parts" sidebar={sidebar}>
      <section className="overflow-y-auto">
        <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="h-5 w-1 rounded-full bg-[#4ec2ed] sm:h-6" />
            <h1 className="text-[23px] font-semibold tracking-tight text-[#0f2244]">{content.catalogTitle}</h1>
          </div>
          {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

          <Card className="mb-6 rounded-xl border-[#d9e2ef] bg-white shadow-[0_6px_16px_rgba(94,126,179,0.10)]">
            <CardHeader>
              <CardTitle className="text-[17px] font-medium text-slate-900">{content.catalogTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <p className="text-sm text-muted-foreground">{content.loadingPartsLabel}</p> : null}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {parts.map((part) => (
                  <div key={part.id} className="rounded-xl border border-[#d9e2ef] bg-[#f9fbff] p-4">
                    <p className="text-[16px] font-medium text-slate-900">{part.name}</p>
                    <p className="text-xs text-slate-500">{part.category}</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">${part.price.toFixed(2)}</p>
                    <p className="text-xs text-slate-500">{part.supplier}</p>
                    <Button
                      className="mt-3 h-9 w-full rounded-xl bg-[#1976f2] text-[13px] font-medium text-white hover:bg-[#0d62d4]"
                      disabled={!part.inStock || orderingPartId === part.id}
                      onClick={() => onOrder(part.id)}
                    >
                      {orderingPartId === part.id
                        ? content.orderingLabel
                        : part.inStock
                          ? content.orderLabel
                          : content.outOfStockLabel}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-[#d9e2ef] bg-white shadow-[0_6px_16px_rgba(94,126,179,0.10)]">
            <CardHeader>
              <CardTitle className="text-[17px] font-medium text-slate-900">{content.myOrdersTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {orders.length === 0 ? <p className="text-sm text-muted-foreground">{content.noOrdersLabel}</p> : null}
              {orders.map((order) => (
                <div key={order.id} className="rounded-xl border border-[#d9e2ef] bg-[#f9fbff] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[14px] font-medium text-slate-900">{order.partName}</p>
                    <p className="text-xs uppercase text-muted-foreground">{order.status}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {content.qtyLabel}: {order.qty} | {content.totalLabel}: ${order.totalAmount.toFixed(2)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </UserThemeShell>
  );
}
