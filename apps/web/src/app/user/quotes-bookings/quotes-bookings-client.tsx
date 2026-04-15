'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  MapPin,
  Star,
  Wallet,
} from 'lucide-react';
import { SessionGuard } from '@/components/auth/session-guard';
import { UserSidebar, UserSidebarMobile } from '@/components/dashboard/user-sidebar';
import { UserTopLogoHeader } from '@/components/dashboard/user-top-logo-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  type UserQuotesBookingsContent, 
  type UserSidebarContent,
  type MockIssueRequest,
  type MockBooking,
  createIssueRequest,
  createPaymentIntent,
  fetchIssueQuotes,
  fetchIssueRequests,
  fetchUserBookings,
  fetchUserVehicles,
  selectQuote,
  updateBooking,
  USER_QUOTES_BOOKINGS_DEFAULT
} from '@/lib/api';

type Props = {
  sidebar: UserSidebarContent;
  content: UserQuotesBookingsContent;
};

type Tab = 'quotes' | 'bookings';

export function QuotesBookingsClient({ sidebar, content: initialContent }: Props) {
  const router = useRouter();
  const content = initialContent?.header && initialContent?.quotes ? initialContent : USER_QUOTES_BOOKINGS_DEFAULT;
  const [activeTab, setActiveTab] = useState<Tab>('quotes');
  const [selectedIssueId, setSelectedIssueId] = useState<string>('');
  
  const [requests, setRequests] = useState<MockIssueRequest[]>([]);
  const [bookings, setBookings] = useState<MockBooking[]>([]);
  const [vehicles, setVehicles] = useState<Array<{ id: string; label: string }>>([]);
  const [requestVehicleId, setRequestVehicleId] = useState('');
  const [requestSummary, setRequestSummary] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setIsLoading(true);
    setError(null);
    try {
      const [issues, bookingsData, vehiclesData] = await Promise.all([
        fetchIssueRequests(),
        fetchUserBookings(),
        fetchUserVehicles(),
      ]);

      const issueWithQuotes = await Promise.all(
        issues.map(async (issue) => ({
          id: issue.id,
          summary: issue.summary,
          quotes: await fetchIssueQuotes(issue.id),
        }))
      );

      setRequests(issueWithQuotes);
      setSelectedIssueId((prev) => {
        if (prev && issueWithQuotes.some((issue) => issue.id === prev)) return prev;
        return issueWithQuotes[0]?.id ?? '';
      });
      setBookings(bookingsData);
      const mappedVehicles = vehiclesData.map((vehicle) => ({
        id: vehicle.id,
        label: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      }));
      setVehicles(mappedVehicles);
      setRequestVehicleId((prev) => prev || vehiclesData.find((v) => v.isDefault)?.id || vehiclesData[0]?.id || '');
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleRaiseRequest() {
    if (!requestVehicleId || !requestSummary.trim()) return;
    try {
      setActionLoading('raise');
      await createIssueRequest({ vehicleId: requestVehicleId, summary: requestSummary.trim() });
      setRequestSummary('');
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to raise request');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSelectQuote(quoteId: string) {
    try {
      setActionLoading(`quote-${quoteId}`);
      await selectQuote(quoteId);
      setActiveTab('bookings');
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to select quote');
    } finally {
      setActionLoading(null);
    }
  }

  async function handlePay(bookingId: string) {
    try {
      setActionLoading(`pay-${bookingId}`);
      const intent = await createPaymentIntent(bookingId, 'card');
      if (!intent.intentId) throw new Error('Unable to start payment');
      router.push(`/user/payments/checkout?intentId=${encodeURIComponent(intent.intentId)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to process payment');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancelBooking(bookingId: string) {
    try {
      setActionLoading(`cancel-${bookingId}`);
      await updateBooking(bookingId, { status: 'cancelled' });
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to cancel booking');
    } finally {
      setActionLoading(null);
    }
  }

  function getQuoteBadgeColor(label: string) {
    if (label === 'below_market') return 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30';
    if (label === 'fair') return 'bg-blue-500/15 text-blue-500 border-blue-500/30';
    return 'bg-orange-500/15 text-orange-500 border-orange-500/30';
  }

  function getQuoteBadgeText(label: string) {
    if (label === 'below_market') return content.quotes.bestMatchBadge;
    if (label === 'fair') return content.quotes.fairPriceBadge;
    return content.quotes.aboveMarketBadge;
  }

  const totalQuotes = requests.reduce((acc, req) => acc + req.quotes.length, 0);
  const requestsWithQuotes = requests.filter((req) => req.quotes.length > 0);
  const visibleRequests = requests.filter((req) => req.id === selectedIssueId);

  return (
    <div className="flex h-screen bg-background">
      <SessionGuard requiredRole="user" />
      <UserSidebarMobile activeItem="quotes-bookings" content={sidebar} />
      <div className="hidden lg:block">
        <UserSidebar activeItem="quotes-bookings" content={sidebar} />
      </div>

      <section className="flex-1 overflow-y-auto w-full relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background -z-10 pointer-events-none" />
        
        <div className="p-4 md:p-8 xl:p-10 max-w-6xl mx-auto space-y-8 min-h-full flex flex-col">
          <UserTopLogoHeader sidebar={sidebar} />
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-border/40">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0 relative overflow-hidden group">
                <div className="absolute inset-0 bg-primary/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300" />
                <Wallet className="h-6 w-6 relative z-10" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-foreground leading-none md:text-3xl">{content.header.title}</h1>
                <p className="text-sm font-medium text-muted-foreground mt-1.5 tracking-wide">
                  {content.header.description}
                </p>
              </div>
            </div>

            {/* Custom Tab Selector */}
            <div className="flex bg-card/60 border border-border/60 p-1 rounded-xl backdrop-blur-md self-start sm:self-auto w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('quotes')}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${
                  activeTab === 'quotes' 
                    ? 'bg-background shadow-md text-foreground' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {content.header.tabs.quotes}
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${
                  activeTab === 'bookings' 
                    ? 'bg-background shadow-md text-foreground' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {content.header.tabs.bookings}
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in duration-500">
              <div className="w-12 h-12 rounded-full border-4 border-muted border-t-primary animate-spin" />
            </div>
          ) : (
            <div className="flex-1">
              <Card className="mb-6 border-border/40 bg-card/50">
                <CardContent className="grid gap-3 p-4 md:grid-cols-[220px_1fr_auto]">
                  <select
                    value={requestVehicleId}
                    onChange={(e) => setRequestVehicleId(e.target.value)}
                    className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                  >
                    <option value="">Select vehicle</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.label}
                      </option>
                    ))}
                  </select>
                  <Input
                    value={requestSummary}
                    onChange={(e) => setRequestSummary(e.target.value)}
                    className="h-10"
                    placeholder="Raise direct request (without AI): e.g., Oil change + brake check"
                  />
                  <Button
                    onClick={handleRaiseRequest}
                    disabled={!requestVehicleId || !requestSummary.trim() || actionLoading === 'raise'}
                    className="h-10"
                  >
                    Raise Request
                  </Button>
                </CardContent>
              </Card>
              {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
              
              {/* QUOTES VIEW */}
              {activeTab === 'quotes' && (
                <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
                  {requests.length === 0 ? (
                    <div className="text-center py-20 bg-card/30 border border-border/40 rounded-[2rem]">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-xl font-bold text-foreground">{content.quotes.emptyStateTitle}</h3>
                      <p className="text-muted-foreground mt-2 max-w-sm mx-auto">{content.quotes.emptyStateDescription}</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <Card className="border-border/40 bg-card/50">
                          <CardContent className="p-4">
                            <p className="text-xs uppercase tracking-wider text-muted-foreground">Total issues</p>
                            <p className="mt-1 text-2xl font-bold text-foreground">{requests.length}</p>
                          </CardContent>
                        </Card>
                        <Card className="border-border/40 bg-card/50">
                          <CardContent className="p-4">
                            <p className="text-xs uppercase tracking-wider text-muted-foreground">Open quote sets</p>
                            <p className="mt-1 text-2xl font-bold text-foreground">{requestsWithQuotes.length}</p>
                          </CardContent>
                        </Card>
                        <Card className="border-border/40 bg-card/50">
                          <CardContent className="p-4">
                            <p className="text-xs uppercase tracking-wider text-muted-foreground">Total quotes</p>
                            <p className="mt-1 text-2xl font-bold text-foreground">{totalQuotes}</p>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-primary/5 border border-primary/10 p-4 rounded-2xl">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold uppercase tracking-wider text-primary">{content.quotes.requestSummaryLabel}</p>
                          <h3 className="text-lg sm:text-xl font-bold text-foreground truncate">
                            {selectedIssueId && requests.find((r) => r.id === selectedIssueId)
                              ? requests.find((r) => r.id === selectedIssueId)?.summary
                              : 'Select an issue to view quotes'}
                          </h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <select
                            value={selectedIssueId}
                            onChange={(e) => setSelectedIssueId(e.target.value)}
                            className="h-11 min-w-[200px] rounded-xl border border-border bg-background px-3 text-sm"
                          >
                            <option value="" disabled>
                              Select issue
                            </option>
                            {requests.map((req, index) => (
                              <option key={req.id} value={req.id}>
                                Issue {index + 1}: {req.summary.substring(0, 30)}{req.summary.length > 30 ? '...' : ''} ({req.quotes.length} quotes)
                              </option>
                            ))}
                          </select>
                          {selectedIssueId && requests.find((r) => r.id === selectedIssueId) && (
                            <Badge variant="outline" className="bg-background whitespace-nowrap">
                              {content.quotes.quoteCountPrefix} {requests.find((r) => r.id === selectedIssueId)?.quotes.length}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {visibleRequests.length === 0 ? (
                        <div className="rounded-2xl border border-border/40 bg-card/30 p-8 text-center">
                          <p className="text-sm text-muted-foreground">No matching issue found.</p>
                        </div>
                      ) : null}

                    {visibleRequests.map((req, index) => (
                      <div key={req.id} className="space-y-6">

                        {req.quotes.length === 0 ? (
                          <Card className="border-dashed border-border/60 bg-card/30">
                            <CardContent className="p-6 text-sm text-muted-foreground">
                              Quotes are not available for this issue yet. Please check back shortly.
                            </CardContent>
                          </Card>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {req.quotes.map(quote => (
                            <Card key={quote.id} className={`relative overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 ${quote.isBestMatch ? 'border-primary ring-1 ring-primary shadow-lg shadow-primary/10' : 'border-border/50'}`}>
                              {quote.isBestMatch && (
                                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-sm z-10 flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-current" /> {content.quotes.bestMatchBadge}
                                </div>
                              )}
                              <CardContent className="p-0">
                                <div className="p-6 pb-4 border-b border-border/30 bg-card/40">
                                  <h4 className="text-lg font-bold text-foreground truncate">{quote.garageName}</h4>
                                  <div className="flex items-center gap-3 mt-2 text-sm font-medium text-muted-foreground">
                                    <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-orange-400 fill-orange-400" /> {quote.garageRating}</span>
                                    <span className="w-1 h-1 rounded-full bg-border" />
                                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {quote.distance} {content.quotes.distanceSuffix}</span>
                                  </div>
                                </div>
                                <div className="p-6 space-y-5">
                                  <div className="flex items-center justify-between">
                                    <Badge variant="outline" className={getQuoteBadgeColor(quote.comparisonLabel)}>
                                      {getQuoteBadgeText(quote.comparisonLabel)}
                                    </Badge>
                                    <p className="text-2xl font-display font-black text-foreground">${quote.totalCost}</p>
                                  </div>
                                  
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between text-muted-foreground">
                                      <span>{content.quotes.partsLabel}</span>
                                      <span className="font-semibold text-foreground/80">${quote.partsCost}</span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground">
                                      <span>{content.quotes.laborLabel}</span>
                                      <span className="font-semibold text-foreground/80">${quote.laborCost}</span>
                                    </div>
                                  </div>
                                  
                                  <Button
                                    onClick={() => handleSelectQuote(quote.id)}
                                    disabled={actionLoading === `quote-${quote.id}`}
                                    className="w-full h-11 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-bold gap-2 group-hover:scale-[1.02] transition-transform"
                                  >
                                    {content.quotes.bookNowLabel} <ArrowRight className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    </>
                  )}
                </div>
              )}

              {/* BOOKINGS VIEW */}
              {activeTab === 'bookings' && (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 max-w-3xl">
                  {bookings.length === 0 ? (
                    <div className="text-center py-20 bg-card/30 border border-border/40 rounded-[2rem]">
                      <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-xl font-bold text-foreground">{content.bookings.emptyStateTitle}</h3>
                      <p className="text-muted-foreground mt-2 max-w-sm mx-auto">{content.bookings.emptyStateDescription}</p>
                    </div>
                  ) : (
                    bookings.map(booking => (
                      <Card key={booking.id} className="border-border/50 shadow-lg rounded-2xl overflow-hidden bg-card/60 backdrop-blur-md">
                        <CardContent className="p-0 flex flex-col md:flex-row">
                          <div className="p-6 md:p-8 flex-1 border-b md:border-b-0 md:border-r border-border/30">
                            <div className="flex items-center gap-3 mb-4">
                              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 capitalize gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5" /> 
                                {booking.status === 'booked' || booking.status === 'confirmed'
                                  ? content.bookings.statusBooked
                                  : booking.status === 'in_service'
                                    ? content.bookings.statusInService
                                    : booking.status === 'cancelled'
                                      ? 'Cancelled'
                                      : content.bookings.statusCompleted}
                              </Badge>
                              <Badge variant="secondary" className="bg-muted text-muted-foreground">{booking.vehicleStr}</Badge>
                            </div>
                            <h3 className="text-xl font-bold text-foreground font-display md:text-2xl">{booking.garageName}</h3>
                            <div className="mt-6 space-y-3">
                              <div className="flex items-center gap-3 text-sm font-medium text-foreground/80">
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0"><Clock className="h-4 w-4 text-muted-foreground" /></div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-0.5">{content.bookings.appointmentLabel}</p>
                                  {new Date(booking.appointmentTime).toLocaleString()}
                                </div>
                              </div>
                              <div className="flex items-center gap-3 text-sm font-medium text-foreground/80">
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0"><MapPin className="h-4 w-4 text-muted-foreground" /></div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-0.5">{content.bookings.checkInLabel}</p>
                                  {booking.checkInMode}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-6 md:p-8 bg-black/[0.02] dark:bg-white/[0.02] flex flex-col md:w-64">
                            <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1">Total Authorized</p>
                            <p className="text-2xl font-black font-display text-foreground md:text-3xl">{booking.totalCost}</p>
                            
                            <div className="mt-auto pt-6 space-y-3">
                              <Button
                                onClick={() => handlePay(booking.id)}
                                disabled={booking.paymentStatus === 'paid' || actionLoading === `pay-${booking.id}`}
                                className="w-full rounded-xl bg-foreground text-background hover:bg-foreground/90 font-bold gap-2"
                              >
                                <Compass className="h-4 w-4" /> {booking.paymentStatus === 'paid' ? 'Paid' : 'Pay Now'}
                              </Button>
                              <Button
                                variant="ghost"
                                onClick={() => handleCancelBooking(booking.id)}
                                disabled={actionLoading === `cancel-${booking.id}`}
                                className="w-full rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 font-semibold"
                              >
                                {content.bookings.cancelBookingLabel}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}

            </div>
          )}
          
        </div>
      </section>
    </div>
  );
}
