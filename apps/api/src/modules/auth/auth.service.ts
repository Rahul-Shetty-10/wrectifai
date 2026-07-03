import { randomUUID } from 'crypto';
import { ensureAuthSchema, hasDatabase, query } from '../../config/db';
import { getEnv } from '../../config/env';
import { HttpError } from '../../utils/http-error';
import { signJwt } from '../../utils/jwt';

type RoleCode = 'customer' | 'garage' | 'vendor';

type AuthUser = {
  id: string;
  phone: string;
  name: string;
  role: RoleCode;
};

const memoryUsers = new Map<string, AuthUser>();
const memoryOtps = new Map<string, { code: string; expiresAt: number }>();

function normalizePhone(phone: unknown) {
  if (typeof phone !== 'string') {
    throw new HttpError(400, 'Phone number is required');
  }

  const compact = phone.trim().replace(/[^\d+]/g, '');

  if (!/^\+?\d{10,15}$/.test(compact)) {
    throw new HttpError(400, 'Enter a valid phone number');
  }

  return compact.startsWith('+') ? compact : `+${compact}`;
}

function normalizeOtp(otp: unknown) {
  if (typeof otp !== 'string' || !otp.trim()) {
    throw new HttpError(400, 'OTP is required');
  }

  return otp.trim();
}

function createToken(user: AuthUser) {
  return signJwt({
    sub: user.id,
    phone: user.phone,
    role: user.role,
  });
}

function publicUser(user: AuthUser) {
  return {
    id: user.id,
    phone: user.phone,
    name: user.name,
    role: user.role,
  };
}

async function findUserByPhone(phone: string) {
  if (!hasDatabase()) {
    return memoryUsers.get(phone) ?? null;
  }

  await ensureAuthSchema();
  const result = await query<{
    id: string;
    phone: string;
    name: string;
    role: RoleCode | null;
  }>(
    `
      SELECT u."_id" AS id, u."mobileNumber" AS phone, u.name, r.code AS role
      FROM users u
      LEFT JOIN user_roles ur ON ur."userId" = u."_id"
      LEFT JOIN roles r ON r."_id" = ur."roleId"
      WHERE u."mobileNumber" = $1
      LIMIT 1
    `,
    [phone]
  );

  const row = result.rows[0];
  return row
    ? {
        id: row.id,
        phone: row.phone,
        name: row.name,
        role: row.role ?? 'customer',
      }
    : null;
}

async function saveOtp(phone: string, code: string) {
  const expiresAt = Date.now() + 5 * 60 * 1000;

  if (!hasDatabase()) {
    memoryOtps.set(phone, { code, expiresAt });
    return;
  }

  await ensureAuthSchema();
  await query(
    `
      INSERT INTO otp_challenges ("mobileNumber", code, "expiresAt", "verifiedAt", "createdAt")
      VALUES ($1, $2, $3, NULL, NOW())
      ON CONFLICT ("mobileNumber")
      DO UPDATE SET code = EXCLUDED.code, "expiresAt" = EXCLUDED."expiresAt", "verifiedAt" = NULL, "createdAt" = NOW()
    `,
    [phone, code, new Date(expiresAt).toISOString()]
  );
}

async function verifyOtpOrThrow(phone: string, otp: string) {
  const { authOtpCode } = getEnv();

  if (!hasDatabase()) {
    const challenge = memoryOtps.get(phone);
    const code = challenge?.code ?? authOtpCode;

    if (challenge && challenge.expiresAt < Date.now()) {
      throw new HttpError(401, 'OTP has expired. Request a new one.');
    }

    if (otp !== code) {
      throw new HttpError(401, 'Invalid OTP');
    }

    return;
  }

  await ensureAuthSchema();
  const result = await query<{ code: string; expires_at: Date }>(
    'SELECT code, "expiresAt" AS expires_at FROM otp_challenges WHERE "mobileNumber" = $1',
    [phone]
  );
  const challenge = result.rows[0];
  const code = challenge?.code ?? authOtpCode;

  if (challenge && new Date(challenge.expires_at).getTime() < Date.now()) {
    throw new HttpError(401, 'OTP has expired. Request a new one.');
  }

  if (otp !== code) {
    throw new HttpError(401, 'Invalid OTP');
  }

  await query('UPDATE otp_challenges SET "verifiedAt" = NOW() WHERE "mobileNumber" = $1', [
    phone,
  ]);
}

export async function requestOtp(input: { phone: unknown }) {
  const phone = normalizePhone(input.phone);
  const { authOtpCode } = getEnv();

  await saveOtp(phone, authOtpCode);

  return {
    phone,
    expiresInSeconds: 300,
    delivery: 'development-static-otp',
  };
}

export async function loginWithOtp(input: { phone: unknown; otp: unknown }) {
  const phone = normalizePhone(input.phone);
  const otp = normalizeOtp(input.otp);

  await verifyOtpOrThrow(phone, otp);

  const user = await findUserByPhone(phone);

  if (!user) {
    throw new HttpError(404, 'Account not found. Please sign up first.');
  }

  return {
    token: createToken(user),
    user: publicUser(user),
  };
}

export async function signupWithOtp(input: {
  phone: unknown;
  otp: unknown;
  name: unknown;
}) {
  const phone = normalizePhone(input.phone);
  const otp = normalizeOtp(input.otp);
  const role: RoleCode = 'customer';
  const name =
    typeof input.name === 'string' && input.name.trim()
      ? input.name.trim()
      : 'WrectifAI User';

  await verifyOtpOrThrow(phone, otp);

  if (!hasDatabase()) {
    const current = memoryUsers.get(phone);
    const user = {
      id: current?.id ?? randomUUID(),
      phone,
      name,
      role,
    };
    memoryUsers.set(phone, user);

    return {
      token: createToken(user),
      user: publicUser(user),
    };
  }

  await ensureAuthSchema();
  const userId = randomUUID();
  const result = await query<{
    id: string;
    phone: string;
    name: string;
  }>(
    `
      INSERT INTO users ("_id", "mobileNumber", name, status, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, 'active', NOW(), NOW())
      ON CONFLICT ("mobileNumber") WHERE "mobileNumber" IS NOT NULL
      DO UPDATE SET name = EXCLUDED.name, "updatedAt" = NOW()
      RETURNING "_id" AS id, "mobileNumber" AS phone, name
    `,
    [userId, phone, name]
  );
  const row = result.rows[0];

  const roleResult = await query<{ id: string }>(
    'SELECT "_id" AS id FROM roles WHERE code = $1',
    [role]
  );
  const roleId = roleResult.rows[0]?.id;

  if (!roleId) {
    throw new HttpError(500, `Role '${role}' is not configured`);
  }

  await query('DELETE FROM user_roles WHERE "userId" = $1', [row.id]);
  await query(
    'INSERT INTO user_roles ("_id", "userId", "roleId") VALUES ($1, $2, $3) ON CONFLICT ("userId", "roleId") DO NOTHING',
    [randomUUID(), row.id, roleId]
  );

  const user = { ...row, role };

  return {
    token: createToken(user),
    user: publicUser(user),
  };
}
