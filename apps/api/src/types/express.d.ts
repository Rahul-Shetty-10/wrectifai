import type { UserTokenPayload } from '../services/jwt.service';

declare global {
  namespace Express {
    interface Request {
      user?: UserTokenPayload;
    }
  }
}
