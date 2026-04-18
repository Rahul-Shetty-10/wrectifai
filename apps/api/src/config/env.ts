type CookieSameSite = 'lax' | 'strict' | 'none';
type AppEnv = 'local' | 'production';
type EnvConfig = {
  appEnv: AppEnv;
  host: string;
  port: number;
  databaseUrl: string;
  webOrigins: string[];
  cookieSameSite: CookieSameSite;
  cookieDomain?: string;
  cookieSecure: boolean;
  otpFixedCode?: string;
  otpTtlSeconds: number;
  otpDebugEcho: boolean;
  socialAuthEnabled: boolean;
  socialDevSubjectFallbackAllowed: boolean;
};

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

function isLocalOrigin(origin: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin.trim());
}

function validateEnvOrThrow(config: EnvConfig) {
  const errors: string[] = [];

  if (!config.databaseUrl) {
    errors.push('DATABASE_URL is required.');
  }

  if (config.cookieDomain && /^https?:\/\//i.test(config.cookieDomain)) {
    errors.push('COOKIE_DOMAIN must be a domain value (for example ".example.com"), not a URL.');
  }

  if (config.cookieSameSite === 'none' && !config.cookieSecure) {
    errors.push('COOKIE_SAME_SITE=none requires COOKIE_SECURE=true.');
  }

  if (config.appEnv === 'production') {
    if (config.webOrigins.length === 0) {
      errors.push('WEB_ORIGINS must be set in production.');
    }
    if (config.webOrigins.some((origin) => isLocalOrigin(origin))) {
      errors.push('WEB_ORIGINS cannot include localhost/127.0.0.1 in production.');
    }
    if (config.otpFixedCode) {
      errors.push('AUTH_OTP_FIXED_CODE must not be set in production.');
    }
    if (config.otpDebugEcho) {
      errors.push('AUTH_OTP_DEBUG_ECHO must be false in production.');
    }
    if (config.socialDevSubjectFallbackAllowed) {
      errors.push('AUTH_SOCIAL_ALLOW_DEV_SUBJECT_FALLBACK must be false in production.');
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration:\n- ${errors.join('\n- ')}`);
  }
}

function resolveEnv(): EnvConfig {
  const appEnv = parseAppEnv(process.env.APP_ENV);
  const cookieSameSite = parseCookieSameSite(process.env.COOKIE_SAME_SITE);
  const cookieSecure = parseBoolean(
    process.env.COOKIE_SECURE,
    appEnv === 'production' || cookieSameSite === 'none'
  );

  const webOrigins = parseOrigins(process.env.WEB_ORIGINS ?? process.env.WEB_ORIGIN, appEnv);
  const config: EnvConfig = {
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
    socialAuthEnabled: parseBoolean(process.env.AUTH_SOCIAL_ENABLED, appEnv === 'local'),
    socialDevSubjectFallbackAllowed: parseBoolean(
      process.env.AUTH_SOCIAL_ALLOW_DEV_SUBJECT_FALLBACK,
      appEnv === 'local'
    ),
  };
  validateEnvOrThrow(config);
  return config;
}

let cachedEnv: EnvConfig | null = null;

export function getEnv() {
  if (!cachedEnv) cachedEnv = resolveEnv();
  return cachedEnv;
}
