type CookieSameSite = 'lax' | 'strict' | 'none';

function parseOrigins(raw: string | undefined) {
  if (!raw) return [process.env.WEB_ORIGIN_DEFAULT || '*'];
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function parseCookieSameSite(raw: string | undefined): CookieSameSite {
  const value = raw?.trim().toLowerCase();
  if (value === 'none' || value === 'strict') return value;
  return 'lax';
}

export function getEnv() {
  const webOrigins = parseOrigins(process.env.WEB_ORIGINS ?? process.env.WEB_ORIGIN);
  return {
    host: process.env.HOST ?? '0.0.0.0',
    port: process.env.PORT ? Number(process.env.PORT) : 3000,
    databaseUrl: process.env.DATABASE_URL,
    webOrigins,
    cookieSameSite: parseCookieSameSite(process.env.COOKIE_SAME_SITE),
    cookieDomain: process.env.COOKIE_DOMAIN?.trim() || undefined,
  };
}
