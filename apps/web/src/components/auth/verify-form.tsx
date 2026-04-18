'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { API_BASE_URL } from '@/lib/api';

type VerifyFormProps = {
  mode: 'login' | 'register';
  phone: string;
  roleCode?: string;
  fullName?: string;
  title: string;
  subtitleTemplate: string;
  otpLabel: string;
  otpPlaceholder: string;
  ctaLabel: string;
  ctaLoadingLabel: string;
  invalidOtpMessage: string;
  verifyFailedMessage: string;
  unexpectedErrorMessage: string;
};

export function VerifyForm({
  mode,
  phone,
  roleCode,
  fullName,
  title,
  subtitleTemplate,
  otpLabel,
  otpPlaceholder,
  ctaLabel,
  ctaLoadingLabel,
  invalidOtpMessage,
  verifyFailedMessage,
  unexpectedErrorMessage,
}: VerifyFormProps) {
  const router = useRouter();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\d{6}$/.test(otp)) {
      setError(invalidOtpMessage);
      return;
    }

    setLoading(true);
    try {
      const endpoint =
        mode === 'register' ? '/auth/register/verify' : '/auth/login/verify';
      const payload =
        mode === 'register'
          ? { phone, roleCode, fullName, otp }
          : { phone, otp };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const contentType = response.headers.get('content-type') ?? '';
      const isJson = contentType.includes('application/json');
      const data = isJson
        ? ((await response.json()) as { message?: string; redirectPath?: string })
        : { message: await response.text() };
      if (!response.ok) {
        throw new Error(data.message ?? verifyFailedMessage);
      }
      const target = data.redirectPath ?? '/';
      // Use a full navigation so auth cookies set by the verify response
      // are definitely applied before protected middleware checks run.
      window.location.assign(target);
    } catch (err) {
      setError(err instanceof Error ? err.message : unexpectedErrorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h2 className="font-display text-4xl font-bold text-foreground">{title}</h2>
      <p className="mt-2 text-muted-foreground">
        {subtitleTemplate.replace('{phone}', phone)}
      </p>

      <form className="mt-8 space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="otp">{otpLabel}</Label>
          <Input
            id="otp"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder={otpPlaceholder}
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button className="h-12 w-full text-base" type="submit" disabled={loading}>
          {loading ? ctaLoadingLabel : ctaLabel}
        </Button>
      </form>
    </div>
  );
}
