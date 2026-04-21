'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, CreditCard, Loader2 } from 'lucide-react';
import { UserThemeShell } from '@/components/dashboard/user-theme-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  confirmPaymentIntent,
  fetchPaymentIntent,
  fetchUserProfile,
  type PaymentIntent,
  type UserProfile,
  type UserSidebarContent,
} from '@/lib/api';

type Props = {
  sidebar: UserSidebarContent;
};

export function PaymentsCheckoutClient({ sidebar }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const intentId = searchParams.get('intentId') ?? '';

  const [intent, setIntent] = useState<PaymentIntent | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    async function load() {
      if (!intentId) {
        setError('Missing payment intent.');
        setLoading(false);
        return;
      }
      try {
        const [intentData, profileData] = await Promise.all([
          fetchPaymentIntent(intentId),
          fetchUserProfile(),
        ]);
        setIntent(intentData);
        setProfile(profileData);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load payment details.');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [intentId]);

  async function handlePayNow() {
    if (!intentId) return;
    try {
      setSubmitting(true);
      setError(null);
      await confirmPaymentIntent(intentId);
      setSuccess(true);
      setRedirecting(true);
      setTimeout(() => {
        router.push('/user/dashboard');
      }, 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to complete payment.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <UserThemeShell activeItem="payments" sidebar={sidebar}>
      <section className="overflow-y-auto">
        <div className="mx-auto max-w-3xl p-4 sm:p-6 md:p-8">
          <div className="mb-4 flex items-center gap-2">
            <span className="h-5 w-1 rounded-full bg-[#4ec2ed] sm:h-6" />
            <h1 className="text-[23px] font-semibold tracking-tight text-[#0f2244]">Payment Checkout</h1>
          </div>

          <Card className="rounded-xl border-[#d9e2ef] bg-white shadow-[0_6px_16px_rgba(94,126,179,0.10)]">
            <CardHeader>
              <CardTitle className="text-[17px] font-medium text-slate-900">Custom Payment Gateway</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading payment details...
                </div>
              ) : null}

              {!loading && error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}

              {!loading && !error && intent ? (
                <>
                  {success ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-700">
                      <p className="flex items-center gap-2 font-semibold">
                        <CheckCircle2 className="h-5 w-5" />
                        Payment successful
                      </p>
                      <p className="mt-1 text-sm">
                        Your booking payment has been recorded. Redirecting to dashboard...
                      </p>
                    </div>
                  ) : null}

                  <div className="space-y-2 rounded-xl border border-[#d9e2ef] bg-[#f9fbff] p-4">
                    <p className="text-sm text-muted-foreground">Payer</p>
                    <p className="font-semibold">{profile?.fullName || 'User'}</p>
                    <p className="text-sm text-muted-foreground">Service Provider</p>
                    <p className="font-semibold">{intent.garageName}</p>
                    <p className="text-sm text-muted-foreground">Vehicle</p>
                    <p className="font-semibold">{intent.vehicleStr}</p>
                    <p className="text-sm text-muted-foreground">Payment Method</p>
                    <p className="font-semibold uppercase">{intent.method.replace('_', ' ')}</p>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="text-[24px] font-semibold text-slate-900">
                      {intent.currency} {intent.amount.toFixed(2)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {!success ? (
                      <Button onClick={handlePayNow} disabled={submitting} className="gap-2">
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                        {submitting ? 'Processing...' : 'Pay Now'}
                      </Button>
                    ) : (
                      <Button onClick={() => router.push('/user/dashboard')} disabled={redirecting}>
                        {redirecting ? 'Redirecting...' : 'Go To Dashboard'}
                      </Button>
                    )}
                    <Button asChild variant="outline">
                      <Link href="/user/quotes-bookings">Back to Bookings</Link>
                    </Button>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </section>
    </UserThemeShell>
  );
}
