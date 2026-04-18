'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Phone, Mail, MapPin, Clock, Upload, Save, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchGarageProfile, updateGarageProfile, type GarageProfile } from '@/lib/api';

export function ProfileClient() {
  const [formData, setFormData] = useState<GarageProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const data = await fetchGarageProfile();
        setFormData(data);
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSave = async () => {
    if (!formData) return;

    try {
      setToast(null);
      setSaving(true);
      await updateGarageProfile(formData);
      setToast({ type: 'success', message: 'Profile saved successfully.' });
    } catch (error) {
      console.error('Failed to save profile:', error);
      setToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to save profile. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Profile</h1>
          <p className="mt-2 text-sm text-slate-500 sm:text-base">Manage your garage profile and information</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="rounded-2xl border-[#d9e2ef] bg-white shadow-none sm:rounded-3xl">
            <CardHeader>
              <div className="h-6 w-32 bg-slate-200 animate-pulse rounded" />
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-32 w-32 bg-slate-200 animate-pulse rounded-full" />
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-[#d9e2ef] bg-white shadow-none sm:rounded-3xl lg:col-span-2">
            <CardHeader>
              <div className="h-6 w-32 bg-slate-200 animate-pulse rounded" />
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 w-full bg-slate-200 animate-pulse rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast ? (
        <Card
          className={
            toast.type === 'success'
              ? 'rounded-2xl border-emerald-200 bg-emerald-50 shadow-none sm:rounded-3xl'
              : 'rounded-2xl border-red-200 bg-red-50 shadow-none sm:rounded-3xl'
          }
        >
          <CardContent className="p-4 sm:p-5">
            <p
              className={
                toast.type === 'success'
                  ? 'text-sm font-medium text-emerald-800'
                  : 'text-sm font-medium text-red-800'
              }
            >
              {toast.message}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {formData?.isApproved === false && (
        <Card className="rounded-2xl border-amber-200 bg-amber-50 shadow-none sm:rounded-3xl">
          <CardContent className="flex items-start gap-4 p-4 sm:p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-amber-900 sm:text-lg">Account Pending Approval</h3>
              <p className="mt-1 text-sm text-amber-800">
                Your garage account is currently under review by our admin team. Once approved, you will have full access to all features including viewing orders, managing bookings, and submitting quotes. This typically takes 1-2 business days.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Profile</h1>
        <p className="mt-2 text-sm text-slate-500 sm:text-base">Manage your garage profile and information</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Picture Section */}
        <Card className="rounded-2xl border-[#d9e2ef] bg-white shadow-none sm:rounded-3xl lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Garage Logo</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-[#f3f8ff] text-[#2456f5]">
                <Building2 className="h-16 w-16" />
              </div>
              <Button type="button" variant="outline" className="gap-2">
                <Upload className="h-4 w-4" />
                Upload Logo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Profile Information */}
        <Card className="rounded-2xl border-[#d9e2ef] bg-white shadow-none sm:rounded-3xl lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Garage Information</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="garageName">Garage Name</Label>
                  <Input
                    id="garageName"
                    value={formData?.garageName || ''}
                    onChange={(e) => setFormData({ ...formData, garageName: e.target.value } as GarageProfile)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData?.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value } as GarageProfile)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData?.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value } as GarageProfile)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData?.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value } as GarageProfile)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessHours">Business Hours</Label>
                <Input
                  id="businessHours"
                  value={formData?.businessHours || ''}
                  onChange={(e) => setFormData({ ...formData, businessHours: e.target.value } as GarageProfile)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={formData?.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value } as GarageProfile)}
                  rows={3}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="lg:col-span-3">
          <Button type="button" className="gap-2 bg-[#2456f5] hover:bg-[#1a4bb8]" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
