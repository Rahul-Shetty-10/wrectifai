import type { Request, Response } from 'express';
import { Router } from 'express';
import {
  createOtpChallenge,
  loginWithOtp,
  loginOrRegisterWithSocial,
  refreshSession,
  registerWithOtp,
  revokeByAccessToken,
  revokeByRefreshToken,
  validateSocialProviderOrThrow,
} from './auth.service';
import { requireAuth } from './auth.middleware';
import { getEnv } from '../../config/env';

export const authRouter = Router();

authRouter.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

function getClientIp(req: Request) {
  return (
    (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
    req.socket.remoteAddress ??
    undefined
  );
}

function setSessionCookies(
  res: Response,
  session: {
    accessToken: string;
    refreshToken: string;
    roleCode: string;
    expiresAt: Date;
    refreshExpiresAt: Date;
  }
) {
  const { cookieSameSite, cookieDomain, cookieSecure } = getEnv();
  const base = {
    httpOnly: true,
    sameSite: cookieSameSite,
    secure: cookieSecure,
    path: '/',
    domain: cookieDomain,
  } as const;

  res.cookie('wrect_at', session.accessToken, {
    ...base,
    expires: session.expiresAt,
  });
  res.cookie('wrect_rt', session.refreshToken, {
    ...base,
    expires: session.refreshExpiresAt,
  });
  res.cookie('wrect_role', session.roleCode, {
    ...base,
    expires: session.refreshExpiresAt,
  });
}

function clearSessionCookies(res: Response) {
  const { cookieSameSite, cookieDomain, cookieSecure } = getEnv();
  const base = { path: '/', sameSite: cookieSameSite, secure: cookieSecure, domain: cookieDomain };
  res.clearCookie('wrect_at', { ...base, httpOnly: true });
  res.clearCookie('wrect_rt', { ...base, httpOnly: true });
  res.clearCookie('wrect_role', { ...base, httpOnly: true });
}

authRouter.post('/register/send-otp', async (req, res, next) => {
  try {
    const { phone, roleCode, fullName } = req.body as {
      phone?: string;
      roleCode?: string;
      fullName?: string;
    };
    if (!phone || !roleCode || !fullName) {
      return res.status(400).json({ message: 'phone, roleCode and fullName are required' });
    }

    const otp = await createOtpChallenge({
      phone,
      purpose: 'register',
      roleCode,
      fullName,
    });
    const { otpDebugEcho } = getEnv();
    return res.json({
      message: 'OTP sent',
      otpLength: 6,
      expiresAt: otp.expiresAt.toISOString(),
      ...(otpDebugEcho ? { debugOtp: otp.otpCode } : {}),
    });
  } catch (error) {
    return next(error);
  }
});

authRouter.post('/register/verify', async (req, res, next) => {
  try {
    const { phone, roleCode, fullName, otp } = req.body as {
      phone?: string;
      roleCode?: 'user' | 'garage' | 'vendor' | 'admin';
      fullName?: string;
      otp?: string;
    };
    if (!phone || !roleCode || !fullName || !otp) {
      return res.status(400).json({ message: 'phone, roleCode, fullName and otp are required' });
    }

    const session = await registerWithOtp({
      phone,
      roleCode,
      fullName,
      otp,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] ?? undefined,
    });

    setSessionCookies(res, session);
    return res.json({
      message: 'Registration successful',
      roleCode: session.roleCode,
      redirectPath: session.redirectPath,
    });
  } catch (error) {
    return next(error);
  }
});

authRouter.post('/login/send-otp', async (req, res, next) => {
  try {
    const { phone } = req.body as { phone?: string };
    if (!phone) return res.status(400).json({ message: 'phone is required' });

    const otp = await createOtpChallenge({ phone, purpose: 'login' });
    const { otpDebugEcho } = getEnv();
    return res.json({
      message: 'OTP sent',
      otpLength: 6,
      expiresAt: otp.expiresAt.toISOString(),
      ...(otpDebugEcho ? { debugOtp: otp.otpCode } : {}),
    });
  } catch (error) {
    return next(error);
  }
});

authRouter.post('/login/verify', async (req, res, next) => {
  try {
    const { phone, otp } = req.body as { phone?: string; otp?: string };
    if (!phone || !otp) {
      return res.status(400).json({ message: 'phone and otp are required' });
    }
    const session = await loginWithOtp({
      phone,
      otp,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] ?? undefined,
    });
    setSessionCookies(res, session);
    return res.json({
      message: 'Login successful',
      roleCode: session.roleCode,
      redirectPath: session.redirectPath,
    });
  } catch (error) {
    return next(error);
  }
});

authRouter.post('/social/:provider', async (req, res, next) => {
  try {
    const { socialAuthEnabled } = getEnv();
    if (!socialAuthEnabled) {
      return res.status(503).json({ message: 'Social authentication is disabled' });
    }

    const provider = req.params.provider;
    validateSocialProviderOrThrow(provider);
    const { socialSubject, fullName, roleCode } = req.body as {
      socialSubject?: string;
      fullName?: string;
      roleCode?: 'user' | 'garage' | 'vendor';
    };

    const session = await loginOrRegisterWithSocial({
      provider: provider as 'google' | 'apple',
      socialSubject,
      fullName,
      roleCode,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] ?? undefined,
    });
    setSessionCookies(res, session);
    return res.json({
      message: 'Social auth successful',
      roleCode: session.roleCode,
      redirectPath: session.redirectPath,
    });
  } catch (error) {
    return next(error);
  }
});

authRouter.post('/sessions/refresh', async (req, res, next) => {
  try {
    const cookieHeader = req.headers.cookie ?? '';
    const tokenPair = cookieHeader
      .split(';')
      .map((v) => v.trim())
      .find((v) => v.startsWith('wrect_rt='));
    const refreshToken = tokenPair?.slice('wrect_rt='.length);
    if (!refreshToken) return res.status(401).json({ message: 'Missing refresh token' });
    const session = await refreshSession({
      refreshToken: decodeURIComponent(refreshToken),
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] ?? undefined,
    });
    setSessionCookies(res, session);
    return res.json({
      message: 'Session refreshed',
      roleCode: session.roleCode,
      redirectPath: session.redirectPath,
    });
  } catch (error) {
    return next(error);
  }
});

authRouter.post('/logout', async (req, res, next) => {
  try {
    const cookieHeader = req.headers.cookie ?? '';
    const accessTokenPair = cookieHeader
      .split(';')
      .map((v) => v.trim())
      .find((v) => v.startsWith('wrect_at='));
    const refreshTokenPair = cookieHeader
      .split(';')
      .map((v) => v.trim())
      .find((v) => v.startsWith('wrect_rt='));
    const accessToken = accessTokenPair?.slice('wrect_at='.length);
    const refreshToken = refreshTokenPair?.slice('wrect_rt='.length);
    if (accessToken) {
      await revokeByAccessToken(decodeURIComponent(accessToken));
    }
    if (refreshToken) {
      await revokeByRefreshToken(decodeURIComponent(refreshToken));
    }
    clearSessionCookies(res);
    return res.json({ message: 'Logged out' });
  } catch (error) {
    return next(error);
  }
});

authRouter.get('/me', requireAuth, (req, res) => {
  return res.json({
    user: req.authUser,
  });
});
