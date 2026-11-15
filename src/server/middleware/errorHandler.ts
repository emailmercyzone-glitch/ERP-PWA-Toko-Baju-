import { NextFunction, Request, Response } from 'express';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const error = err as Error & { status?: number; code?: string };

  res.status(error.status ?? 500).json({
    success: false,
    message: error.message ?? 'Internal server error',
    code: error.code ?? 'INTERNAL_ERROR',
  });
}
