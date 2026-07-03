import { createHmac, timingSafeEqual } from 'crypto';
import { getEnv } from '../config/env';
import { HttpError } from './http-error';

type JwtPayload = {
  sub: string;
  phone: string;
  role: string;
  iat: number;
  exp: number;
};

function base64Url(input: string) {
  return Buffer.from(input).toString('base64url');
}

function sign(input: string) {
  const { jwtSecret } = getEnv();
  return createHmac('sha256', jwtSecret).update(input).digest('base64url');
}

function safeEqual(left: string, right: string) {
  const leftBuffer = new Uint8Array(Buffer.from(left));
  const rightBuffer = new Uint8Array(Buffer.from(right));

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function signJwt(payload: Pick<JwtPayload, 'sub' | 'phone' | 'role'>) {
  const { jwtExpiresInSeconds } = getEnv();
  const issuedAt = Math.floor(Date.now() / 1000);
  const tokenPayload: JwtPayload = {
    ...payload,
    iat: issuedAt,
    exp: issuedAt + jwtExpiresInSeconds,
  };
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(tokenPayload));
  const signature = sign(`${encodedHeader}.${encodedPayload}`);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyJwt(token: string) {
  const [encodedHeader, encodedPayload, signature] = token.split('.');

  if (!encodedHeader || !encodedPayload || !signature) {
    throw new HttpError(401, 'Invalid authorization token');
  }

  const expectedSignature = sign(`${encodedHeader}.${encodedPayload}`);

  if (!safeEqual(signature, expectedSignature)) {
    throw new HttpError(401, 'Invalid authorization token');
  }

  let payload: JwtPayload;

  try {
    payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
  } catch {
    throw new HttpError(401, 'Invalid authorization token');
  }

  if (!payload.sub || !payload.phone || !payload.role || !payload.exp) {
    throw new HttpError(401, 'Invalid authorization token');
  }

  if (payload.exp <= Math.floor(Date.now() / 1000)) {
    throw new HttpError(401, 'Authorization token has expired');
  }

  return payload;
}
