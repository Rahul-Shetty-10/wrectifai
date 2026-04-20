'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Plus, Wrench, DollarSign, Edit, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchGarageServices, createGarageService, updateGarageService, deleteGarageService, type GarageService, type DynamicPageContent } from '@/lib/api';

export function ServicesClient({ content }: { content: DynamicPageContent }) {
  const t = (key: string, fallback: string) => content[key] ?? fallback;
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [services, setServices] = useState<GarageService[]>([]);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 10;

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedService, setSelectedService] = useState<GarageService | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [serviceName, setServiceName] = useState('');
  const [serviceCategory, setServiceCategory] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [serviceActive, setServiceActive] = useState(true);

  useEffect(() => {
    async function loadServices() {
      try {
        setLoading(true);
        const data = await fetchGarageServices();
        setServices(data);
      } catch (error) {
        console.error('Failed to load services:', error);
      } finally {
        setLoading(false);
      }
    }
    loadServices();
  }, []);

  const filteredServices = services.filter((service) => {
    return searchQuery === '' ||
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.category.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const totalPages = Math.ceil(filteredServices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentServices = filteredServices.slice(startIndex, endIndex);

  const resetPage = () => setCurrentPage(1);

  const handleAddService = () => {
    setServiceName('');
    setServiceCategory('');
    setServicePrice('');
    setServiceDescription('');
    setServiceActive(true);
    setShowAddModal(true);
  };

  const handleEditService = (service: GarageService) => {
    setSelectedService(service);
    setServiceName(service.name);
    setServiceCategory(service.category);
    setServicePrice(service.price.toString());
    setServiceDescription(service.description || '');
    setServiceActive(service.active);
    setShowEditModal(true);
  };

  const handleDeleteService = (service: GarageService) => {
    setSelectedService(service);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedService) return;

    try {
      setSubmitting(true);
      await deleteGarageService(selectedService.id);
      const data = await fetchGarageServices();
      setServices(data);
      setShowDeleteModal(false);
      setSelectedService(null);
    } catch (error) {
      console.error('Failed to delete service:', error);
      alert(t('deleteErrorLabel', 'Failed to delete service. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateService = async () => {
    if (!serviceName || !serviceCategory || !servicePrice) {
      alert(t('requiredFieldsLabel', 'Please fill in all required fields'));
      return;
    }

    try {
      setSubmitting(true);
      await createGarageService(serviceName, serviceCategory, parseFloat(servicePrice), serviceDescription);
      setShowAddModal(false);
      const data = await fetchGarageServices();
      setServices(data);
    } catch (error) {
      console.error('Failed to create service:', error);
      alert(t('createErrorLabel', 'Failed to create service. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateService = async () => {
    if (!selectedService || !serviceName || !serviceCategory || !servicePrice) {
      alert(t('requiredFieldsLabel', 'Please fill in all required fields'));
      return;
    }

    try {
      setSubmitting(true);
      await updateGarageService(selectedService.id, serviceName, serviceCategory, parseFloat(servicePrice), serviceDescription, serviceActive);
      setShowEditModal(false);
      const data = await fetchGarageServices();
      setServices(data);
    } catch (error) {
      console.error('Failed to update service:', error);
      alert(t('updateErrorLabel', 'Failed to update service. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">{t('title', 'Services')}</h1>
            <p className="mt-2 text-sm text-slate-500 sm:text-base">{t('description', 'Manage services offered by your garage')}</p>
          </div>
          <Button className="gap-2 bg-[#2456f5] hover:bg-[#1a4bb8]" onClick={handleAddService}>
            <Plus className="h-4 w-4" />
            {t('addServiceLabel', 'Add Service')}
          </Button>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">{t('title', 'Services')}</h1>
          <p className="mt-2 text-sm text-slate-500 sm:text-base">{t('description', 'Manage services offered by your garage')}</p>
        </div>
        <Button className="gap-2 bg-[#2456f5] hover:bg-[#1a4bb8]" onClick={handleAddService}>
          <Plus className="h-4 w-4" />
          {t('addServiceLabel', 'Add Service')}
        </Button>
      </div>

      {/* Search */}
      <Card className="rounded-2xl border-[#d9e2ef] bg-white shadow-none sm:rounded-3xl">
        <CardContent className="p-4 sm:p-6">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder={t('searchPlaceholder', 'Search services...')}
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

      {/* Services Grid */}
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {currentServices.map((service) => (
          <Card key={service.id} className="rounded-2xl border-[#d9e2ef] bg-white shadow-none sm:rounded-3xl">
            <CardHeader className="border-b border-[#e6ebf2] pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f3f8ff] text-[#2456f5] sm:h-14 sm:w-14">
                    <Wrench className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-slate-900 sm:text-lg">{service.name}</CardTitle>
                    <p className="text-xs text-slate-500 sm:text-sm">{service.category}</p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={service.active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}
                >
                  {service.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-3 text-sm text-slate-500">
                <p className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-medium text-slate-900">{t('priceLabel', 'Price:')}</span> ${service.price.toFixed(2)}
                </p>
                <p>{service.description}</p>
              </div>
              <div className="mt-4 flex gap-2">
                <Button type="button" variant="outline" size="sm" className="flex-1 gap-2" onClick={() => handleEditService(service)}>
                  <Edit className="h-4 w-4" />
                  {t('editLabel', 'Edit')}
                </Button>
                <Button type="button" variant="outline" size="sm" className="flex-1 gap-2 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteService(service)}>
                  <Trash2 className="h-4 w-4" />
                  {t('deleteLabel', 'Delete')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {filteredServices.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredServices.length)} of {filteredServices.length} services
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

      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500">{t('emptyState', 'No services found matching your search.')}</p>
        </div>
      )}

      {/* Add Service Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md rounded-2xl border-[#d9e2ef] bg-white shadow-none sm:rounded-3xl">
            <CardHeader className="border-b border-[#e6ebf2] pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-slate-900">Add New Service</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setShowAddModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="serviceName">Service Name *</Label>
                <Input
                  id="serviceName"
                  placeholder="e.g., Oil Change"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceCategory">Category *</Label>
                <Input
                  id="serviceCategory"
                  placeholder="e.g., Maintenance"
                  value={serviceCategory}
                  onChange={(e) => setServiceCategory(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="servicePrice">Price ($) *</Label>
                <Input
                  id="servicePrice"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={servicePrice}
                  onChange={(e) => setServicePrice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceDescription">Description</Label>
                <Input
                  id="serviceDescription"
                  placeholder="Brief description of the service"
                  value={serviceDescription}
                  onChange={(e) => setServiceDescription(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="flex-1 gap-2 bg-[#2456f5] hover:bg-[#1a4bb8]"
                  disabled={submitting || !serviceName || !serviceCategory || !servicePrice}
                  onClick={handleCreateService}
                >
                  {submitting ? 'Adding...' : 'Add Service'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Service Modal */}
      {showEditModal && selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md rounded-2xl border-[#d9e2ef] bg-white shadow-none sm:rounded-3xl">
            <CardHeader className="border-b border-[#e6ebf2] pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-slate-900">Edit Service</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setShowEditModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editServiceName">Service Name *</Label>
                <Input
                  id="editServiceName"
                  placeholder="e.g., Oil Change"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editServiceCategory">Category *</Label>
                <Input
                  id="editServiceCategory"
                  placeholder="e.g., Maintenance"
                  value={serviceCategory}
                  onChange={(e) => setServiceCategory(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editServicePrice">Price ($) *</Label>
                <Input
                  id="editServicePrice"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={servicePrice}
                  onChange={(e) => setServicePrice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editServiceDescription">Description</Label>
                <Input
                  id="editServiceDescription"
                  placeholder="Brief description of the service"
                  value={serviceDescription}
                  onChange={(e) => setServiceDescription(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editServiceActive"
                  checked={serviceActive}
                  onChange={(e) => setServiceActive(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="editServiceActive" className="cursor-pointer">Active</Label>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="flex-1 gap-2 bg-[#2456f5] hover:bg-[#1a4bb8]"
                  disabled={submitting || !serviceName || !serviceCategory || !servicePrice}
                  onClick={handleUpdateService}
                >
                  {submitting ? 'Updating...' : 'Update Service'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteModal} onOpenChange={(open) => !open && setShowDeleteModal(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Service</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-slate-900">
              {selectedService?.name}
            </span>
            ? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={submitting}
              onClick={handleConfirmDelete}
            >
              {submitting ? 'Deleting...' : 'Delete Service'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
