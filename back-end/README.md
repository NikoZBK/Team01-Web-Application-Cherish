# Cherish Back End

The REST API behind the Cherish wellness calendar (the front end lives in `../front-end`).
It is a copy of the [plug-n-play backend](https://github.com/NikoZBK/plugnplaybackend) with a
`days` feature module in place of the example one. TypeScript on Node 22, Fastify behind a framework-agnostic route layer,
in-memory or PostgreSQL storage chosen by one environment variable.

```bash
npm install
npm run dev          # http://127.0.0.1:3000/api/v1  (in-memory storage, no setup)
npm test             # full suite over real HTTP
npm run typecheck
npm run smoke        # boots the production entry point, checks readiness and clean shutdown
```

Requires Node 22.7 or newer.

To persist data, copy `.env.example` to `.env` and set `PERSISTENCE_DRIVER=postgres` and
`DATABASE_URL`. Migrations run automatically at startup. To run the test suite against
PostgreSQL as well: `TEST_DATABASE_URL=postgres://… npm test`.

## Connecting a front end

The Cherish front end already does this in `../front-end/src/services/api.js`, through the dev
server started by `npm run start-client` in the repository root. For any other client:

1. Add the front end's origin to `CORS_ORIGINS` (exact origins, no wildcards).
2. Generate a typed client from `GET /api/v1/openapi.json` (for example with `openapi-typescript`), or call it directly:

```ts
const API = 'http://127.0.0.1:3000/api/v1';
let accessToken: string | null = null;            // keep in memory, not localStorage

async function login(email: string, password: string) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    credentials: 'include',                       // lets the browser store the refresh cookie
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw await res.json();            // RFC 9457 problem: { status, code, detail, errors? }
  accessToken = (await res.json()).accessToken;
}

async function api(path: string, init: RequestInit = {}) {
  const call = () => fetch(`${API}${path}`, {
    ...init,
    headers: { ...init.headers, authorization: `Bearer ${accessToken}` },
  });
  let res = await call();
  if (res.status === 401) {                       // access token expired: rotate and retry once
    const refreshed = await fetch(`${API}/auth/refresh`, { method: 'POST', credentials: 'include' });
    if (!refreshed.ok) throw new Error('signed out');
    accessToken = (await refreshed.json()).accessToken;
    res = await call();
  }
  return res;
}
```

If the front end is served from a different *site* than the API (not just a different port),
set `COOKIE_SAMESITE=none` and serve both over HTTPS.

## Endpoints

| Method | Path (under `/api/v1`) | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/health`, `/health/ready` | public | liveness / readiness |
| POST | `/auth/register` | public, strict throttle | create account, start session |
| POST | `/auth/login` | public, strict throttle | start session |
| POST | `/auth/refresh` | refresh cookie, strict throttle | rotate session |
| POST | `/auth/logout` | refresh cookie | end session |
| POST | `/auth/password` | signed in | change password, end other sessions |
| GET, PATCH | `/users/me` | signed in | read / update own profile |
| GET | `/users` | admin | list users |
| PUT | `/users/:id/role` | admin | change a user's role |
| GET | `/days?from=&to=` | signed in | list own recorded days, oldest first, optionally within a date range |
| DELETE | `/days` | signed in | erase all own days |
| GET | `/days/:date` | signed in | one own day (`YYYY-MM-DD`); blank if nothing is recorded |
| PUT | `/days/:date` | signed in | record a day: `{ rating, journal, emotions: [{ emotion, magnitude, description, time }] }` |

The first admin is created from `BOOTSTRAP_ADMIN_EMAIL` /
`BOOTSTRAP_ADMIN_PASSWORD`.

## Architecture

```
src/
  main.ts                     process entry: config, start, graceful shutdown
  config/                     typed, validated environment configuration
  composition/                composition root: the only place concrete classes are chosen
    application.ts              wires adapters -> services -> modules -> HTTP server
    persistence.ts              storage driver selection (memory | postgres)
  shared/                     kernel every module may depend on
    domain/                     AppError, Principal/Role, pagination
    application/ports.ts        Clock, IdGenerator, HealthProbe
    http/                       route contract (defineRoute, access policies), AccessGuard, shared schemas
  platform/                   framework and driver code
    http/fastify-server.ts      the only file that imports Fastify
    persistence/postgres/       pool, migrator, SQL migrations
  modules/<feature>/          one folder per feature
    domain/                     entities and rules, no dependencies
    application/                services + the ports (interfaces) they need
    infrastructure/             adapters implementing those ports
    http/                       route definitions and DTO schemas
```

Dependencies point inward: `http` and `infrastructure` depend on `application`, which depends
on `domain`. Nothing in a module's `domain` or `application` imports Fastify, `pg` or `jose`.

How the SOLID principles show up:

- **Single responsibility** — a service holds use-case rules, a repository holds storage, a
  module's `http` file holds transport mapping; cross-cutting protection lives once in the HTTP adapter.
- **Open/closed** — features are added by writing a module and listing it in the composition
  root; the server, guard and error handling are not edited.
- **Liskov** — every repository port has an in-memory and a PostgreSQL implementation, and the
  same HTTP-level test suite passes on both.
- **Interface segregation** — ports are narrow and owned by their consumer (`PasswordHasher`,
  `AccessTokenIssuer`, `Authenticator`, `OpaqueTokenFactory`, `Clock`, …); the JWT service
  implements two of them and each consumer sees only its half.
- **Dependency inversion** — services receive interfaces through their constructors;
  `composition/` is the only code that calls `new` on an adapter.

### Adding a feature module

1. Copy `src/modules/days` and rename. Define the entity, the repository port, the service.
2. Describe endpoints with `defineRoute`. `access` is a required field, so a route cannot exist
   without an explicit decision; request schemas give you typed, pre-validated input, and
   `principal` is typed non-null for anything that is not `access.public`.
3. Implement the repository for each storage driver, add it to `Persistence`, and add a
   numbered `.sql` file under `platform/persistence/postgres/migrations/`.
4. Add `createXModule(...)` to the `modules` list in `composition/application.ts`.

### Swapping a part

| To change… | Implement… | Wire it in… |
| --- | --- | --- |
| Database | the repository ports + a driver in `PersistenceConfig` | `composition/persistence.ts` |
| Password hashing (e.g. argon2) | `PasswordHasher` | `composition/application.ts` |
| Token format / identity provider | `AccessTokenIssuer`, `Authenticator` | `composition/application.ts` |
| HTTP framework | `HttpServer` from the same `AppModule[]` | `composition/application.ts` |

## Security model

Applied to every route by the HTTP adapter, not per endpoint:

- **Access control** — deny by construction: each route declares `public`, `authenticated` or
  `roles(...)`, enforced before the body is parsed. Tests enumerate every protected route.
- **Object-level authorisation** — day queries are scoped by owner inside the repository; the
  owner comes from the access token, never from the URL or body.
- **Input** — JSON Schema validation on body, query and path; unknown properties are rejected
  (no mass assignment); 100 kB body limit; page size capped at 100; SQL is always parameterised.
- **Output** — responses are serialised through explicit DTO schemas, so fields such as
  `passwordHash` cannot leak; errors are RFC 9457 problems with a request id and no internals.
- **Passwords** — scrypt (N=2^17, r=8) with per-password salt, constant-time comparison,
  12–128 characters; login takes the same time and returns the same error for unknown emails.
- **Sessions** — 15-minute HS256 JWT access tokens with pinned algorithm, issuer and audience;
  refresh tokens are random 256-bit values stored only as SHA-256 digests, sent only in an
  `HttpOnly` cookie scoped to `/api/v1/auth`, rotated on every use, and a replayed token
  revokes its whole family.
- **Browser attacks** — CORS allow-list with credentials; state-changing requests whose `Origin`
  is not on the list are refused (CSRF); `SameSite` cookies; helmet headers with
  `default-src 'none'`, HSTS, `no-store` caching.
- **Abuse** — per-IP rate limiting everywhere, ten times tighter on credential endpoints.
- **Operations** — production refuses to start without a ≥32-character `JWT_SECRET` and secure
  cookies; authorisation and cookie headers are redacted from logs; OpenAPI is hidden in
  production by default.

### Known limits

- Access tokens are stateless: a role change, logout or password change takes effect for
  already-issued access tokens when they expire (15 minutes at most). Lower
  `ACCESS_TOKEN_TTL_SECONDS` if that window is too long.
- Rate-limit counters live in process memory. Behind several instances, give
  `@fastify/rate-limit` a shared (Redis) store in `fastify-server.ts`, and set
  `TRUST_PROXY=true` behind a proxy so limits apply to the real client IP.
- `POST /auth/register` answers 409 for an email that is already registered, which reveals
  that the account exists. Hiding that requires an email-verification flow; there is no mail
  integration yet, so no email verification or password reset either.
- TLS is expected to be terminated by a reverse proxy or platform in front of the service.
