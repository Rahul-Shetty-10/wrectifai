import Link from 'next/link';
import { AuthShell } from '@/components/auth/auth-shell';
import { RegisterForm } from '@/components/auth/register-form';
import { getAuthPageContent } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function GarageRegisterPage() {
  const ui = await getAuthPageContent('register');

  return (
    <AuthShell
      hideHeroOnMobile
      appName={ui.appName}
      authModeLabel={ui.authModeLabel}
      heroKicker={ui.hero.kicker}
      heroTitle={ui.hero.title}
      heroBody={ui.hero.body}
      rightPane={
        <div>
          <p className="mb-6 text-right text-sm text-muted-foreground">
            {ui.links.haveAccountPrefix}{' '}
            <Link href="/auth/login" className="text-primary hover:underline">
              {ui.links.haveAccountCta}
            </Link>
          </p>
          <RegisterForm
            initialRoleCode="garage"
            title={ui.form.title}
            subtitle={ui.form.subtitle}
            fullNameLabel={ui.form.fullNameLabel}
            fullNamePlaceholder={ui.form.fullNamePlaceholder}
            phoneLabel={ui.form.phoneLabel}
            phonePlaceholder={ui.form.phonePlaceholder}
            termsLabel={ui.form.termsLabel}
            createAccountLabel={ui.form.createAccountLabel}
            sendingOtpLabel={ui.form.sendingOtpLabel}
            socialDividerLabel={ui.form.socialDividerLabel}
            continueWithGoogleLabel={ui.form.continueWithGoogleLabel}
            continueWithAppleLabel={ui.form.continueWithAppleLabel}
            fullNameRequiredMessage={ui.errors.fullNameRequired}
            invalidPhoneMessage={ui.errors.phoneInvalid}
            termsRequiredMessage={ui.errors.termsRequired}
            sendOtpFailedMessage={ui.errors.sendOtpFailed}
            unexpectedErrorMessage={ui.errors.unexpected}
          />
        </div>
      }
    />
  );
}
