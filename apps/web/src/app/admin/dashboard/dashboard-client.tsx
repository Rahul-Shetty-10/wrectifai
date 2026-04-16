'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, CreditCard, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';

export function AdminAnalyticsDashboardClient() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Dashboard</h1>
        <p className="mt-2 text-sm text-slate-500 sm:text-base">Platform analytics and metrics overview</p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border-[#d9e2ef] bg-white shadow-none sm:rounded-3xl">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#97a9c1] sm:text-sm">Total Users</p>
                <p className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">2,458</p>
                <p className="mt-1 text-xs text-emerald-600 sm:text-sm">+12.5% from last month</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e7f3fc] text-[#0f93de] sm:h-14 sm:w-14">
                <Users className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-[#d9e2ef] bg-white shadow-none sm:rounded-3xl">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#97a9c1] sm:text-sm">Total Bookings</p>
                <p className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">1,234</p>
                <p className="mt-1 text-xs text-emerald-600 sm:text-sm">+8.2% from last month</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e9f7f1] text-[#0c8f63] sm:h-14 sm:w-14">
                <Calendar className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-[#d9e2ef] bg-white shadow-none sm:rounded-3xl">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#97a9c1] sm:text-sm">Revenue</p>
                <p className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">$45.2K</p>
                <p className="mt-1 text-xs text-emerald-600 sm:text-sm">+15.3% from last month</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#fef3c7] text-[#d97706] sm:h-14 sm:w-14">
                <CreditCard className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-[#d9e2ef] bg-white shadow-none sm:rounded-3xl">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#97a9c1] sm:text-sm">Conversion Rate</p>
                <p className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">68.5%</p>
                <p className="mt-1 text-xs text-emerald-600 sm:text-sm">+3.1% from last month</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#dbeafe] text-[#2563eb] sm:h-14 sm:w-14">
                <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border-[#d9e2ef] bg-white shadow-none sm:rounded-3xl">
          <CardHeader className="border-b border-[#e6ebf2] pb-4">
            <CardTitle className="text-lg font-semibold text-slate-900 sm:text-xl">User Growth</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="h-64 flex items-center justify-center rounded-xl border-2 border-dashed border-[#d9e2ef] bg-[#f8fafc]">
              <p className="text-sm text-slate-500">Chart component to be added</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-[#d9e2ef] bg-white shadow-none sm:rounded-3xl">
          <CardHeader className="border-b border-[#e6ebf2] pb-4">
            <CardTitle className="text-lg font-semibold text-slate-900 sm:text-xl">Popular Repairs</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              {[
                { name: 'Brake Repair', count: 234, percentage: 35 },
                { name: 'Oil Change', count: 189, percentage: 28 },
                { name: 'Battery Replacement', count: 145, percentage: 22 },
                { name: 'Tire Service', count: 112, percentage: 15 },
              ].map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-900">{item.name}</span>
                    <span className="text-slate-500">{item.count} ({item.percentage}%)</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#e6ebf2]">
                    <div
                      className="h-2 rounded-full bg-[#0f93de]"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shop Performance & Active Customers */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border-[#d9e2ef] bg-white shadow-none sm:rounded-3xl">
          <CardHeader className="border-b border-[#e6ebf2] pb-4">
            <CardTitle className="text-lg font-semibold text-slate-900 sm:text-xl">Shop Performance</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              {[
                { name: 'AutoFix Garage', rating: 4.8, bookings: 45, status: 'Excellent' },
                { name: 'QuickService Center', rating: 4.6, bookings: 38, status: 'Good' },
                { name: 'Premium Motors', rating: 4.5, bookings: 32, status: 'Good' },
              ].map((shop, index) => (
                <div key={index} className="flex items-center justify-between rounded-xl border border-[#e6ebf2] p-3 sm:p-4">
                  <div>
                    <p className="font-medium text-slate-900 sm:text-base">{shop.name}</p>
                    <p className="text-xs text-slate-500 sm:text-sm">{shop.bookings} bookings</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500 sm:h-5 sm:w-5" />
                    <span className="text-sm font-medium text-slate-900">{shop.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-[#d9e2ef] bg-white shadow-none sm:rounded-3xl">
          <CardHeader className="border-b border-[#e6ebf2] pb-4">
            <CardTitle className="text-lg font-semibold text-slate-900 sm:text-xl">Active Customers</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              {[
                { label: 'This Week', value: '1,234', change: '+5.2%' },
                { label: 'This Month', value: '4,567', change: '+12.8%' },
                { label: 'This Year', value: '45,678', change: '+45.3%' },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between rounded-xl border border-[#e6ebf2] p-3 sm:p-4">
                  <div>
                    <p className="text-sm text-slate-500 sm:text-base">{item.label}</p>
                    <p className="text-lg font-bold text-slate-900 sm:text-xl">{item.value}</p>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-600">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm font-medium">{item.change}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals Alert */}
      <Card className="rounded-2xl border-amber-200 bg-amber-50 shadow-none sm:rounded-3xl">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 sm:h-12 sm:w-12">
              <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900 sm:text-lg">Pending Approvals</p>
              <p className="mt-1 text-sm text-slate-600 sm:text-base">
                You have 12 pending garage registrations and 8 vendor registrations awaiting approval.
              </p>
              <button
                type="button"
                className="mt-3 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700 sm:px-6 sm:text-base"
              >
                Review Approvals
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
