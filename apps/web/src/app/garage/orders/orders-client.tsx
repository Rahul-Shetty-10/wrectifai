'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, AlertTriangle, Car, Clock, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchGarageOrders, type GarageOrder, type DynamicPageContent } from '@/lib/api';

export function OrdersClient({ content }: { content: DynamicPageContent }) {
  const t = (key: string, fallback: string) => content[key] ?? fallback;
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'New' | 'Quoted' | 'Accepted' | 'Rejected'>('all');
  const [orders, setOrders] = useState<GarageOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 10;

  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true);
        const data = await fetchGarageOrders();
        setOrders(data);
      } catch (error) {
        console.error('Failed to load orders:', error);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = searchQuery === '' ||
      order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.issue.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  const resetPage = () => setCurrentPage(1);

  const handleViewQuoteDetails = (order: GarageOrder) => {
    router.push(`/garage/orders/${order.id}`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">{t('title', 'Orders')}</h1>
          <p className="mt-2 text-sm text-slate-500 sm:text-base">{t('description', 'Manage new issue requests from customers')}</p>
        </div>
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="rounded-2xl border-[#d9e2ef] bg-white shadow-none sm:rounded-3xl">
              <CardHeader className="border-b border-[#e6ebf2] pb-4">
                <div className="h-6 w-32 bg-slate-200 animate-pulse rounded" />
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-slate-200 animate-pulse rounded" />
                  <div className="h-4 w-32 bg-slate-200 animate-pulse rounded" />
                  <div className="h-8 w-full bg-slate-200 animate-pulse rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">{t('title', 'Orders')}</h1>
        <p className="mt-2 text-sm text-slate-500 sm:text-base">{t('description', 'Manage new issue requests from customers')}</p>
      </div>

      {/* Search and Filter */}
      <Card className="rounded-2xl border-[#d9e2ef] bg-white shadow-none sm:rounded-3xl">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder={t('searchPlaceholder', 'Search orders...')}
                className="pl-10"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  resetPage();
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                className="gap-2"
                onClick={() => {
                  setStatusFilter('all');
                  resetPage();
                }}
              >
                {t('filterAll', 'All')}
              </Button>
              <Button
                variant={statusFilter === 'New' ? 'default' : 'outline'}
                className="gap-2"
                onClick={() => {
                  setStatusFilter('New');
                  resetPage();
                }}
              >
                {t('filterNew', 'New')}
              </Button>
              <Button
                variant={statusFilter === 'Quoted' ? 'default' : 'outline'}
                className="gap-2"
                onClick={() => {
                  setStatusFilter('Quoted');
                  resetPage();
                }}
              >
                {t('filterQuoted', 'Quoted')}
              </Button>
              <Button
                variant={statusFilter === 'Accepted' ? 'default' : 'outline'}
                className="gap-2"
                onClick={() => {
                  setStatusFilter('Accepted');
                  resetPage();
                }}
              >
                {t('filterAccepted', 'Accepted')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Grid */}
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {currentOrders.map((order) => (
          <Card key={order.id} className="rounded-2xl border-[#d9e2ef] bg-white shadow-none sm:rounded-3xl">
            <CardHeader className="border-b border-[#e6ebf2] pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f3f8ff] text-[#2456f5] sm:h-14 sm:w-14">
                    <Car className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-slate-900 sm:text-lg">{order.customer}</CardTitle>
                    <p className="text-xs text-slate-500 sm:text-sm">{order.vehicle}</p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={
                    order.status === 'New'
                      ? 'border-blue-200 bg-blue-50 text-blue-700 w-fit'
                      : order.status === 'Quoted'
                      ? 'border-amber-200 bg-amber-50 text-amber-700 w-fit'
                      : order.status === 'Accepted'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 w-fit'
                      : 'border-red-200 bg-red-50 text-red-700 w-fit'
                  }
                >
                  {order.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-3 text-sm text-slate-500">
                <p className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium text-slate-900">{t('issueLabel', 'Issue:')}</span> {order.issue}
                </p>
                <p className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-medium text-slate-900">{t('diagnosisLabel', 'Diagnosis:')}</span> {order.diagnosis}
                </p>
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {t('submittedPrefix', 'Submitted:')} {order.submitted}
                  </p>
                  <Badge
                    variant="outline"
                    className={
                      order.urgency === 'High'
                        ? 'border-red-200 bg-red-50 text-red-700'
                        : order.urgency === 'Medium'
                        ? 'border-amber-200 bg-amber-50 text-amber-700'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    }
                  >
                    {order.urgency}
                  </Badge>
                </div>
              </div>
              <div className="mt-4">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full gap-2 border-[#d9e2ef] text-[#2456f5] hover:bg-[#f3f8ff]"
                  onClick={() => handleViewQuoteDetails(order)}
                >
                  {t('viewDetailsLabel', 'View Details')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {filteredOrders.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length} orders
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0 sm:h-9 sm:w-9"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0 sm:h-9 sm:w-9"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500">{t('emptyState', 'No orders found matching your search or filters.')}</p>
        </div>
      )}

    </div>
  );
}
