'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, Calendar, Car, MapPin, Clock, MoreVertical, ChevronLeft, ChevronRight, X, Phone, Mail, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchAdminBookings, type AdminBooking } from '@/lib/api';

export function BookingsClient() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled'>('all');
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    async function loadBookings() {
      try {
        setLoading(true);
        const data = await fetchAdminBookings();
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
      booking.garage.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBookings = filteredBookings.slice(startIndex, endIndex);

  const resetPage = () => setCurrentPage(1);

  const handleViewDetails = (booking: AdminBooking) => {
    setSelectedBooking(booking);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Bookings</h1>
        <p className="mt-2 text-sm text-slate-500 sm:text-base">Manage all platform bookings</p>
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
                variant={statusFilter === 'Completed' ? 'default' : 'outline'} 
                className="gap-2"
                onClick={() => {
                  setStatusFilter('Completed');
                  resetPage();
                }}
              >
                Completed
              </Button>
              <Button 
                variant={statusFilter === 'Cancelled' ? 'default' : 'outline'} 
                className="gap-2"
                onClick={() => {
                  setStatusFilter('Cancelled');
                  resetPage();
                }}
              >
                Cancelled
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking Cards Grid */}
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                    booking.status === 'Confirmed'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 w-fit'
                      : booking.status === 'Pending'
                      ? 'border-amber-200 bg-amber-50 text-amber-700 w-fit'
                      : booking.status === 'Completed'
                      ? 'border-blue-200 bg-blue-50 text-blue-700 w-fit'
                      : 'border-red-200 bg-red-50 text-red-700 w-fit'
                  }
                >
                  {booking.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-2 text-sm text-slate-500">
                <p>{booking.service} at {booking.garage}</p>
                <p className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {booking.date} at {booking.time}
                </p>
                <p className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {booking.location}
                </p>
                <p className="font-semibold text-slate-900">{booking.amount}</p>
              </div>
              <div className="mt-4 flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-2 text-xs sm:h-9 sm:text-sm"
                  onClick={() => handleViewDetails(booking)}
                >
                  View Details
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                  <MoreVertical className="h-4 w-4" />
                </Button>
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

      {/* Booking Details Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Booking Details</DialogTitle>
            <DialogDescription>View complete booking information</DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-6 mt-4">
              {/* Customer Information */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <User className="h-5 w-5 text-[#2456f5]" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Name</p>
                    <p className="font-medium text-slate-900">{selectedBooking.customer}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Email</p>
                    <p className="font-medium text-slate-900">customer@example.com</p>
                  </div>
                </div>
              </div>

              {/* Vehicle Information */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Car className="h-5 w-5 text-[#2456f5]" />
                  Vehicle Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Vehicle</p>
                    <p className="font-medium text-slate-900">{selectedBooking.vehicle}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Service Required</p>
                    <p className="font-medium text-slate-900">{selectedBooking.service}</p>
                  </div>
                </div>
              </div>

              {/* Garage Information */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-[#2456f5]" />
                  Garage Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Garage Name</p>
                    <p className="font-medium text-slate-900">{selectedBooking.garage}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Location</p>
                    <p className="font-medium text-slate-900">{selectedBooking.location}</p>
                  </div>
                </div>
              </div>

              {/* Appointment Details */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#2456f5]" />
                  Appointment Details
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Date</p>
                    <p className="font-medium text-slate-900">{selectedBooking.date}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Time</p>
                    <p className="font-medium text-slate-900">{selectedBooking.time}</p>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-[#2456f5]" />
                  Payment Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Amount</p>
                    <p className="font-medium text-slate-900">{selectedBooking.amount}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Status</p>
                    <Badge
                      variant="outline"
                      className={
                        selectedBooking.status === 'Confirmed'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : selectedBooking.status === 'Pending'
                          ? 'border-amber-200 bg-amber-50 text-amber-700'
                          : selectedBooking.status === 'Completed'
                          ? 'border-blue-200 bg-blue-50 text-blue-700'
                          : 'border-red-200 bg-red-50 text-red-700'
                      }
                    >
                      {selectedBooking.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsDetailOpen(false)}
                >
                  Close
                </Button>
                {selectedBooking.status === 'Pending' && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 text-destructive hover:bg-destructive/10"
                    >
                      Cancel Booking
                    </Button>
                    <Button type="button" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                      Confirm Booking
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
