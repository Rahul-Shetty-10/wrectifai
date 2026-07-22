import { test, mock } from 'node:test';
import assert from 'node:assert';
import { Pool } from 'pg';

// Setup Mock DB responses
const mockDbCalls: any[] = [];
mock.method(Pool.prototype, 'query', async (text: string, params?: any[]) => {
  mockDbCalls.push({ text, params });
  if (text.includes('SELECT user_id')) {
    // Return mock row for validation
    return {
      rows: [
        {
          user_id: 'user-789',
          expires_at: new Date(Date.now() + 50000), // Valid expiration
        },
      ],
    };
  }
  return { rows: [] };
});

import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  storeRefreshToken,
  validateRefreshTokenInDb,
  deleteRefreshTokenInDb,
} from '../../services/jwt.service';

test('auth service - Access Token roundtrip', () => {
  const payload = { userId: 'user-456', email: 'test@wrectifai.com', roles: ['customer'] };
  const token = generateAccessToken(payload);
  const decoded = verifyAccessToken(token);

  assert.strictEqual(decoded.userId, payload.userId);
  assert.strictEqual(decoded.email, payload.email);
  assert.deepStrictEqual(decoded.roles, payload.roles);
});

test('auth service - Refresh Token roundtrip', () => {
  const payload = { userId: 'user-456' };
  const token = generateRefreshToken(payload);
  const decoded = verifyRefreshToken(token);

  assert.strictEqual(decoded.userId, payload.userId);
});

test('auth service - Database-backed refresh token operations', async () => {
  mockDbCalls.length = 0;
  const token = generateRefreshToken({ userId: 'user-789' });

  // 1. Store refresh token
  await storeRefreshToken('user-789', token);
  assert.strictEqual(mockDbCalls.length, 1);
  assert.ok(mockDbCalls[0].text.includes('INSERT INTO refresh_tokens'));
  assert.strictEqual(mockDbCalls[0].params[0], 'user-789');

  // 2. Validate token
  const validatedUserId = await validateRefreshTokenInDb(token);
  assert.strictEqual(validatedUserId, 'user-789');

  // 3. Delete token
  await deleteRefreshTokenInDb(token);
  assert.ok(mockDbCalls[mockDbCalls.length - 1].text.includes('DELETE FROM refresh_tokens'));
});
