export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_SERVER_ERROR';

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  status?: number; // optional HTTP status for convenience on server
  details?: Record<string, unknown> | string[];
}

// Narrow helper to check if a value looks like an ApiError (runtime guard)
export function isApiError(value: unknown): value is ApiError {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<ApiError>;
  return typeof v.message === 'string' && typeof v.code === 'string';
}

// Optional mapping helper for backend to generate consistent errors
export function makeApiError(
  code: ApiErrorCode,
  message: string,
  opts?: { status?: number; details?: Record<string, unknown> | string[] }
): ApiError {
  return { code, message, status: opts?.status, details: opts?.details };
}

// Standard API envelope used across frontend and backend
export interface ApiEnvelope<T> {
  error: ApiError | null;
  data: T | null;
  message: string;
  status: number; // HTTP status code
}

// Helpers to construct envelopes consistently on the server
export function ok<T>(data: T, message = 'OK', status = 200): ApiEnvelope<T> {
  return { error: null, data, message, status };
}

export function fail<T = unknown>(
  error: ApiError,
  message = error.message,
  status = error.status ?? 400
): ApiEnvelope<T> {
  return { error, data: null, message, status };
}

