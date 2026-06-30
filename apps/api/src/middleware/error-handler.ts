import type { NextFunction, Request, Response } from 'express';

type HttpError = Error & {
  statusCode?: number;
  details?: unknown;
};

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error(err);
  const httpError = err as HttpError;
  const statusCode = httpError.statusCode ?? 500;

  res.status(statusCode).json({
    error: {
      code: statusCode === 500 ? 'internal_server_error' : 'request_failed',
      message:
        statusCode === 500
          ? 'Internal server error'
          : httpError.message ?? 'Request failed',
      details: httpError.details,
    },
  });
}
