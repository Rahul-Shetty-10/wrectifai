import crypto from 'node:crypto';
import { query } from '../../db/postgres';

export type RoleCode = 'user' | 'garage' | 'vendor' | 'admin';
export type SocialProvider = 'google' | 'apple';

const OTP_CODE = '123456';
const ACCESS_TTL_MS = 15 * 60 * 1000;
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function now() {
  return new Date();
}

function hashToken(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function randomToken() {
  return crypto.randomBytes(32).toString('hex');
}

function isPhoneValid(phone: string) {
  return /^\d{10}$/.test(phone);
}

export function validatePhoneOrThrow(phone: string) {
  if (!isPhoneValid(phone)) {
    throw new Error('Phone number must be 10 digits');
  }
}

export function validateRegisterRoleOrThrow(roleCode: string) {
  if (!['user', 'garage', 'vendor'].includes(roleCode)) {
    throw new Error('Invalid role for registration');
  }
}

export function validateSocialProviderOrThrow(provider: string) {
  if (!['google', 'apple'].includes(provider)) {
    throw new Error('Invalid social provider');
  }
}

export async function createOtpChallenge(input: {
  phone: string;
  purpose: 'register' | 'login';
  roleCode?: string;
  fullName?: string;
}) {
  validatePhoneOrThrow(input.phone);
  if (input.purpose === 'register') {
    validateRegisterRoleOrThrow(input.roleCode ?? '');
  }

  const challengeId = crypto.randomUUID();
  const expiresAt = new Date(now().getTime() + 5 * 60 * 1000);

  await query(
    `
      INSERT INTO otp_challenges (id, phone, purpose, role_code, full_name, otp_code, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7);
    `,
    [
      challengeId,
      input.phone,
      input.purpose,
      input.roleCode ?? null,
      input.fullName ?? null,
      OTP_CODE,
      expiresAt,
    ]
  );

  await query(
    `
      INSERT INTO sms_events (id, phone, event_type, status, meta)
      VALUES ($1, $2, $3, 'sent', $4::jsonb);
    `,
    [
      crypto.randomUUID(),
      input.phone,
      'OTP_SENT',
      JSON.stringify({ purpose: input.purpose }),
    ]
  );

  return { expiresAt };
}

async function consumeChallenge(input: {
  phone: string;
  otp: string;
  purpose: 'register' | 'login';
}) {
  validatePhoneOrThrow(input.phone);
  if (!/^\d{6}$/.test(input.otp)) throw new Error('OTP must be 6 digits');
  const result = await query<{
    id: string;
    role_code: string | null;
    full_name: string | null;
  }>(
    `
      SELECT id, role_code, full_name
      FROM otp_challenges
      WHERE phone = $1
        AND purpose = $2
        AND otp_code = $3
        AND consumed_at IS NULL
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1;
    `,
    [input.phone, input.purpose, input.otp]
  );

  const challenge = result.rows[0];
  if (!challenge) throw new Error('Invalid or expired OTP');

  await query(`UPDATE otp_challenges SET consumed_at = NOW() WHERE id = $1`, [
    challenge.id,
  ]);

  return challenge;
}

export async function registerWithOtp(input: {
  phone: string;
  fullName: string;
  roleCode: RoleCode;
  otp: string;
  userAgent?: string;
  ipAddress?: string;
}) {
  validateRegisterRoleOrThrow(input.roleCode);
  const challenge = await consumeChallenge({
    phone: input.phone,
    otp: input.otp,
    purpose: 'register',
  });

  if (challenge.role_code !== input.roleCode) {
    throw new Error('Role mismatch for verification');
  }

  const existing = await query<{ id: string }>(
    `SELECT id FROM users WHERE phone = $1 LIMIT 1`,
    [input.phone]
  );
  if (existing.rows[0]) throw new Error('Account already exists for this phone');

  const userId = crypto.randomUUID();
  await query(
    `
      INSERT INTO users (id, phone, full_name)
      VALUES ($1, $2, $3);
    `,
    [userId, input.phone, input.fullName.trim()]
  );

  const role = await query<{ id: string; code: string }>(
    `SELECT id, code FROM roles WHERE code = $1 LIMIT 1`,
    [input.roleCode]
  );
  if (!role.rows[0]) throw new Error('Role not configured');

  await query(
    `
      INSERT INTO user_roles (id, user_id, role_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, role_id) DO NOTHING;
    `,
    [crypto.randomUUID(), userId, role.rows[0].id]
  );

  return createSession({
    userId,
    roleCode: input.roleCode,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  });
}

export async function loginWithOtp(input: {
  phone: string;
  otp: string;
  userAgent?: string;
  ipAddress?: string;
}) {
  await consumeChallenge({
    phone: input.phone,
    otp: input.otp,
    purpose: 'login',
  });

  const user = await query<{
    id: string;
    full_name: string;
    role_code: RoleCode;
  }>(
    `
      SELECT u.id, u.full_name, r.code AS role_code
      FROM users u
      JOIN user_roles ur ON ur.user_id = u.id
      JOIN roles r ON r.id = ur.role_id
      WHERE u.phone = $1
      ORDER BY ur.created_at ASC
      LIMIT 1;
    `,
    [input.phone]
  );

  const account = user.rows[0];
  if (!account) throw new Error('Account not found');

  return createSession({
    userId: account.id,
    roleCode: account.role_code,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  });
}

function normalizeSocialSubject(provider: SocialProvider, socialSubject?: string) {
  const trimmed = socialSubject?.trim();
  if (trimmed) return trimmed;
  return `dev-${provider}`;
}

function derivePhoneFromSocial(provider: SocialProvider, socialSubject: string) {
  const hash = crypto
    .createHash('sha256')
    .update(`${provider}:${socialSubject}`)
    .digest('hex');
  const numeric = BigInt(`0x${hash.slice(0, 15)}`) % 9000000000n;
  return `9${numeric.toString().padStart(9, '0')}`;
}

async function findRoleOrThrow(roleCode: RoleCode) {
  const role = await query<{ id: string; code: RoleCode }>(
    `SELECT id, code FROM roles WHERE code = $1 LIMIT 1`,
    [roleCode]
  );
  if (!role.rows[0]) throw new Error('Role not configured');
  return role.rows[0];
}

export async function loginOrRegisterWithSocial(input: {
  provider: SocialProvider;
  socialSubject?: string;
  fullName?: string;
  roleCode?: 'user' | 'garage' | 'vendor';
  userAgent?: string;
  ipAddress?: string;
}) {
  validateSocialProviderOrThrow(input.provider);
  if (input.roleCode) {
    validateRegisterRoleOrThrow(input.roleCode);
  }

  const socialSubject = normalizeSocialSubject(input.provider, input.socialSubject);
  const roleCode: RoleCode = input.roleCode ?? 'user';

  const existing = await query<{ user_id: string; role_code: RoleCode }>(
    `
      SELECT usa.user_id, r.code AS role_code
      FROM user_social_accounts usa
      JOIN user_roles ur ON ur.user_id = usa.user_id
      JOIN roles r ON r.id = ur.role_id
      WHERE usa.provider = $1
        AND usa.social_subject = $2
      ORDER BY ur.created_at ASC
      LIMIT 1;
    `,
    [input.provider, socialSubject]
  );

  const mapped = existing.rows[0];
  if (mapped) {
    return createSession({
      userId: mapped.user_id,
      roleCode: mapped.role_code,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
  }

  const userId = crypto.randomUUID();
  const fullName = input.fullName?.trim() || `${input.provider[0].toUpperCase()}${input.provider.slice(1)} User`;
  let phone = derivePhoneFromSocial(input.provider, socialSubject);

  const existingPhone = await query<{ id: string }>(
    `SELECT id FROM users WHERE phone = $1 LIMIT 1`,
    [phone]
  );
  if (existingPhone.rows[0]) {
    phone = derivePhoneFromSocial(
      input.provider,
      `${socialSubject}-${crypto.randomUUID().slice(0, 8)}`
    );
  }

  await query(
    `
      INSERT INTO users (id, phone, full_name)
      VALUES ($1, $2, $3);
    `,
    [userId, phone, fullName]
  );

  const role = await findRoleOrThrow(roleCode);
  await query(
    `
      INSERT INTO user_roles (id, user_id, role_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, role_id) DO NOTHING;
    `,
    [crypto.randomUUID(), userId, role.id]
  );

  await query(
    `
      INSERT INTO user_social_accounts (id, user_id, provider, social_subject)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (provider, social_subject) DO NOTHING;
    `,
    [crypto.randomUUID(), userId, input.provider, socialSubject]
  );

  return createSession({
    userId,
    roleCode,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  });
}

async function createSession(input: {
  userId: string;
  roleCode: RoleCode;
  userAgent?: string;
  ipAddress?: string;
}) {
  const sessionId = crypto.randomUUID();
  const accessToken = randomToken();
  const refreshToken = randomToken();
  const expiresAt = new Date(now().getTime() + ACCESS_TTL_MS);
  const refreshExpiresAt = new Date(now().getTime() + REFRESH_TTL_MS);

  await query(
    `
      INSERT INTO auth_sessions (
        id, user_id, access_token_hash, refresh_token_hash, role_code,
        user_agent, ip_address, expires_at, refresh_expires_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    `,
    [
      sessionId,
      input.userId,
      hashToken(accessToken),
      hashToken(refreshToken),
      input.roleCode,
      input.userAgent ?? null,
      input.ipAddress ?? null,
      expiresAt,
      refreshExpiresAt,
    ]
  );

  return {
    accessToken,
    refreshToken,
    roleCode: input.roleCode,
    expiresAt,
    refreshExpiresAt,
    redirectPath: `/${input.roleCode}/dashboard`,
  };
}

export async function refreshSession(input: {
  refreshToken: string;
  userAgent?: string;
  ipAddress?: string;
}) {
  const current = await query<{ id: string; user_id: string; role_code: RoleCode }>(
    `
      SELECT id, user_id, role_code
      FROM auth_sessions
      WHERE refresh_token_hash = $1
        AND revoked_at IS NULL
        AND refresh_expires_at > NOW()
      LIMIT 1
    `,
    [hashToken(input.refreshToken)]
  );
  const row = current.rows[0];
  if (!row) throw new Error('Session expired');

  await query(`UPDATE auth_sessions SET revoked_at = NOW() WHERE id = $1`, [row.id]);

  return createSession({
    userId: row.user_id,
    roleCode: row.role_code,
    userAgent: input.userAgent,
    ipAddress: input.ipAddress,
  });
}

export async function revokeByAccessToken(accessToken: string) {
  await query(
    `UPDATE auth_sessions SET revoked_at = NOW() WHERE access_token_hash = $1`,
    [hashToken(accessToken)]
  );
}

export async function revokeByRefreshToken(refreshToken: string) {
  await query(
    `UPDATE auth_sessions SET revoked_at = NOW() WHERE refresh_token_hash = $1`,
    [hashToken(refreshToken)]
  );
}

export async function findSessionByAccessToken(accessToken: string) {
  const result = await query<{
    user_id: string;
    role_code: RoleCode;
    full_name: string;
    phone: string;
  }>(
    `
      SELECT s.user_id, s.role_code, u.full_name, u.phone
      FROM auth_sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.access_token_hash = $1
        AND s.revoked_at IS NULL
        AND s.expires_at > NOW()
      LIMIT 1
    `,
    [hashToken(accessToken)]
  );
  return result.rows[0] ?? null;
}
