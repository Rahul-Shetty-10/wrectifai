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
import { Search, CreditCard, Calendar, DollarSign, MoreVertical, Receipt, ChevronLeft, ChevronRight, User, MapPin, Clock, Building2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchAdminPayments, type AdminPayment } from '@/lib/api';

export function PaymentsClient() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Completed' | 'Pending' | 'Failed'>('all');
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<AdminPayment | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    async function loadPayments() {
      try {
        setLoading(true);
        const data = await fetchAdminPayments();
        setPayments(data);
      } catch (error) {
        console.error('Failed to load payments:', error);
      } finally {
        setLoading(false);
      }
    }
    loadPayments();
  }, []);

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = searchQuery === '' || 
      payment.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.bookingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.garage.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.method.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPayments = filteredPayments.slice(startIndex, endIndex);

  const resetPage = () => setCurrentPage(1);

  const handleViewDetails = (payment: AdminPayment) => {
    setSelectedPayment(payment);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Payments</h1>
        <p className="mt-2 text-sm text-slate-500 sm:text-base">Manage all platform transactions</p>
      </div>

      {/* Search and Filter */}
      <Card className="rounded-2xl border-[#d9e2ef] bg-white shadow-none sm:rounded-3xl">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input 
                placeholder="Search transactions..." 
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
                variant={statusFilter === 'Failed' ? 'default' : 'outline'} 
                className="gap-2"
                onClick={() => {
                  setStatusFilter('Failed');
                  resetPage();
                }}
              >
                Failed
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Cards Grid */}
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {currentPayments.map((payment) => (
          <Card key={payment.id} className="rounded-2xl border-[#d9e2ef] bg-white shadow-none sm:rounded-3xl">
            <CardHeader className="border-b border-[#e6ebf2] pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f3f8ff] text-[#2456f5] sm:h-14 sm:w-14">
                    <CreditCard className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-slate-900 sm:text-lg">{payment.customer}</CardTitle>
                    <p className="text-xs text-slate-500 sm:text-sm">{payment.bookingId}</p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={
                    payment.status === 'Completed'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 w-fit'
                      : payment.status === 'Pending'
                      ? 'border-amber-200 bg-amber-50 text-amber-700 w-fit'
                      : 'border-red-200 bg-red-50 text-red-700 w-fit'
                  }
                >
                  {payment.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-2 text-sm text-slate-500">
                <p>{payment.garage}</p>
                <p className="flex items-center gap-2">
                  <DollarSign className="h-3 w-3" />
                  <span className="font-semibold text-slate-900">{payment.amount}</span>
                  <span className="text-slate-400">| Commission: {payment.commission}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  {payment.date} | {payment.method}
                </p>
              </div>
              <div className="mt-4 flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-2 text-xs sm:h-9 sm:text-sm"
                  onClick={() => handleViewDetails(payment)}
                >
                  <Receipt className="h-3 w-3 sm:h-4 sm:w-4" />
                  View Receipt
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
      {filteredPayments.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredPayments.length)} of {filteredPayments.length} transactions
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

      {filteredPayments.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500">No transactions found matching your search or filters.</p>
        </div>
      )}

      {/* Payment Details Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Payment Details</DialogTitle>
            <DialogDescription>View complete transaction information</DialogDescription>
          </DialogHeader>
          {selectedPayment && (
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
                    <p className="font-medium text-slate-900">{selectedPayment.customer}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Email</p>
                    <p className="font-medium text-slate-900">customer@example.com</p>
                  </div>
                </div>
              </div>

              {/* Booking Information */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-[#2456f5]" />
                  Booking Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Booking ID</p>
                    <p className="font-medium text-slate-900">{selectedPayment.bookingId}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Receipt Number</p>
                    <p className="font-medium text-slate-900">{selectedPayment.receiptNumber}</p>
                  </div>
                </div>
              </div>

              {/* Garage Information */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[#2456f5]" />
                  Garage Information
                </h3>
                <div className="text-sm">
                  <p className="text-slate-500">Garage Name</p>
                  <p className="font-medium text-slate-900">{selectedPayment.garage}</p>
                </div>
              </div>

              {/* Payment Details */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-[#2456f5]" />
                  Payment Details
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Amount</p>
                    <p className="font-medium text-slate-900">{selectedPayment.amount}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Commission</p>
                    <p className="font-medium text-slate-900">{selectedPayment.commission}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Payment Method</p>
                    <p className="font-medium text-slate-900">{selectedPayment.method}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Status</p>
                    <Badge
                      variant="outline"
                      className={
                        selectedPayment.status === 'Completed'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : selectedPayment.status === 'Pending'
                          ? 'border-amber-200 bg-amber-50 text-amber-700'
                          : 'border-red-200 bg-red-50 text-red-700'
                      }
                    >
                      {selectedPayment.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#2456f5]" />
                  Timeline
                </h3>
                <div className="text-sm">
                  <p className="text-slate-500">Transaction Date</p>
                  <p className="font-medium text-slate-900">{selectedPayment.date}</p>
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
                {selectedPayment.status === 'Pending' && (
                  <Button type="button" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                    Process Payment
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
