import type { ErrorRequestHandler, RequestHandler, Request } from 'express';
import { ZodError } from 'zod';
import { MulterError } from 'multer';
import { AppError } from '../lib/errors';
import { env } from '../config/env';

/** Wrap an async handler so a rejected promise reaches the error middleware. */
export const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

export const notFound: RequestHandler = (req, _res, next) => {
  next(new AppError('NOT_FOUND', 404, `Route not found: ${req.method} ${req.path}`));
};

function reqId(req: Request): string {
  return (req as Request & { id?: string }).id ?? 'unknown';
}

/**
 * The single terminal error handler. Translates AppError, ZodError, Multer errors and
 * (later) Prisma errors into one envelope: { error: { code, message, details?, requestId } }.
 * Unknown errors are logged with the requestId and returned as a generic 500 — never a stack trace.
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const requestId = reqId(req);

  if (err instanceof AppError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details, requestId },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
        requestId,
      },
    });
    return;
  }

  if (err instanceof MulterError) {
    const tooLarge = err.code === 'LIMIT_FILE_SIZE';
    res.status(tooLarge ? 413 : 400).json({
      error: {
        code: tooLarge ? 'FILE_TOO_LARGE' : 'VALIDATION_ERROR',
        message: tooLarge ? 'Uploaded file exceeds the size limit' : err.message,
        requestId,
      },
    });
    return;
  }

  // Unknown / unexpected: log server-side, return generic.
  console.error(`[${requestId}] Unhandled error:`, err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong. Please try again.',
      ...(env.NODE_ENV === 'development' ? { details: String(err) } : {}),
      requestId,
    },
  });
};
