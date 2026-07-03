'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useCallback, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/home/sidebar';
import { cn } from '@/utils/cn';

const TOKEN_STORAGE_KEY = 'wrectifai_token';

export function DashboardShell({
  header,
  children,
  aside,
}: {
  header?: ReactNode;
  children: ReactNode;
  aside?: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [authChecked, setAuthChecked] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const redirectToLogin = useCallback(() => {
    const redirect =
      pathname && pathname !== '/'
        ? `?redirect=${encodeURIComponent(pathname)}`
        : '';
    setAuthChecked(false);
    router.replace(`/login${redirect}`);
  }, [pathname, router]);

  const verifySession = useCallback(() => {
    const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);

    if (!token) {
      redirectToLogin();
      return;
    }

    setAuthChecked(true);
  }, [redirectToLogin]);

  const handleToggle = () => {
    setCollapsed((current) => !current);
  };

  useEffect(() => {
    verifySession();

    const handlePageShow = () => verifySession();
    const handleFocus = () => verifySession();
    const handlePopState = () => verifySession();
    const handleAuthChange = () => verifySession();
    const handleStorage = (event: StorageEvent) => {
      if (event.key === TOKEN_STORAGE_KEY) {
        verifySession();
      }
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        verifySession();
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('wrectifai-auth-changed', handleAuthChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('wrectifai-auth-changed', handleAuthChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [verifySession]);

  useEffect(() => {
    const handleToggleMobile = () => setMobileOpen((curr) => !curr);
    window.addEventListener('toggle-mobile-sidebar', handleToggleMobile);
    return () =>
      window.removeEventListener('toggle-mobile-sidebar', handleToggleMobile);
  }, []);

  if (!authChecked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f8fe] px-4">
        <div className="rounded-[14px] border border-[#dbe6ff] bg-white px-5 py-4 text-[13px] font-semibold text-[#17307a] shadow-sm">
          Checking secure access...
        </div>
      </main>
    );
  }

  return (
    <main id="top" className="min-h-screen bg-[#f6f8fe]">
      <div className="mx-auto max-w-[1600px] px-3 py-3 sm:px-4 lg:px-5 lg:h-screen lg:overflow-hidden lg:py-4">
        <div
          className={cn(
            'grid gap-4 lg:h-full lg:gap-0 lg:[grid-template-columns:var(--sidebar-width)_minmax(0,1fr)]'
          )}
          style={
            {
              '--sidebar-width': collapsed ? '84px' : '248px',
            } as CSSProperties
          }
        >
          {mobileOpen ? (
            <div
              className="fixed inset-0 z-[60] bg-[#0a122d]/40 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
          ) : null}

          <div
            className={cn(
              'fixed inset-y-0 left-0 z-[70] w-[280px] transform transition-transform duration-300 ease-in-out lg:static lg:z-auto lg:w-auto lg:transform-none lg:sticky lg:top-0 lg:h-screen',
              mobileOpen
                ? 'translate-x-0'
                : '-translate-x-full lg:translate-x-0'
            )}
          >
            <Sidebar
              collapsed={collapsed}
              onToggle={handleToggle}
              onMobileClose={() => setMobileOpen(false)}
            />
          </div>

          <div className="flex min-h-0 flex-col gap-4 lg:h-full lg:overflow-y-auto lg:px-4 lg:pr-1">
            {header ? <div>{header}</div> : null}
            <div
              className={cn(
                'grid gap-4 lg:items-start lg:gap-4',
                aside ? 'lg:grid-cols-[minmax(0,1fr)_300px]' : 'lg:grid-cols-1'
              )}
            >
              <div className="min-w-0">{children}</div>
              {aside ? <div className="min-w-0">{aside}</div> : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
