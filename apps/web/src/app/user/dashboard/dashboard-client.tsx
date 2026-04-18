'use client';

import Link from 'next/link';
import { BrainCircuit, CheckCircle2, Send } from 'lucide-react';
import { SessionGuard } from '@/components/auth/session-guard';
import { UserSidebar, UserSidebarMobile } from '@/components/dashboard/user-sidebar';
import { UserTopLogoHeader } from '@/components/dashboard/user-top-logo-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { UserDashboardContent, UserSidebarContent } from '@/lib/api';

type Props = {
  sidebar: UserSidebarContent;
  content: UserDashboardContent;
  appLogoUrl?: string;
};

export function DashboardClient({ sidebar, content, appLogoUrl }: Props) {
  const headerSidebar = { ...sidebar, logoUrl: appLogoUrl || sidebar.logoUrl };
  const garageRawTitle = content?.actions?.garage?.title ?? 'Direct Service Request';
  const garageRawDescription =
    content?.actions?.garage?.description ??
    'Skip analysis and raise a direct service request when you already know the issue.';
  const garageTitle = garageRawTitle.toLowerCase().includes('garage')
    ? 'Direct Service Request'
    : garageRawTitle;
  const garageDescription = garageRawTitle.toLowerCase().includes('garage')
    ? 'Skip analysis and raise a direct service request when you already know the issue.'
    : garageRawDescription;

  return (
    <div className="flex h-screen bg-background">
      <SessionGuard requiredRole="user" />
      <UserSidebarMobile activeItem="dashboard" content={sidebar} />
      <div className="hidden lg:block">
        <UserSidebar activeItem="dashboard" content={sidebar} />
      </div>

      <section className="flex-1 overflow-y-auto bg-[#f1f3f8]">
        <div className="mx-auto max-w-7xl p-4 sm:p-6 md:p-8">
          <UserTopLogoHeader sidebar={headerSidebar} />

          <div className="mt-4 sm:mt-6 space-y-2">
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.12em] text-[#0f93de]">Service Intake</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">What do you need?</h1>
            <p className="text-xs sm:text-sm text-slate-500">Choose one path. Both end with the same structured payload sent to garages.</p>
          </div>

          <Card className="mt-3 sm:mt-4 rounded-2xl border-[#d9e2ef] bg-white shadow-none sm:rounded-3xl">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 sm:text-lg">Before You Start</h3>
                  <p className="text-xs text-slate-500 sm:text-sm">
                    A few things improve quote quality and reduce back-and-forth.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" className="h-9 rounded-lg border-[#bad5fb] px-3 text-xs text-[#0f62d6] hover:bg-[#f4f8ff] sm:px-4 sm:text-sm">
                    <Link href="/user/quotes-bookings">Quotes &amp; Bookings</Link>
                  </Button>
                  <Button asChild variant="outline" className="h-9 rounded-lg border-[#bad5fb] px-3 text-xs text-[#0f62d6] hover:bg-[#f4f8ff] sm:px-4 sm:text-sm">
                    <Link href="/user/payments">Payments</Link>
                  </Button>
                </div>
              </div>

              <div className="mt-3 sm:mt-4 grid gap-2 sm:gap-3 md:grid-cols-3">
                <InfoItem text="Select the correct vehicle before submitting the request." />
                <InfoItem text="Add clear symptoms and optional photos/videos for faster matching." />
                <InfoItem text="After submission, compare quotes first, then confirm and pay." />
              </div>
            </CardContent>
          </Card>

          <div className="mt-3 sm:mt-4 grid gap-3 sm:gap-4 md:grid-cols-2">
            <Card className="rounded-2xl border-[#d9e2ef] bg-white shadow-none sm:rounded-3xl">
              <CardContent className="space-y-4 p-4 sm:p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e7f3fc] text-[#0f93de] sm:h-12 sm:w-12">
                  <BrainCircuit className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 sm:text-xl">{content.actions.diagnosis.title}</h2>
                  <p className="mt-1 text-xs text-slate-500 sm:text-sm">{content.actions.diagnosis.description}</p>
                </div>
                <Button asChild className="h-10 w-full rounded-xl bg-[#0f93de] text-white text-sm hover:bg-[#0d82c4] sm:h-11 sm:text-base">
                  <Link href="/user/ai-diagnosis">Start Guided Assessment</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-[#d9e2ef] bg-white shadow-none sm:rounded-3xl">
              <CardContent className="space-y-4 p-4 sm:p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e9f7f1] text-[#0c8f63] sm:h-12 sm:w-12">
                  <Send className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 sm:text-xl">{garageTitle}</h2>
                  <p className="mt-1 text-xs text-slate-500 sm:text-sm">{garageDescription}</p>
                </div>
                <Button asChild className="h-10 w-full rounded-xl bg-[#0f93de] text-white text-sm hover:bg-[#0d82c4] sm:h-11 sm:text-base">
                  <Link href="/user/direct-request">Raise Direct Service Request</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoItem({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-[#dbe8fb] bg-[#ffffff] px-3 py-2">
      <p className="flex items-start gap-2 text-sm text-slate-700">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0f93de]" />
        <span>{text}</span>
      </p>
    </div>
  );
}
