type CookieSameSite = 'lax' | 'strict' | 'none';
type AppEnv = 'local' | 'production';

function parseAppEnv(raw: string | undefined): AppEnv {
  const value = raw?.trim().toLowerCase();
  if (value === 'production' || value === 'prod') return 'production';
  if (process.env.NODE_ENV === 'production') return 'production';
  return 'local';
}

function parseOrigins(raw: string | undefined, appEnv: AppEnv) {
  if (!raw) {
    return appEnv === 'production' ? [] : ['http://localhost:4200', 'http://127.0.0.1:4200'];
  }
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

function parseBoolean(raw: string | undefined, fallback = false) {
  if (raw === undefined) return fallback;
  const value = raw.trim().toLowerCase();
  return value === '1' || value === 'true' || value === 'yes' || value === 'on';
}

function parsePositiveInt(raw: string | undefined, fallback: number) {
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function parseOtpFixedCode(raw: string | undefined) {
  const value = raw?.trim();
  if (!value) return undefined;
  return /^\d{6}$/.test(value) ? value : undefined;
}

export function getEnv() {
  const appEnv = parseAppEnv(process.env.APP_ENV);
  const cookieSameSite = parseCookieSameSite(process.env.COOKIE_SAME_SITE);
  const cookieSecure = parseBoolean(
    process.env.COOKIE_SECURE,
    appEnv === 'production' || cookieSameSite === 'none'
  );

  const webOrigins = parseOrigins(process.env.WEB_ORIGINS ?? process.env.WEB_ORIGIN, appEnv);
  return {
    appEnv,
    host: process.env.HOST ?? (appEnv === 'production' ? '0.0.0.0' : 'localhost'),
    port: parsePositiveInt(process.env.PORT, 3000),
    databaseUrl: process.env.DATABASE_URL ?? '',
    webOrigins,
    cookieSameSite,
    cookieDomain: process.env.COOKIE_DOMAIN?.trim() || undefined,
    cookieSecure,
    otpFixedCode: parseOtpFixedCode(process.env.AUTH_OTP_FIXED_CODE),
    otpTtlSeconds: parsePositiveInt(process.env.AUTH_OTP_TTL_SECONDS, 300),
    otpDebugEcho: parseBoolean(process.env.AUTH_OTP_DEBUG_ECHO, appEnv === 'local'),
  };
}
