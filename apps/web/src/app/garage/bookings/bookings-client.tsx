'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Calendar, Clock, Car, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchGarageBookings, updateGarageBookingStatus, type GarageBooking } from '@/lib/api';

export function BookingsClient() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled'>('all');
  const [bookings, setBookings] = useState<GarageBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const itemsPerPage = 9;

  useEffect(() => {
    async function loadBookings() {
      try {
        setLoading(true);
        const data = await fetchGarageBookings();
        setBookings(data);
      } catch (error) {
        console.error('Failed to load bookings:', error);
      } finally {
        setLoading(false);
      }
    }
    loadBookings();
  }, []);

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch = searchQuery === '' ||
      booking.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.service.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBookings = filteredBookings.slice(startIndex, endIndex);

  const resetPage = () => setCurrentPage(1);

  const handleMarkComplete = async (bookingId: string) => {
    try {
      setActionError(null);
      setUpdatingBookingId(bookingId);
      const updated = await updateGarageBookingStatus(bookingId, 'completed');
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingId ? { ...booking, status: updated.status ?? 'Completed' } : booking
        )
      );
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to update booking status');
    } finally {
      setUpdatingBookingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Bookings</h1>
          <p className="mt-2 text-sm text-slate-500 sm:text-base">Manage your appointments and bookings</p>
        </div>
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Bookings</h1>
        <p className="mt-2 text-sm text-slate-500 sm:text-base">Manage your appointments and bookings</p>
      </div>

      {/* Search and Filter */}
      <Card className="rounded-2xl border-[#d9e2ef] bg-white shadow-none sm:rounded-3xl">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search bookings..."
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
                All
              </Button>
              <Button
                variant={statusFilter === 'Pending' ? 'default' : 'outline'}
                className="gap-2"
                onClick={() => {
                  setStatusFilter('Pending');
                  resetPage();
                }}
              >
                Pending
              </Button>
              <Button
                variant={statusFilter === 'Confirmed' ? 'default' : 'outline'}
                className="gap-2"
                onClick={() => {
                  setStatusFilter('Confirmed');
                  resetPage();
                }}
              >
                Confirmed
              </Button>
              <Button
                variant={statusFilter === 'Completed' ? 'default' : 'outline'}
                className="gap-2"
                onClick={() => {
                  setStatusFilter('Completed');
                  resetPage();
                }}
              >
                Completed
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {currentBookings.map((booking) => (
          <Card key={booking.id} className="rounded-2xl border-[#d9e2ef] bg-white shadow-none sm:rounded-3xl">
            <CardHeader className="border-b border-[#e6ebf2] pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f3f8ff] text-[#2456f5] sm:h-14 sm:w-14">
                    <Car className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-slate-900 sm:text-lg">{booking.customer}</CardTitle>
                    <p className="text-xs text-slate-500 sm:text-sm">{booking.vehicle}</p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={
                    booking.status === 'Pending'
                      ? 'border-amber-200 bg-amber-50 text-amber-700 w-fit'
                      : booking.status === 'Confirmed'
                      ? 'border-blue-200 bg-blue-50 text-blue-700 w-fit'
                      : booking.status === 'Completed'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 w-fit'
                      : 'border-red-200 bg-red-50 text-red-700 w-fit'
                  }
                >
                  {booking.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-2 text-sm text-slate-500">
                <p className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium text-slate-900">Service:</span> {booking.service}
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium text-slate-900">Date:</span> {booking.date} at {booking.time}
                </p>
                <p className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium text-slate-900">Mode:</span> {booking.mode}
                </p>
              </div>
              <div className="mt-4 flex gap-2">
                {booking.status === 'Pending' && (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Accept
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-2 text-destructive hover:bg-destructive/10"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                  </>
                )}
                {booking.status === 'Confirmed' && (
                  <Button
                    type="button"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => handleMarkComplete(booking.id)}
                    disabled={updatingBookingId === booking.id}
                  >
                    <CheckCircle className="h-4 w-4" />
                    {updatingBookingId === booking.id ? 'Updating...' : 'Mark Complete'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {filteredBookings.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredBookings.length)} of {filteredBookings.length} bookings
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

      {filteredBookings.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500">No bookings found matching your search or filters.</p>
        </div>
      )}

      {actionError ? <p className="text-sm text-red-600">{actionError}</p> : null}
    </div>
  );
}
