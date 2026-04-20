import type { ReactNode } from 'react';
import Image from 'next/image';

type AuthShellProps = {
  layout?: 'split' | 'centered';
  appName?: string;
  logoUrl?: string;
  motto?: string;
  rightPane: ReactNode;
  // Legacy props for split layout
  hideHeroOnMobile?: boolean;
  hideHero?: boolean;
  authModeLabel?: string;
  heroKicker?: string;
  heroTitle?: string;
  heroBody?: string;
};

export function AuthShell({
  layout = 'centered',
  appName = 'WrectifAI',
  logoUrl = '/wrectifai_logo_cropped.png',
  rightPane,
  hideHeroOnMobile = false,
  hideHero = false,
  authModeLabel = '',
  heroKicker = '',
  heroTitle = '',
  heroBody = '',
}: AuthShellProps) {
  if (layout === 'centered') {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[480px] flex flex-col items-center">
          {/* Top Branding Section */}
          <div className="flex flex-col items-center mb-4 transition-all duration-500">
            <div className="relative w-72 h-44">
              <Image 
                src={logoUrl} 
                alt="Logo" 
                fill 
                className="object-contain scale-110"
                priority
              />
            </div>
          </div>

          {/* Main Card */}
          <section className="w-full bg-card rounded-[2rem] shadow-ambient overflow-hidden">
            <div className="p-8 sm:p-10">
              {rightPane}
            </div>
          </section>
        </div>
      </main>
    );
  }

  // Legacy Split Layout
  const asideClassName = hideHero
    ? 'hidden'
    : hideHeroOnMobile
    ? 'hidden relative min-h-[520px] overflow-hidden bg-sidebar p-12 text-sidebar-foreground lg:block'
    : 'relative min-h-[520px] overflow-hidden bg-sidebar p-12 text-sidebar-foreground';

  const gridClassName = hideHero ? 'grid-cols-1' : 'lg:grid-cols-2';

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-8 flex items-center justify-between">
          <p className="font-display text-4xl font-bold text-foreground">{appName}</p>
          <p className="text-sm text-muted-foreground">{authModeLabel}</p>
        </header>

        <section className={`grid gap-0 overflow-hidden rounded-xl surface-low shadow-ambient ${gridClassName}`}>
          <aside className={asideClassName}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(72,148,226,0.25),transparent_45%)]" />
            <div className="relative z-10">
              <p className="mb-6 inline-flex rounded-full bg-sidebar-accent px-4 py-1 text-xs tracking-[0.16em] text-sidebar-foreground">
                {heroKicker}
              </p>
              <h1 className="mb-6 text-5xl font-display font-extrabold leading-tight text-primary">
                {heroTitle}
              </h1>
              <p className="max-w-md text-xl text-blue-100/85">{heroBody}</p>
            </div>
          </aside>

          <div className="surface-lowest p-10">{rightPane}</div>
        </section>
      </div>
    </main>
  );
}
