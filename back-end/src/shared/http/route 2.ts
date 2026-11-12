import type { Static, TSchema } from '@sinclair/typebox';
import type { Principal, Role } from '../domain/principal.ts';

/**
 * Framework-agnostic route contract. Feature modules describe their endpoints
 * with `defineRoute`; a single HTTP adapter turns the descriptions into real
 * routes and enforces access, validation and throttling for all of them.
 *
 * `access` is mandatory, so an endpoint cannot be exposed without an explicit
 * decision about who may call it.
 */
export type AccessPolicy =
  | { readonly kind: 'public' }
  | { readonly kind: 'authenticated' }
  | { readonly kind: 'roles'; readonly roles: readonly Role[] };

export const access = {
  public: { kind: 'public' } as const,
  authenticated: { kind: 'authenticated' } as const,
  roles: (...roles: Role[]) => ({ kind: 'roles', roles }) as const,
};

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** `strict` is for endpoints that are attractive brute-force targets. */
export type Throttle = 'standard' | 'strict';

export interface RouteSchemas {
  readonly body?: TSchema;
  readonly query?: TSchema;
  readonly params?: TSchema;
}

export type Cookies = Readonly<Record<string, string | undefined>>;

/** Cookies are always sent HttpOnly; Secure/SameSite come from configuration. */
export interface ResponseCookie {
  readonly name: string;
  readonly value: string;
  readonly path: string;
  readonly maxAgeSeconds: number;
}

export interface HttpRequest {
  readonly body: unknown;
  readonly query: unknown;
  readonly params: unknown;
  readonly principal: Principal | null;
  readonly cookies: Cookies;
}

export interface HttpResponse {
  readonly status: number;
  readonly body?: unknown;
  readonly cookies?: readonly ResponseCookie[];
}

interface RouteMeta<S extends RouteSchemas, A extends AccessPolicy> {
  readonly method: HttpMethod;
  /** Relative to the API base path, e.g. `/days/:date`. */
  readonly path: string;
  readonly summary: string;
  readonly access: A;
  readonly throttle?: Throttle;
  readonly request?: S;
  /** Response body schema per status code; `null` for an empty body. */
  readonly responses: Readonly<Record<number, TSchema | null>>;
}

export interface Route extends RouteMeta<RouteSchemas, AccessPolicy> {
  handle(request: HttpRequest): Promise<HttpResponse>;
}

type BodyOf<S> = S extends { body: infer T extends TSchema } ? Static<T> : undefined;
type QueryOf<S> = S extends { query: infer T extends TSchema } ? Static<T> : undefined;
type ParamsOf<S> = S extends { params: infer T extends TSchema } ? Static<T> : undefined;
type PrincipalFor<A extends AccessPolicy> = A extends { kind: 'public' } ? null : Principal;

export interface TypedRequest<S extends RouteSchemas, A extends AccessPolicy> {
  readonly body: BodyOf<S>;
  readonly query: QueryOf<S>;
  readonly params: ParamsOf<S>;
  readonly principal: PrincipalFor<A>;
  readonly cookies: Cookies;
}

export interface RouteDefinition<S extends RouteSchemas, A extends AccessPolicy>
  extends RouteMeta<S, A> {
  handler(request: TypedRequest<S, A>): Promise<HttpResponse>;
}

/**
 * The cast is sound because the HTTP adapter validates the request against
 * `request` schemas and resolves the principal per `access` before `handle`
 * is ever invoked.
 */
export function defineRoute<S extends RouteSchemas, A extends AccessPolicy>(
  definition: RouteDefinition<S, A>,
): Route {
  const { handler, ...meta } = definition;
  return { ...meta, handle: (request) => handler(request as TypedRequest<S, A>) };
}

export const ok = (body: unknown): HttpResponse => ({ status: 200, body });
export const created = (body: unknown): HttpResponse => ({ status: 201, body });
export const noContent = (): HttpResponse => ({ status: 204 });
