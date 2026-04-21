'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { API_BASE_URL } from '@/lib/api';
import { OTPInput } from './otp-input';
import { ChevronLeft, Info } from 'lucide-react';

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

type Step = 'phone' | 'otp';

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
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ phone?: string; otp?: string }>({});

  function persistRoleHint(roleCode?: string) {
    const normalized = roleCode?.trim().toLowerCase();
    if (!normalized) return;
    if (!['user', 'garage', 'vendor', 'admin'].includes(normalized)) return;
    document.cookie = `wrect_role_hint=${encodeURIComponent(normalized)}; Path=/; Max-Age=600; SameSite=Lax`;
  }

  async function onSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!/^\d{10}$/.test(phone)) {
      setFieldErrors({ phone: invalidPhoneMessage });
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
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : unexpectedErrorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone, otp }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message ?? "Verification failed");
      }
      persistRoleHint(data.roleCode);
      window.location.assign(data.redirectPath ?? '/');
    } catch (err) {
      setError(err instanceof Error ? err.message : unexpectedErrorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      {step === 'otp' && (
        <button 
          onClick={() => setStep('phone')}
          className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Edit Phone Number
        </button>
      )}

      <form className="space-y-6" onSubmit={step === 'phone' ? onSendOtp : onVerifyOtp}>
        {step === 'phone' ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-muted-foreground ml-1">
                {phoneLabel}
              </Label>
              <Input
                id="phone"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength={10}
                placeholder={phonePlaceholder}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className={fieldErrors.phone ? 'border-destructive h-12 text-base rounded-xl' : 'h-12 text-base rounded-xl'}
              />
              {fieldErrors.phone && <p className="text-sm text-destructive ml-1">{fieldErrors.phone}</p>}
            </div>

            <Button 
              className="w-full h-12 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/20" 
              type="submit" 
              disabled={loading}
            >
              {loading ? sendingOtpLabel : sendOtpLabel}
            </Button>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-3">
              <div className="flex justify-between items-end px-1">
                <Label htmlFor="otp" className="text-sm font-medium text-muted-foreground">
                  OTP (6 digits)
                </Label>
                <p className="text-xs text-green-600 font-medium animate-pulse">
                  OTP sent successfully.
                </p>
              </div>
              <OTPInput 
                value={otp}
                onChange={setOtp}
                length={6}
                disabled={loading}
              />
            </div>

            {error ? <p className="text-sm text-destructive text-center">{error}</p> : null}

            <Button 
              className="w-full h-12 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/20" 
              type="submit" 
              disabled={loading || otp.length !== 6}
            >
              {loading ? "Verifying..." : "Login"}
            </Button>
          </div>
        )}
      </form>

      {/* Quick Login Tips */}
      <div className="mt-10 p-6 rounded-2xl bg-secondary/30 border border-secondary/50">
        <div className="flex items-center gap-2 mb-3 text-primary font-bold">
          <Info className="w-5 h-5" />
          <span>Quick Login Tips</span>
        </div>
        <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
          <li>Use your registered mobile number</li>
          <li>Ensure you have range to receive SMS OTP</li>
          <li>Contact support if you face any issues</li>
        </ul>
      </div>

      <div className="mt-8 flex items-center gap-3 opacity-50">
        <div className="h-px flex-1 bg-border" />
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          {socialDividerLabel}
        </p>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="mt-6 flex justify-center gap-4">
        {/* Placeholder for social icons as per design need, keeping them simple buttons for now */}
        <Button variant="outline" size="icon" className="w-12 h-12 rounded-xl" disabled>
          <GoogleIcon />
        </Button>
        <Button variant="outline" size="icon" className="w-12 h-12 rounded-xl" disabled>
          <AppleIcon />
        </Button>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="h-5 w-5">
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
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
      <path d="M16.6 12.7c0-2 1.7-3 1.8-3.1-1-1.5-2.5-1.7-3-1.7-1.3-.1-2.5.8-3.1.8-.6 0-1.6-.8-2.7-.8-1.4 0-2.7.8-3.4 2.1-1.5 2.6-.4 6.5 1.1 8.7.7 1.1 1.6 2.3 2.8 2.2 1.1 0 1.6-.7 2.9-.7 1.3 0 1.7.7 2.9.7 1.2 0 2-.9 2.7-2 .8-1.1 1.1-2.2 1.1-2.2 0 0-2.1-.8-2.1-3.9zM14.6 6.7c.6-.8 1-1.8.9-2.9-.9 0-2 .6-2.7 1.4-.6.7-1.1 1.8-1 2.9 1 .1 2.1-.5 2.8-1.4z" />
    </svg>
  );
}
