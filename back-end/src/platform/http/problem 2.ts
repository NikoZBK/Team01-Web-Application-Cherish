import { STATUS_CODES } from 'node:http';
import { AppError, type ErrorKind } from '../../shared/domain/errors.ts';

/** RFC 9457 problem details (without the per-request id, which the server adds). */
export interface Problem {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly detail: string;
  readonly code: string;
  readonly errors?: readonly { path: string; message: string }[];
}

const STATUS_BY_KIND: Readonly<Record<ErrorKind, number>> = {
  validation: 400,
  unauthenticated: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
};

interface FrameworkError {
  readonly statusCode?: unknown;
  readonly message?: unknown;
  readonly validation?: unknown;
  readonly validationContext?: unknown;
}

interface ValidationIssue {
  readonly instancePath?: unknown;
  readonly message?: unknown;
}

export function problem(status: number, code: string, detail: string, errors?: Problem['errors']): Problem {
  return {
    type: 'about:blank',
    title: STATUS_CODES[status] ?? 'Error',
    status,
    detail,
    code,
    ...(errors === undefined ? {} : { errors }),
  };
}

/**
 * Maps anything thrown while serving a request to a client-safe problem.
 * Unknown failures become an opaque 500: internals are logged, never returned.
 */
export function toProblem(error: unknown): Problem {
  if (error instanceof AppError) {
    return problem(STATUS_BY_KIND[error.kind], error.kind, error.message);
  }

  if (typeof error === 'object' && error !== null) {
    const candidate = error as FrameworkError;

    if (Array.isArray(candidate.validation)) {
      const context = typeof candidate.validationContext === 'string' ? candidate.validationContext : 'request';
      const issues = (candidate.validation as ValidationIssue[]).map((issue) => ({
        path: `${context}${typeof issue.instancePath === 'string' ? issue.instancePath : ''}`,
        message: typeof issue.message === 'string' ? issue.message : 'is invalid',
      }));
      return problem(400, 'validation', 'Request validation failed', issues);
    }

    const status = candidate.statusCode;
    if (typeof status === 'number' && status >= 400 && status < 500) {
      const detail = typeof candidate.message === 'string' ? candidate.message : 'Request rejected';
      return problem(status, status === 429 ? 'rate_limited' : 'bad_request', detail);
    }
  }

  return problem(500, 'internal', 'An unexpected error occurred');
}
