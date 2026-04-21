'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Car,
  CarFront,
  ChevronLeft,
  ChevronRight,
  Circle,
  Compass,
  Heart,
  History,
  Home,
  MapPin,
  Menu,
  Plus,
  Search,
  Settings,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { SessionGuard } from '@/components/auth/session-guard';
import { LogoutButton } from '@/components/auth/logout-button';
import { UserSidebarMobile } from '@/components/dashboard/user-sidebar';
import { UserTopLogoHeader } from '@/components/dashboard/user-top-logo-header';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  addUserVehicle,
  fetchIssueRequestsWithQuotes,
  fetchUserVehicles,
  setDefaultUserVehicle,
  uploadRcAndSuggest,
  updateUserVehicle,
  type IssueRequestWithQuotes,
  type UserDashboardContent,
  type UserSidebarContent,
  type UserVehicle,
} from '@/lib/api';
import { cn } from '@/lib/utils';

type Props = {
  sidebar: UserSidebarContent;
  content: UserDashboardContent;
  appLogoUrl?: string;
};

type VehicleCard = {
  id: string;
  name: string;
  meta: string;
  image: string;
  isDefault?: boolean;
  source: UserVehicle;
};

type VehicleFormState = {
  make: string;
  model: string;
  year: string;
  fuelType: string;
  trim: string;
  mileage: string;
  engineType: string;
  vin: string;
  plateNumber: string;
  warrantyDetails: string;
};

const EMPTY_VEHICLE_FORM: VehicleFormState = {
  make: '',
  model: '',
  year: '',
  fuelType: '',
  trim: '',
  mileage: '',
  engineType: '',
  vin: '',
  plateNumber: '',
  warrantyDetails: '',
};

type GarageCard = {
  id: string;
  name: string;
  rating: string;
  reviews: string;
  distance: string;
  price: string;
  image: string;
};

type DashboardQuoteCard = {
  id: string;
  issueId: string;
  issue: string;
  garage: string;
  eta: string;
  amount: string;
  createdAt: string;
};

const VEHICLE_IMAGES = [
  'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=800&q=80',
];

const nearbyGarages: GarageCard[] = [
  {
    id: 'g1',
    name: 'Garage A',
    rating: '4.4',
    reviews: '120 reviews',
    distance: '2.3 km',
    price: 'INR 4,300',
    image:
      'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'g2',
    name: 'Garage B',
    rating: '4.1',
    reviews: '155 reviews',
    distance: '3.1 km',
    price: 'INR 3,000',
    image:
      'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'g3',
    name: 'Garage C',
    rating: '4.4',
    reviews: '96 reviews',
    distance: '2.7 km',
    price: 'INR 6,000',
    image:
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'g4',
    name: 'Garage D',
    rating: '4.2',
    reviews: '85 reviews',
    distance: '4.1 km',
    price: 'INR 6,000',
    image:
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=400&q=80',
  },
];

const quoteCards = [
  {
    id: 'q1',
    issueId: 'sample-issue-1',
    issue: 'Brake response issue',
    garage: 'Garage A',
    eta: 'Today, 3:10 PM',
    amount: 'INR 4,200',
  },
  {
    id: 'q2',
    issueId: 'sample-issue-2',
    issue: 'Engine noise issue',
    garage: 'Garage B',
    eta: 'Today, 6:00 PM',
    amount: 'INR 3,800',
  },
];

const navItems = [
  { href: '/user/dashboard', label: 'Home', icon: Home, active: true },
  { href: '/user/ai-diagnosis', label: 'Diagnose', icon: Sparkles },
  { href: '/user/my-garage', label: 'My Garages', icon: Car },
  { href: '/user/quotes-bookings', label: 'Quotes', icon: Menu },
  { href: '/user/payments', label: 'History', icon: History },
];

const issueQuickTags = ['Noise', 'Vibration', 'Warning Light', 'Performance'] as const;

export function DashboardClient({ sidebar, content, appLogoUrl }: Props) {
  const headerSidebar = { ...sidebar, logoUrl: appLogoUrl || sidebar.logoUrl };
  const [registeredVehicles, setRegisteredVehicles] = useState<UserVehicle[]>([]);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<UserVehicle | null>(null);
  const [form, setForm] = useState<VehicleFormState>(EMPTY_VEHICLE_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [rcText, setRcText] = useState('');
  const [processingRc, setProcessingRc] = useState(false);
  const [settingDefaultVehicleId, setSettingDefaultVehicleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [issueDraft, setIssueDraft] = useState('');
  const [activeIssueTag, setActiveIssueTag] = useState<string>('Noise');
  const [vehiclePage, setVehiclePage] = useState(0);
  const [recentQuotes, setRecentQuotes] = useState<DashboardQuoteCard[]>([]);

  useEffect(() => {
    async function loadVehicles() {
      try {
        const data = await fetchUserVehicles();
        setRegisteredVehicles(data);
      } catch {
        setRegisteredVehicles([]);
      }
    }
    void loadVehicles();
  }, []);

  useEffect(() => {
    async function loadRecentQuotes() {
      try {
        const issues = await fetchIssueRequestsWithQuotes();
        const topQuotes = issues
          .flatMap((issue: IssueRequestWithQuotes) =>
            (issue.quotes ?? []).map((quote) => ({
              id: quote.id,
              issueId: issue.id,
              issue: issue.summary || 'Issue',
              garage: quote.garage_name || 'Garage',
              eta: formatQuoteTime(quote.created_at),
              amount: formatInr(quote.total_cost),
              createdAt: quote.created_at,
            }))
          )
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 2);
        setRecentQuotes(topQuotes);
      } catch {
        setRecentQuotes([]);
      }
    }

    void loadRecentQuotes();
  }, []);

  const vehicles = useMemo<VehicleCard[]>(
    () =>
      registeredVehicles
        .filter((vehicle) => {
          const q = searchQuery.trim().toLowerCase();
          if (!q) return true;
          return `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.fuelType} ${vehicle.plateNumber ?? ''}`
            .toLowerCase()
            .includes(q);
        })
        .map((vehicle, index) => ({
        id: vehicle.id,
        name: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        meta: `${vehicle.fuelType} | ${vehicle.engineType || vehicle.trim || '-'} | ${
          vehicle.mileage != null ? `${vehicle.mileage.toLocaleString()} KM` : '-'
        }`,
        image: VEHICLE_IMAGES[index % VEHICLE_IMAGES.length],
        isDefault: vehicle.isDefault,
        source: vehicle,
      })),
    [registeredVehicles, searchQuery]
  );

  const issueQuery = issueDraft.trim()
    ? `?issue=${encodeURIComponent(issueDraft.trim())}`
    : '';

  const VEHICLES_PER_PAGE = 2;
  const totalVehiclePages = Math.max(1, Math.ceil(vehicles.length / VEHICLES_PER_PAGE));
  const pagedVehicles = vehicles.slice(
    vehiclePage * VEHICLES_PER_PAGE,
    vehiclePage * VEHICLES_PER_PAGE + VEHICLES_PER_PAGE
  );

  useEffect(() => {
    if (vehiclePage > totalVehiclePages - 1) {
      setVehiclePage(Math.max(0, totalVehiclePages - 1));
    }
  }, [totalVehiclePages, vehiclePage]);

  function openAddVehicleModal() {
    setEditingVehicle(null);
    setForm(EMPTY_VEHICLE_FORM);
    setRcText('');
    setFormError(null);
    setShowVehicleForm(true);
  }

  function openEditVehicleModal(vehicle: UserVehicle) {
    setEditingVehicle(vehicle);
    setForm({
      make: vehicle.make,
      model: vehicle.model,
      year: String(vehicle.year),
      fuelType: vehicle.fuelType,
      trim: vehicle.trim ?? '',
      mileage: vehicle.mileage != null ? String(vehicle.mileage) : '',
      engineType: vehicle.engineType ?? '',
      vin: vehicle.vin ?? '',
      plateNumber: vehicle.plateNumber ?? '',
      warrantyDetails: '',
    });
    setRcText('');
    setFormError(null);
    setShowVehicleForm(true);
  }

  async function refreshVehicles() {
    try {
      const data = await fetchUserVehicles();
      setRegisteredVehicles(data);
    } catch {
      setRegisteredVehicles([]);
    }
  }

  async function handleSaveVehicle() {
    if (!form.make.trim() || !form.model.trim() || !form.fuelType.trim() || !form.year.trim()) {
      setFormError('Please fill all required fields.');
      return;
    }

    const yearNum = Number(form.year);
    if (!Number.isInteger(yearNum)) {
      setFormError('Year must be a valid number.');
      return;
    }

    const mileageNum = form.mileage.trim() ? Number(form.mileage) : undefined;
    if (form.mileage.trim() && !Number.isFinite(mileageNum)) {
      setFormError('Mileage must be a valid number.');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);

      if (editingVehicle) {
        await updateUserVehicle(editingVehicle.id, {
          make: form.make.trim(),
          model: form.model.trim(),
          year: yearNum,
          fuelType: form.fuelType.trim(),
          trim: form.trim.trim() || undefined,
          mileage: mileageNum,
          engineType: form.engineType.trim() || undefined,
          vin: form.vin.trim() || undefined,
          plateNumber: form.plateNumber.trim() || undefined,
        });
      } else {
        await addUserVehicle({
          make: form.make.trim(),
          model: form.model.trim(),
          year: yearNum,
          fuelType: form.fuelType.trim(),
          trim: form.trim.trim() || undefined,
          mileage: mileageNum,
          engineType: form.engineType.trim() || undefined,
          vin: form.vin.trim() || undefined,
          plateNumber: form.plateNumber.trim() || undefined,
          warrantyDetails: form.warrantyDetails.trim() || undefined,
          isDefault: registeredVehicles.length === 0,
        });
      }

      await refreshVehicles();
      setShowVehicleForm(false);
      setEditingVehicle(null);
      setForm(EMPTY_VEHICLE_FORM);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to save vehicle.');
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleSetDefault(vehicleId: string) {
    try {
      setSettingDefaultVehicleId(vehicleId);
      await setDefaultUserVehicle(vehicleId);
      await refreshVehicles();
    } finally {
      setSettingDefaultVehicleId(null);
    }
  }

  async function handleApplyRcSuggestion() {
    if (!rcText.trim()) return;
    try {
      setProcessingRc(true);
      const suggestion = await uploadRcAndSuggest(rcText.trim());
      setForm((prev) => ({
        ...prev,
        make: suggestion.make ?? prev.make,
        model: suggestion.model ?? prev.model,
        year: suggestion.year ? String(suggestion.year) : prev.year,
        fuelType: suggestion.fuelType ?? prev.fuelType,
        vin: suggestion.vin ?? prev.vin,
        plateNumber: suggestion.plateNumber ?? prev.plateNumber,
      }));
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to apply RC suggestion.');
    } finally {
      setProcessingRc(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#dfe7f5] px-2 py-2 sm:px-3 sm:py-3 [font-family:Inter,'SF_Pro_Display',-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,Helvetica,Arial,sans-serif]">
      <SessionGuard requiredRole="user" />
      <UserSidebarMobile activeItem="dashboard" content={sidebar} />

      <div className="mx-auto w-full min-h-[calc(100vh-1rem)] overflow-hidden rounded-xl border border-[#d4deef] bg-[#edf2fb] shadow-[0_12px_36px_rgba(38,67,122,0.14)] sm:min-h-[calc(100vh-1.5rem)]">
        <UserTopLogoHeader sidebar={headerSidebar} />

        <header className="border-b border-[#dbe5f4] bg-[#f8fbff] px-2.5 py-2 sm:px-4 sm:py-2.5">
          <div className="flex items-center gap-2.5 sm:gap-4">
            <div className="hidden h-[62px] w-[320px] shrink-0 overflow-hidden rounded-xl bg-white p-0.5 shadow-sm sm:flex">
              <img
                src="/wrectifai_logo_cropped.png?v=4"
                alt={sidebar.brandName}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="relative w-full max-w-[520px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vehicles, garages, bookings..."
                className="h-[38px] w-full rounded-xl border border-[#d6e0f0] bg-white pl-9 pr-4 text-[13px] font-medium text-slate-700 outline-none"
              />
            </div>
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <IconPill>
                <Bell className="h-4 w-4" />
              </IconPill>
              <IconPill>
                <Heart className="h-4 w-4" />
              </IconPill>
              <IconPill>
                <Settings className="h-4 w-4" />
              </IconPill>
              <Link href="/user/profile" className="block">
                <div className="h-9 w-9 overflow-hidden rounded-full border-2 border-[#8db4ff] bg-white shadow-sm">
                  <img
                    src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                </div>
              </Link>
            </div>
          </div>
        </header>

        <nav className="overflow-x-auto bg-[linear-gradient(180deg,#0e4ca2_0%,#0a3779_100%)] px-2 py-2 sm:px-4">
          <div className="flex min-w-max items-center gap-2.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    'inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-[13px] font-medium text-white/90 transition',
                    item.active ? 'bg-[#1e83f6] shadow-[0_8px_20px_rgba(0,0,0,0.25)]' : 'hover:bg-white/15'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <LogoutButton
              withIcon
              label="Logout"
              variant="ghost"
              className="ml-auto inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-[13px] font-medium text-white/90 transition hover:bg-white/15"
            />
          </div>
        </nav>

        <section className="p-2.5 sm:p-3.5 md:p-4">
          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-5">
              <CardShell>
                <div className="flex items-center justify-between">
                  <h2 className="text-[23px] font-semibold text-slate-800">My Vehicles</h2>
                  <div className="flex items-center gap-2">
                    {vehicles.length > VEHICLES_PER_PAGE ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setVehiclePage((prev) => Math.max(0, prev - 1))}
                          disabled={vehiclePage === 0}
                          className="grid h-8 w-8 place-items-center rounded-full border border-[#d5e2f3] bg-white text-slate-600 transition hover:bg-[#f4f8ff] disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Previous vehicles"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setVehiclePage((prev) => Math.min(totalVehiclePages - 1, prev + 1))}
                          disabled={vehiclePage >= totalVehiclePages - 1}
                          className="grid h-8 w-8 place-items-center rounded-full border border-[#d5e2f3] bg-white text-slate-600 transition hover:bg-[#f4f8ff] disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Next vehicles"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </>
                    ) : null}
                    <p className="text-xl text-slate-300">...</p>
                  </div>
                </div>

                <div className="mt-3.5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {pagedVehicles.map((vehicle) => (
                    <VehicleBlock
                      key={vehicle.id}
                      vehicle={vehicle}
                      onEdit={() => openEditVehicleModal(vehicle.source)}
                      onSetDefault={() => void handleSetDefault(vehicle.id)}
                      settingDefault={settingDefaultVehicleId === vehicle.id}
                    />
                  ))}

                  <button
                    type="button"
                    onClick={openAddVehicleModal}
                    className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-[#dde6f3] bg-[#f6f9ff] p-4 text-center transition hover:border-[#9ec5ff] hover:bg-white"
                  >
                    <Plus className="h-8 w-8 text-[#2a82f6]" />
                    <p className="mt-1.5 text-[18px] font-medium text-slate-700">Add Vehicle</p>
                  </button>
                </div>
              </CardShell>

              <CardShell>
                <h3 className="text-[23px] font-semibold tracking-tight text-slate-800">AI Diagnosis</h3>
                <p className="mt-1 text-[17px] font-medium text-slate-700">What&apos;s wrong with your car?</p>

                <div className="mt-3.5 rounded-xl border border-[#dbe5f5] bg-white p-4">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={issueDraft}
                      onChange={(e) => {
                        setIssueDraft(e.target.value);
                        setActiveIssueTag('');
                      }}
                      placeholder="Type your issue..."
                      className="h-10 w-full rounded-xl border border-[#d6e2f2] bg-[#fbfdff] pl-9 pr-3 text-[13px] text-slate-700 placeholder:text-slate-500 outline-none"
                    />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {issueQuickTags.map((tag) => (
                      <Pill
                        key={tag}
                        active={activeIssueTag === tag}
                        onClick={() => {
                          setIssueDraft(tag);
                          setActiveIssueTag(tag);
                        }}
                      >
                        {tag}
                      </Pill>
                    ))}
                  </div>

                  <div className="mt-3.5 space-y-2.5">
                    <IssueCard
                      title="Wheel Balancing"
                      risk="Tire wear, vibration"
                      confidence="HIGH"
                      low="INR 3,200"
                      fair="INR 3,500"
                      high="INR 3,900"
                    />
                    <IssueCard
                      title="Brake Pads Wear"
                      risk="Safety issue"
                      confidence="MEDIUM"
                      low="INR 1,200"
                      fair="INR 2,500"
                      high="INR 3,000"
                    />
                  </div>

                  <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                    <Link
                      href={`/user/ai-diagnosis${issueQuery}`}
                      className="inline-flex h-9 items-center justify-center rounded-xl border border-[#cde0fc] bg-white px-3 text-[13px] font-medium text-[#0f62d6] transition hover:bg-[#f3f8ff]"
                    >
                      Start Guided Assessment
                    </Link>
                    <Link
                      href={`/user/direct-request${issueQuery}`}
                      className="inline-flex h-9 items-center justify-center rounded-xl bg-[#1976f2] px-3 text-[13px] font-medium text-white transition hover:bg-[#0d62d4]"
                    >
                      Raise Direct Service Request
                    </Link>
                  </div>
                </div>
              </CardShell>

              <CardShell>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-[23px] font-semibold tracking-tight text-slate-800">Nearby Garages</h3>
                  <Link href="/user/quotes-bookings" className="text-[13px] font-medium text-[#0f62d6]">
                    {content.actions.quotes.title}
                  </Link>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {nearbyGarages.map((garage) => (
                    <GarageBlock key={garage.id} garage={garage} />
                  ))}
                </div>
              </CardShell>

              <CardShell>
                <div className="flex items-center justify-between">
                  <h3 className="text-[23px] font-semibold tracking-tight text-slate-800">Quotes Received</h3>
                  <Link href="/user/quotes-bookings" className="text-[13px] font-medium text-[#0f62d6]">
                    {content.stats.pendingQuotes}
                  </Link>
                </div>

                <div className="mt-3.5 space-y-2.5">
                  {(recentQuotes.length > 0 ? recentQuotes : quoteCards).map((quote) => (
                    <div
                      key={quote.id}
                      className="flex min-h-[84px] flex-wrap items-center justify-between gap-3 rounded-xl border border-[#dbe6f5] bg-white px-4 py-3"
                    >
                      <div>
                        <p className="text-[16px] font-medium text-slate-800">{quote.garage}</p>
                        <p className="text-[13px] text-slate-600">{quote.issue}</p>
                        <p className="text-[12px] text-slate-500">{quote.eta}</p>
                      </div>
                      <div className="ml-auto text-right">
                        <p className="text-[24px] font-semibold text-slate-900">{quote.amount}</p>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/user/quotes-bookings/${quote.issueId}`}
                          className="inline-flex h-9 items-center rounded-lg bg-[#16a34a] px-3 text-[13px] font-medium text-white"
                        >
                          Accept
                        </Link>
                        <Link
                          href={`/user/quotes-bookings/${quote.issueId}`}
                          className="inline-flex h-9 items-center rounded-lg bg-[#1976f2] px-3 text-[13px] font-medium text-white"
                        >
                          Reject
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </CardShell>
            </div>

            <aside className="space-y-4">
              <CardShell compact>
                <h4 className="text-[18px] font-semibold text-slate-800">Your Cards</h4>
                <div className="mt-3 space-y-2.5">
                  <StatCard label="Total Spent" value="INR 56,500" tone="blue" />
                  <StatCard label="Upcoming booking" value="Garage Monroe" sub="Apr 23, 10:00" tone="orange" />
                  <StatCard label="Active Vehicles" value="2" tone="green" />
                  <StatCard label="Favorite Garages" value="3" tone="yellow" />
                </div>
              </CardShell>

              <CardShell compact>
                <h4 className="text-[18px] font-semibold text-slate-800">Preventive Maintenance</h4>
                <div className="mt-3 overflow-hidden rounded-xl border border-[#dbe4f4] bg-white">
                  <div className="flex items-center justify-between border-b border-[#edf2fa] px-3 py-2">
                    <p className="text-[14px] font-medium text-slate-700">Oil Change</p>
                    <span className="text-[12px] text-slate-500">65,500 KM</span>
                  </div>
                  <img
                    src="https://images.unsplash.com/photo-1577086664693-894d8405334a?auto=format&fit=crop&w=1200&q=80"
                    alt="Map"
                    className="h-64 w-full object-cover"
                  />
                  <div className="grid grid-cols-4 gap-2 border-t border-[#edf2fa] p-2">
                    <button className="rounded-lg bg-[#1976f2] py-2 text-white">
                      <Compass className="mx-auto h-4 w-4" />
                    </button>
                    <button className="rounded-lg bg-[#f3f7ff] py-2 text-slate-600">
                      <MapPin className="mx-auto h-4 w-4" />
                    </button>
                    <button className="rounded-lg bg-[#f3f7ff] py-2 text-slate-600">
                      <Settings className="mx-auto h-4 w-4" />
                    </button>
                    <button className="rounded-lg bg-[#f3f7ff] py-2 text-slate-600">
                      <Wrench className="mx-auto h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardShell>

              <CardShell compact>
                <h4 className="text-[18px] font-semibold text-slate-800">Quotes Received Today</h4>
                <div className="mt-3 space-y-2">
                  <MiniQuote garage="Garage A" when="Derol · 5 KM" />
                  <MiniQuote garage="Garage C" when="April · 10 AM" />
                  <Link
                    href="/user/quotes-bookings"
                    className="inline-flex h-9 w-full items-center justify-center rounded-xl bg-[#1976f2] text-[13px] font-medium text-white"
                  >
                    Add to Favorites
                  </Link>
                </div>
              </CardShell>
            </aside>
          </div>
        </section>
      </div>

      <Dialog open={showVehicleForm} onOpenChange={setShowVehicleForm}>
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl border border-[#cfdff6] bg-[linear-gradient(180deg,#f7fbff_0%,#f3f8ff_100%)] p-0 shadow-[0_28px_64px_rgba(26,54,101,0.26)] sm:max-w-4xl [&>button]:right-5 [&>button]:top-5 [&>button]:rounded-full [&>button]:border [&>button]:border-[#c9daf2] [&>button]:bg-white [&>button]:p-1 [&>button]:text-[#5f7598] [&>button]:opacity-100">
          <DialogHeader className="border-b border-[#d7e5f8] bg-[linear-gradient(180deg,#fafdff_0%,#edf5ff_100%)] px-6 py-5 sm:px-7">
            <DialogTitle className="flex items-center gap-3 text-[28px] font-semibold tracking-tight text-[#0f2244] sm:text-[34px]">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#e6f1ff] text-[#2a7cea] shadow-[inset_0_-1px_0_rgba(255,255,255,0.8)]">
                <CarFront className="h-5 w-5" />
              </span>
              {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
            </DialogTitle>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] font-medium text-[#60779b]">
              <span className="rounded-full border border-[#cfe1fa] bg-white px-2.5 py-1">Smart RC Autofill</span>
              <span className="rounded-full border border-[#cfe1fa] bg-white px-2.5 py-1">
                {editingVehicle ? 'Update existing vehicle' : 'Create vehicle profile'}
              </span>
            </div>
          </DialogHeader>

          <div className="space-y-4 p-6 sm:p-7">
            <div className="rounded-2xl border border-[#c9ddfb] bg-[linear-gradient(180deg,#f2f8ff_0%,#ebf4ff_100%)] p-4 sm:p-5">
              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <div className="space-y-2">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#4d6fa6]">
                    Upload RC Text
                  </p>
                  <Input
                    value={rcText}
                    onChange={(e) => setRcText(e.target.value)}
                    placeholder="Paste RC text here to auto-fill details..."
                    className="h-11 rounded-xl border-[#bdd3f6] bg-white text-[14px] text-[#233c60] placeholder:text-[#9aa9bf] focus-visible:ring-2 focus-visible:ring-[#78adff]"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => void handleApplyRcSuggestion()}
                    disabled={processingRc || !rcText.trim()}
                    className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-[#bcd3f7] bg-white px-5 text-[13px] font-semibold text-[#1f6fdf] transition hover:bg-[#edf4ff] disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
                  >
                    {processingRc ? 'Applying...' : 'Apply RC Suggestion'}
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#cfdef2] bg-white p-4 shadow-[0_10px_30px_rgba(80,111,160,0.08)] sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-[#e8f0fb] pb-3">
                <p className="text-[15px] font-semibold text-[#163153]">Vehicle Details</p>
                <p className="text-[12px] font-medium text-[#7d8fa9]">Fields marked * are required</p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <LabeledInput id="make" label="Make" value={form.make} required onChange={(v) => setForm((p) => ({ ...p, make: v }))} placeholder="e.g., Toyota" />
                <LabeledInput id="model" label="Model" value={form.model} required onChange={(v) => setForm((p) => ({ ...p, model: v }))} placeholder="e.g., Corolla" />
                <LabeledInput id="year" label="Year" type="number" value={form.year} required onChange={(v) => setForm((p) => ({ ...p, year: v }))} placeholder="e.g., 2022" />
                <LabeledInput id="fuelType" label="Fuel Type" value={form.fuelType} required onChange={(v) => setForm((p) => ({ ...p, fuelType: v }))} placeholder="e.g., Petrol" />
                <LabeledInput id="trim" label="Trim" value={form.trim} onChange={(v) => setForm((p) => ({ ...p, trim: v }))} placeholder="e.g., ZX" />
                <LabeledInput id="mileage" label="Mileage" type="number" value={form.mileage} onChange={(v) => setForm((p) => ({ ...p, mileage: v }))} placeholder="e.g., 12000" />
                <LabeledInput id="engineType" label="Engine Type" value={form.engineType} onChange={(v) => setForm((p) => ({ ...p, engineType: v }))} placeholder="e.g., 1.5L i-VTEC" />
                <LabeledInput id="vin" label="VIN" value={form.vin} onChange={(v) => setForm((p) => ({ ...p, vin: v }))} placeholder="17-character VIN" />
                <LabeledInput id="plateNumber" label="Plate Number" value={form.plateNumber} onChange={(v) => setForm((p) => ({ ...p, plateNumber: v }))} placeholder="e.g., KA01AB1234" />
                {!editingVehicle ? (
                  <LabeledInput id="warrantyDetails" label="Warranty Details" value={form.warrantyDetails} onChange={(v) => setForm((p) => ({ ...p, warrantyDetails: v }))} placeholder="e.g., 3 years / 60,000 KM" />
                ) : null}
              </div>

              {formError ? <p className="mt-3 text-sm font-medium text-red-600">{formError}</p> : null}
            </div>

            <div className="sticky bottom-0 z-10 -mx-6 -mb-6 flex flex-wrap gap-3 border-t border-[#d8e7fb] bg-[linear-gradient(180deg,#f8fbff_0%,#f1f7ff_100%)] px-6 py-4 shadow-[0_-8px_24px_rgba(52,92,158,0.12)] sm:-mx-7 sm:-mb-7 sm:px-7">
              <button
                type="button"
                onClick={() => void handleSaveVehicle()}
                disabled={formSubmitting}
                className="inline-flex h-11 min-w-36 items-center justify-center rounded-xl bg-[linear-gradient(180deg,#2384ff_0%,#1469df_100%)] px-5 text-[13px] font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {formSubmitting ? 'Saving...' : editingVehicle ? 'Save Changes' : 'Save Vehicle'}
              </button>
              <button
                type="button"
                onClick={() => setShowVehicleForm(false)}
                className="inline-flex h-11 min-w-28 items-center justify-center rounded-xl border border-[#cfddef] bg-white px-5 text-[13px] font-semibold text-[#365179] transition hover:bg-[#edf3fb]"
              >
                Cancel
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function formatInr(amount: number | string) {
  const parsedAmount = Number(amount);
  if (!Number.isFinite(parsedAmount)) return 'INR 0';
  return `INR ${Math.round(parsedAmount).toLocaleString('en-IN')}`;
}

function formatQuoteTime(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return 'Recent';
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  const timeLabel = new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);

  if (sameDay) return `Today, ${timeLabel}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday, ${timeLabel}`;

  const dateLabel = new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    day: 'numeric',
  }).format(date);
  return `${dateLabel}, ${timeLabel}`;
}

function IconPill({ children }: { children: ReactNode }) {
  return (
    <div className="grid h-8 w-8 place-items-center rounded-full border border-[#d7e2f0] bg-white text-slate-600">
      {children}
    </div>
  );
}

function CardShell({
  children,
  compact = false,
}: {
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-[#d4e0f0] bg-[#f4f8ff] shadow-[0_6px_16px_rgba(94,126,179,0.10)]',
        compact ? 'p-4' : 'p-4 md:p-[18px]'
      )}
    >
      {children}
    </div>
  );
}

function VehicleBlock({
  vehicle,
  onEdit,
  onSetDefault,
  settingDefault,
}: {
  vehicle: VehicleCard;
  onEdit: () => void;
  onSetDefault: () => void;
  settingDefault?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#dbe5f2] bg-white">
      <div className="relative">
        {vehicle.isDefault ? (
          <span className="absolute left-2 top-2 rounded-full bg-[#ffe58f] px-2 py-0.5 text-xs font-semibold text-[#805b00]">
            Default
          </span>
        ) : null}
        <img src={vehicle.image} alt={vehicle.name} className="h-32 w-full object-cover" />
      </div>
      <div className="p-4">
        <p className="text-[16px] font-medium text-slate-800">{vehicle.name}</p>
        <p className="text-[12px] text-slate-500">{vehicle.meta}</p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="h-8 rounded-full border border-[#c8dcfb] bg-[#f5f9ff] px-3 text-[13px] font-medium text-[#0f62d6]"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onSetDefault}
            disabled={vehicle.isDefault || settingDefault}
            className="h-8 rounded-full border border-[#d9e3f3] bg-white px-3 text-[13px] font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {vehicle.isDefault ? 'Default' : settingDefault ? 'Setting...' : 'Set Default'}
          </button>
        </div>
      </div>
    </div>
  );
}

function LabeledInput({
  id,
  label,
  value,
  onChange,
  required,
  type = 'text',
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5d708f]">
        {label} {required ? <span className="text-red-600">*</span> : null}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 rounded-xl border border-[#cfdeef] bg-[#fbfdff] px-3 text-[14px] text-[#263f61] placeholder:text-[#9baabc] focus-visible:ring-2 focus-visible:ring-[#78adff]"
      />
    </div>
  );
}

function Pill({
  children,
  active = false,
  onClick,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-8 rounded-xl border px-2.5 text-[13px] font-medium',
        active ? 'border-[#7bb4ff] bg-[#1d7ff2] text-white' : 'border-[#d5e2f3] bg-white text-slate-700'
      )}
    >
      {children}
    </button>
  );
}

function IssueCard({
  title,
  risk,
  confidence,
  low,
  fair,
  high,
}: {
  title: string;
  risk: string;
  confidence: string;
  low: string;
  fair: string;
  high: string;
}) {
  return (
    <div className="rounded-xl border border-[#dce7f5] bg-[#fbfdff] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[16px] font-medium text-slate-800">{title}</p>
        <span className="rounded-full bg-[#d9f9e7] px-2 py-0.5 text-[12px] font-medium text-[#117a43]">{confidence}</span>
      </div>
      <p className="mt-1 text-[13px] text-slate-600">Risk: {risk}</p>
      <div className="mt-2 h-2 rounded-full bg-[linear-gradient(90deg,#3d97ff_0%,#6ed777_50%,#ff8e62_100%)]" />
      <div className="mt-2 grid grid-cols-3 gap-2 text-[13px] font-medium text-slate-700">
        <span>{low}</span>
        <span className="text-center">{fair}</span>
        <span className="text-right">{high}</span>
      </div>
    </div>
  );
}

function GarageBlock({ garage }: { garage: GarageCard }) {
  return (
    <div className="rounded-xl border border-[#dbe6f4] bg-white p-4">
      <div className="flex gap-3">
        <img src={garage.image} alt={garage.name} className="h-16 w-20 rounded-xl object-cover" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[16px] font-medium text-slate-800">{garage.name}</p>
            <span className="rounded-lg bg-[#f8a401] px-2 py-1 text-[12px] font-medium text-white">{garage.price}</span>
          </div>
          <p className="text-[13px] text-slate-600">
            {garage.rating} ★ · {garage.reviews}
          </p>
          <p className="text-[12px] text-slate-500">{garage.distance}</p>
        </div>
      </div>
    </div>
  );
}

function MiniQuote({ garage, when }: { garage: string; when: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-[#dbe6f4] bg-white px-3 py-2">
      <div className="grid h-8 w-8 place-items-center rounded-full bg-[#e6f1ff] text-[#1e74ea]">
        <Car className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium text-slate-800">{garage}</p>
        <p className="truncate text-xs text-slate-500">{when}</p>
      </div>
      <Circle className="h-3 w-3 fill-[#8cc2ff] text-[#8cc2ff]" />
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone: 'blue' | 'orange' | 'green' | 'yellow';
}) {
  const toneClass = {
    blue: 'bg-[#e8f2ff] text-[#1d74ea]',
    orange: 'bg-[#fff2e3] text-[#e58516]',
    green: 'bg-[#e7faef] text-[#1d9960]',
    yellow: 'bg-[#fff8df] text-[#cf980e]',
  }[tone];

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#dbe6f4] bg-white p-3">
      <div className={cn('grid h-9 w-9 place-items-center rounded-lg', toneClass)}>
        <Wrench className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="truncate text-[20px] font-semibold leading-tight text-slate-900">{value}</p>
        {sub ? <p className="truncate text-xs text-slate-500">{sub}</p> : null}
      </div>
    </div>
  );
}
