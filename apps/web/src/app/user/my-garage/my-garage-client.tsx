'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CarFront,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  Star,
  Trash2,
  Search,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { UserThemeShell } from '@/components/dashboard/user-theme-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  addUserVehicle,
  deleteUserVehicle,
  fetchUserVehicles,
  fetchVehicleHistory,
  setDefaultUserVehicle,
  uploadRcAndSuggest,
  type UserMyGarageContent,
  type UserSidebarContent,
  type UserVehicle,
  type VehicleHistoryEntry,
} from '@/lib/api';

type Props = {
  sidebar: UserSidebarContent;
  content: UserMyGarageContent;
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

const EMPTY_FORM: VehicleFormState = {
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

const VEHICLE_IMAGES = [
  'https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1000&q=80',
];

export function MyGarageClient({ sidebar, content }: Props) {
  const [search, setSearch] = useState('');
  const [vehicles, setVehicles] = useState<UserVehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [history, setHistory] = useState<VehicleHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [vehicleToSetDefault, setVehicleToSetDefault] = useState<UserVehicle | null>(null);
  const [settingDefaultVehicleId, setSettingDefaultVehicleId] = useState<string | null>(null);
  const [vehicleToDelete, setVehicleToDelete] = useState<UserVehicle | null>(null);
  const [deletingVehicleId, setDeletingVehicleId] = useState<string | null>(null);

  const [rcText, setRcText] = useState('');
  const [form, setForm] = useState<VehicleFormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof VehicleFormState, string>>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [processingRc, setProcessingRc] = useState(false);
  const [vehiclePage, setVehiclePage] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadVehicles(search);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!selectedVehicleId) {
      setHistory([]);
      return;
    }
    void loadHistory(selectedVehicleId, search);
  }, [selectedVehicleId, search]);

  async function loadVehicles(searchTerm: string) {
    try {
      const data = await fetchUserVehicles(searchTerm);
      setVehicles(data);

      if (data.length === 0) {
        setSelectedVehicleId(null);
        return;
      }

      const stillExists = data.some((v) => v.id === selectedVehicleId);
      if (!stillExists) {
        setSelectedVehicleId(data.find((v) => v.isDefault)?.id ?? data[0].id);
      }
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : content.forms.loadVehiclesErrorLabel);
    }
  }

  async function loadHistory(vehicleId: string, searchTerm: string) {
    try {
      setHistoryLoading(true);
      const data = await fetchVehicleHistory(vehicleId, searchTerm);
      setHistory(data);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handleApplyRcSuggestion() {
    if (!rcText.trim()) return;

    try {
      setProcessingRc(true);
      const suggestion = await uploadRcAndSuggest(rcText);
      setForm((prev) => ({
        ...prev,
        make: suggestion.make ?? prev.make,
        model: suggestion.model ?? prev.model,
        year: suggestion.year ? String(suggestion.year) : prev.year,
        fuelType: suggestion.fuelType ?? prev.fuelType,
        vin: suggestion.vin ?? prev.vin,
        plateNumber: suggestion.plateNumber ?? prev.plateNumber,
      }));
      setFormErrors({});
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : content.forms.processRcErrorLabel);
    } finally {
      setProcessingRc(false);
    }
  }

  function validateForm() {
    const errors: Partial<Record<keyof VehicleFormState, string>> = {};
    const yearNum = Number(form.year);

    if (!form.make.trim()) errors.make = content.forms.requiredFieldsErrorLabel;
    if (!form.model.trim()) errors.model = content.forms.requiredFieldsErrorLabel;
    if (!form.fuelType.trim()) errors.fuelType = content.forms.requiredFieldsErrorLabel;
    if (!form.year.trim() || !Number.isInteger(yearNum)) {
      errors.year = content.forms.requiredFieldsErrorLabel;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleAddVehicle() {
    setGlobalError(null);
    if (!validateForm()) return;

    const yearNum = Number(form.year);
    const mileageNum = form.mileage ? Number(form.mileage) : undefined;

    try {
      setSubmitting(true);
      const result = await addUserVehicle({
        make: form.make.trim(),
        model: form.model.trim(),
        year: yearNum,
        fuelType: form.fuelType.trim(),
        trim: form.trim.trim() || undefined,
        mileage: Number.isFinite(mileageNum) ? mileageNum : undefined,
        engineType: form.engineType.trim() || undefined,
        vin: form.vin.trim() || undefined,
        plateNumber: form.plateNumber.trim() || undefined,
        warrantyDetails: form.warrantyDetails.trim() || undefined,
        isDefault: vehicles.length === 0,
      });

      await loadVehicles(search);
      if (result.vehicleId) setSelectedVehicleId(result.vehicleId);

      setShowAddForm(false);
      setForm(EMPTY_FORM);
      setRcText('');
      setFormErrors({});
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : content.forms.addVehicleErrorLabel);
    } finally {
      setSubmitting(false);
    }
  }

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? null,
    [vehicles, selectedVehicleId]
  );

  const visibleVehicles = vehicles;
  const VEHICLES_PER_PAGE = 2;
  const totalVehiclePages = Math.max(1, Math.ceil(visibleVehicles.length / VEHICLES_PER_PAGE));
  const pagedVehicles = visibleVehicles.slice(
    vehiclePage * VEHICLES_PER_PAGE,
    vehiclePage * VEHICLES_PER_PAGE + VEHICLES_PER_PAGE
  );

  useEffect(() => {
    if (vehiclePage > totalVehiclePages - 1) {
      setVehiclePage(Math.max(0, totalVehiclePages - 1));
    }
  }, [totalVehiclePages, vehiclePage]);

  return (
    <>
      <UserThemeShell activeItem="my-garage" sidebar={sidebar}>
      <section className="overflow-y-auto bg-[#f8fafe]">
        <div className="mx-auto w-full max-w-[1280px] px-4 py-4 sm:px-6 sm:py-5">
          <div className="mb-4 sm:mb-6 flex flex-col gap-4 border-b border-[#e6ebf2] pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold leading-none text-[#0f2244] md:text-3xl sm:text-4xl">MyGarage</h1>
              <p className="mt-1 text-xs font-medium text-[#6f7f9b] sm:text-sm">Precision Driver Fleet Management</p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:max-w-[560px] sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ba9bf]" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search vehicle ID..."
                  className="h-10 rounded-xl border-[#dce4ef] bg-white pl-10 text-sm sm:h-12"
                />
              </div>
              <Button
                onClick={() => setShowAddForm(true)}
                className="h-10 rounded-xl bg-[#0989d8] px-4 text-sm font-semibold text-white hover:bg-[#0874b8] sm:h-12 sm:px-6"
              >
                <CirclePlus className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Add New Vehicle</span>
                <span className="sm:hidden ml-2">Add</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_360px]">
            <div>
              <div className="mb-3 sm:mb-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-5 w-1 rounded-full bg-[#4ec2ed] sm:h-6" />
                  <h2 className="text-xl font-semibold tracking-tight text-[#0f2244] sm:text-2xl">Active Inventory</h2>
                </div>
                {visibleVehicles.length > VEHICLES_PER_PAGE ? (
                  <div className="flex items-center gap-2">
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
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pagedVehicles.map((vehicle, index) => {
                  const active = vehicle.id === selectedVehicle?.id;
                  return (
                    <button
                      key={vehicle.id}
                      onClick={() => setSelectedVehicleId(vehicle.id)}
                      className={`overflow-hidden rounded-xl border bg-white p-3 text-left transition ${
                        active ? 'border-[#8ed5ef] shadow-[0_6px_16px_rgba(73,144,196,0.14)]' : 'border-[#dde6f0]'
                      }`}
                    >
                        <div className="relative mb-2.5 sm:mb-3 h-40 sm:h-56 overflow-hidden rounded-xl">
                          <img
                            src={VEHICLE_IMAGES[index % VEHICLE_IMAGES.length]}
                            alt={`${vehicle.make} ${vehicle.model}`}
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                          {vehicle.isDefault ? (
                            <span className="absolute right-2 top-2 rounded-full bg-[#dbfff0] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#00a56a] sm:px-2.5 sm:py-1 sm:text-[10px]">
                              Default
                            </span>
                          ) : null}
                        </div>

                        <div className="space-y-2.5 text-[#203457] sm:space-y-3">
                          <div>
                            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#97a9c1] sm:text-[10px]">Vehicle</p>
                            <p className="mt-1 text-sm font-semibold sm:text-base">{vehicle.make} {vehicle.model}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#97a9c1] sm:text-[10px]">Details</p>
                            <div className="mt-1 space-y-0.5 text-xs font-semibold sm:space-y-1 sm:text-sm">
                              <p>Model: {vehicle.model}</p>
                              <p>Year: {vehicle.year}</p>
                              <p>Fuel Type: {vehicle.fuelType}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setVehicleToSetDefault(vehicle);
                              }}
                              className="h-7 px-2 text-[10px] sm:h-8 sm:px-3 sm:text-xs"
                            >
                              <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              <span className="hidden sm:inline ml-1">Default</span>
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setVehicleToDelete(vehicle);
                              }}
                              className="h-7 px-2 text-[10px] text-destructive hover:text-destructive sm:h-8 sm:px-3 sm:text-xs"
                            >
                              <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              <span className="hidden sm:inline ml-1">Delete</span>
                            </Button>
                          </div>
                        </div>
                    </button>
                  );
                })}

                <button
                  onClick={() => setShowAddForm(true)}
                  className="grid min-h-[280px] sm:min-h-[370px] place-items-center rounded-xl border border-dashed border-[#cfdced] bg-[#f5f8fd] text-center text-[#90a4c2] transition hover:border-[#7abfe6] hover:text-[#4db5df]"
                >
                  <div className="space-y-2">
                    <CirclePlus className="mx-auto h-6 w-6 sm:h-8 sm:w-8" />
                    <p className="text-xs font-semibold sm:text-sm">Add New Vehicle</p>
                  </div>
                </button>
              </div>
            </div>

            <Card className="rounded-xl border-[#d9e2ef] bg-white shadow-[0_6px_16px_rgba(94,126,179,0.10)]">
              <CardContent className="p-5">
                <div className="mb-4 flex items-center gap-2">
                  <span className="h-6 w-1 rounded-full bg-[#0f2244]" />
                  <h2 className="text-2xl font-semibold tracking-tight text-[#0f2244]">Service Logs</h2>
                </div>

                <div className="space-y-5">
                  {historyLoading ? (
                    <p className="text-sm text-[#92a4be]">Loading history...</p>
                  ) : history.length === 0 ? (
                    <p className="text-sm text-[#92a4be]">No service logs available.</p>
                  ) : (
                    history.slice(0, 3).map((entry, index) => (
                      <div key={entry.id} className="flex gap-3">
                        <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-lg bg-[#f4f8ff] text-[#76b5ff]">
                          {index % 2 === 0 ? <Wrench className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-[#10264a]">{entry.title}</p>
                            <p className="text-[10px] font-semibold uppercase text-[#9aaac1]">{formatCompactDate(entry.date)}</p>
                          </div>
                          <p className="text-xs text-[#7f91ac]">{entry.subtitle}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <button className="mt-8 w-full text-center text-[11px] font-semibold uppercase tracking-[0.1em] text-[#56bce6]">
                  View Comprehensive History
                </button>
              </CardContent>
            </Card>
          </div>

          {globalError ? (
            <p className="mt-4 text-sm text-red-600">{globalError}</p>
          ) : null}
        </div>
      </section>
      </UserThemeShell>

      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl border border-[#d5e2f4] bg-[#f7fbff] p-0 shadow-[0_24px_56px_rgba(26,54,101,0.24)] sm:max-w-4xl [&>button]:right-5 [&>button]:top-5 [&>button]:rounded-full [&>button]:border [&>button]:border-[#d3dfef] [&>button]:bg-white [&>button]:p-1 [&>button]:text-[#60738f] [&>button]:opacity-100">
          <DialogHeader className="border-b border-[#dce7f6] bg-[linear-gradient(180deg,#f9fcff_0%,#eef5ff_100%)] px-6 py-5 sm:px-7">
            <DialogTitle className="flex items-center gap-3 text-[32px] font-semibold tracking-tight text-[#0f2244]">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e6f0ff] text-[#2a7cea]">
                <CarFront className="h-5 w-5" />
              </span>
              {content.forms.addVehicleTitle}
            </DialogTitle>
            <p className="pt-1 text-[13px] font-medium text-[#70839f]">
              Enter vehicle details manually or paste RC text for quick auto-fill.
            </p>
          </DialogHeader>

          <div className="space-y-4 p-6 sm:p-7">
            <div className="rounded-2xl border border-[#cfe1fb] bg-[linear-gradient(180deg,#f2f8ff_0%,#ecf4ff_100%)] p-4 sm:p-5">
              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <div className="space-y-2">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#4d6fa6]">
                    {content.forms.rcInputLabel}
                  </p>
                  <Input
                    value={rcText}
                    onChange={(e) => setRcText(e.target.value)}
                    placeholder={content.forms.rcInputPlaceholder}
                    className="h-11 rounded-xl border-[#bdd3f6] bg-white text-[14px] text-[#233c60] placeholder:text-[#9aa9bf] focus-visible:ring-2 focus-visible:ring-[#78adff]"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    variant="secondary"
                    className="h-11 w-full rounded-xl border border-[#bcd3f7] bg-white px-5 text-[13px] font-semibold text-[#1f6fdf] hover:bg-[#edf4ff] md:w-auto"
                    onClick={handleApplyRcSuggestion}
                    disabled={processingRc || !rcText.trim()}
                  >
                    {processingRc ? `${content.forms.applyRcSuggestionLabel}...` : content.forms.applyRcSuggestionLabel}
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#d5e2f4] bg-white p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-[#e8f0fb] pb-3">
                <p className="text-[15px] font-semibold text-[#163153]">Vehicle Details</p>
                <p className="text-[12px] font-medium text-[#7d8fa9]">Fields marked * are required</p>
              </div>

              <div className="mb-3 grid gap-3 md:grid-cols-2">
                <LabeledInput
                  id="make"
                  label={content.forms.makeLabel}
                  value={form.make}
                  placeholder="e.g., Toyota"
                  required
                  error={formErrors.make}
                  onChange={(value) => setForm((prev) => ({ ...prev, make: value }))}
                />
                <LabeledInput
                  id="model"
                  label={content.forms.modelLabel}
                  value={form.model}
                  placeholder="e.g., Corolla"
                  required
                  error={formErrors.model}
                  onChange={(value) => setForm((prev) => ({ ...prev, model: value }))}
                />
                <LabeledInput
                  id="year"
                  label={content.forms.yearLabel}
                  value={form.year}
                  placeholder="e.g., 2022"
                  required
                  error={formErrors.year}
                  type="number"
                  onChange={(value) => setForm((prev) => ({ ...prev, year: value }))}
                />
                <LabeledInput
                  id="fuelType"
                  label={content.forms.fuelTypeLabel}
                  value={form.fuelType}
                  placeholder="e.g., Petrol"
                  required
                  error={formErrors.fuelType}
                  onChange={(value) => setForm((prev) => ({ ...prev, fuelType: value }))}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <LabeledInput
                  id="trim"
                  label={content.forms.trimLabel}
                  value={form.trim}
                  placeholder="e.g., ZX"
                  onChange={(value) => setForm((prev) => ({ ...prev, trim: value }))}
                />
                <LabeledInput
                  id="mileage"
                  label={content.forms.mileageLabel}
                  value={form.mileage}
                  type="number"
                  placeholder="e.g., 12000"
                  onChange={(value) => setForm((prev) => ({ ...prev, mileage: value }))}
                />
                <LabeledInput
                  id="engineType"
                  label={content.forms.engineTypeLabel}
                  value={form.engineType}
                  placeholder="e.g., 1.5L i-VTEC"
                  onChange={(value) => setForm((prev) => ({ ...prev, engineType: value }))}
                />
                <LabeledInput
                  id="vin"
                  label={content.forms.vinLabel}
                  value={form.vin}
                  placeholder="17-character VIN"
                  onChange={(value) => setForm((prev) => ({ ...prev, vin: value }))}
                />
                <LabeledInput
                  id="plateNumber"
                  label={content.forms.plateLabel}
                  value={form.plateNumber}
                  placeholder="e.g., KA01AB1234"
                  onChange={(value) => setForm((prev) => ({ ...prev, plateNumber: value }))}
                />
                <LabeledInput id="warrantyDetails" label={content.forms.warrantyLabel} value={form.warrantyDetails} placeholder={content.forms.warrantyPlaceholder} onChange={(value) => setForm((prev) => ({ ...prev, warrantyDetails: value }))} />
              </div>
            </div>

            <div className="sticky bottom-0 z-10 -mx-6 -mb-6 flex flex-wrap gap-3 border-t border-[#dce8f8] bg-[#f7fbff] px-6 py-4 sm:-mx-7 sm:-mb-7 sm:px-7">
              <Button
                onClick={handleAddVehicle}
                disabled={submitting}
                className="h-11 min-w-36 rounded-xl bg-[#1677f2] px-5 text-[13px] font-semibold text-white hover:bg-[#0f66d7]"
              >
                {submitting ? `${content.forms.saveVehicleLabel}...` : content.forms.saveVehicleLabel}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowAddForm(false)}
                className="h-11 min-w-28 rounded-xl border border-[#d3dfef] bg-white px-5 text-[13px] font-semibold text-[#365179] hover:bg-[#edf3fb]"
              >
                {content.forms.cancelLabel}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(vehicleToDelete)} onOpenChange={(open) => !open && setVehicleToDelete(null)}>
        <DialogContent className="rounded-xl border-[#d9e2ef] bg-white shadow-[0_16px_40px_rgba(33,61,105,0.18)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Vehicle</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-foreground">
              {vehicleToDelete ? `${vehicleToDelete.year} ${vehicleToDelete.make} ${vehicleToDelete.model}` : 'this vehicle'}
            </span>
            ? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVehicleToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!vehicleToDelete || deletingVehicleId === vehicleToDelete.id}
              onClick={async () => {
                if (!vehicleToDelete) return;
                try {
                  setDeletingVehicleId(vehicleToDelete.id);
                  await deleteUserVehicle(vehicleToDelete.id);
                  await loadVehicles(search);
                  setVehicleToDelete(null);
                } catch (error) {
                  setGlobalError(error instanceof Error ? error.message : 'Failed to delete vehicle');
                } finally {
                  setDeletingVehicleId(null);
                }
              }}
            >
              {deletingVehicleId && vehicleToDelete && deletingVehicleId === vehicleToDelete.id
                ? 'Deleting...'
                : 'Delete Vehicle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(vehicleToSetDefault)} onOpenChange={(open) => !open && setVehicleToSetDefault(null)}>
        <DialogContent className="rounded-xl border-[#d9e2ef] bg-white shadow-[0_16px_40px_rgba(33,61,105,0.18)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Default Vehicle</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Make{' '}
            <span className="font-semibold text-foreground">
              {vehicleToSetDefault
                ? `${vehicleToSetDefault.year} ${vehicleToSetDefault.make} ${vehicleToSetDefault.model}`
                : 'this vehicle'}
            </span>{' '}
            your default vehicle?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVehicleToSetDefault(null)}>
              Cancel
            </Button>
            <Button
              disabled={!vehicleToSetDefault || settingDefaultVehicleId === vehicleToSetDefault.id}
              onClick={async () => {
                if (!vehicleToSetDefault) return;
                try {
                  setSettingDefaultVehicleId(vehicleToSetDefault.id);
                  await setDefaultUserVehicle(vehicleToSetDefault.id);
                  await loadVehicles(search);
                  setVehicleToSetDefault(null);
                } catch (error) {
                  setGlobalError(error instanceof Error ? error.message : 'Failed to set default');
                } finally {
                  setSettingDefaultVehicleId(null);
                }
              }}
            >
              {settingDefaultVehicleId && vehicleToSetDefault && settingDefaultVehicleId === vehicleToSetDefault.id
                ? 'Updating...'
                : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function LabeledInput({
  id,
  label,
  value,
  onChange,
  error,
  required,
  type = 'text',
  placeholder,
}: {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  const safeLabel = typeof label === 'string' && label.trim() ? label : id;
  const displayLabel = safeLabel.replace(/\s*\*\s*$/, '');
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={id}
        className={`text-[12px] font-semibold uppercase tracking-[0.1em] ${
          error ? 'text-destructive' : 'text-[#5d708f]'
        }`}
      >
        {displayLabel} {required ? <span className="text-destructive">*</span> : null}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`h-11 rounded-xl border bg-[#fbfdff] text-[14px] text-[#263f61] placeholder:text-[#9baabc] focus-visible:ring-2 ${
          error
            ? 'border-destructive focus-visible:ring-destructive'
            : 'border-[#d5e1f0] focus-visible:ring-[#78adff]'
        }`}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function formatCompactDate(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return '--';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHrs >= 1 && diffHrs <= 23) return `${diffHrs}H AGO`;

  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase();
}
