import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { resolveApiBaseUrl } from './lib/runtime-env';

const publicPaths = [
  '/auth/login',
  '/auth/register',
  '/auth/vendor/register',
  '/auth/garage/register',
  '/auth/verify',
];
const rolePrefixes = ['/user', '/garage', '/vendor', '/admin'] as const;
const authRoles = ['user', 'garage', 'vendor', 'admin'] as const;
type AuthRole = (typeof authRoles)[number];

function parseRoleCookie(value: string | undefined): AuthRole | null {
  const normalized = value?.replace(/^"|"$/g, '').toLowerCase();
  if (!normalized) return null;
  return authRoles.includes(normalized as AuthRole) ? (normalized as AuthRole) : null;
}

function getApiBaseUrl(req: NextRequest) {
  return resolveApiBaseUrl(req.nextUrl.origin);
}

function withNoStore(res: NextResponse) {
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.headers.set('Pragma', 'no-cache');
  res.headers.set('Expires', '0');
  return res;
}

function clearAuthCookies(res: NextResponse) {
  const cookieNames = ['wrect_at', 'wrect_rt', 'wrect_role', 'wrect_role_hint'];
  for (const cookieName of cookieNames) {
    res.cookies.set(cookieName, '', {
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    });
  }
  return res;
}

async function getSessionRole(req: NextRequest) {
  const accessToken = req.cookies.get('wrect_at')?.value;
  const refreshToken = req.cookies.get('wrect_rt')?.value;
  const roleFromCookie = parseRoleCookie(req.cookies.get('wrect_role')?.value);

  async function tryRefreshSession() {
    if (!refreshToken) return false;
    try {
      const apiBaseUrl = getApiBaseUrl(req);
      const refreshResponse = await fetch(`${apiBaseUrl}/auth/sessions/refresh`, {
        method: 'POST',
        headers: {
          cookie: req.headers.get('cookie') ?? '',
        },
        cache: 'no-store',
      });
      return refreshResponse.ok;
    } catch {
      return false;
    }
  }

  if (!accessToken) {
    const refreshed = await tryRefreshSession();
    if (refreshed && roleFromCookie) {
      return { role: roleFromCookie, garageApproved: undefined as boolean | undefined };
    }
    return null;
  }

  try {
    const apiBaseUrl = getApiBaseUrl(req);
    const response = await fetch(`${apiBaseUrl}/auth/me`, {
      method: 'GET',
      headers: {
        cookie: req.headers.get('cookie') ?? '',
      },
      cache: 'no-store',
    });
    if (!response.ok) {
      const refreshed = await tryRefreshSession();
      if (refreshed && roleFromCookie) {
        return { role: roleFromCookie, garageApproved: undefined as boolean | undefined };
      }
      return null;
    }
    const data = (await response.json()) as {
      user?: {
        roleCode?: 'user' | 'garage' | 'vendor' | 'admin';
        garageApproved?: boolean;
      };
    };
    if (!data.user?.roleCode) return null;
    return {
      role: data.user.roleCode,
      garageApproved: data.user.garageApproved,
    };
  } catch {
    const refreshed = await tryRefreshSession();
    if (refreshed && roleFromCookie) {
      return { role: roleFromCookie, garageApproved: undefined as boolean | undefined };
    }
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/api')
  ) {
    return NextResponse.next();
  }

  const sessionInfo = await getSessionRole(req);
  const role = sessionInfo?.role ?? null;
  const roleHint = parseRoleCookie(req.cookies.get('wrect_role_hint')?.value);
  const isAuthed = Boolean(role);
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));
  const rolePath = rolePrefixes.find((prefix) => pathname.startsWith(prefix));
  const roleFromPath = rolePath ? (rolePath.slice(1) as AuthRole) : null;

  // Cross-domain production setup can store auth cookies on API domain only.
  // In that case middleware cannot read HttpOnly cookies from the web domain.
  // Use short-lived role hint from OTP verification to avoid redirect loops.
  if (!isAuthed && roleFromPath && roleHint === roleFromPath) {
    return withNoStore(NextResponse.next());
  }

  if (!isAuthed && rolePath) {
    return clearAuthCookies(withNoStore(NextResponse.redirect(new URL('/auth/login', req.url))));
  }

  if (!isAuthed && pathname === '/') {
    return clearAuthCookies(withNoStore(NextResponse.redirect(new URL('/auth/login', req.url))));
  }

  if (isAuthed && isPublic) {
    return withNoStore(NextResponse.redirect(new URL(`/${role}/dashboard`, req.url)));
  }

  if (isAuthed && rolePath) {
    const requiredRole = rolePath.slice(1);
    if (requiredRole !== role) {
      return withNoStore(NextResponse.redirect(new URL(`/${role}/dashboard`, req.url)));
    }
    if (role === 'garage') {
      const isProfileRoute = pathname === '/garage/profile' || pathname.startsWith('/garage/profile/');
      if (sessionInfo?.garageApproved === false && !isProfileRoute) {
        return withNoStore(NextResponse.redirect(new URL('/garage/profile', req.url)));
      }
    }
  }

  if (isPublic || rolePath || pathname === '/') {
    return withNoStore(NextResponse.next());
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};
