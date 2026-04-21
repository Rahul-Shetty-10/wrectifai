'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, Calendar, Plus, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchGarageAvailability, type GarageAvailability, type DynamicPageContent } from '@/lib/api';

export function AvailabilityClient({ content }: { content: DynamicPageContent }) {
  const t = (key: string, fallback: string) => content[key] ?? fallback;
  const [currentPage, setCurrentPage] = useState(1);
  const [availability, setAvailability] = useState<GarageAvailability | null>(null);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 10;

  useEffect(() => {
    async function loadAvailability() {
      try {
        setLoading(true);
        const data = await fetchGarageAvailability();
        setAvailability(data);
      } catch (error) {
        console.error('Failed to load availability:', error);
      } finally {
        setLoading(false);
      }
    }
    loadAvailability();
  }, []);

  const availabilitySlots = availability?.businessHours || [];
  const totalPages = Math.ceil(availabilitySlots.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSlots = availabilitySlots.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[23px] font-semibold text-slate-900 sm:text-[24px]">{t('title', 'Availability')}</h1>
            <p className="mt-2 text-sm text-slate-500 sm:text-base">{t('description', 'Manage your business hours and availability slots')}</p>
          </div>
          <Button className="gap-2 bg-[#2456f5] hover:bg-[#1a4bb8]">
            <Plus className="h-4 w-4" />
            {t('addSlotLabel', 'Add Slot')}
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="rounded-xl border-[#d9e2ef] bg-white shadow-[0_6px_16px_rgba\(94,126,179,0.10\)] ">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-slate-200 animate-pulse rounded" />
                  <div className="h-4 w-32 bg-slate-200 animate-pulse rounded" />
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
          <h1 className="text-[23px] font-semibold text-slate-900 sm:text-[24px]">{t('title', 'Availability')}</h1>
          <p className="mt-2 text-sm text-slate-500 sm:text-base">{t('description', 'Manage your business hours and availability slots')}</p>
        </div>
        <Button className="gap-2 bg-[#2456f5] hover:bg-[#1a4bb8]">
          <Plus className="h-4 w-4" />
          {t('addSlotLabel', 'Add Slot')}
        </Button>
      </div>

      {/* Business Hours Summary */}
      <Card className="rounded-xl border-[#d9e2ef] bg-white shadow-[0_6px_16px_rgba\(94,126,179,0.10\)] ">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">{t('businessHoursTitle', 'Current Business Hours')}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {availabilitySlots.map((slot) => (
              <div key={slot.id} className="flex items-center justify-between rounded-lg border border-[#e6ebf2] bg-[#f8fafc] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f3f8ff] text-[#2456f5]">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{slot.day}</p>
                    <p className="text-sm text-slate-500">{slot.startTime} - {slot.endTime}</p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={slot.active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}
                >
                  {slot.active ? t('activeLabel', 'Active') : t('closedLabel', 'Closed')}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Blocked Dates */}
      <Card className="rounded-xl border-[#d9e2ef] bg-white shadow-[0_6px_16px_rgba\(94,126,179,0.10\)] ">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">{t('blockedDatesTitle', 'Blocked Dates')}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-[#e6ebf2] bg-[#f8fafc] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">December 25, 2024</p>
                  <p className="text-sm text-slate-500">Christmas Holiday</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" className="gap-2">
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
                <Button type="button" variant="outline" size="sm" className="gap-2 text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                  Remove
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[#e6ebf2] bg-[#f8fafc] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">January 1, 2025</p>
                  <p className="text-sm text-slate-500">New Year's Day</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" className="gap-2">
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
                <Button type="button" variant="outline" size="sm" className="gap-2 text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                  Remove
                </Button>
              </div>
            </div>
            <Button type="button" variant="outline" className="w-full gap-2">
              <Plus className="h-4 w-4" />
              {t('blockDateLabel', 'Block Date')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pickup/Drop-off Availability */}
      <Card className="rounded-xl border-[#d9e2ef] bg-white shadow-[0_6px_16px_rgba\(94,126,179,0.10\)] ">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">{t('pickupDropoffTitle', 'Pickup & Drop-off Service')}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">{t('homePickupLabel', 'Home Pickup')}</p>
                <p className="text-sm text-slate-500">Offer pickup service for customers</p>
              </div>
              <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">{t('enabledLabel', 'Enabled')}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">{t('dropoffLabel', 'Drop-off Service')}</p>
                <p className="text-sm text-slate-500">Offer drop-off service for customers</p>
              </div>
              <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">{t('enabledLabel', 'Enabled')}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

