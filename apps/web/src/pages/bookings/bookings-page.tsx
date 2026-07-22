'use client';

import { useEffect, useState, useMemo } from 'react';
import { DashboardShell } from '@/components/home/dashboard-shell';
import { TopNavbar } from '@/components/home/top-navbar';
import { Card } from '@/components/common/card';
import { Button } from '@/components/common/button';
import { fetchBookings, updateBookingStatus } from '@/lib/bookings-api';
import type { Booking } from '@/lib/bookings-api';
import { cn } from '@/utils/cn';
import { Calendar, Clock, Wrench, XCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

type TabKey = 'all' | 'upcoming' | 'inService' | 'completed' | 'cancelled';

export function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  const loadBookings = async () => {
    await Promise.resolve();
    setLoading(true);
    setErrorText(null);
    try {
      const data = await fetchBookings();
      setBookings(data || []);
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : 'Failed to retrieve bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        loadBookings();
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const handleCancelBooking = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await updateBookingStatus(id, 'cancelled');
      // Update locally
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' as const } : b))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cancel booking');
    }
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (activeTab === 'all') return true;
      if (activeTab === 'upcoming') return b.status === 'confirmed' || b.status === 'pendingPayment';
      if (activeTab === 'inService') return b.status === 'inService';
      if (activeTab === 'completed') return b.status === 'completed';
      if (activeTab === 'cancelled') return b.status === 'cancelled';
      return true;
    });
  }, [bookings, activeTab]);

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'all', label: 'All Bookings' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'inService', label: 'In Service' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <DashboardShell header={<TopNavbar />}>
      <div className="space-y-4">
        {/* Header */}
        <Card className="p-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a8ab4]">
                WrectifAI Workspace
              </p>
              <h1 className="mt-1 text-[25px] font-bold tracking-[-0.04em] text-[#17307a]">
                My Bookings
              </h1>
            </div>
          </div>
        </Card>

        {/* Tab Filters */}
        <div className="flex flex-wrap gap-1.5 border-b border-[#eef3ff] pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'rounded-[10px] px-3.5 py-1.5 text-[11.5px] font-bold transition-all',
                activeTab === tab.key
                  ? 'bg-[#1a56db] text-white shadow-sm'
                  : 'bg-white border border-[#e2eefc] text-[#17307a] hover:bg-[#f8fbff]'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content States */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Card key={i} className="animate-pulse p-5 space-y-3">
                <div className="h-4 bg-slate-200 rounded w-1/4" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
                <div className="h-3 bg-slate-200 rounded w-1/3" />
              </Card>
            ))}
          </div>
        ) : errorText ? (
          <Card className="p-5 border-[#ffcccc] bg-[#fffbfb] flex flex-col items-center justify-center text-center">
            <AlertTriangle className="h-8 w-8 text-[#ff3b30] mb-2" />
            <p className="text-[13px] font-bold text-[#ff3b30]">{errorText}</p>
            <Button onClick={loadBookings} variant="outline" className="mt-3">
              Retry
            </Button>
          </Card>
        ) : filteredBookings.length === 0 ? (
          <Card className="p-8 flex flex-col items-center justify-center text-center">
            <Calendar className="h-10 w-10 text-[#8a99ad] mb-2" />
            <p className="text-[13.5px] font-bold text-[#17307a]">No bookings found</p>
            <p className="text-[11.5px] text-[#5c6e8e] mt-1">There are no bookings matching the selected filter.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredBookings.map((b) => (
              <Card key={b.id} className="p-4 sm:p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-[#eef3ff]">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        'rounded-[6px] px-2 py-0.5 text-[10px] font-bold uppercase',
                        b.status === 'confirmed' && 'bg-[#e0f2fe] text-[#0369a1]',
                        b.status === 'pendingPayment' && 'bg-[#fef3c7] text-[#b45309]',
                        b.status === 'inService' && 'bg-[#e0e7ff] text-[#4338ca]',
                        b.status === 'completed' && 'bg-[#dcfce7] text-[#15803d]',
                        b.status === 'cancelled' && 'bg-[#fee2e2] text-[#b91c1c]'
                      )}
                    >
                      {b.status}
                    </span>
                    <span className="text-[10px] text-[#8a96b8] font-semibold font-mono">
                      ID: {b.id.substring(0, 8)}
                    </span>
                  </div>

                  <h3 className="text-[14.5px] font-bold text-[#17307a]">{b.garageName || 'Garage'}</h3>
                  
                  {b.garageAddress && (
                    <p className="text-[11px] text-[#5c6e8e] font-normal leading-none">{b.garageAddress}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-[11px] text-[#17307a] font-semibold">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-[#1a56db]" />
                      {new Date(b.scheduledAt).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-[#1a56db]" />
                      {new Date(b.scheduledAt).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {b.vehicleMake && (
                      <span className="flex items-center gap-1 border-l border-[#eef3ff] pl-4">
                        <Wrench className="h-3.5 w-3.5 text-[#1a56db]" />
                        {b.vehicleYear} {b.vehicleMake} {b.vehicleModel}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 border-[#eef3ff] pt-3 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] font-bold text-[#8a96b8] uppercase">Total Cost</p>
                    <p className="text-[15.5px] font-extrabold text-[#17307a]">{b.currency} {b.totalAmount}</p>
                  </div>

                  <div className="flex gap-2">
                    {(b.status === 'confirmed' || b.status === 'pendingPayment') && (
                      <Button
                        onClick={() => handleCancelBooking(b.id)}
                        variant="outline"
                        className="h-8 rounded-[9px] px-2.5 text-[10.5px] font-semibold border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

export default BookingsPage;
