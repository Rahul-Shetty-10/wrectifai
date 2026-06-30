import { Router } from 'express';
import {
  loginWithOtp,
  requestOtp,
  signupWithOtp,
} from './auth.service';

export const authRouter = Router();

authRouter.get('/status', (_req, res) => {
  res.json({ feature: 'auth', status: 'ready' });
});

authRouter.post('/request-otp', async (req, res, next) => {
  try {
    const data = await requestOtp(req.body);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/verify-otp', async (req, res, next) => {
  try {
    const data = await loginWithOtp(req.body);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/signup', async (req, res, next) => {
  try {
    const data = await signupWithOtp(req.body);
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
});
