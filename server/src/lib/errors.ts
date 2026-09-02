/**
 * Typed application error. Every failure the API returns on purpose is an AppError;
 * the central error handler turns it into the one response envelope. `code` is a stable
 * machine constant the front-end switches on (never the human message).
 */
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'AUTH_REQUIRED'
  | 'INVALID_CREDENTIALS'
  | 'ADMIN_ONLY'
  | 'NOT_FOUND'
  | 'IDENTIFIER_TAKEN'
  | 'DUPLICATE_ORDER_ID'
  | 'RECEIPT_ALREADY_PROCESSED'
  | 'SELF_REVIEW_FORBIDDEN'
  | 'FILE_TOO_LARGE'
  | 'UNSUPPORTED_FILE_TYPE'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const BadRequest = (message: string, details?: unknown) =>
  new AppError('VALIDATION_ERROR', 400, message, details);
export const Unauthorized = (message = 'Authentication required') =>
  new AppError('AUTH_REQUIRED', 401, message);
export const InvalidCredentials = (message = 'Invalid credentials') =>
  new AppError('INVALID_CREDENTIALS', 401, message);
export const Forbidden = (message = 'Admins only') =>
  new AppError('ADMIN_ONLY', 403, message);
export const NotFound = (message = 'Not found') =>
  new AppError('NOT_FOUND', 404, message);
export const Conflict = (code: ErrorCode, message: string, details?: unknown) =>
  new AppError(code, 409, message, details);
