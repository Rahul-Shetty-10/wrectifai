'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Mail, Phone, Send, UserRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchGarageIssueDetails, submitGarageQuote, type GarageIssueDetailsResponse } from '@/lib/api';

type Props = {
  issueId: string;
};

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

export function IssueDetailsClient({ issueId }: Props) {
  const router = useRouter();
  const [details, setDetails] = useState<GarageIssueDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [partsCost, setPartsCost] = useState('');
  const [laborCost, setLaborCost] = useState('');
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const payload = await fetchGarageIssueDetails(issueId);
        setDetails(payload);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load issue details.');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [issueId]);

  const issuePayload = details?.issue?.issue_payload ?? {};
  const issueInfo = issuePayload.issue ?? {};
  const issueSymptoms: string[] = Array.isArray(issueInfo.symptoms)
    ? issueInfo.symptoms.filter((value: unknown): value is string => typeof value === 'string')
    : [];
  const issueAnswers = issueInfo.answers && typeof issueInfo.answers === 'object' ? issueInfo.answers : {};
  const parsedSymptoms = useMemo(() => issueSymptoms.map(parseSymptomEntry), [issueSymptoms]);
  const answerEntries = useMemo(() => Object.entries(issueAnswers), [issueAnswers]);
  const quoteCount = details?.quotes?.length ?? 0;

  async function handleSubmitQuote() {
    if (!partsCost || !laborCost) return;
    try {
      setSubmittingQuote(true);
      setSubmitMessage(null);
      await submitGarageQuote(issueId, Number(partsCost), Number(laborCost));
      setSubmitMessage('Quote submitted successfully.');
      const refreshed = await fetchGarageIssueDetails(issueId);
      setDetails(refreshed);
      setPartsCost('');
      setLaborCost('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to submit quote.');
    } finally {
      setSubmittingQuote(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-11 w-11 animate-spin rounded-full border-[3px] border-[#cfd8e8] border-t-[#2456f5]" />
      </div>
    );
  }

  if (error && !details) {
    return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>;
  }

  if (!details?.issue) {
    return <p className="text-sm text-slate-500">Issue details not found.</p>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={() => router.push('/garage/orders')}
            className="mb-1 inline-flex items-center gap-1 text-sm font-medium text-[#2c4468] hover:text-[#1f3659]"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to orders
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Issue Details</h1>
          <p className="mt-1 text-sm text-slate-500">
            {details.issue.summary}
          </p>
        </div>
        <Badge className="bg-[#edf4ff] text-[#205fb5] hover:bg-[#edf4ff]">
          {quoteCount} quote{quoteCount === 1 ? '' : 's'} submitted
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-3xl border-[#d9e2ef] bg-white shadow-[0_6px_16px_rgba(94,126,179,0.10)]">
          <CardContent className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7f95b4]">Customer</p>
            <div className="mt-3 space-y-2">
              <p className="text-lg font-semibold text-slate-900">{details.issue.customer_name}</p>
              <p className="inline-flex items-center gap-2 text-sm text-slate-700">
                <Phone className="h-4 w-4 text-slate-500" />
                {details.issue.customer_phone}
              </p>
              <p className="inline-flex items-center gap-2 text-sm text-slate-700">
                <Mail className="h-4 w-4 text-slate-500" />
                {details.issue.customer_email ?? 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-[#d9e2ef] bg-white shadow-[0_6px_16px_rgba(94,126,179,0.10)]">
          <CardContent className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7f95b4]">Vehicle</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-slate-500">Vehicle</p>
                <p className="text-sm font-semibold text-slate-900">{details.issue.vehicle}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Fuel Type</p>
                <p className="text-sm font-semibold text-slate-900">{formatReadableText(details.issue.fuel_type)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Mileage</p>
                <p className="text-sm font-semibold text-slate-900">{details.issue.mileage?.toLocaleString() ?? 'N/A'} miles</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Submitted</p>
                <p className="text-sm font-semibold text-slate-900">{new Date(details.issue.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border-[#d9e2ef] bg-white shadow-[0_6px_16px_rgba(94,126,179,0.10)]">
        <CardContent className="p-5 sm:p-6">
          <h3 className="text-xl font-bold text-slate-900">Issue Breakdown</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[#dbe5f4] bg-[#f8fbff] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7f95b4]">Category</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{formatReadableText(issueInfo.category ?? 'N/A')}</p>
            </div>
            <div className="rounded-xl border border-[#dbe5f4] bg-[#f8fbff] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7f95b4]">Severity</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{formatReadableText(issueInfo.severity ?? 'N/A')}</p>
            </div>
            <div className="rounded-xl border border-[#dbe5f4] bg-[#f8fbff] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7f95b4]">When It Started</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{formatReadableText(issueInfo.sinceWhen ?? 'N/A')}</p>
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-[#dbe5f4] bg-[#f8fbff] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7f95b4]">Description</p>
            <p className="mt-1 text-sm text-slate-800">{formatReadableText(issueInfo.description ?? details.issue.summary)}</p>
          </div>
        </CardContent>
      </Card>

      {parsedSymptoms.length > 0 ? (
        <Card className="rounded-3xl border-[#d9e2ef] bg-white shadow-[0_6px_16px_rgba(94,126,179,0.10)]">
          <CardContent className="p-5 sm:p-6">
            <h3 className="text-lg font-semibold text-slate-900">Symptoms</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {parsedSymptoms.map((symptom, index) => (
                <div key={`${symptom.category}-${symptom.field}-${index}`} className="rounded-xl border border-[#e2e8f3] bg-[#fbfdff] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{symptom.field}</p>
                    <Badge variant="outline" className="border-[#d2deef] bg-white text-[10px] uppercase text-[#4f6b93]">
                      {symptom.category}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-700">{symptom.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {answerEntries.length > 0 ? (
        <Card className="rounded-3xl border-[#d9e2ef] bg-white shadow-[0_6px_16px_rgba(94,126,179,0.10)]">
          <CardContent className="p-5 sm:p-6">
            <h3 className="text-lg font-semibold text-slate-900">Answers Provided</h3>
            <div className="mt-2 overflow-hidden rounded-xl border border-[#e2e8f3]">
              {answerEntries.map(([key, value], index) => (
                <div
                  key={key}
                  className={`grid gap-2 bg-white px-3 py-2.5 sm:grid-cols-[240px_1fr] ${
                    index !== answerEntries.length - 1 ? 'border-b border-[#edf2f9]' : ''
                  }`}
                >
                  <p className="text-xs font-semibold tracking-[0.04em] text-[#5c7699]">{formatFieldLabel(key)}</p>
                  <p className="text-sm text-slate-800">{displayValue(value)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="rounded-3xl border-[#d9e2ef] bg-white shadow-[0_6px_16px_rgba(94,126,179,0.10)]">
        <CardContent className="p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-slate-900">Submit Quote</h3>
          <p className="mt-1 text-sm text-slate-500">Send your estimate for this issue request.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="partsCost">Parts Cost ($)</Label>
              <Input
                id="partsCost"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={partsCost}
                onChange={(event) => setPartsCost(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="laborCost">Labor Cost ($)</Label>
              <Input
                id="laborCost"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={laborCost}
                onChange={(event) => setLaborCost(event.target.value)}
              />
            </div>
          </div>

          {(partsCost || laborCost) ? (
            <div className="mt-3 rounded-lg bg-[#f3f8ff] p-3">
              <p className="text-sm font-semibold text-slate-900">
                Total: ${((parseFloat(partsCost) || 0) + (parseFloat(laborCost) || 0)).toFixed(2)}
              </p>
            </div>
          ) : null}

          {submitMessage ? <p className="mt-3 text-sm font-medium text-emerald-700">{submitMessage}</p> : null}
          {error ? <p className="mt-3 text-sm font-medium text-red-600">{error}</p> : null}

          <Button
            type="button"
            className="mt-4 w-full gap-2 bg-[#2456f5] hover:bg-[#1a4bb8]"
            disabled={submittingQuote || !partsCost || !laborCost}
            onClick={() => void handleSubmitQuote()}
          >
            <Send className="h-4 w-4" />
            {submittingQuote ? 'Submitting...' : 'Submit Quote'}
          </Button>
        </CardContent>
      </Card>

      {details.quotes.length > 0 ? (
        <Card className="rounded-3xl border-[#d9e2ef] bg-white shadow-[0_6px_16px_rgba(94,126,179,0.10)]">
          <CardContent className="p-5 sm:p-6">
            <h3 className="text-lg font-semibold text-slate-900">Quote History</h3>
            <div className="mt-3 space-y-2">
              {details.quotes.map((quote) => (
                <div key={quote.id} className="rounded-xl border border-[#e2e8f3] bg-[#fbfdff] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <UserRound className="h-4 w-4 text-slate-500" />
                      Garage ID: {quote.garage_id}
                    </p>
                    <Badge variant="outline" className="border-[#d2deef] bg-white text-[#3f5f8f]">
                      {formatReadableText(quote.status)}
                    </Badge>
                  </div>
                  <div className="mt-2 grid gap-2 text-sm sm:grid-cols-3">
                    <p><span className="text-slate-500">Parts:</span> ${Number(quote.parts_cost).toFixed(2)}</p>
                    <p><span className="text-slate-500">Labor:</span> ${Number(quote.labor_cost).toFixed(2)}</p>
                    <p><span className="text-slate-500">Total:</span> ${Number(quote.total_cost).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
