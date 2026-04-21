'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api';

type SessionGuardProps = {
  requiredRole: 'user' | 'garage' | 'vendor' | 'admin';
};

export function SessionGuard({ requiredRole }: SessionGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let active = true;

    function clearRoleHint() {
      document.cookie = 'wrect_role_hint=; Path=/; Max-Age=0; SameSite=Lax';
    }

    async function redirectToLoginAfterLogout() {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          credentials: 'include',
          cache: 'no-store',
        });
      } catch {
        // Ignore logout API failures and force local redirect.
      } finally {
        clearRoleHint();
        router.replace('/auth/login');
      }
    }

    async function verifySession() {
      try {
        const me = async () =>
          fetch(`${API_BASE_URL}/auth/me`, {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
          });

        let response = await me();

        if (!response.ok) {
          const refreshResponse = await fetch(`${API_BASE_URL}/auth/sessions/refresh`, {
            method: 'POST',
            credentials: 'include',
            cache: 'no-store',
          });
          if (!refreshResponse.ok) {
            await redirectToLoginAfterLogout();
            return;
          }
          response = await me();
        }

        if (!response.ok) {
          await redirectToLoginAfterLogout();
          return;
        }

        const data = (await response.json()) as {
          user?: {
            roleCode?: 'user' | 'garage' | 'vendor' | 'admin';
            garageApproved?: boolean;
          };
        };
        const role = data.user?.roleCode;
        const garageApproved = data.user?.garageApproved;

        if (!role) {
          await redirectToLoginAfterLogout();
          return;
        }

        if (role === 'garage') {
          const isProfileRoute = pathname === '/garage/profile' || pathname.startsWith('/garage/profile/');
          if (garageApproved === false && !isProfileRoute) {
            router.replace('/garage/profile');
            return;
          }
        }

        if (role !== requiredRole) {
          router.replace(`/${role}/dashboard`);
          return;
        }

        if (active) {
          router.refresh();
        }
      } catch {
        await redirectToLoginAfterLogout();
      }
    }

    verifySession();

    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted) {
        verifySession();
      }
    }

    window.addEventListener('pageshow', onPageShow);
    return () => {
      active = false;
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [pathname, requiredRole, router]);

  return null;
}
