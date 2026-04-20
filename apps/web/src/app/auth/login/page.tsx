import Link from 'next/link';
import { AuthShell } from '@/components/auth/auth-shell';
import { LoginForm } from '@/components/auth/login-form';
import { getAuthPageContent } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const ui = await getAuthPageContent('login');

  return (
    <AuthShell
      layout="centered"
      appName={ui.appName}
      motto={ui.hero.body}
      rightPane={
          <LoginForm
            title={ui.form.title}
            subtitle={ui.form.subtitle}
            phoneLabel={ui.form.phoneLabel}
            phonePlaceholder={ui.form.phonePlaceholder}
            sendOtpLabel={ui.form.sendOtpLabel}
            sendingOtpLabel={ui.form.sendingOtpLabel}
            socialDividerLabel={ui.form.socialDividerLabel}
            continueWithGoogleLabel={ui.form.continueWithGoogleLabel}
            continueWithAppleLabel={ui.form.continueWithAppleLabel}
            invalidPhoneMessage={ui.errors.phoneInvalid}
            sendOtpFailedMessage={ui.errors.sendOtpFailed}
            unexpectedErrorMessage={ui.errors.unexpected}
          />
      }
    />
  );
}
