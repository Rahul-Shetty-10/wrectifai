'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Grid3X3,
  List,
  Search,
  SlidersHorizontal,
  TriangleAlert,
  Zap,
  CheckCircle,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { SessionGuard } from '@/components/auth/session-guard';
import { UserSidebar, UserSidebarMobile } from '@/components/dashboard/user-sidebar';
import { UserTopLogoHeader } from '@/components/dashboard/user-top-logo-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  fetchIssueDetail,
  type IssueDetail,
  type UserQuotesBookingsContent,
  type UserSidebarContent,
  fetchIssueRequestsWithQuotes,
  type IssueRequestWithQuotes,
} from '@/lib/api';

type Props = {
  sidebar: UserSidebarContent;
  content: UserQuotesBookingsContent;
};

type ViewMode = 'grid' | 'list';
type SortOption = 'date_desc' | 'date_asc' | 'quotes_desc' | 'quotes_asc' | 'issue_asc' | 'issue_desc';
type PathFilter = 'all' | 'diy' | 'garage';

function formatIssueDate(value: string | Date | undefined) {
  const fallback = new Date();
  const parsed = value ? new Date(value) : fallback;
  return parsed.toLocaleDateString('en-US');
}

function inferSeverity(issue: IssueRequestWithQuotes): 'high' | 'medium' | 'low' {
  const raw = (issue.summary ?? '').toLowerCase();
  if (raw.includes('not_starting') || raw.includes('critical') || raw.includes('high')) return 'high';
  if (raw.includes('risky') || raw.includes('medium')) return 'medium';
  if (raw.includes('can_drive') || raw.includes('low')) return 'low';

  if (issue.summary.toLowerCase().includes('brake') || issue.summary.toLowerCase().includes('engine')) return 'high';
  if (issue.summary.toLowerCase().includes('noise') || issue.summary.toLowerCase().includes('knock')) return 'medium';
  return 'medium';
}

function normalizeStatus(issue: IssueRequestWithQuotes) {
  if (issue.status?.toLowerCase() === 'quote_accepted') return 'QUOTE ACCEPTED';
  if ((issue.quotes?.length ?? 0) > 0) return 'QUOTED';
  if (!issue.status) return 'OPEN';
  return issue.status.replace(/_/g, ' ').toUpperCase();
}

function getPendingQuotesCount(issue: IssueRequestWithQuotes): number {
  if (issue.status?.toLowerCase() === 'quote_accepted') {
    // If a quote is accepted, show remaining quotes as pending
    return Math.max(0, (issue.quotes?.length ?? 0) - 1);
  }
  // If no quote accepted yet, all quotes are pending
  return issue.quotes?.length ?? 0;
}

function severityClass(severity: 'high' | 'medium' | 'low') {
  if (severity === 'high') return 'border-red-200 bg-red-50 text-red-600';
  if (severity === 'low') return 'border-emerald-200 bg-emerald-50 text-emerald-600';
  return 'border-amber-200 bg-amber-50 text-amber-600';
}

function resolveVehicleLabel(issue: IssueRequestWithQuotes) {
  const trimmed = issue.vehicle_label?.trim();
  if (trimmed) return trimmed;
  return 'Vehicle details unavailable';
}

function issueTimestamp(issue: IssueRequestWithQuotes) {
  const ts = issue.created_at ? new Date(issue.created_at).getTime() : NaN;
  if (!Number.isNaN(ts)) return ts;
  return 0;
}

export function QuotesBookingsClient({ sidebar, content: _initialContent }: Props) {
  void _initialContent;
  const router = useRouter();
  const [requests, setRequests] = useState<IssueRequestWithQuotes[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailsIssue, setDetailsIssue] = useState<IssueRequestWithQuotes | null>(null);
  const [detailsPayload, setDetailsPayload] = useState<IssueDetail | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('all');
  const [selectedPath, setSelectedPath] = useState<PathFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('date_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const loadData = useCallback(async (showLoader = false) => {
    if (showLoader) setIsLoading(true);
    setError(null);
    try {
      const issues = await fetchIssueRequestsWithQuotes();
      setRequests(issues);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load quotes');
    } finally {
      if (showLoader) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData(true);
  }, [loadData]);

  useEffect(() => {
    const interval = setInterval(() => {
      void loadData(false);
    }, 15000);

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void loadData(false);
      }
    };

    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [loadData]);

  function formatFieldLabel(key: string) {
    if (key === '__selected_categories') return 'Selected categories';
    if (key === '__primary_category') return 'Primary category';
    return key
      .replace(/_/g, ' ')
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^\w/, (char) => char.toUpperCase());
  }

  function formatReadableText(value: string) {
    return value
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^\w/, (char) => char.toUpperCase());
  }

  function displayValue(value: unknown) {
    if (value === null || value === undefined || value === '') return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.map((item) => formatReadableText(String(item))).join(', ');
    if (typeof value === 'object') return JSON.stringify(value);
    return formatReadableText(String(value));
  }

  function parseSymptomEntry(symptom: string) {
    const [categoryRaw, fieldRaw, ...valueParts] = symptom.split(':');
    const valueRaw = valueParts.join(':');
    return {
      category: formatReadableText(categoryRaw || 'Other'),
      field: formatFieldLabel(fieldRaw || 'Symptom'),
      value: displayValue(valueRaw || ''),
    };
  }

  const handleViewQuotes = (issue: IssueRequestWithQuotes) => {
    router.push(`/user/quotes-bookings/${issue.id}`);
  };

  const handleViewDetails = async (issue: IssueRequestWithQuotes) => {
    setDetailsIssue(issue);
    setShowDetailsModal(true);
    setDetailsLoading(true);
    setDetailsPayload(null);
    try {
      const payload = await fetchIssueDetail(issue.id);
      setDetailsPayload(payload);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load issue details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const totalQuotes = useMemo(
    () => requests.reduce((acc, req) => acc + (req.quotes?.length ?? 0), 0),
    [requests]
  );

  const pendingAiVerification = useMemo(
    () =>
      requests.filter((issue) => normalizeStatus(issue) === 'OPEN').length,
    [requests]
  );

  const savingsToDate = useMemo(() => 0, []);

  const vehicleOptions = useMemo(() => {
    const uniqueVehicles = new Set<string>();
    requests.forEach((req) => {
      uniqueVehicles.add(resolveVehicleLabel(req));
    });
    return Array.from(uniqueVehicles).sort((a, b) => a.localeCompare(b));
  }, [requests]);

  const searchedRequests = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return requests;
    return requests.filter((req) => {
      const vehicleMatch = resolveVehicleLabel(req).toLowerCase().includes(term);
      return req.summary.toLowerCase().includes(term) || vehicleMatch;
    });
  }, [requests, search]);

  const filteredRequests = useMemo(() => {
    const pathFiltered =
      selectedPath === 'all'
        ? searchedRequests
        : searchedRequests.filter((req) => classifyPath(req) === selectedPath);

    const vehicleFiltered =
      selectedVehicle === 'all'
        ? pathFiltered
        : pathFiltered.filter((req) => resolveVehicleLabel(req) === selectedVehicle);

    const sorted = [...vehicleFiltered];
    if (sortOption === 'date_desc') {
      sorted.sort((a, b) => issueTimestamp(b) - issueTimestamp(a));
    } else if (sortOption === 'date_asc') {
      sorted.sort((a, b) => issueTimestamp(a) - issueTimestamp(b));
    } else if (sortOption === 'quotes_desc') {
      sorted.sort((a, b) => (b.quotes?.length ?? 0) - (a.quotes?.length ?? 0));
    } else if (sortOption === 'quotes_asc') {
      sorted.sort((a, b) => (a.quotes?.length ?? 0) - (b.quotes?.length ?? 0));
    } else if (sortOption === 'issue_asc') {
      sorted.sort((a, b) => a.summary.localeCompare(b.summary));
    } else {
      sorted.sort((a, b) => b.summary.localeCompare(a.summary));
    }
    return sorted;
  }, [searchedRequests, selectedPath, selectedVehicle, sortOption]);

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

  const resetPage = () => setCurrentPage(1);

  useEffect(() => {
    resetPage();
  }, [search, selectedPath, selectedVehicle, sortOption]);

  function classifyPath(issue: IssueRequestWithQuotes): 'diy' | 'garage' {
    const status = (issue.status ?? '').toLowerCase();
    if (status === 'quotes_pending' || status === 'quote_accepted') return 'garage';
    if ((issue.quotes?.length ?? 0) > 0) return 'garage';
    return 'diy';
  }

  function formatIssueDate(value: string | Date | undefined) {
    const fallback = new Date();
    const parsed = value ? new Date(value) : fallback;
    return parsed.toLocaleDateString('en-US');
  }

  return (
    <div className="flex h-screen bg-background">
      <SessionGuard requiredRole="user" />
      <UserSidebarMobile activeItem="quotes-bookings" content={sidebar} />
      <div className="hidden lg:block">
        <UserSidebar activeItem="quotes-bookings" content={sidebar} />
      </div>

      <section className="flex-1 overflow-y-auto bg-[#f1f3f8] text-sm">
        <div className="mx-auto max-w-7xl p-6 md:p-8">
          <UserTopLogoHeader sidebar={sidebar} />

          <div className="mt-6">
            <h1 className="text-xl font-bold text-slate-900">Service Quotes</h1>
            <p className="mt-1 text-xs text-slate-500">
              Track and compare garage offers for your vehicle repairs.
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="rounded-2xl border-[#d9e2ef] bg-white shadow-none">
              <CardContent className="p-4 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8599b8]">Active Requests</p>
                <p className="mt-2 text-xl leading-none font-bold text-[#2456f5]">{requests.length}</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-[#d9e2ef] bg-white shadow-none">
              <CardContent className="p-4 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8599b8]">Total Quotes</p>
                <p className="mt-2 text-xl leading-none font-bold text-[#039167]">{totalQuotes}</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-[#d9e2ef] bg-white shadow-none">
              <CardContent className="p-4 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8599b8]">Pending AI Verification</p>
                <p className="mt-2 text-xl leading-none font-bold text-[#cb7a00]">{pendingAiVerification}</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-[#d9e2ef] bg-white shadow-none">
              <CardContent className="p-4 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8599b8]">Savings To Date</p>
                <p className="mt-2 text-xl leading-none font-bold text-[#0f2547]">${savingsToDate}</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-[#d9e2ef] bg-white p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
            <label className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-transparent px-3 py-2">
              <Search className="h-5 w-5 text-[#b7c3d6]" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full border-none bg-transparent text-xs sm:text-sm text-[#2b4368] outline-none placeholder:text-[#bcc7d8]"
                  placeholder="Search by issue or vehicle..."
                />
              </label>

            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                type="button"
                variant="ghost"
                className="h-10 rounded-xl bg-[#f4f7fc] px-3 text-sm font-semibold text-[#2c4468] hover:bg-[#ecf1f8] sm:h-11 sm:px-4"
                onClick={() => {
                  setIsFilterOpen((prev) => !prev);
                  setIsSortOpen(false);
                }}
              >
                <TriangleAlert className="mr-1.5 h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Filter</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-10 rounded-xl bg-[#f4f7fc] px-3 text-sm font-semibold text-[#2c4468] hover:bg-[#ecf1f8] sm:h-11 sm:px-4"
                onClick={() => {
                  setIsSortOpen((prev) => !prev);
                  setIsFilterOpen(false);
                }}
              >
                <SlidersHorizontal className="mr-1.5 h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Sort</span>
              </Button>

              <div className="mx-1 h-8 w-px bg-[#dce3ef] hidden sm:block" />

              <div className="flex rounded-2xl bg-[#f4f7fc] p-1">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`rounded-xl px-2.5 py-2 ${viewMode === 'grid' ? 'bg-white text-[#2456f5] shadow-sm' : 'text-[#8ca0bb]'}`}
                  aria-label="Grid view"
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`rounded-xl px-2.5 py-2 ${viewMode === 'list' ? 'bg-white text-[#2456f5] shadow-sm' : 'text-[#8ca0bb]'}`}
                  aria-label="List view"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {isFilterOpen ? (
            <div className="mt-3 rounded-2xl border border-[#d9e2ef] bg-white p-4">
              <p className="mb-3 text-sm font-semibold text-[#2c4468]">Filter by Type</p>
              <div className="mb-4 flex flex-wrap gap-2">
                {[
                  { label: 'All', value: 'all' as PathFilter },
                  { label: 'DIY', value: 'diy' as PathFilter },
                  { label: 'Garage', value: 'garage' as PathFilter },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedPath(option.value)}
                    className={`rounded-full border px-3 py-1.5 text-sm ${
                      selectedPath === option.value
                        ? 'border-[#2456f5] bg-[#edf3ff] text-[#2456f5]'
                        : 'border-[#d9e2ef] bg-white text-[#2c4468]'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <p className="mb-3 text-sm font-semibold text-[#2c4468]">Filter by Vehicle</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedVehicle('all')}
                  className={`rounded-full border px-3 py-1.5 text-sm ${
                    selectedVehicle === 'all'
                      ? 'border-[#2456f5] bg-[#edf3ff] text-[#2456f5]'
                      : 'border-[#d9e2ef] bg-white text-[#2c4468]'
                  }`}
                >
                  All Vehicles
                </button>
                {vehicleOptions.map((vehicleName) => (
                  <button
                    key={vehicleName}
                    type="button"
                    onClick={() => setSelectedVehicle(vehicleName)}
                    className={`rounded-full border px-3 py-1.5 text-sm ${
                      selectedVehicle === vehicleName
                        ? 'border-[#2456f5] bg-[#edf3ff] text-[#2456f5]'
                        : 'border-[#d9e2ef] bg-white text-[#2c4468]'
                    }`}
                  >
                    {vehicleName}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {isSortOpen ? (
            <div className="mt-3 rounded-2xl border border-[#d9e2ef] bg-white p-4">
              <p className="mb-3 text-sm font-semibold text-[#2c4468]">Sort Issues</p>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                {[
                  { label: 'Newest First', value: 'date_desc' as SortOption },
                  { label: 'Oldest First', value: 'date_asc' as SortOption },
                  { label: 'Most Quotes', value: 'quotes_desc' as SortOption },
                  { label: 'Least Quotes', value: 'quotes_asc' as SortOption },
                  { label: 'Issue A-Z', value: 'issue_asc' as SortOption },
                  { label: 'Issue Z-A', value: 'issue_desc' as SortOption },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSortOption(option.value)}
                    className={`rounded-full border px-3 py-1.5 text-sm ${
                      sortOption === option.value
                        ? 'border-[#2456f5] bg-[#edf3ff] text-[#2456f5]'
                        : 'border-[#d9e2ef] bg-white text-[#2c4468]'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

              {error ? <p className="mt-5 text-xs sm:text-sm font-medium text-destructive">{error}</p> : null}

          {isLoading ? (
            <div className="mt-16 flex items-center justify-center">
              <div className="h-11 w-11 animate-spin rounded-full border-[3px] border-[#cfd8e8] border-t-[#2456f5]" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-[#d9e2ef] bg-white p-6 sm:p-8 text-center text-[#6c809e]">
              No quote requests found.
            </div>
          ) : (
            <div
              className={`mt-6 ${
                viewMode === 'grid'
                  ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
                  : 'flex flex-col gap-4'
              }`}
            >
              {paginatedRequests.map((issue) => {
                const severity = inferSeverity(issue);
                const vehicleLabel = resolveVehicleLabel(issue);
                const pathType = classifyPath(issue);
                const isDiy = pathType === 'diy';
                const pendingQuotesCount = getPendingQuotesCount(issue);

                return (
                  <Card
                    key={issue.id}
                    className="relative rounded-2xl border-[#d9e2ef] bg-white shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(33,61,105,0.1)]"
                  >
                    {pendingQuotesCount > 0 && (
                      <Badge className="absolute right-4 top-4 z-10 h-6 min-w-6 rounded-full bg-[#2456f5] px-2 text-xs font-bold text-white sm:right-5 sm:top-5">
                        {pendingQuotesCount}
                      </Badge>
                    )}
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-2 sm:items-center sm:gap-3">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none sm:px-3 sm:py-1 sm:text-xs ${severityClass(severity)}`}>
                            <AlertTriangle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            {severity.toUpperCase()}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none sm:px-3 sm:py-1 sm:text-xs ${
                              isDiy
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-[#bad5fb] bg-[#f4f8ff] text-[#0f62d6]'
                            }`}
                          >
                            {isDiy ? 'DIY' : 'Garage'}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-[#9aacc7] sm:text-sm">{formatIssueDate(issue.created_at)}</p>
                      </div>

                      <h3 className="mt-3 line-clamp-2 text-lg font-bold text-slate-900 sm:mt-4 sm:text-xl sm:leading-tight">
                        {issue.summary}
                      </h3>
                      <p className="mt-1.5 text-xs sm:text-sm text-[#47688f]">{vehicleLabel}</p>

                      <div className="my-4 h-px bg-[#e6ebf3]" />

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-9 rounded-lg border-[#d9e2ef] px-3 text-xs font-semibold text-[#2c4468] hover:bg-[#f4f8ff]"
                          onClick={() => void handleViewDetails(issue)}
                        >
                          View Details
                        </Button>
                        <Button
                          type="button"
                          className="h-9 rounded-lg bg-[#2456f5] px-3 text-xs font-semibold text-white hover:bg-[#1e49d1]"
                          onClick={() => handleViewQuotes(issue)}
                        >
                          {isDiy ? 'View DIY Steps' : 'View Quotes'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {filteredRequests.length > 0 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-xs sm:text-sm text-slate-500">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredRequests.length)} of {filteredRequests.length} requests
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
                <span className="text-xs sm:text-sm text-slate-700">
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
        </div>
      </section>

      {/* Quotes Modal */}
      {showDetailsModal && detailsIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border-[#d9e2ef] bg-white shadow-none sm:rounded-3xl">
            <CardHeader className="border-b border-[#e6ebf2] pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900">Issue Details</CardTitle>
                  <p className="mt-1 text-xs text-slate-500">{detailsIssue.summary}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setShowDetailsModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
              {detailsLoading ? (
                <div className="py-8 text-center text-xs text-slate-500">Loading details...</div>
              ) : !detailsPayload ? (
                <div className="py-8 text-center text-xs text-slate-500">No details available.</div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="rounded-lg border border-[#dbe5f4] bg-[#f8fbff] p-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#7f95b4]">Category</p>
                      <p className="mt-1 text-xs font-semibold text-slate-900">{formatReadableText(detailsPayload.issuePayload?.issue?.category ?? 'N/A')}</p>
                    </div>
                    <div className="rounded-lg border border-[#dbe5f4] bg-[#f8fbff] p-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#7f95b4]">Severity</p>
                      <p className="mt-1 text-xs font-semibold text-slate-900">{formatReadableText(detailsPayload.issuePayload?.issue?.severity ?? 'N/A')}</p>
                    </div>
                    <div className="rounded-lg border border-[#dbe5f4] bg-[#f8fbff] p-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#7f95b4]">When It Started</p>
                      <p className="mt-1 text-xs font-semibold text-slate-900">{formatReadableText(detailsPayload.issuePayload?.issue?.sinceWhen ?? 'N/A')}</p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-[#dbe5f4] bg-[#f8fbff] p-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#7f95b4]">Description</p>
                    <p className="mt-1 text-xs text-slate-800">{formatReadableText(detailsPayload.issuePayload?.issue?.description ?? detailsPayload.summary ?? 'N/A')}</p>
                  </div>

                  {(detailsPayload.issuePayload?.issue?.symptoms?.length ?? 0) > 0 ? (
                    <div>
                      <p className="text-xs font-semibold text-slate-900">Symptoms</p>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {(detailsPayload.issuePayload?.issue?.symptoms ?? []).map((symptom, index) => {
                          const parsed = parseSymptomEntry(symptom);
                          return (
                            <div key={`${symptom}-${index}`} className="rounded-lg border border-[#e2e8f3] bg-[#fbfdff] p-2.5">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-semibold text-slate-900">{parsed.field}</p>
                                <Badge variant="outline" className="border-[#d2deef] bg-white text-[10px] uppercase text-[#4f6b93]">
                                  {parsed.category}
                                </Badge>
                              </div>
                              <p className="mt-1 text-xs text-slate-700">{parsed.value}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {Object.keys(detailsPayload.issuePayload?.issue?.answers ?? {}).length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold text-slate-900">Answers Provided</p>
                      <div className="mt-2 overflow-hidden rounded-lg border border-[#e2e8f3]">
                        {Object.entries(detailsPayload.issuePayload?.issue?.answers ?? {}).map(([key, value], index, arr) => (
                          <div
                            key={key}
                            className={`grid gap-1 bg-white px-2.5 py-2 sm:grid-cols-[180px_1fr] ${
                              index !== arr.length - 1 ? 'border-b border-[#edf2f9]' : ''
                            }`}
                          >
                            <p className="text-[11px] font-semibold tracking-[0.04em] text-[#5c7699]">
                              {formatFieldLabel(key)}
                            </p>
                            <p className="text-xs text-slate-800">{displayValue(value)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
