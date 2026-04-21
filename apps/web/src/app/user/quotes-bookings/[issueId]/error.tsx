'use client';

import { useEffect } from 'react';
import Link from 'next/link';

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function IssueQuotesError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    const message = (error?.message ?? '').toLowerCase();
    const isAuthError =
      message.includes('401') ||
      message.includes('unauthorized') ||
      message.includes('session') ||
      message.includes('token') ||
      message.includes('login');

    if (isAuthError) {
      window.location.replace('/auth/login');
    }
  }, [error]);

  return (
    <main className="min-h-screen bg-[#dfe7f5] px-4 py-8">
      <div className="mx-auto max-w-2xl rounded-2xl border border-[#d4deef] bg-white p-6 shadow-[0_12px_36px_rgba(38,67,122,0.14)]">
        <h1 className="text-xl font-semibold text-slate-900">Unable to open issue details</h1>
        <p className="mt-2 text-sm text-slate-600">
          We could not load this issue right now. Please go back and try again.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-9 items-center justify-center rounded-xl bg-[#1976f2] px-4 text-[13px] font-medium text-white"
          >
            Try Again
          </button>
          <Link
            href="/user/quotes-bookings"
            className="inline-flex h-9 items-center justify-center rounded-xl border border-[#cde0fc] bg-white px-4 text-[13px] font-medium text-[#0f62d6]"
          >
            Back to Quotes
          </Link>
        </div>
      </div>
    </main>
  );
}
