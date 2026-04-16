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
import { Search, AlertTriangle, Calendar, Building2, CheckCircle, Clock, MoreVertical, MessageCircle, ChevronLeft, ChevronRight, User, FileText, Phone, Mail } from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchAdminComplaints, type AdminComplaint } from '@/lib/api';

export function ComplaintsClient() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Resolved' | 'In Progress' | 'Pending'>('all');
  const [complaints, setComplaints] = useState<AdminComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<AdminComplaint | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    async function loadComplaints() {
      try {
        setLoading(true);
        const data = await fetchAdminComplaints();
        setComplaints(data);
      } catch (error) {
        console.error('Failed to load complaints:', error);
      } finally {
        setLoading(false);
      }
    }
    loadComplaints();
  }, []);

  const filteredComplaints = complaints.filter((complaint) => {
    const matchesSearch = searchQuery === '' || 
      complaint.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.garage.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.bookingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || complaint.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredComplaints.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentComplaints = filteredComplaints.slice(startIndex, endIndex);

  const resetPage = () => setCurrentPage(1);

  const handleViewDetails = (complaint: AdminComplaint) => {
    setSelectedComplaint(complaint);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Complaints</h1>
        <p className="mt-2 text-sm text-slate-500 sm:text-base">Manage user complaints and reports</p>
      </div>

      {/* Search and Filter */}
      <Card className="rounded-2xl border-[#d9e2ef] bg-white shadow-none sm:rounded-3xl">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input 
                placeholder="Search complaints..." 
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
                variant={statusFilter === 'Resolved' ? 'default' : 'outline'} 
                className="gap-2"
                onClick={() => {
                  setStatusFilter('Resolved');
                  resetPage();
                }}
              >
                Resolved
              </Button>
              <Button 
                variant={statusFilter === 'In Progress' ? 'default' : 'outline'} 
                className="gap-2"
                onClick={() => {
                  setStatusFilter('In Progress');
                  resetPage();
                }}
              >
                In Progress
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Complaint Cards Grid */}
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {currentComplaints.map((complaint) => (
          <Card key={complaint.id} className="rounded-2xl border-[#d9e2ef] bg-white shadow-none sm:rounded-3xl">
            <CardHeader className="border-b border-[#e6ebf2] pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600 sm:h-14 sm:w-14">
                    <AlertTriangle className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-slate-900 sm:text-lg">{complaint.customer}</CardTitle>
                    <p className="text-xs text-slate-500 sm:text-sm">{complaint.garage}</p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={
                    complaint.status === 'Resolved'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 w-fit'
                      : complaint.status === 'In Progress'
                      ? 'border-blue-200 bg-blue-50 text-blue-700 w-fit'
                      : 'border-amber-200 bg-amber-50 text-amber-700 w-fit'
                  }
                >
                  {complaint.status === 'Resolved' && <CheckCircle className="mr-1 h-3 w-3" />}
                  {complaint.status === 'In Progress' && <Clock className="mr-1 h-3 w-3" />}
                  {complaint.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-2 text-sm text-slate-500">
                <p className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {complaint.bookingId}
                </p>
                <p className="italic">{complaint.description}</p>
                <p className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Submitted: {complaint.submitted}
                </p>
                <div className="pt-2">
                  <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700 w-fit">
                    {complaint.type}
                  </Badge>
                </div>
              </div>
              <div className="mt-4 flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-2 text-xs sm:h-9 sm:text-sm"
                  onClick={() => handleViewDetails(complaint)}
                >
                  <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                  Respond
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
      {filteredComplaints.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredComplaints.length)} of {filteredComplaints.length} complaints
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

      {filteredComplaints.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500">No complaints found matching your search or filters.</p>
        </div>
      )}

      {/* Complaint Details Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Complaint Details</DialogTitle>
            <DialogDescription>View complete complaint information</DialogDescription>
          </DialogHeader>
          {selectedComplaint && (
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
                    <p className="font-medium text-slate-900">{selectedComplaint.customer}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Email</p>
                    <p className="font-medium text-slate-900">customer@example.com</p>
                  </div>
                </div>
              </div>

              {/* Complaint Details */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-[#2456f5]" />
                  Complaint Details
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Type</p>
                    <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
                      {selectedComplaint.type}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-slate-500">Status</p>
                    <Badge
                      variant="outline"
                      className={
                        selectedComplaint.status === 'Resolved'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : selectedComplaint.status === 'In Progress'
                          ? 'border-blue-200 bg-blue-50 text-blue-700'
                          : 'border-amber-200 bg-amber-50 text-amber-700'
                      }
                    >
                      {selectedComplaint.status}
                    </Badge>
                  </div>
                </div>
                <div className="text-sm">
                  <p className="text-slate-500">Description</p>
                  <p className="font-medium text-slate-900">{selectedComplaint.description}</p>
                </div>
              </div>

              {/* Booking Information */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[#2456f5]" />
                  Related Booking
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Booking ID</p>
                    <p className="font-medium text-slate-900">{selectedComplaint.bookingId}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Garage</p>
                    <p className="font-medium text-slate-900">{selectedComplaint.garage}</p>
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
                  <p className="font-medium text-slate-900">{selectedComplaint.submitted}</p>
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
                {selectedComplaint.status === 'Pending' && (
                  <Button type="button" className="flex-1 bg-blue-600 hover:bg-blue-700">
                    Mark as In Progress
                  </Button>
                )}
                {selectedComplaint.status === 'In Progress' && (
                  <Button type="button" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                    Mark as Resolved
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
