import fs from 'fs';
import path from 'path';

let envLoaded = false;

function loadEnvFile() {
  if (envLoaded) {
    return;
  }

  envLoaded = true;
  const envPath = path.resolve(process.cwd(), '.env');

  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    process.env[key] ??= rawValue.replace(/^['"]|['"]$/g, '');
  }
}

export function getEnv() {
  loadEnvFile();

  return {
    host: process.env.HOST ?? '0.0.0.0',
    port: process.env.PORT ? Number(process.env.PORT) : 4200,
    authOtpCode: process.env.AUTH_OTP_CODE ?? '123456',
    jwtSecret:
      process.env.JWT_SECRET ??
      'wrectifai-local-development-secret-change-before-production',
    jwtExpiresInSeconds: process.env.JWT_EXPIRES_IN_SECONDS
      ? Number(process.env.JWT_EXPIRES_IN_SECONDS)
      : 60 * 60 * 24 * 7,
    databaseUrl: process.env.DATABASE_URL,
  };
}
