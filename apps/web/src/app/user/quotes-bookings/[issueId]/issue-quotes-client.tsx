'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftRight, CheckCircle2, ChevronLeft, Star, Trophy } from 'lucide-react';
import { UserThemeShell } from '@/components/dashboard/user-theme-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  cancelSelectedQuote,
  type IssueDetail,
  type MockQuote,
  type UserQuotesBookingsContent,
  type UserSidebarContent,
  fetchIssueDetail,
  fetchIssueQuotes,
  raiseIssueToGarage,
  selectQuote,
} from '@/lib/api';

type Props = {
  sidebar: UserSidebarContent;
  content: UserQuotesBookingsContent;
  issueId: string;
};

function quoteLabelClass(label: 'below_market' | 'fair' | 'above_market') {
  if (label === 'below_market') return 'bg-emerald-100 text-emerald-700';
  if (label === 'fair') return 'bg-blue-100 text-blue-700';
  return 'bg-amber-100 text-amber-700';
}

function quoteLabelText(label: 'below_market' | 'fair' | 'above_market') {
  if (label === 'below_market') return 'Below Market';
  if (label === 'fair') return 'Fair Price';
  return 'Above Market';
}

export function IssueQuotesClient({ sidebar, content: _initialContent, issueId }: Props) {
  void _initialContent;
  const router = useRouter();

  const [issue, setIssue] = useState<IssueDetail | null>(null);
  const [quotes, setQuotes] = useState<MockQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptingQuoteId, setAcceptingQuoteId] = useState<string | null>(null);
  const [cancellingQuote, setCancellingQuote] = useState(false);
  const [raisingToGarage, setRaisingToGarage] = useState(false);
  const [quoteAcceptedOpen, setQuoteAcceptedOpen] = useState(false);

  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const [issueDetail, issueQuotes] = await Promise.all([
          fetchIssueDetail(issueId),
          fetchIssueQuotes(issueId),
        ]);

        setIssue(issueDetail);
        setQuotes(issueQuotes);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load issue quotes.');
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [issueId]);

  const compareQuotes = useMemo(
    () => quotes.filter((quote) => selectedCompareIds.includes(quote.id)).slice(0, 2),
    [quotes, selectedCompareIds]
  );
  const acceptedQuote = useMemo(
    () => quotes.find((quote) => quote.status === 'selected' || quote.status === 'accepted') ?? null,
    [quotes]
  );
  const isIssueQuoteAccepted = useMemo(
    () => issue?.status === 'quote_accepted' || Boolean(acceptedQuote),
    [issue?.status, acceptedQuote]
  );
  const cheapestCompareQuoteId = useMemo(() => {
    if (compareQuotes.length !== 2) return null;
    return compareQuotes[0].totalCost <= compareQuotes[1].totalCost
      ? compareQuotes[0].id
      : compareQuotes[1].id;
  }, [compareQuotes]);
  const compareSavings = useMemo(() => {
    if (compareQuotes.length !== 2) return 0;
    return Math.abs(compareQuotes[0].totalCost - compareQuotes[1].totalCost);
  }, [compareQuotes]);
  const diagnosisSeverity = (issue?.issuePayload?.issue?.severity ?? '').toLowerCase();
  const diagnosisRiskLevel =
    diagnosisSeverity === 'can_drive' ? 'low' : diagnosisSeverity === 'risky' ? 'medium' : 'high';
  const isDiagnosisIssue = issue?.source === 'diagnosis';
  const canRaiseToGarage =
    isDiagnosisIssue &&
    issue?.status !== 'quotes_pending' &&
    issue?.status !== 'quote_accepted';
  const diagnosisCategory = (issue?.issuePayload?.issue?.category ?? 'other').toLowerCase();
  const diagnosisDescription = issue?.issuePayload?.issue?.description?.trim();
  const diySteps = useMemo(() => {
    if (diagnosisRiskLevel !== 'low') return [] as string[];
    if (diagnosisCategory === 'tyre') {
      return [
        'Inspect tyre sidewall and tread for cuts, nails, or visible damage.',
        'Check tyre pressure and inflate to recommended PSI.',
        'Use temporary puncture kit only for short-distance emergency movement.',
        'Complete permanent repair/replacement at garage soon.',
      ];
    }
    if (diagnosisCategory === 'battery') {
      return [
        'Check terminal tightness and clean visible corrosion safely.',
        'Measure battery voltage and recharge if low.',
        'Turn off non-essential electrical loads and re-test start.',
        'If no-start repeats, escalate to garage for charging-system checks.',
      ];
    }
    if (diagnosisCategory === 'ac') {
      return [
        'Set AC to recirculation mode and verify cooling response.',
        'Inspect cabin filter and replace if blocked.',
        'Run AC for 10 minutes and monitor cooling stability.',
        'Escalate to garage if cooling remains weak or absent.',
      ];
    }
    if (diagnosisCategory === 'electrical') {
      return [
        'Check relevant fuse and relay for affected component.',
        'Inspect accessible connectors for loose fitment.',
        'Retest after ignition restart.',
        'Escalate to garage if fault persists/intermittent.',
      ];
    }
    return [
      'Perform visual inspection for loose parts, leaks, or obvious damage.',
      'Reproduce issue safely and note exact trigger condition.',
      'Avoid aggressive driving until behavior is stable.',
      'Raise issue to garage if symptom repeats or worsens.',
    ];
  }, [diagnosisCategory, diagnosisRiskLevel]);

  function toggleCompare(quoteId: string) {
    setSelectedCompareIds((prev) => {
      if (prev.includes(quoteId)) return prev.filter((id) => id !== quoteId);
      if (prev.length >= 2) return prev;
      return [...prev, quoteId];
    });
  }

  async function handleAcceptQuote(quoteId: string) {
    if (isIssueQuoteAccepted && acceptedQuote?.id !== quoteId) return;
    try {
      setAcceptingQuoteId(quoteId);
      await selectQuote(quoteId);
      setQuotes((prev) =>
        prev.map((quote) => ({
          ...quote,
          status: quote.id === quoteId ? 'selected' : 'rejected',
        }))
      );
      setIssue((prev) => (prev ? { ...prev, status: 'quote_accepted' } : prev));
      setQuoteAcceptedOpen(true);
    } catch (acceptError) {
      setError(acceptError instanceof Error ? acceptError.message : 'Failed to accept quote.');
    } finally {
      setAcceptingQuoteId(null);
    }
  }

  async function handleRaiseToGarage() {
    try {
      setRaisingToGarage(true);
      setError(null);
      await raiseIssueToGarage(issueId);
      const [issueDetail, issueQuotes] = await Promise.all([
        fetchIssueDetail(issueId),
        fetchIssueQuotes(issueId),
      ]);
      setIssue(issueDetail);
      setQuotes(issueQuotes);
    } catch (raiseError) {
      setError(raiseError instanceof Error ? raiseError.message : 'Failed to raise issue to garage.');
    } finally {
      setRaisingToGarage(false);
    }
  }

  async function handleCancelAcceptedQuote() {
    if (!acceptedQuote) return;
    try {
      setCancellingQuote(true);
      setError(null);
      await cancelSelectedQuote(acceptedQuote.id);
      const [issueDetail, issueQuotes] = await Promise.all([
        fetchIssueDetail(issueId),
        fetchIssueQuotes(issueId),
      ]);
      setIssue(issueDetail);
      setQuotes(issueQuotes);
      setSelectedCompareIds([]);
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : 'Failed to cancel accepted quote.');
    } finally {
      setCancellingQuote(false);
    }
  }

  return (
    <UserThemeShell activeItem="quotes-bookings" sidebar={sidebar}>
      <section className="overflow-y-auto bg-[#f1f3f8]">
        <div className="mx-auto max-w-5xl p-6 md:p-8">
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <button
                type="button"
                onClick={() => router.push('/user/quotes-bookings')}
                className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-[#2c4468] hover:text-[#1f3659]"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to issues
              </button>
              <h1 className="text-2xl font-bold text-slate-900">{issue?.summary ?? 'Issue Quotes'}</h1>
              <p className="mt-1 text-sm text-slate-500">
              {quotes.length} quote(s) received for this issue.
              </p>
              {isIssueQuoteAccepted ? (
                <p className="mt-2 text-sm font-semibold text-emerald-700">Quote accepted for this issue.</p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={() => setCompareOpen(true)}
                disabled={selectedCompareIds.length !== 2}
                className="h-10 rounded-xl bg-[#0f93de] px-4 text-sm text-white hover:bg-[#0d82c4] disabled:bg-slate-300"
              >
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                Compare ({selectedCompareIds.length}/2)
              </Button>
              {acceptedQuote ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleCancelAcceptedQuote()}
                  disabled={cancellingQuote}
                  className="h-10 rounded-xl border-red-200 text-sm text-red-700 hover:bg-red-50"
                >
                  {cancellingQuote ? 'Cancelling...' : 'Cancel Accepted Quote'}
                </Button>
              ) : null}
            </div>
          </div>

          {isDiagnosisIssue ? (
            <div className="mt-4 rounded-2xl border border-[#d9e2ef] bg-white p-4">
              <h3 className="text-lg font-semibold text-slate-900">Diagnosis Report</h3>
              <p className="mt-2 text-sm text-slate-700">
                <span className="font-semibold">Risk level:</span>{' '}
                <span className={diagnosisRiskLevel === 'low' ? 'text-emerald-700' : diagnosisRiskLevel === 'medium' ? 'text-amber-700' : 'text-red-700'}>
                  {diagnosisRiskLevel.toUpperCase()}
                </span>
              </p>
              <p className="mt-1 text-sm text-slate-700">
                <span className="font-semibold">Severity:</span> {issue?.issuePayload?.issue?.severity ?? 'N/A'}
              </p>
              <p className="mt-1 text-sm text-slate-700">
                <span className="font-semibold">Summary:</span>{' '}
                {diagnosisDescription || `${diagnosisCategory.toUpperCase()} issue reported from guided answers.`}
              </p>

              {diySteps.length > 0 ? (
                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-sm font-semibold text-emerald-800">DIY Steps</p>
                  <ul className="mt-2 list-inside list-disc text-sm text-emerald-900">
                    {diySteps.map((step, index) => (
                      <li key={`${step}-${index}`}>{step}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  DIY is not recommended for this risk level.
                </div>
              )}

              {canRaiseToGarage ? (
                <div className="mt-3">
                  <Button
                    type="button"
                    onClick={() => void handleRaiseToGarage()}
                    disabled={raisingToGarage}
                    className="h-9 rounded-lg bg-[#0f93de] px-4 text-sm text-white hover:bg-[#0d82c4]"
                  >
                    {raisingToGarage ? 'Raising...' : 'Raise Issue to Garage'}
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          {error ? <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}

          {loading ? (
            <div className="mt-16 flex items-center justify-center">
              <div className="h-11 w-11 animate-spin rounded-full border-[3px] border-[#cfd8e8] border-t-[#2456f5]" />
            </div>
          ) : quotes.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-[#d9e2ef] bg-white p-8 text-sm text-slate-500 shadow-[0_6px_16px_rgba(94,126,179,0.10)]">
              No quotes available yet for this issue.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {quotes.map((quote) => {
                const selectedForCompare = selectedCompareIds.includes(quote.id);
                const compareDisabled = selectedCompareIds.length >= 2 && !selectedForCompare;
                const isSelectedQuote = quote.status === 'selected' || quote.status === 'accepted';
                const disableAccept =
                  acceptingQuoteId === quote.id ||
                  (isIssueQuoteAccepted && !isSelectedQuote);

                return (
                  <Card key={quote.id} className="rounded-xl border-[#d9e2ef] bg-white shadow-[0_6px_16px_rgba(94,126,179,0.10)]">
                    <CardContent className="p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-lg font-semibold text-slate-900">{quote.garageName}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            <Star className="mr-1 inline h-4 w-4 text-amber-500" />
                            {quote.garageRating} - {quote.distance} mi away
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-slate-900">${quote.totalCost}</p>
                          <Badge className={quoteLabelClass(quote.comparisonLabel)}>{quoteLabelText(quote.comparisonLabel)}</Badge>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                        <div className="rounded-lg bg-slate-50 p-2">
                          <p className="text-xs text-slate-500">Parts</p>
                          <p className="font-semibold text-slate-800">${quote.partsCost}</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-2">
                          <p className="text-xs text-slate-500">Labor</p>
                          <p className="font-semibold text-slate-800">${quote.laborCost}</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-2">
                          <p className="text-xs text-slate-500">Total</p>
                          <p className="font-semibold text-slate-800">${quote.totalCost}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                        <Button
                          type="button"
                          variant={selectedForCompare ? 'default' : 'outline'}
                          onClick={() => toggleCompare(quote.id)}
                          disabled={compareDisabled}
                          className="h-9 rounded-lg"
                        >
                          {selectedForCompare ? (
                            <>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Selected for compare
                            </>
                          ) : (
                            'Select to compare'
                          )}
                        </Button>

                        <Button
                          type="button"
                          className="h-9 rounded-lg bg-[#0f93de] px-4 text-sm text-white hover:bg-[#0d82c4]"
                          onClick={() => void handleAcceptQuote(quote.id)}
                          disabled={disableAccept}
                        >
                          {acceptingQuoteId === quote.id
                            ? 'Accepting...'
                            : isSelectedQuote
                              ? 'Quote Accepted'
                              : 'Accept Quote'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="max-w-4xl rounded-xl border-[#d9e2ef] bg-[#f8fbff] shadow-[0_16px_40px_rgba(33,61,105,0.18)]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Quote Comparison</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Compare selected quotes side by side and choose the best value.
            </DialogDescription>
          </DialogHeader>

          {compareQuotes.length === 2 ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-[#dce7f6] bg-white px-4 py-3">
                <p className="text-sm font-medium text-slate-700">
                  Price difference: <span className="font-bold text-[#0f62d6]">${compareSavings.toFixed(2)}</span>
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {compareQuotes.map((quote) => {
                  const isBestValue = quote.id === cheapestCompareQuoteId;
                  return (
                    <div
                      key={quote.id}
                      className={`rounded-2xl border p-4 ${
                        isBestValue ? 'border-emerald-300 bg-emerald-50/40' : 'border-[#d9e2ef] bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold text-slate-900">{quote.garageName}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            Rating {quote.garageRating} - {quote.distance} mi away
                          </p>
                        </div>
                        {isBestValue ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            <Trophy className="h-3.5 w-3.5" />
                            Best Value
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-3 grid gap-2 text-sm">
                        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                          <span className="text-slate-500">Parts</span>
                          <span className="font-semibold text-slate-900">${quote.partsCost}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                          <span className="text-slate-500">Labor</span>
                          <span className="font-semibold text-slate-900">${quote.laborCost}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-[#dce5f3] bg-white px-3 py-2.5">
                          <span className="text-slate-700">Total</span>
                          <span className="text-lg font-bold text-slate-900">${quote.totalCost}</span>
                        </div>
                      </div>

                      <div className="mt-3 flex justify-end">
                        <Button
                          type="button"
                          className="h-9 rounded-lg bg-[#0f93de] px-4 text-sm text-white hover:bg-[#0d82c4]"
                          onClick={() => void handleAcceptQuote(quote.id)}
                          disabled={acceptingQuoteId === quote.id || (isIssueQuoteAccepted && quote.status !== 'selected' && quote.status !== 'accepted')}
                        >
                          {acceptingQuoteId === quote.id
                            ? 'Accepting...'
                            : quote.status === 'selected' || quote.status === 'accepted'
                              ? 'Quote Accepted'
                              : 'Accept This Quote'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500">
                Tip: Compare total cost, rating, and distance together before accepting.
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Select exactly two quotes to compare.</p>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={quoteAcceptedOpen} onOpenChange={setQuoteAcceptedOpen}>
        <DialogContent className="max-w-md rounded-xl border-[#d9e2ef] bg-white shadow-[0_16px_40px_rgba(33,61,105,0.18)]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Quote Accepted</DialogTitle>
            <DialogDescription className="text-sm text-slate-600">
              Your quote has been accepted successfully.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 flex justify-end">
            <Button
              type="button"
              className="h-9 rounded-lg bg-[#0f93de] px-4 text-sm text-white hover:bg-[#0d82c4]"
              onClick={() => setQuoteAcceptedOpen(false)}
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </UserThemeShell>
  );
}
