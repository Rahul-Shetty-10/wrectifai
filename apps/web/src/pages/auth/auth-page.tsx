'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  CarFront,
  Eye,
  EyeOff,
  LockKeyhole,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/common/badge';
import { Button } from '@/components/common/button';
import { Card } from '@/components/common/card';
import { Input } from '@/components/common/input';
import { cn } from '@/utils/cn';

type AuthMode = 'login' | 'signup';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4200/api';

const benefits = [
  { label: 'AI diagnosis history', icon: Sparkles },
  { label: 'Garage quotes in one place', icon: Wrench },
  { label: 'Verified service updates', icon: ShieldCheck },
];

function BrandHeader() {
  return (
    <div className="flex items-center justify-between gap-3">
      <Link href="/" className="flex items-center gap-2.5">
        <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[12px] border border-[#dbe6ff] bg-white shadow-sm">
          <Image
            src="/fin_logo.png"
            alt="WrectifAI"
            width={96}
            height={96}
            priority
            className="h-14 w-14 object-contain"
          />
        </span>
        <span className="min-w-0">
          <span className="block text-[14px] font-bold text-white">
            WrectifAI
          </span>
          <span className="block text-[11px] font-medium text-white/72">
            Vehicle care workspace
          </span>
        </span>
      </Link>

      <Badge tone="slate" className="hidden h-8 rounded-[8px] px-3 sm:inline-flex">
        Live support
      </Badge>
    </div>
  );
}

function AuthField({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-[#17307a]">
        <Icon className="h-3.5 w-3.5 text-[#1a56db]" />
        {label}
      </span>
      {children}
    </label>
  );
}

export function AuthPage({ mode }: { mode: AuthMode }) {
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [city, setCity] = useState('Hyderabad');
  const [otpRequested, setOtpRequested] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const isSignup = mode === 'signup';
  const title = isSignup ? 'Create your account' : 'Welcome back';
  const subtitle = isSignup
    ? 'Join WrectifAI to manage vehicles, requests, quotes, and service bookings from one clean workspace.'
    : 'Sign in to continue tracking diagnostics, quotes, bookings, and garage updates.';
  const alternateHref = isSignup ? '/login' : '/signup';
  const alternateLabel = isSignup
    ? 'Already have an account? Log in'
    : 'New to WrectifAI? Create account';

  const callAuthApi = async (path: string, body: Record<string, unknown>) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        payload?.error?.message ?? 'Something went wrong. Please try again.'
      );
    }

    return payload.data;
  };

  const handleRequestOtp = async () => {
    setIsSubmitting(true);
    setStatusMessage('');
    setErrorMessage('');

    try {
      await callAuthApi('/auth/request-otp', { phone });
      setOtpRequested(true);
      setStatusMessage('OTP sent. Enter the code to continue.');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Could not request OTP.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatusMessage('');
    setErrorMessage('');

    try {
      const data = isSignup
        ? await callAuthApi('/auth/signup', {
            phone,
            otp,
            name,
            city,
            role: 'customer',
          })
        : await callAuthApi('/auth/verify-otp', { phone, otp });

      window.localStorage.setItem('wrectifai_token', data.token);
      window.localStorage.setItem('wrectifai_user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('wrectifai-auth-changed'));
      setStatusMessage('Verified. Taking you to your dashboard...');
      window.location.replace(searchParams?.get('redirect') || '/');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Could not verify OTP.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f6f8fe] px-3 py-3 sm:px-5 lg:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-24px)] max-w-[1180px] gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(390px,0.78fr)] lg:items-stretch">
        <section className="relative min-h-[360px] overflow-hidden rounded-[18px] border border-[#dfe8ff] bg-[#07163b] text-white shadow-[0_16px_42px_rgba(23,48,122,0.12)] lg:min-h-full">
          <Image
            src="/assets/garage_1_1778071156220.png"
            alt="Garage service bay"
            fill
            priority
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,22,59,0.94)_0%,rgba(19,44,102,0.78)_48%,rgba(7,22,59,0.34)_100%)]" />
          <div className="relative flex min-h-full flex-col justify-between gap-8 p-5 sm:p-7 lg:p-8">
            <BrandHeader />

            <div className="max-w-[540px]">
              <Badge tone="blue" className="h-8 rounded-[8px] bg-white text-[#17307a]">
                Trusted automotive assistant
              </Badge>
              <h1 className="mt-5 text-[31px] font-bold leading-tight text-white sm:text-[42px]">
                Diagnose, quote, and book your car care in one place.
              </h1>
              <p className="mt-4 max-w-[480px] text-[13px] leading-6 text-white/82 sm:text-[14px]">
                Keep your vehicle profile, AI issue notes, garage quotes, and
                booking status connected from the first symptom to the final
                service update.
              </p>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-3">
              {benefits.map(({ label, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-[12px] border border-white/14 bg-white/10 px-3 py-3 backdrop-blur"
                >
                  <Icon className="h-4.5 w-4.5 text-white" />
                  <p className="mt-2 text-[11.5px] font-semibold leading-4 text-white">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-center">
          <Card className="w-full rounded-[18px] border-[#dfe8ff] bg-white/95 p-4 shadow-[0_16px_42px_rgba(30,58,138,0.08)] sm:p-6 lg:p-7">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase text-[#7a8ab4]">
                  Account access
                </p>
                <h2 className="mt-2 text-[25px] font-bold leading-tight text-[#17307a]">
                  {title}
                </h2>
                <p className="mt-2 max-w-[410px] text-[12.5px] leading-5 text-[#5f7099]">
                  {subtitle}
                </p>
              </div>
              <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[#eef4ff] text-[#1a56db] sm:flex">
                <CarFront className="h-5 w-5" />
              </div>
            </div>

            <form className="space-y-3.5" onSubmit={handleSubmit}>
              {isSignup ? (
                <AuthField icon={UserRound} label="Full name">
                  <Input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                    placeholder="Rahul Sharma"
                    className="h-11 rounded-[10px]"
                  />
                </AuthField>
              ) : null}

              <AuthField icon={Phone} label="Phone number">
                <Input
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value);
                    setOtp('');
                    setOtpRequested(false);
                    setStatusMessage('');
                    setErrorMessage('');
                  }}
                  type="tel"
                  autoComplete="tel"
                  placeholder="+91 98765 43210"
                  className="h-11 rounded-[10px]"
                />
              </AuthField>

              {otpRequested ? (
                <AuthField icon={LockKeyhole} label="One-time password">
                  <div className="relative">
                    <Input
                      value={otp}
                      onChange={(event) => setOtp(event.target.value)}
                      type={showPassword ? 'text' : 'password'}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="Enter OTP"
                      className="h-11 rounded-[10px] pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-[8px] text-[#6b7aa5] hover:bg-[#eef4ff] hover:text-[#17307a]"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </AuthField>
              ) : null}

              {isSignup ? (
                <AuthField icon={MapPin} label="Primary city">
                  <Input
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    placeholder="Hyderabad"
                    className="h-11 rounded-[10px]"
                  />
                </AuthField>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-[12px] font-medium text-[#5f7099]">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-[#c8d6f6] text-[#1a56db]"
                    />
                    Remember me
                  </label>
                  <Link href="/help-support" className="text-[12px] font-semibold text-[#1a56db]">
                    Need help?
                  </Link>
                </div>
              )}

              {statusMessage ? (
                <div className="rounded-[10px] border border-[#d5f0df] bg-[#f0fff4] px-3 py-2 text-[11.5px] font-medium text-[#238453]">
                  {statusMessage}
                </div>
              ) : null}

              {errorMessage ? (
                <div className="rounded-[10px] border border-[#ffd3d8] bg-[#fff5f6] px-3 py-2 text-[11.5px] font-medium text-[#b42335]">
                  {errorMessage}
                </div>
              ) : null}

              <div
                className={cn(
                  'grid gap-2',
                  otpRequested ? 'sm:grid-cols-[0.72fr_1fr]' : 'sm:grid-cols-1'
                )}
              >
                <Button
                  type="button"
                  variant={otpRequested ? 'subtle' : 'outline'}
                  className="h-11 rounded-[10px]"
                  disabled={isSubmitting}
                  onClick={handleRequestOtp}
                >
                  {otpRequested ? 'Resend OTP' : 'Send OTP'}
                </Button>
                {otpRequested ? (
                  <Button
                    type="submit"
                    className="h-11 rounded-[10px]"
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? 'Please wait...'
                      : isSignup
                      ? 'Verify and create'
                      : 'Verify and log in'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </form>

            <div className="mt-4 flex items-center justify-center">
              <Button asChild variant="ghost" className="h-9 rounded-[9px] px-3 text-[12px]">
                <Link href={alternateHref}>{alternateLabel}</Link>
              </Button>
            </div>

          </Card>
        </section>
      </div>
    </main>
  );
}

export default AuthPage;
