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
import { Search, User, Building2, Package, Ban, CheckCircle, ChevronLeft, ChevronRight, Mail, Phone, MapPin, Calendar, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchAdminUsers, updateUserStatus, type AdminUser, type DynamicPageContent } from '@/lib/api';

export function UsersClient({ content }: { content: DynamicPageContent }) {
  const t = (key: string, fallback: string) => content[key] ?? fallback;
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'Customer' | 'Garage' | 'Vendor'>('all');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ user: AdminUser; action: 'suspend' | 'activate' } | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    async function loadUsers() {
      try {
        setLoading(true);
        const data = await fetchAdminUsers();
        setUsers(data);
      } catch (error) {
        console.error('Failed to load users:', error);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  function normalizeRole(role: string) {
    const value = role.trim().toLowerCase();
    if (value === 'customer' || value === 'user') return 'customer';
    if (value === 'garage') return 'garage';
    if (value === 'vendor') return 'vendor';
    if (value === 'admin') return 'admin';
    return value;
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch = searchQuery === '' || 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.location.toLowerCase().includes(searchQuery.toLowerCase());
    const normalizedRole = normalizeRole(user.role);
    const matchesRole =
      roleFilter === 'all' ||
      (roleFilter === 'Customer' && normalizedRole === 'customer') ||
      (roleFilter === 'Garage' && normalizedRole === 'garage') ||
      (roleFilter === 'Vendor' && normalizedRole === 'vendor');
    return matchesSearch && matchesRole;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  const resetPage = () => setCurrentPage(1);

  const handleViewDetails = (user: AdminUser) => {
    setSelectedUser(user);
    setIsDetailOpen(true);
  };

  const handleToggleStatus = async (user: AdminUser) => {
    const action = user.status === 'Active' ? 'suspend' : 'activate';
    setConfirmAction({ user, action });
  };

  const confirmToggleStatus = async () => {
    if (!confirmAction) return;
    
    try {
      const newStatus = confirmAction.action === 'suspend' ? 'Suspended' : 'Active';
      await updateUserStatus(confirmAction.user.id, newStatus);
      // Refresh users list
      const data = await fetchAdminUsers();
      setUsers(data);
      setConfirmAction(null);
    } catch (error) {
      console.error('Failed to update user status:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[23px] font-semibold text-slate-900 sm:text-[24px]">{t('title', 'Users')}</h1>
        <p className="mt-2 text-sm text-slate-500 sm:text-base">{t('description', 'Manage all platform users')}</p>
      </div>

      {/* Search and Filter */}
      <Card className="rounded-xl border-[#d9e2ef] bg-white shadow-[0_6px_16px_rgba\(94,126,179,0.10\)] ">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input 
                placeholder={t('searchPlaceholder', 'Search users...')}
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
                variant={roleFilter === 'all' ? 'default' : 'outline'} 
                className="gap-2"
                onClick={() => {
                  setRoleFilter('all');
                  resetPage();
                }}
              >
                <User className="h-4 w-4" />
                {t('filterAll', 'All')}
              </Button>
              <Button 
                variant={roleFilter === 'Customer' ? 'default' : 'outline'} 
                className="gap-2"
                onClick={() => {
                  setRoleFilter('Customer');
                  resetPage();
                }}
              >
                <User className="h-4 w-4" />
                {t('filterCustomers', 'Customers')}
              </Button>
              <Button 
                variant={roleFilter === 'Garage' ? 'default' : 'outline'} 
                className="gap-2"
                onClick={() => {
                  setRoleFilter('Garage');
                  resetPage();
                }}
              >
                <Building2 className="h-4 w-4" />
                {t('filterGarages', 'Garages')}
              </Button>
              {/* <Button variant="outline" className="gap-2">
                <Package className="h-4 w-4" />
                Vendors
              </Button> */}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Cards Grid */}
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {currentUsers.map((user) => (
          <Card key={user.id} className="rounded-xl border-[#d9e2ef] bg-white shadow-[0_6px_16px_rgba\(94,126,179,0.10\)] ">
            <CardHeader className="border-b border-[#e6ebf2] pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f3f8ff] text-[#2456f5] sm:h-14 sm:w-14">
                    {normalizeRole(user.role) === 'customer' && <User className="h-6 w-6 sm:h-7 sm:w-7" />}
                    {normalizeRole(user.role) === 'garage' && <Building2 className="h-6 w-6 sm:h-7 sm:w-7" />}
                    {normalizeRole(user.role) === 'vendor' && <Package className="h-6 w-6 sm:h-7 sm:w-7" />}
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-slate-900 sm:text-lg">{user.name}</CardTitle>
                    <p className="text-xs text-slate-500 sm:text-sm">{user.role}</p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={
                    user.status === 'Active'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 w-fit'
                      : user.status === 'Suspended'
                      ? 'border-red-200 bg-red-50 text-red-700 w-fit'
                      : 'border-amber-200 bg-amber-50 text-amber-700 w-fit'
                  }
                >
                  {user.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-2 text-sm text-slate-500">
                <p>{user.email}</p>
                <p>{user.phone}</p>
                <p>{user.location}</p>
                <p>{t('joinedPrefix', 'Joined:')} {user.joined}</p>
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-2 text-xs sm:h-9 sm:text-sm"
                  onClick={() => handleViewDetails(user)}
                >
                  {t('viewDetailsLabel', 'View Details')}
                </Button>
                {user.status === 'Active' ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-2 text-destructive hover:bg-destructive/10 sm:h-9 sm:text-sm"
                    onClick={() => handleToggleStatus(user)}
                  >
                    <Ban className="h-3 w-3 sm:h-4 sm:w-4" />
                    {t('suspendLabel', 'Suspend')}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-2 text-emerald-600 hover:bg-emerald-50 sm:h-9 sm:text-sm"
                    onClick={() => handleToggleStatus(user)}
                  >
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                    {t('activateLabel', 'Activate')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {filteredUsers.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
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

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500">{t('emptyState', 'No users found matching your search or filters.')}</p>
        </div>
      )}

      {/* User Details Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-xl border-[#d9e2ef] bg-white shadow-[0_16px_40px_rgba(33,61,105,0.18)]">
          <DialogHeader>
            <DialogTitle className="text-2xl">{t('userDetailsTitle', 'User Details')}</DialogTitle>
            <DialogDescription>{t('userDetailsDescription', 'View complete user information')}</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6 mt-4">
              {/* Profile Information */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <User className="h-5 w-5 text-[#2456f5]" />
                  Profile Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Name</p>
                    <p className="font-medium text-slate-900">{selectedUser.name}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Role</p>
                    <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                      {selectedUser.role}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-slate-500">Email</p>
                    <p className="font-medium text-slate-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Phone</p>
                    <p className="font-medium text-slate-900">{selectedUser.phone}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-500">Location</p>
                    <p className="font-medium text-slate-900">{selectedUser.location}</p>
                  </div>
                </div>
              </div>

              {/* Account Status */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[#2456f5]" />
                  Account Status
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Status</p>
                    <Badge
                      variant="outline"
                      className={
                        selectedUser.status === 'Active'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : selectedUser.status === 'Suspended'
                          ? 'border-red-200 bg-red-50 text-red-700'
                          : 'border-amber-200 bg-amber-50 text-amber-700'
                      }
                    >
                      {selectedUser.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-slate-500">Joined Date</p>
                    <p className="font-medium text-slate-900">{selectedUser.joined}</p>
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
                  {t('closeLabel', 'Close')}
                </Button>
                {selectedUser.status === 'Active' ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      handleToggleStatus(selectedUser);
                      setIsDetailOpen(false);
                    }}
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    {t('suspendUserLabel', 'Suspend User')}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => {
                      handleToggleStatus(selectedUser);
                      setIsDetailOpen(false);
                    }}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {t('activateUserLabel', 'Activate User')}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {confirmAction?.action === 'suspend' ? t('suspendUserLabel', 'Suspend User') : t('activateUserLabel', 'Activate User')}
            </DialogTitle>
            {confirmAction && (
              <DialogDescription>
                {confirmAction.action === 'suspend'
                  ? `Are you sure you want to suspend ${confirmAction.user.name}? This will restrict their access to the platform.`
                  : `Are you sure you want to activate ${confirmAction.user.name}? This will restore their access to the platform.`}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="flex gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setConfirmAction(null)}
            >
              {t('cancelLabel', 'Cancel')}
            </Button>
            <Button
              type="button"
              variant={confirmAction?.action === 'suspend' ? 'destructive' : 'default'}
              className="flex-1"
              onClick={confirmToggleStatus}
            >
              {confirmAction?.action === 'suspend' ? t('suspendLabel', 'Suspend') : t('activateLabel', 'Activate')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

