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
import { Search, MessageSquare, DollarSign, TrendingDown, TrendingUp, MoreVertical, ChevronLeft, ChevronRight, User, Car, MapPin, Calendar, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchAdminQuotes, type AdminQuote } from '@/lib/api';

export function QuotesClient() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Accepted' | 'Pending' | 'Rejected'>('all');
  const [quotes, setQuotes] = useState<AdminQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<AdminQuote | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    async function loadQuotes() {
      try {
        setLoading(true);
        const data = await fetchAdminQuotes();
        setQuotes(data);
      } catch (error) {
        console.error('Failed to load quotes:', error);
      } finally {
        setLoading(false);
      }
    }
    loadQuotes();
  }, []);

  const filteredQuotes = quotes.filter((quote) => {
    const matchesSearch = searchQuery === '' || 
      quote.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.garage.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.service.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredQuotes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentQuotes = filteredQuotes.slice(startIndex, endIndex);

  const resetPage = () => setCurrentPage(1);

  const handleViewDetails = (quote: AdminQuote) => {
    setSelectedQuote(quote);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Quotes</h1>
        <p className="mt-2 text-sm text-slate-500 sm:text-base">Manage all service quotes</p>
      </div>

      {/* Search and Filter */}
      <Card className="rounded-2xl border-[#d9e2ef] bg-white shadow-none sm:rounded-3xl">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input 
                placeholder="Search quotes..." 
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
                variant={statusFilter === 'Accepted' ? 'default' : 'outline'} 
                className="gap-2"
                onClick={() => {
                  setStatusFilter('Accepted');
                  resetPage();
                }}
              >
                Accepted
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
                variant={statusFilter === 'Rejected' ? 'default' : 'outline'} 
                className="gap-2"
                onClick={() => {
                  setStatusFilter('Rejected');
                  resetPage();
                }}
              >
                Rejected
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quote Cards Grid */}
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {currentQuotes.map((quote) => (
          <Card key={quote.id} className="rounded-2xl border-[#d9e2ef] bg-white shadow-none sm:rounded-3xl">
            <CardHeader className="border-b border-[#e6ebf2] pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f3f8ff] text-[#2456f5] sm:h-14 sm:w-14">
                    <MessageSquare className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-slate-900 sm:text-lg">{quote.customer}</CardTitle>
                    <p className="text-xs text-slate-500 sm:text-sm">{quote.vehicle}</p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={
                    quote.status === 'Accepted'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 w-fit'
                      : quote.status === 'Pending'
                      ? 'border-amber-200 bg-amber-50 text-amber-700 w-fit'
                      : 'border-red-200 bg-red-50 text-red-700 w-fit'
                  }
                >
                  {quote.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-2 text-sm text-slate-500">
                <p>{quote.service} by {quote.garage}</p>
                <p className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{quote.amount}</span>
                  <span className="text-slate-400">vs Fair Price: {quote.fairPrice}</span>
                </p>
                <p>Submitted: {quote.submitted}</p>
                <div className="pt-2">
                  <Badge
                    variant="outline"
                    className={
                      quote.comparison === 'Fair'
                        ? 'border-blue-200 bg-blue-50 text-blue-700 w-fit'
                        : quote.comparison === 'Below Market'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 w-fit'
                        : 'border-amber-200 bg-amber-50 text-amber-700 w-fit'
                    }
                  >
                    {quote.comparison === 'Below Market' && <TrendingDown className="mr-1 h-3 w-3" />}
                    {quote.comparison === 'Above Market' && <TrendingUp className="mr-1 h-3 w-3" />}
                    {quote.comparison}
                  </Badge>
                </div>
              </div>
              <div className="mt-4 flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-2 text-xs sm:h-9 sm:text-sm"
                  onClick={() => handleViewDetails(quote)}
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
      {filteredQuotes.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredQuotes.length)} of {filteredQuotes.length} quotes
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

      {filteredQuotes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500">No quotes found matching your search or filters.</p>
        </div>
      )}

      {/* Quote Details Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Quote Details</DialogTitle>
            <DialogDescription>View complete quote information</DialogDescription>
          </DialogHeader>
          {selectedQuote && (
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
                    <p className="font-medium text-slate-900">{selectedQuote.customer}</p>
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
                    <p className="font-medium text-slate-900">{selectedQuote.vehicle}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Service Required</p>
                    <p className="font-medium text-slate-900">{selectedQuote.service}</p>
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
                    <p className="font-medium text-slate-900">{selectedQuote.garage}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Location</p>
                    <p className="font-medium text-slate-900">San Francisco, CA</p>
                  </div>
                </div>
              </div>

              {/* Quote Details */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-[#2456f5]" />
                  Quote Details
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Quoted Amount</p>
                    <p className="font-medium text-slate-900">{selectedQuote.amount}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Fair Price Range</p>
                    <p className="font-medium text-slate-900">{selectedQuote.fairPrice}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Price Comparison</p>
                    <Badge
                      variant="outline"
                      className={
                        selectedQuote.comparison === 'Fair'
                          ? 'border-blue-200 bg-blue-50 text-blue-700'
                          : selectedQuote.comparison === 'Below Market'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-amber-200 bg-amber-50 text-amber-700'
                      }
                    >
                      {selectedQuote.comparison}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-slate-500">Status</p>
                    <Badge
                      variant="outline"
                      className={
                        selectedQuote.status === 'Accepted'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : selectedQuote.status === 'Pending'
                          ? 'border-amber-200 bg-amber-50 text-amber-700'
                          : 'border-red-200 bg-red-50 text-red-700'
                      }
                    >
                      {selectedQuote.status}
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
                  <p className="text-slate-500">Submitted Date</p>
                  <p className="font-medium text-slate-900">{selectedQuote.submitted}</p>
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
                {selectedQuote.status === 'Pending' && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 text-destructive hover:bg-destructive/10"
                    >
                      Reject Quote
                    </Button>
                    <Button type="button" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                      Accept Quote
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
