function parseAppEnv() {
  const value = process.env.NEXT_PUBLIC_APP_ENV?.trim().toLowerCase();
  if (value === 'production' || value === 'prod') return 'production';
  if (process.env.NODE_ENV === 'production') return 'production';
  return 'local';
}

export function resolveApiBaseUrl(origin?: string) {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (configured) return configured;

  if (parseAppEnv() === 'local') {
    return 'http://localhost:3000/api';
  }

  if (origin) return `${origin}/api`;
  if (typeof window !== 'undefined') return '/api';

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (siteUrl) return `${siteUrl.replace(/\/+$/, '')}/api`;

  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}/api`;

  return '/api';
}
