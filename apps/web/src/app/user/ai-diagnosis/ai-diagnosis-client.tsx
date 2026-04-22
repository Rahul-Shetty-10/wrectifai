'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, CarFront, Eye, Sparkles } from 'lucide-react';
import { UserThemeShell } from '@/components/dashboard/user-theme-shell';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { fetchIssueDetail, fetchIssueRequests, type IssueDetail, type IssueRequestListItem, type UserSidebarContent } from '@/lib/api';

type Props = {
  sidebar: UserSidebarContent;
};

type QAItem = {
  question: string;
  answer: string;
};

function formatFieldLabel(key: string) {
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
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.map((item) => formatReadableText(String(item))).join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return formatReadableText(String(value));
}

function toQuestionAnswers(issueDetail: IssueDetail | null): QAItem[] {
  if (!issueDetail) return [];
  const issueAnswers = issueDetail.issuePayload?.issue?.answers;
  if (!issueAnswers || typeof issueAnswers !== 'object') return [];
  return Object.entries(issueAnswers)
    .map(([questionKey, answerValue]) => ({
      question: formatFieldLabel(questionKey),
      answer: displayValue(answerValue),
    }))
    .filter((item) => item.question.trim().length > 0);
}

export function AiDiagnosisClient({ sidebar }: Props) {
  const [issues, setIssues] = useState<IssueRequestListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [selectedIssueDetail, setSelectedIssueDetail] = useState<IssueDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadIssues() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchIssueRequests();
        if (!active) return;
        setIssues(data);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load issues.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadIssues();
    return () => {
      active = false;
    };
  }, []);

  async function openIssueDetails(issueId: string) {
    setSelectedIssueId(issueId);
    setSelectedIssueDetail(null);
    setDetailLoading(true);
    try {
      const detail = await fetchIssueDetail(issueId);
      setSelectedIssueDetail(detail);
    } catch {
      setSelectedIssueDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }

  const sortedIssues = useMemo(
    () =>
      [...issues].sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      }),
    [issues]
  );
  const questionAnswers = useMemo(
    () => toQuestionAnswers(selectedIssueDetail),
    [selectedIssueDetail]
  );

  return (
    <UserThemeShell activeItem="ai-diagnosis" sidebar={sidebar}>
      <div className="mx-auto max-w-7xl space-y-4 px-2 py-2 sm:px-4 sm:py-4">
        <div className="rounded-xl border border-[#d4e0f0] bg-[#f4f8ff] p-4 shadow-[0_6px_16px_rgba(94,126,179,0.10)]">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#1d7ff2]" />
            <h1 className="text-[24px] font-semibold text-slate-900">Created Issues</h1>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            All diagnosis/direct issues are shown here. Click View More for complete details.
          </p>
        </div>

        {loading ? <p className="rounded-xl bg-white p-4 text-sm text-slate-500">Loading issues...</p> : null}
        {error ? <p className="rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</p> : null}

        {!loading && !error ? (
          sortedIssues.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {sortedIssues.map((issue) => (
                <div key={issue.id} className="rounded-xl border border-[#dbe6f5] bg-white p-4 shadow-[0_6px_14px_rgba(94,126,179,0.08)]">
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-2 text-[18px] font-semibold text-slate-900">{issue.summary || 'Issue'}</p>
                    <span className="rounded-full border border-[#d4e2f6] bg-[#f5f9ff] px-2 py-0.5 text-[11px] font-semibold uppercase text-[#3f5f8c]">
                      {issue.source ?? 'diagnosis'}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-[13px] text-slate-600">
                    <p className="inline-flex items-center gap-1.5">
                      <CarFront className="h-3.5 w-3.5 text-slate-400" />
                      {issue.vehicleLabel || 'Vehicle unavailable'}
                    </p>
                    <p className="inline-flex items-center gap-1.5">
                      <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
                      {issue.createdAt ? formatIssueDate(issue.createdAt) : 'Unknown time'}
                    </p>
                    <p>
                      Quotes: <span className="font-semibold text-slate-800">{issue.quoteCount ?? 0}</span>
                    </p>
                    <p>
                      Status: <span className="font-semibold text-slate-800">{issue.status ?? 'open'}</span>
                    </p>
                    {issue.severity ? (
                      <p>
                        Severity: <span className="font-semibold text-slate-800">{issue.severity}</span>
                      </p>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => void openIssueDetails(issue.id)}
                    className="mt-4 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-[#cde0fc] bg-[#f7fbff] text-[13px] font-medium text-[#0f62d6] hover:bg-[#edf4ff]"
                  >
                    <Eye className="h-4 w-4" />
                    View More
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-white p-4 text-sm text-slate-500">
              No issues found. Create one from Dashboard using Start Diagnosis.
            </p>
          )
        ) : null}
      </div>

      <Dialog open={Boolean(selectedIssueId)} onOpenChange={(open) => (!open ? setSelectedIssueId(null) : null)}>
        <DialogContent className="max-h-[88vh] max-w-4xl overflow-y-auto rounded-2xl border border-[#d5e1f1] bg-[#f8fbff] p-0">
          <DialogHeader className="border-b border-[#e2ebf7] px-6 py-4">
            <DialogTitle className="text-[30px] font-semibold text-slate-900">Issue Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-6">
            {detailLoading ? <p className="text-sm text-slate-500">Loading details...</p> : null}
            {!detailLoading && !selectedIssueDetail ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">Unable to load issue details.</p>
            ) : null}
            {selectedIssueDetail ? (
              <>
                <div className="rounded-xl border border-[#dbe6f5] bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Summary</p>
                      <p className="mt-1 text-[18px] font-semibold text-slate-900">
                        {selectedIssueDetail.summary || '-'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-[#cfe0fb] bg-[#f2f7ff] px-2.5 py-1 text-xs font-semibold uppercase text-[#1d65d6]">
                        {selectedIssueDetail.source || '-'}
                      </span>
                      <span className="rounded-full border border-[#d8e7dc] bg-[#edf9f0] px-2.5 py-1 text-xs font-semibold uppercase text-[#20844b]">
                        {selectedIssueDetail.status || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                  <IssueDetailStat label="Vehicle" value={selectedIssueDetail.vehicleLabel || '-'} />
                  <IssueDetailStat label="Created At" value={formatIssueDate(selectedIssueDetail.createdAt)} />
                  <IssueDetailStat label="Quote Count" value={String(selectedIssueDetail.quoteCount ?? 0)} />
                  <IssueDetailStat
                    label="Severity"
                    value={String(selectedIssueDetail.issuePayload?.issue?.severity ?? '-')}
                  />
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2">
                  <IssueDetailRow
                    label="Category"
                    value={String(selectedIssueDetail.issuePayload?.issue?.category ?? '-')}
                  />
                  <IssueDetailRow
                    label="Since When"
                    value={String(selectedIssueDetail.issuePayload?.issue?.sinceWhen ?? '-')}
                  />
                  <IssueDetailRow
                    label="Service Type"
                    value={String(selectedIssueDetail.issuePayload?.serviceType ?? '-')}
                  />
                  <IssueDetailRow
                    label="Address"
                    value={String(
                      (selectedIssueDetail.issuePayload?.location as { address?: string } | undefined)?.address ?? '-'
                    )}
                  />
                  <IssueDetailRow
                    label="Schedule"
                    value={
                      String((selectedIssueDetail.issuePayload?.schedule as { mode?: string } | undefined)?.mode ?? '-') +
                      (
                        (selectedIssueDetail.issuePayload?.schedule as { preferredAt?: string } | undefined)?.preferredAt
                          ? ` | ${String((selectedIssueDetail.issuePayload?.schedule as { preferredAt?: string }).preferredAt)}`
                          : ''
                      )
                    }
                  />
                  <div className="sm:col-span-2">
                    <IssueDetailRow
                      label="Description"
                      value={String(selectedIssueDetail.issuePayload?.issue?.description ?? '-')}
                    />
                  </div>
                </div>

                {questionAnswers.length > 0 ? (
                  <div className="rounded-xl border border-[#dbe6f5] bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Questions Asked & Answers
                    </p>
                    <div className="mt-3 overflow-hidden rounded-xl border border-[#e2eaf6]">
                      {questionAnswers.map((item, index) => (
                        <div
                          key={`${item.question}-${index}`}
                          className={`grid gap-1.5 bg-[#fbfdff] px-3 py-2.5 sm:grid-cols-[260px_1fr] ${
                            index !== questionAnswers.length - 1 ? 'border-b border-[#edf2f9]' : ''
                          }`}
                        >
                          <p className="text-xs font-semibold tracking-[0.04em] text-[#4a678d]">{item.question}</p>
                          <p className="text-sm text-slate-800">{item.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </UserThemeShell>
  );
}

function IssueDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#dbe6f5] bg-white p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-800">{value || '-'}</p>
    </div>
  );
}

function IssueDetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#dbe6f5] bg-white p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</p>
      <p className="mt-1 truncate text-[14px] font-semibold text-slate-900">{value || '-'}</p>
    </div>
  );
}

function formatIssueDate(input: string | Date) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return 'Invalid date';
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}
