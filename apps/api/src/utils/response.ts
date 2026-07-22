import type { Response } from 'express';

export function success(res: Response, data: unknown, status = 200, meta?: unknown) {
  return res.status(status).json({
    data,
    ...(meta ? { meta } : {}),
  });
}

export function error(
  res: Response,
  message: string,
  code = 'INTERNAL_ERROR',
  status = 500,
  details?: unknown
) {
  return res.status(status).json({
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  });
}
