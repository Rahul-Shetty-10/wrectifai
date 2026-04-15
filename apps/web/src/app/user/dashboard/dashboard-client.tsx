'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  Clock3,
  Loader2,
  PlusCircle,
  ScanSearch,
  Search,
  Send,
  ShieldAlert,
  Siren,
  SquareChartGantt,
  Wrench,
} from 'lucide-react';
import { SessionGuard } from '@/components/auth/session-guard';
import { UserSidebar, UserSidebarMobile } from '@/components/dashboard/user-sidebar';
import { UserTopLogoHeader } from '@/components/dashboard/user-top-logo-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  createIssueRequest,
  fetchUserVehicles,
  fetchUserProfile,
  type UserDashboardContent,
  type UserProfile,
  type UserSidebarContent,
  USER_DASHBOARD_DEFAULT,
} from '@/lib/api';

type Props = {
  sidebar: UserSidebarContent;
  content: UserDashboardContent;
  appLogoUrl?: string;
};

type QuoteView = {
  id: string;
  garageName: string;
  amount: string;
  eta: string;
  marketLabel: 'Below market' | 'Fair' | 'Above market';
  vehicle: string;
  issueSummary: string;
};

type ServiceView = {
  id: string;
  title: string;
  priceLabel: string;
};

export function DashboardClient({ sidebar, content: initialContent, appLogoUrl }: Props) {
  const router = useRouter();
  const content = initialContent?.hero?.description
    ? initialContent
    : USER_DASHBOARD_DEFAULT;
  const [query, setQuery] = useState('');
  const [vehicles, setVehicles] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [directIssue, setDirectIssue] = useState('');
  const [showDirectRequest, setShowDirectRequest] = useState(false);
  const [isRaisingRequest, setIsRaisingRequest] = useState(false);
  const [directRequestError, setDirectRequestError] = useState<string | null>(null);
  const [directRequestSuccess, setDirectRequestSuccess] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const headerSidebar = { ...sidebar, logoUrl: appLogoUrl || sidebar.logoUrl };

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const data = await fetchUserVehicles();
        if (!active) return;
        const mapped = data.map((vehicle) => ({
          id: vehicle.id,
          label: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        }));
        setVehicles(mapped);
        setSelectedVehicleId(data.find((v) => v.isDefault)?.id ?? data[0]?.id ?? '');
      } catch {
        if (!active) return;
        setDirectRequestError('Unable to load vehicles for direct request.');
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const data = await fetchUserProfile();
        if (!active) return;
        setProfile(data);
      } catch {
        if (!active) return;
        setProfile(null);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function handleRaiseDirectRequest() {
    if (!selectedVehicleId || !directIssue.trim()) return;
    setDirectRequestError(null);
    setDirectRequestSuccess(null);
    try {
      setIsRaisingRequest(true);
      await createIssueRequest({
        vehicleId: selectedVehicleId,
        summary: directIssue.trim(),
      });
      setDirectIssue('');
      setDirectRequestSuccess('Request raised successfully. Opening Quotes & Bookings...');
      router.push('/user/quotes-bookings');
    } catch (error) {
      setDirectRequestError(error instanceof Error ? error.message : 'Unable to raise request.');
    } finally {
      setIsRaisingRequest(false);
    }
  }

  const bestQuotes = useMemo<QuoteView[]>(
    () => [
      {
        id: 'q_1',
        garageName: 'Precision Auto Works',
        amount: '$268',
        eta: 'Same day',
        marketLabel: 'Below market',
        vehicle: '2018 Toyota Camry',
        issueSummary: 'Brake pad replacement',
      },
      {
        id: 'q_2',
        garageName: 'CarMotive Pro Garage',
        amount: '$305',
        eta: 'Tomorrow',
        marketLabel: 'Fair',
        vehicle: '2018 Toyota Camry',
        issueSummary: 'Brake pad replacement',
      },
      {
        id: 'q_3',
        garageName: 'MetroDrive Service Hub',
        amount: '$349',
        eta: 'Tomorrow',
        marketLabel: 'Above market',
        vehicle: '2018 Toyota Camry',
        issueSummary: 'Brake pad replacement',
      },
    ],
    []
  );

  const recommendedServices = useMemo<ServiceView[]>(
    () => [
      { id: 's_1', title: 'Oil Change', priceLabel: 'Starting at $39.99' },
      { id: 's_2', title: 'Brake Service', priceLabel: 'Starting at $99.99' },
      { id: 's_3', title: 'Tire Replacement', priceLabel: 'Starting at $69.99' },
    ],
    []
  );

  return (
    <div className="flex h-screen bg-[#dfe4ec]">
      <SessionGuard requiredRole="user" />
      <UserSidebarMobile activeItem="dashboard" content={sidebar} />
      <div className="hidden lg:block">
        <UserSidebar activeItem="dashboard" content={sidebar} />
      </div>

      <section className="flex-1 overflow-y-auto bg-[#f6f8fc]">
        <div className="mx-auto w-full max-w-[1320px] px-6 py-6">
          <UserTopLogoHeader sidebar={headerSidebar} />
          <div className="space-y-5">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                Welcome Back, <span className="text-[#0f93de]">{profile?.fullName?.trim() || content.hero.userNameDefault}</span>
              </h1>
              <p className="mt-2 text-base text-slate-500">{content.hero.description}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-8">
              <Card className="xl:col-span-5 rounded-3xl border-[#e2e8f0] bg-white shadow-none">
                <CardContent className="space-y-6 p-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0f93de]">
                      <ScanSearch className="h-3.5 w-3.5" />
                      AI Diagnostic Module
                    </div>
                    <h2 className="text-2xl font-bold leading-tight text-slate-900 md:text-3xl">
                      Describe the anomaly you&apos;re experiencing
                    </h2>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="e.g., Squeaking sound when braking"
                      className="h-12 border-[#d7dee8] bg-[#f8fafc]"
                    />
                    <Button asChild className="h-12 rounded-xl bg-[#0989d8] px-6 text-white hover:bg-[#0874b8]">
                      <Link href={query ? `/user/ai-diagnosis?symptoms=${encodeURIComponent(query)}` : '/user/ai-diagnosis'}>
                        <Search className="h-4 w-4" />
                        Analyze Issue
                      </Link>
                    </Button>
                  </div>
                  <div className="rounded-2xl border border-[#e6edf5] bg-[#f8fbff] p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-800">Need service without AI diagnosis?</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDirectRequest((prev) => !prev)}
                        className="border-[#d6e1ee] bg-white"
                      >
                        {showDirectRequest ? 'Hide' : 'Raise Direct Request'}
                      </Button>
                    </div>

                    {showDirectRequest ? (
                      <div className="space-y-3">
                        <select
                          value={selectedVehicleId}
                          onChange={(e) => setSelectedVehicleId(e.target.value)}
                          className="h-11 w-full rounded-xl border border-[#d7dee8] bg-white px-3 text-sm"
                        >
                          <option value="" disabled>
                            Select vehicle
                          </option>
                          {vehicles.map((vehicle) => (
                            <option key={vehicle.id} value={vehicle.id}>
                              {vehicle.label}
                            </option>
                          ))}
                        </select>
                        <Input
                          value={directIssue}
                          onChange={(e) => setDirectIssue(e.target.value)}
                          placeholder="e.g., Brake check + oil change"
                          className="h-11 border-[#d7dee8] bg-white"
                        />
                        {directRequestError ? (
                          <p className="text-xs font-medium text-red-600">{directRequestError}</p>
                        ) : null}
                        {directRequestSuccess ? (
                          <p className="text-xs font-medium text-emerald-600">{directRequestSuccess}</p>
                        ) : null}
                        <Button
                          type="button"
                          onClick={handleRaiseDirectRequest}
                          disabled={!selectedVehicleId || !directIssue.trim() || isRaisingRequest}
                          className="h-11 rounded-xl bg-[#0989d8] px-5 text-white hover:bg-[#0874b8]"
                        >
                          {isRaisingRequest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                          Submit Service Request
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>

              <Card className="xl:col-span-3 rounded-3xl border-[#e2e8f0] bg-white shadow-none">
                <CardHeader className="pb-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Quick Actions</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button asChild variant="outline" className="h-12 w-full justify-start border-[#e4eaf2] bg-[#f6f9fc]">
                    <Link href="/user/ai-diagnosis">
                      <PlusCircle className="h-4 w-4 text-[#0989d8]" />
                      Start New Diagnosis
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-12 w-full justify-start border-[#e4eaf2] bg-[#f6f9fc]">
                    <Link href="/user/my-garage">
                      <Wrench className="h-4 w-4 text-[#0989d8]" />
                      Manage Vehicles
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-12 w-full justify-start border-[#e4eaf2] bg-[#f6f9fc]">
                    <Link href="/user/payments">
                      <Clock3 className="h-4 w-4 text-[#0989d8]" />
                      Review Payments
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-3xl border-[#e2e8f0] bg-white shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900 md:text-2xl">
                  <SquareChartGantt className="h-6 w-6 text-[#0f93de]" />
                  Best Quotes For Your Issue
                </CardTitle>
                <Button asChild variant="ghost" size="sm" className="text-[#0f93de]">
                  <Link href="/user/quotes-bookings">View All Quotes</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {bestQuotes.map((quote) => (
                    <div key={quote.id} className="rounded-2xl border border-[#e4eaf2] bg-[#fcfdff] p-4">
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <p className="text-base font-semibold leading-tight text-slate-900">{quote.garageName}</p>
                        <p className="text-2xl font-bold tracking-tight text-slate-900">{quote.amount}</p>
                      </div>
                      <div className="space-y-1 text-sm text-slate-500">
                        <p>{quote.issueSummary}</p>
                        <p>{quote.vehicle}</p>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <Badge className={getQuoteBadgeClass(quote.marketLabel)}>{quote.marketLabel}</Badge>
                        <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-400">{quote.eta}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <Card className="rounded-3xl border-[#e2e8f0] bg-white shadow-none lg:col-span-4">
                <CardContent className="space-y-6 p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <div className="mt-1 rounded-lg bg-red-50 p-2 text-red-500">
                        <Siren className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xl font-semibold leading-tight text-slate-900">Front brake pads worn out</p>
                        <p className="mt-1 text-sm text-slate-500">2018 Toyota Camry</p>
                        <p className="text-xs text-slate-400">Chassis ID: TC-882</p>
                      </div>
                    </div>
                    <Badge className="rounded-lg border-0 bg-red-100 px-3 py-1 text-[11px] uppercase tracking-[0.08em] text-red-700 hover:bg-red-100">
                      Critical Alert
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 gap-2 border-t border-[#e8edf4] pt-4 sm:grid-cols-3">
                    <InfoPill icon={ShieldAlert} label="Risk Factor" value="Reduced braking safety" />
                    <InfoPill icon={Clock3} label="Recommended Action" value="Service within 24 hrs" alert />
                    <InfoPill icon={Wrench} label="Suggested Service" value="Pad + rotor inspection" />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-[#e2e8f0] bg-white shadow-none lg:col-span-5">
                <CardHeader className="pb-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Recommended Services</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recommendedServices.map((service) => (
                    <div key={service.id} className="flex items-center justify-between rounded-xl border border-[#e8edf4] px-3 py-3">
                      <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-[#0989d8]" />
                        <p className="font-medium text-slate-700">{service.title}</p>
                      </div>
                      <p className="text-xs font-medium text-slate-400">{service.priceLabel.replace('Starting at ', 'Next: ')}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-[#e2e8f0] bg-white shadow-none lg:col-span-3">
                <CardContent className="flex h-full flex-col justify-between p-6">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#0f93de]">AI Precision Rate</p>
                    <p className="text-4xl font-bold tracking-tight text-slate-900">99.2%</p>
                  </div>
                  <div>
                    <div className="mb-4 h-2 rounded-full bg-[#e8edf4]">
                      <div className="h-2 w-[99%] rounded-full bg-[#0f93de]" />
                    </div>
                    <Button variant="outline" className="w-full border-[#d5deea]">
                      Schedule Maintenance
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoPill({
  icon: Icon,
  label,
  value,
  alert,
}: {
  icon: typeof ShieldAlert;
  label: string;
  value: string;
  alert?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#e8edf4] bg-[#fcfdff] p-3">
      <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className={alert ? 'mt-1 text-sm font-semibold text-red-600' : 'mt-1 text-sm font-semibold text-slate-900'}>{value}</p>
    </div>
  );
}

function getQuoteBadgeClass(label: QuoteView['marketLabel']) {
  if (label === 'Below market') {
    return 'border-0 bg-emerald-50 text-emerald-700 hover:bg-emerald-50';
  }
  if (label === 'Fair') {
    return 'border-0 bg-blue-50 text-blue-700 hover:bg-blue-50';
  }
  return 'border-0 bg-orange-50 text-orange-700 hover:bg-orange-50';
}
