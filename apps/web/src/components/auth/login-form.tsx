'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { API_BASE_URL } from '@/lib/api';

type LoginFormProps = {
  title: string;
  subtitle: string;
  phoneLabel: string;
  phonePlaceholder: string;
  sendOtpLabel: string;
  sendingOtpLabel: string;
  socialDividerLabel: string;
  continueWithGoogleLabel: string;
  continueWithAppleLabel: string;
  invalidPhoneMessage: string;
  sendOtpFailedMessage: string;
  unexpectedErrorMessage: string;
};

export function LoginForm({
  title,
  subtitle,
  phoneLabel,
  phonePlaceholder,
  sendOtpLabel,
  sendingOtpLabel,
  socialDividerLabel,
  continueWithGoogleLabel,
  continueWithAppleLabel,
  invalidPhoneMessage,
  sendOtpFailedMessage,
  unexpectedErrorMessage,
}: LoginFormProps) {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ phone?: string }>({});

  async function onSocialLogin(provider: 'google' | 'apple') {
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/social/${provider}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });

      let payload: { message?: string; redirectPath?: string } = {};
      try {
        payload = (await response.json()) as { message?: string; redirectPath?: string };
      } catch {
        payload = {};
      }

      if (!response.ok) {
        throw new Error(payload.message ?? unexpectedErrorMessage);
      }

      router.push(payload.redirectPath ?? '/');
    } catch (err) {
      setError(err instanceof Error ? err.message : unexpectedErrorMessage);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const errors: { phone?: string } = {};

    if (!/^\d{10}$/.test(phone)) {
      errors.phone = invalidPhoneMessage;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message ?? sendOtpFailedMessage);
      }
      router.push(`/auth/verify?mode=login&phone=${encodeURIComponent(phone)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : unexpectedErrorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h2 className="font-display text-4xl font-bold text-foreground">{title}</h2>
      <p className="mt-2 text-muted-foreground">{subtitle}</p>

      <form className="mt-8 space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="phone">{phoneLabel}</Label>
          <Input
            id="phone"
            type="tel"
            inputMode="numeric"
            pattern="[0-9]{10}"
            maxLength={10}
            placeholder={phonePlaceholder}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            className={fieldErrors.phone ? 'border-destructive' : ''}
          />
          {fieldErrors.phone && <p className="text-sm text-destructive">{fieldErrors.phone}</p>}
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button className="h-12 w-full text-base" type="submit" disabled={loading}>
          {loading ? sendingOtpLabel : sendOtpLabel}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
          {socialDividerLabel}
        </p>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          type="button"
          variant="outline"
          className="group relative h-11 w-full"
          onClick={() => void onSocialLogin('google')}
        >
          <GoogleIcon />
          {continueWithGoogleLabel}
          <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-border bg-background px-2 py-1 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
            Feature coming soon
          </span>
        </Button>
        <Button
          type="button"
          variant="outline"
          className="group relative h-11 w-full"
          onClick={() => void onSocialLogin('apple')}
        >
          <AppleIcon />
          {continueWithAppleLabel}
          <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-border bg-background px-2 py-1 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
            Feature coming soon
          </span>
        </Button>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="h-4 w-4">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303C33.655 32.657 29.24 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.95 3.05l5.657-5.657C34.056 6.053 29.278 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 16.108 18.961 13 24 13c3.059 0 5.842 1.154 7.95 3.05l5.657-5.657C34.056 6.053 29.278 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.176 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.154 35.144 26.715 36 24 36c-5.219 0-9.623-3.329-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.776 2.164-2.259 3.955-4.084 5.2l.003-.002 6.19 5.238C36.971 38.801 44 33.5 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M16.6 12.7c0-2 1.7-3 1.8-3.1-1-1.5-2.5-1.7-3-1.7-1.3-.1-2.5.8-3.1.8-.6 0-1.6-.8-2.7-.8-1.4 0-2.7.8-3.4 2.1-1.5 2.6-.4 6.5 1.1 8.7.7 1.1 1.6 2.3 2.8 2.2 1.1 0 1.6-.7 2.9-.7 1.3 0 1.7.7 2.9.7 1.2 0 2-.9 2.7-2 .8-1.1 1.1-2.2 1.1-2.2 0 0-2.1-.8-2.1-3.9zM14.6 6.7c.6-.8 1-1.8.9-2.9-.9 0-2 .6-2.7 1.4-.6.7-1.1 1.8-1 2.9 1 .1 2.1-.5 2.8-1.4z" />
    </svg>
  );
}
