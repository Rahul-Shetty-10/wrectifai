import type { NextFunction, Request, Response } from 'express';
import { error } from '../utils/response';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error(err);
  
  const status = (err as any).status || 500;
  const message = err instanceof Error ? err.message : 'Internal server error';
  const code = (err as any).code || 'INTERNAL_SERVER_ERROR';
  const details = (err as any).details;

  return error(res, message, code, status, details);
}
