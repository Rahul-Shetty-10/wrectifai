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

function getApiBaseUrl(req: NextRequest) {
  return resolveApiBaseUrl(req.nextUrl.origin);
}

function withNoStore(res: NextResponse) {
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.headers.set('Pragma', 'no-cache');
  res.headers.set('Expires', '0');
  return res;
}

async function getSessionRole(req: NextRequest) {
  const accessToken = req.cookies.get('wrect_at')?.value;
  const refreshToken = req.cookies.get('wrect_rt')?.value;
  const roleCookie = req.cookies.get('wrect_role')?.value?.replace(/^"|"$/g, '').toLowerCase();
  const roleFromCookie =
    roleCookie === 'user' || roleCookie === 'garage' || roleCookie === 'vendor' || roleCookie === 'admin'
      ? roleCookie
      : null;

  if (!accessToken) {
    if (refreshToken && roleFromCookie) return { role: roleFromCookie, garageApproved: undefined as boolean | undefined };
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
      if (refreshToken && roleFromCookie) return { role: roleFromCookie, garageApproved: undefined as boolean | undefined };
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
    // Production fallback: if API reachability is transiently broken but
    // session cookies exist, keep user signed in instead of forcing logout.
    if (refreshToken && roleFromCookie) {
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
  const isAuthed = Boolean(role);
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));
  const rolePath = rolePrefixes.find((prefix) => pathname.startsWith(prefix));

  if (!isAuthed && rolePath) {
    return withNoStore(NextResponse.redirect(new URL('/auth/login', req.url)));
  }

  if (!isAuthed && pathname === '/') {
    return withNoStore(NextResponse.redirect(new URL('/auth/login', req.url)));
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
