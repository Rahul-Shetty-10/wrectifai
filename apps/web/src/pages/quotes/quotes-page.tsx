'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  BellRing,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  FileText,
  Gauge,
  Lock,
  MessageCircleMore,
  MoreHorizontal,
  Scale,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { DashboardShell } from '@/components/home/dashboard-shell';
import { TopNavbar } from '@/components/home/top-navbar';
import { Card } from '@/components/common/card';
import { GarageMoreMenu } from '@/components/quotes/garage-more-menu';
import {
  aiEstimatedQuoteRange,
  quoteContextDefaultIssueIds,
  quotesList,
} from '@/components/quotes/quotes-shared';
import { resultIssues } from '@/components/ai-diagnose/diagnose-flow-shared';
import { useApiResource } from '@/lib/resource-data';
import { cn } from '@/utils/cn';
import type { QuoteStatus } from '@/components/quotes/quotes-shared';

type QuoteTabKey = 'all' | QuoteStatus;

const BULLET = '\u2022';
const PREV = '\u2039';
const NEXT = '\u203A';

const homeSectionHeadingClass = 'ui-page-title';
const homeSubheadingClass = 'ui-subheading';
const homeBodyClass = 'ui-body';
const noop = () => undefined;

const actionItems = [
  { label: 'Select Garage', icon: CheckCircle2, tone: 'blue' as const },
  { label: 'View Quotes', icon: FileText, tone: 'blue' as const },
  { label: 'Message Garage', icon: MessageCircleMore, tone: 'purple' as const },
  { label: 'More Options', icon: MoreHorizontal, tone: 'blue' as const },
];

export function QuotesPage() {
  const quotesPerPage = 5;
  const screenContent = useApiResource('quotes', {
    quotesList,
    defaults: {
      issueIds: quoteContextDefaultIssueIds,
      aiEstimatedQuoteRange,
    },
  });
  const screenQuotes = screenContent.quotesList?.length
    ? screenContent.quotesList
    : quotesList;
  const defaultIssueIds =
    screenContent.defaults?.issueIds ?? quoteContextDefaultIssueIds;
  const router = useRouter();
  const searchParams = useSearchParams();
  const pageRootRef = useRef<HTMLDivElement>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedQuoteIds, setSelectedQuoteIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<QuoteTabKey>('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const pageScroller = (() => {
      let node = pageRootRef.current?.parentElement ?? null;
      while (node) {
        if (node.scrollHeight > node.clientHeight) return node;
        node = node.parentElement;
      }
      return null;
    })();

    window.scrollTo({ top: 0, behavior: 'auto' });
    pageScroller?.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const quoteTabs = useMemo(
    () => [
      { key: 'all' as const, label: `All Quotes (${screenQuotes.length})` },
      {
        key: 'new' as const,
        label: `New (${
          screenQuotes.filter((quote) => quote.status === 'new').length
        })`,
      },
      {
        key: 'viewed' as const,
        label: `Viewed (${
          screenQuotes.filter((quote) => quote.status === 'viewed').length
        })`,
      },
      {
        key: 'expired' as const,
        label: `Expired (${
          screenQuotes.filter((quote) => quote.status === 'expired').length
        })`,
      },
    ],
    [screenQuotes]
  );

  const filteredQuotes =
    activeTab === 'all'
      ? screenQuotes
      : screenQuotes.filter((quote) => quote.status === activeTab);
  const totalPages = Math.max(
    1,
    Math.ceil(filteredQuotes.length / quotesPerPage)
  );
  const paginatedQuotes = filteredQuotes.slice(
    (currentPage - 1) * quotesPerPage,
    currentPage * quotesPerPage
  );

  const selectedQuoteCount = selectedQuoteIds.length;
  const canCompare = selectedQuoteCount >= 2;
  const selectedLimitReached = selectedQuoteCount >= 3;
  const issueIds = useMemo(
    () =>
      (searchParams?.get('issues') || defaultIssueIds.join(','))
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    [defaultIssueIds, searchParams]
  );
  const requestedIssues = useMemo(
    () => resultIssues.filter((issue) => issueIds.includes(issue.id)),
    [issueIds]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <DashboardShell header={<TopNavbar />}>
      <div ref={pageRootRef} className="space-y-5 pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[17.5px] font-bold tracking-[-0.03em] text-[#17307a]">
              My Quotes
            </h1>
            <span className="rounded-full bg-[#dff4e7] px-2.5 py-1 text-[11px] font-medium text-[#18965c]">
              3 New Quotes
            </span>
          </div>
          <p className="mt-2 ui-caption">
            Compare quotes from trusted garages and choose the best one for your
            car.
          </p>
        </div>

        <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_250px] 2xl:items-start">
          <div className="space-y-5">
            <div className="flex flex-col gap-4 border-b border-[#e9eefb] pb-0 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-wrap items-center gap-10">
                {quoteTabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'border-b-2 pb-4 text-[12px] font-medium transition-colors',
                      activeTab === tab.key
                        ? 'border-[#1a56db] text-[#17307a]'
                        : 'border-transparent text-[#5f7099]'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="mb-3 grid gap-3 sm:grid-cols-[208px_192px]">
                <div className="group relative">
                  <button
                    type="button"
                    onClick={() => {
                      if (compareMode && canCompare) {
                        router.push(
                          `/compare-quotes?ids=${selectedQuoteIds.join(',')}`
                        );
                        return;
                      }

                      setCompareMode(true);
                    }}
                    className={cn(
                      'inline-flex h-[40px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-[12px] px-4 text-[12px] font-semibold transition-all',
                      canCompare
                        ? 'border border-[#1a56db] bg-[#1a56db] text-white shadow-[0_14px_28px_rgba(26,86,219,0.28)] ring-4 ring-[#1a56db]/10'
                        : 'border border-[#c8d6ff] bg-white text-[#1a56db] shadow-[0_8px_18px_rgba(36,83,232,0.04)]'
                    )}
                  >
                    <Scale className="h-4.5 w-4.5 shrink-0" />
                    <span>{canCompare ? 'Compare Now' : 'Compare Quotes'}</span>
                    <span
                      className={cn(
                        'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold',
                        canCompare
                          ? 'bg-white text-[#1a56db]'
                          : 'bg-[#1a56db] text-white'
                      )}
                    >
                      {selectedQuoteCount}
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0" />
                  </button>

                  {!canCompare ? (
                    <div className="pointer-events-none absolute left-0 top-full z-10 mt-2 rounded-[10px] border border-[#dbe6ff] bg-white px-3 py-2 text-[11px] text-[#5f7099] opacity-0 shadow-[0_10px_24px_rgba(37,73,153,0.08)] transition-opacity duration-150 group-hover:opacity-100">
                      Compare up to 3 garages. Select a minimum of 2.
                    </div>
                  ) : null}
                </div>

                <button
                  type="button"
                  className="inline-flex h-[40px] items-center justify-between whitespace-nowrap rounded-[12px] border border-[#dfe7fb] bg-white px-4 text-[12px] font-semibold text-[#5f7099]"
                >
                  <span className="whitespace-nowrap">
                    Sort by:&nbsp;{' '}
                    <span className="text-[#17307a]">Lowest Price</span>
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-[#7c8bb3]" />
                </button>
              </div>
            </div>

            <Card className="rounded-[18px] border-[#e4ebff] bg-[linear-gradient(180deg,#f8f9ff_0%,#f4f7ff_100%)] px-5 py-4 shadow-[0_12px_30px_rgba(37,73,153,0.04)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  <span className="flex h-[50px] w-[50px] items-center justify-center rounded-[14px] border border-[#dce5ff] bg-[#fbfdff] text-[#1a56db]">
                    <Image
                      src="/assets/Robo_icon.png"
                      alt="WrectifAI"
                      width={42}
                      height={42}
                      className="h-[36px] w-[36px] object-contain"
                    />
                  </span>
                  <div>
                    <div className={homeSubheadingClass}>
                      WrectifAI Estimated Quote
                    </div>
                    <p className="mt-1.5 text-[11px] leading-5 text-[#5f7099]">
                      This is a WrectifAI generated estimate based on your
                      selected issues and market data.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-8">
                  <div>
                    <div className={homeBodyClass}>Estimated Price Range</div>
                    <div className="mt-1.5 whitespace-nowrap text-[15.5px] font-semibold tracking-[-0.03em] text-[#159a5d]">
                      {aiEstimatedQuoteRange}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="inline-flex h-[38px] items-center justify-center whitespace-nowrap rounded-[12px] border border-[#c9d8ff] px-4 text-[12px] font-semibold text-[#1a56db]"
                  >
                    View Estimate Details
                  </button>
                </div>
              </div>
            </Card>

            <div className="space-y-4">
              {paginatedQuotes.map((quote) => (
                <Card
                  key={quote.id}
                  className="relative rounded-[18px] border-[#e6ecfb] bg-white px-5 pt-7 pb-4 shadow-[0_12px_30px_rgba(37,73,153,0.04)]"
                >
                  <div className="absolute right-5 top-0 flex items-start gap-2">
                    {quote.status === 'new' && (
                      <span className="rounded-b-[10px] bg-[#e8f7ee] px-2.5 py-1.5 text-[11px] font-semibold leading-none text-[#1a945a] shadow-[0_4px_10px_rgba(26,148,90,0.08)]">
                        New
                      </span>
                    )}
                    <span className="pt-2 text-[11px] text-[#5f7099]">
                      {quote.time}
                    </span>
                  </div>

                  <div
                    className={cn(
                      'grid gap-4 pt-1 2xl:items-center',
                      compareMode
                        ? '2xl:grid-cols-[36px_minmax(320px,1.25fr)_144px_312px]'
                        : '2xl:grid-cols-[minmax(320px,1.25fr)_144px_312px]'
                    )}
                  >
                    {compareMode ? (
                      <label className="flex items-center justify-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedQuoteIds.includes(quote.id)}
                          onChange={() =>
                            setSelectedQuoteIds((current) => {
                              if (current.includes(quote.id)) {
                                return current.filter(
                                  (item) => item !== quote.id
                                );
                              }
                              if (current.length >= 3) {
                                return current;
                              }
                              return [...current, quote.id];
                            })
                          }
                          disabled={
                            !selectedQuoteIds.includes(quote.id) &&
                            selectedLimitReached
                          }
                          className="h-6 w-6 cursor-pointer rounded border-[#cdd9fb] text-[#2551f6] focus:ring-[#2551f6]"
                        />
                      </label>
                    ) : null}

                    <div className="flex min-w-0 items-center gap-5 pr-3">
                      <div className="shrink-0">
                        <Image
                          src={quote.image}
                          alt={quote.garage}
                          width={128}
                          height={84}
                          className="h-[84px] w-[128px] rounded-[12px] object-cover"
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="ui-subheading truncate whitespace-nowrap leading-7">
                          {quote.garage}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[#5f7099]">
                          <span className="font-semibold text-[#17307a]">
                            {quote.rating}
                          </span>
                          <Star className="h-3.5 w-3.5 fill-[#ffb800] text-[#ffb800]" />
                          <span>({quote.reviews})</span>
                          <span>{BULLET}</span>
                          <span>{quote.distance}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[#5f7099]">
                          <span>{quote.meta}</span>
                          <span>{BULLET}</span>
                          <span>{quote.metaSecondary}</span>
                        </div>
                      </div>
                    </div>

                    <div className="min-w-[144px] pl-2">
                      <div className="ui-page-title">{quote.price}</div>
                      <div className="mt-1 text-[11px] text-[#5f7099]">
                        Total Estimate
                      </div>
                      <div className="mt-3 flex items-center gap-2 whitespace-nowrap text-[11px] font-medium text-[#159a5d]">
                        <span className="whitespace-nowrap">
                          You save {quote.savings}
                        </span>
                        <CircleHelp className="h-3.5 w-3.5 text-[#8090b7]" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-2 gap-y-3 sm:grid-cols-4 sm:gap-x-1">
                      {actionItems.map(({ label, icon: Icon, tone }) =>
                        label === 'More Options' ? (
                          <GarageMoreMenu
                            key={`${quote.id}-${label}`}
                            triggerLabel={label}
                            onViewGarageProfile={() => router.push('/garages')}
                            onViewReviews={noop}
                            onViewServices={noop}
                            onPriceBreakup={noop}
                            onCompareDetails={noop}
                            onSaveGarage={noop}
                            onShareGarage={noop}
                            onRemove={() => {
                              setSelectedQuoteIds((current) =>
                                current.filter((item) => item !== quote.id)
                              );
                            }}
                          />
                        ) : (
                          <button
                            key={`${quote.id}-${label}`}
                            type="button"
                            onClick={() => {
                              if (label === 'Select Garage') {
                                router.push(
                                  `/garages?source=quotes&quote=${
                                    quote.id
                                  }&issues=${issueIds.join(',')}`
                                );
                              }
                            }}
                            className="flex w-[72px] flex-col items-center gap-2 justify-self-center text-center"
                          >
                            <span
                              className={cn(
                                'flex h-[48px] w-[48px] items-center justify-center rounded-full border bg-white',
                                tone === 'purple'
                                  ? 'border-[#efd8ff] text-[#cb45ff]'
                                  : 'border-[#dfe7fb] text-[#1a56db]'
                              )}
                            >
                              <Icon className="h-5 w-5" />
                            </span>
                            <span
                              className={cn(
                                'text-[10.5px] leading-4',
                                tone === 'purple'
                                  ? 'text-[#8f53d8]'
                                  : 'text-[#5f7099]'
                              )}
                            >
                              {label}
                            </span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {totalPages > 1 ? (
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  disabled={currentPage === 1}
                  className={cn(
                    'flex h-[30px] min-w-[30px] items-center justify-center rounded-[8px] border px-2 text-[11px] font-medium',
                    currentPage === 1
                      ? 'cursor-not-allowed border-[#edf2fb] bg-[#f8faff] text-[#a7b4d3]'
                      : 'border-[#e1e8fb] bg-white text-[#5f7099]'
                  )}
                >
                  {PREV}
                </button>

                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1
                ).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      'flex h-[30px] min-w-[30px] items-center justify-center rounded-[8px] border px-2 text-[11px] font-medium',
                      page === currentPage
                        ? 'border-[#1a56db] bg-[#1a56db] text-white'
                        : 'border-[#e1e8fb] bg-white text-[#5f7099]'
                    )}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                  disabled={currentPage === totalPages}
                  className={cn(
                    'flex h-[30px] min-w-[30px] items-center justify-center rounded-[8px] border px-2 text-[11px] font-medium',
                    currentPage === totalPages
                      ? 'cursor-not-allowed border-[#edf2fb] bg-[#f8faff] text-[#a7b4d3]'
                      : 'border-[#e1e8fb] bg-white text-[#5f7099]'
                  )}
                >
                  {NEXT}
                </button>
              </div>
            ) : null}

            <Card className="rounded-[18px] border-[#e6ecfb] bg-[linear-gradient(180deg,#fcfdff_0%,#f7faff_100%)] px-5 py-4 shadow-[0_10px_26px_rgba(37,73,153,0.04)]">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3.5">
                  <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border border-[#d8e3ff] bg-white text-[#1a56db] shadow-[0_4px_12px_rgba(36,81,246,0.06)]">
                    <BellRing className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <div className="ui-body-strong">
                      More quotes may be on the way!
                    </div>
                    <div className="mt-0.5 text-[10.5px] text-[#5f7099]">
                      We&apos;ll notify you as more garages submit their quotes.
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="inline-flex h-[34px] items-center justify-center gap-2 rounded-[10px] border border-[#c9d8ff] bg-white px-3.5 text-[11px] font-semibold text-[#1a56db] shadow-[0_4px_12px_rgba(36,81,246,0.05)]"
                >
                  <Gauge className="h-4 w-4" />
                  <span>Notification Settings</span>
                </button>
              </div>
            </Card>

            <div className="flex items-center justify-center gap-2 text-center text-[10.5px] text-[#5f7099]">
              <Lock className="h-3.5 w-3.5 text-[#8b9ac1]" />
              <span>
                We do not charge any platform fee. You pay the garage directly.
              </span>
            </div>
          </div>

          <div className="space-y-4 2xl:pt-[76px]">
            <Card className="rounded-[18px] border-[#e6ecfb] bg-white px-4 py-3.5 shadow-[0_12px_30px_rgba(37,73,153,0.04)]">
              <div className="flex items-center gap-3">
                <h3 className={homeSectionHeadingClass}>
                  Your Request Summary
                </h3>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <div className={homeBodyClass}>Vehicle</div>
                  <div className="ui-subheading mt-2">
                    Honda City (TS07 AB 1234)
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2.5 text-[11px] text-[#5f7099]">
                    <span>Petrol</span>
                    <span>{BULLET}</span>
                    <span>2018</span>
                    <span>{BULLET}</span>
                    <span>58,320 km</span>
                  </div>
                </div>

                <div>
                  <div className={homeBodyClass}>
                    Issues Requested ({requestedIssues.length})
                  </div>
                  <div className="mt-2 space-y-2 text-[12px] text-[#17307a]">
                    {requestedIssues.map((issue) => (
                      <div key={issue.id}>
                        {BULLET}&nbsp; {issue.title}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-[#edf2fb] pt-4">
                  <div className={homeBodyClass}>Request sent on</div>
                  <div className="mt-2 text-[12px] text-[#17307a]">
                    20 May 2024, 10:30 AM
                  </div>
                </div>
              </div>
            </Card>

            <Card className="rounded-[18px] border-[#e6ecfb] bg-white px-5 py-4 shadow-[0_12px_30px_rgba(37,73,153,0.04)]">
              <h3 className={homeSectionHeadingClass}>Need Help?</h3>
              <p className="mt-3 text-[11px] text-[#5f7099]">
                Have questions about your quotes?
              </p>
              <div className="mt-5 space-y-4">
                <button
                  type="button"
                  className="text-left text-[12px] font-semibold text-[#1a56db]"
                >
                  View Help Center
                </button>
                <button
                  type="button"
                  className="text-left text-[12px] font-medium text-[#5f7099]"
                >
                  Chat with our support team
                </button>
              </div>
            </Card>

            <Card className="rounded-[18px] border-[#dceee5] bg-[radial-gradient(circle_at_top,#fcfffd_0%,#f8fffb_62%,#f6fbff_100%)] px-5 py-4 shadow-[0_12px_30px_rgba(37,73,153,0.04)]">
              <div className="flex items-start gap-4">
                <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-[#e9f7ef] text-[#16975b]">
                  <ShieldCheck className="h-7 w-7" />
                </span>
                <div className="min-w-0">
                  <h3 className="whitespace-nowrap text-[14px] font-semibold tracking-[-0.03em] text-[#159a5d]">
                    Your data is safe with us
                  </h3>
                  <p className="mt-2 text-[11px] leading-6 text-[#5f7099]">
                    We only share your request with verified and trusted
                    garages.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

export default QuotesPage;
