'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Calendar, ClipboardList, DollarSign, Star, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchGarageDashboard, type GarageDashboardData, type DynamicPageContent } from '@/lib/api';

export function DashboardClient({ content }: { content: DynamicPageContent }) {
  const t = (key: string, fallback: string) => content[key] ?? fallback;
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<GarageDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isApproved, setIsApproved] = useState<boolean | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const data = await fetchGarageDashboard();
        setDashboardData(data);
        setIsApproved(data.isApproved ?? true);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[23px] font-semibold text-slate-900 sm:text-[24px]">{t('title', 'Dashboard')}</h1>
          <p className="mt-2 text-sm text-slate-500 sm:text-base">{t('description', 'Overview of your garage performance')}</p>
        </div>
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="rounded-xl border-[#d9e2ef] bg-white shadow-[0_6px_16px_rgba\(94,126,179,0.10\)] ">
              <CardHeader className="border-b border-[#e6ebf2] pb-4">
                <div className="h-6 w-32 bg-slate-200 animate-pulse rounded" />
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-8 w-20 bg-slate-200 animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isApproved === false && (
        <Card className="rounded-xl border-amber-200 bg-amber-50 shadow-[0_6px_16px_rgba\(94,126,179,0.10\)] ">
          <CardContent className="flex items-start gap-4 p-4 sm:p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <Clock className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-amber-900 sm:text-lg">{t('pendingApprovalTitle', 'Account Pending Approval')}</h3>
              <p className="mt-1 text-sm text-amber-800">
                {t('pendingApprovalDescription', 'Your garage account is under review and some actions are restricted until approval.')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h1 className="text-[23px] font-semibold text-slate-900 sm:text-[24px]">{t('title', 'Dashboard')}</h1>
        <p className="mt-2 text-sm text-slate-500 sm:text-base">{t('description', 'Overview of your garage performance')}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          onClick={() => isApproved && router.push('/garage/bookings')}
          className={`rounded-xl border-[#d9e2ef] bg-white shadow-[0_6px_16px_rgba(94,126,179,0.10)]  transition-colors ${
            isApproved ? 'cursor-pointer hover:border-[#2456f5]' : 'cursor-not-allowed opacity-60'
          }`}
        >
          <CardHeader className="border-b border-[#e6ebf2] pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-500">{t('totalBookingsLabel', 'Total Bookings')}</CardTitle>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3f8ff] text-[#2456f5]">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-1">
              <p className="text-3xl font-bold text-slate-900">{dashboardData?.totalBookings || 0}</p>
              <p className="text-sm text-emerald-600 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +12% from last month
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => isApproved && router.push('/garage/orders')}
          className={`rounded-xl border-[#d9e2ef] bg-white shadow-[0_6px_16px_rgba(94,126,179,0.10)]  transition-colors ${
            isApproved ? 'cursor-pointer hover:border-[#2456f5]' : 'cursor-not-allowed opacity-60'
          }`}
        >
          <CardHeader className="border-b border-[#e6ebf2] pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-500">{t('quotesSentLabel', 'Quotes Sent')}</CardTitle>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3f8ff] text-[#2456f5]">
                <ClipboardList className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-1">
              <p className="text-3xl font-bold text-slate-900">{dashboardData?.quotesSent || 0}</p>
              <p className="text-sm text-emerald-600 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +8% from last month
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-[#d9e2ef] bg-white shadow-[0_6px_16px_rgba\(94,126,179,0.10\)] ">
          <CardHeader className="border-b border-[#e6ebf2] pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-500">{t('revenueLabel', 'Revenue')}</CardTitle>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3f8ff] text-[#2456f5]">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-1">
              <p className="text-3xl font-bold text-slate-900">${dashboardData?.revenue?.toLocaleString() || 0}</p>
              <p className="text-sm text-emerald-600 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +15% from last month
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-[#d9e2ef] bg-white shadow-[0_6px_16px_rgba\(94,126,179,0.10\)] ">
          <CardHeader className="border-b border-[#e6ebf2] pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-500">{t('ratingLabel', 'Rating')}</CardTitle>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3f8ff] text-[#2456f5]">
                <Star className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-1">
              <p className="text-3xl font-bold text-slate-900">{dashboardData?.rating || 0}</p>
              <p className="text-sm text-slate-500">Based on {dashboardData?.reviewCount || 0} {t('reviewsSuffix', 'reviews')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="rounded-xl border-[#d9e2ef] bg-white shadow-[0_6px_16px_rgba\(94,126,179,0.10\)] ">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">{t('quickActionsTitle', 'Quick Actions')}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <button
              onClick={() => isApproved && router.push('/garage/orders')}
              disabled={!isApproved}
              className={`flex flex-col items-center gap-2 rounded-xl border border-[#d9e2ef] bg-[#f8fafc] p-4 text-left transition-colors ${
                isApproved ? 'hover:bg-[#f3f8ff] cursor-pointer' : 'cursor-not-allowed opacity-60'
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eaf3ff] text-[#2456f5]">
                <ClipboardList className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{t('viewOrdersLabel', 'View Orders')}</p>
                <p className="text-xs text-slate-500">3 new requests</p>
              </div>
            </button>
            <button
              onClick={() => isApproved && router.push('/garage/bookings')}
              disabled={!isApproved}
              className={`flex flex-col items-center gap-2 rounded-xl border border-[#d9e2ef] bg-[#f8fafc] p-4 text-left transition-colors ${
                isApproved ? 'hover:bg-[#f3f8ff] cursor-pointer' : 'cursor-not-allowed opacity-60'
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eaf3ff] text-[#2456f5]">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{t('manageBookingsLabel', 'Manage Bookings')}</p>
                <p className="text-xs text-slate-500">5 pending</p>
              </div>
            </button>
            <button
              onClick={() => router.push('/garage/dashboard')}
              className="flex flex-col items-center gap-2 rounded-xl border border-[#d9e2ef] bg-[#f8fafc] p-4 text-left transition-colors hover:bg-[#f3f8ff] cursor-pointer"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eaf3ff] text-[#2456f5]">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{t('viewAnalyticsLabel', 'View Analytics')}</p>
                <p className="text-xs text-slate-500">View performance</p>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="rounded-xl border-[#d9e2ef] bg-white shadow-[0_6px_16px_rgba\(94,126,179,0.10\)] ">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">{t('recentActivityTitle', 'Recent Activity')}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            {dashboardData?.recentActivity?.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  activity.type === 'booking' ? 'bg-emerald-50 text-emerald-600' :
                  activity.type === 'quote' ? 'bg-blue-50 text-blue-600' :
                  'bg-amber-50 text-amber-600'
                }`}>
                  {activity.type === 'booking' ? <Calendar className="h-5 w-5" /> :
                   activity.type === 'quote' ? <ClipboardList className="h-5 w-5" /> :
                   <Star className="h-5 w-5" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{activity.message}</p>
                  <p className="text-xs text-slate-500">{activity.details}</p>
                  <p className="text-xs text-slate-400">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

