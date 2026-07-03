import type { RequestHandler } from 'express';
import { verifyJwt } from '../utils/jwt';
import { HttpError } from '../utils/http-error';

export const requireAuth: RequestHandler = (req, res, next) => {
  try {
    const header = req.header('authorization');
    const [scheme, token] = header?.split(' ') ?? [];

    if (scheme !== 'Bearer' || !token) {
      throw new HttpError(401, 'Authorization bearer token is required');
    }

    res.locals.user = verifyJwt(token);
    next();
  } catch (error) {
    next(error);
  }
};
