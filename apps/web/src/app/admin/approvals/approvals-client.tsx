'use client';

import { useState, useEffect } from 'react';
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
import { Building2, CheckCircle, XCircle, Clock, FileText, ChevronLeft, ChevronRight, Search, Phone, Mail, MapPin, Calendar, User } from 'lucide-react';
import { fetchAdminApprovals, type AdminApproval } from '@/lib/api';

export function ApprovalsClient() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [garages, setGarages] = useState<AdminApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGarage, setSelectedGarage] = useState<AdminApproval | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const apiData = await fetchAdminApprovals();
        setGarages(apiData.garages);
      } catch (error) {
        console.error('Failed to load approvals:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredData = garages.filter((item) => {
    return searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.phone.includes(searchQuery);
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredData.slice(startIndex, endIndex);

  const resetPage = () => setCurrentPage(1);

  const handleViewDetails = (garage: AdminApproval) => {
    setSelectedGarage(garage);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Approvals</h1>
        <p className="mt-2 text-sm text-slate-500 sm:text-base">Review and approve garage registrations</p>
      </div>

      {/* Search */}
      <Card className="rounded-2xl border-[#d9e2ef] bg-white shadow-none sm:rounded-3xl">
        <CardContent className="p-4 sm:p-6">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input 
              placeholder="Search garages..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                resetPage();
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Cards Grid */}
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {currentItems.map((garage) => (
            <Card key={garage.id} className="rounded-2xl border-[#d9e2ef] bg-white shadow-none sm:rounded-3xl">
              <CardHeader className="border-b border-[#e6ebf2] pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f3f8ff] text-[#2456f5] sm:h-14 sm:w-14">
                      <Building2 className="h-6 w-6 sm:h-7 sm:w-7" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold text-slate-900 sm:text-lg">{garage.name}</CardTitle>
                      <p className="text-xs text-slate-500 sm:text-sm">{garage.location}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                    <Clock className="mr-1 h-3 w-3" />
                    Pending
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#97a9c1] mb-2 sm:text-sm">
                      Specializations
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(garage.specializations || []).map((spec, index) => (
                        <Badge key={index} variant="secondary" className="bg-[#f3f8ff] text-[#2456f5]">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#97a9c1] mb-2 sm:text-sm">
                      Submitted Documents
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {garage.documents.map((doc, index) => (
                        <Button
                          key={index}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 gap-2 text-xs sm:h-9 sm:text-sm"
                        >
                          <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                          {doc}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 gap-2 text-xs sm:h-9 sm:text-sm"
                      onClick={() => handleViewDetails(garage)}
                    >
                      View Details
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 gap-2 text-destructive hover:bg-destructive/10 sm:h-9 sm:text-sm"
                      >
                        <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                        Reject
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 gap-2 bg-emerald-600 hover:bg-emerald-700 sm:h-9 sm:text-sm"
                      >
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                        Approve
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Pagination */}
      {filteredData.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} garages
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

      {filteredData.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500">No garages found matching your search.</p>
        </div>
      )}

      {/* Garage Details Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Garage Registration Details</DialogTitle>
            <DialogDescription>Review complete garage information</DialogDescription>
          </DialogHeader>
          {selectedGarage && (
            <div className="space-y-6 mt-4">
              {/* Garage Information */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[#2456f5]" />
                  Garage Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Garage Name</p>
                    <p className="font-medium text-slate-900">{selectedGarage.name}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Location</p>
                    <p className="font-medium text-slate-900">{selectedGarage.location}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Phone</p>
                    <p className="font-medium text-slate-900">{selectedGarage.phone}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Email</p>
                    <p className="font-medium text-slate-900">garage@example.com</p>
                  </div>
                </div>
              </div>

              {/* Specializations */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#2456f5]" />
                  Specializations
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(selectedGarage.specializations || []).map((spec, index) => (
                    <Badge key={index} variant="secondary" className="bg-[#f3f8ff] text-[#2456f5]">
                      {spec}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Submitted Documents */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#2456f5]" />
                  Submitted Documents
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedGarage.documents.map((doc, index) => (
                    <Button
                      key={index}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 gap-2 text-xs sm:h-9 sm:text-sm"
                    >
                      <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                      {doc}
                    </Button>
                  ))}
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
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 text-destructive hover:bg-destructive/10"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject Registration
                </Button>
                <Button type="button" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve Registration
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
