/**
 * Transport-agnostic application errors. The HTTP layer decides how each
 * kind is presented; domain and application code never mention status codes.
 */
export type ErrorKind = 'validation' | 'unauthenticated' | 'forbidden' | 'not_found' | 'conflict';

export class AppError extends Error {
  readonly kind: ErrorKind;

  constructor(kind: ErrorKind, message: string) {
    super(message);
    this.name = 'AppError';
    this.kind = kind;
  }
}

export const validationFailed = (message: string) => new AppError('validation', message);
export const unauthenticated = (message = 'Authentication required') =>
  new AppError('unauthenticated', message);
export const forbidden = (message = 'You are not allowed to perform this action') =>
  new AppError('forbidden', message);
export const notFound = (resource: string) => new AppError('not_found', `${resource} not found`);
export const conflict = (message: string) => new AppError('conflict', message);
