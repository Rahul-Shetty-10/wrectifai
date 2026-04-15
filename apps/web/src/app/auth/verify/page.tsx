import Link from 'next/link';
import { AuthShell } from '@/components/auth/auth-shell';
import { VerifyForm } from '@/components/auth/verify-form';
import { getAuthPageContent } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const ui = await getAuthPageContent('verify');
  const params = await searchParams;
  const mode = (params.mode === 'register' ? 'register' : 'login') as
    | 'register'
    | 'login';
  const phone = typeof params.phone === 'string' ? params.phone : '';
  const roleCode = typeof params.roleCode === 'string' ? params.roleCode : undefined;
  const fullName = typeof params.fullName === 'string' ? params.fullName : undefined;
  const registerPath =
    typeof params.registerPath === 'string' &&
    ['/auth/register', '/auth/vendor/register', '/auth/garage/register'].includes(
      params.registerPath
    )
      ? params.registerPath
      : '/auth/register';
  const backHref = mode === 'register' ? registerPath : '/auth/login';

  return (
    <AuthShell
      appName={ui.appName}
      authModeLabel=""
      heroKicker={ui.hero.kicker}
      heroTitle={ui.hero.title}
      heroBody={ui.hero.body}
      rightPane={
        <div>
          <p className="mb-6 text-right text-sm text-muted-foreground">
            {ui.links.backToPrefix}{' '}
            <Link href={backHref} className="text-primary hover:underline">
              {mode === 'register' ? ui.links.backToRegisterCta : ui.links.backToLoginCta}
            </Link>
          </p>
          <VerifyForm
            mode={mode}
            phone={phone}
            roleCode={roleCode}
            fullName={fullName}
            title={ui.form.title}
            subtitleTemplate={ui.form.subtitleTemplate}
            otpLabel={ui.form.otpLabel}
            otpPlaceholder={ui.form.otpPlaceholder}
            ctaLabel={ui.form.ctaLabel}
            ctaLoadingLabel={ui.form.ctaLoadingLabel}
            invalidOtpMessage={ui.errors.otpInvalid}
            verifyFailedMessage={ui.errors.verifyFailed}
            unexpectedErrorMessage={ui.errors.unexpected}
          />
        </div>
      }
    />
  );
}
