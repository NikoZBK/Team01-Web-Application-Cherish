import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { ALLOWED_ORIGIN, PASSWORD, startTestApp, uniqueEmail, type TestApp } from './support/harness.ts';

describe('transport hardening', () => {
  let app: TestApp;
  before(async () => {
    app = await startTestApp();
  });
  after(() => app.stop());

  it('reports liveness and readiness', async () => {
    assert.deepEqual((await app.request('GET', '/health')).body, { status: 'ok' });
    assert.deepEqual((await app.request('GET', '/health/ready')).body, { status: 'ok' });
  });

  it('sends security headers and forbids caching', async () => {
    const { headers } = await app.request('GET', '/health');
    assert.equal(headers.get('x-content-type-options'), 'nosniff');
    assert.equal(headers.get('cache-control'), 'no-store');
    assert.match(headers.get('content-security-policy') ?? '', /default-src 'none'/);
    assert.match(headers.get('strict-transport-security') ?? '', /max-age=/);
    assert.equal(headers.get('x-powered-by'), null);
  });

  it('answers CORS only for allow-listed origins', async () => {
    const allowed = await app.request('GET', '/health', { headers: { origin: ALLOWED_ORIGIN } });
    assert.equal(allowed.headers.get('access-control-allow-origin'), ALLOWED_ORIGIN);
    assert.equal(allowed.headers.get('access-control-allow-credentials'), 'true');

    const other = await app.request('GET', '/health', { headers: { origin: 'https://evil.example' } });
    assert.equal(other.headers.get('access-control-allow-origin'), null);
  });

  it('refuses state-changing requests from foreign origins (CSRF)', async () => {
    const session = await app.register();
    const forged = await app.request('POST', '/auth/refresh', {
      cookie: session.cookie,
      headers: { origin: 'https://evil.example' },
    });
    assert.equal(forged.status, 403);

    const legitimate = await app.request('POST', '/auth/refresh', {
      cookie: session.cookie,
      headers: { origin: ALLOWED_ORIGIN },
    });
    assert.equal(legitimate.status, 200, 'the forged attempt did not consume the token');
  });

  it('returns problem details without internals for unknown routes and bad payloads', async () => {
    const missing = await app.request('GET', '/nope');
    assert.equal(missing.status, 404);
    assert.equal(missing.body.code, 'not_found');
    assert.ok(missing.body.requestId);

    const malformed = await app.request('POST', '/auth/login', {
      headers: { 'content-type': 'application/json' },
    });
    assert.equal(malformed.status, 400);
    assert.equal(malformed.body.stack, undefined);
  });

  it('rejects oversized bodies', async () => {
    const response = await app.request('POST', '/auth/login', {
      body: { email: uniqueEmail(), password: 'x'.repeat(200_000) },
    });
    assert.equal(response.status, 413);
  });

  it('publishes an OpenAPI document that marks protected routes', async () => {
    const { status, body } = await app.request('GET', '/openapi.json');
    assert.equal(status, 200);
    assert.deepEqual(body.paths['/api/v1/days'].get.security, [{ bearerAuth: [] }]);
    assert.equal(body.paths['/api/v1/auth/login'].post.security, undefined);
  });
});

describe('rate limiting', () => {
  it('throttles credential endpoints more tightly than the rest', async () => {
    const app = await startTestApp({ RATE_LIMIT_AUTH_MAX: '3' });
    try {
      const email = uniqueEmail();
      const statuses: number[] = [];
      for (let attempt = 0; attempt < 5; attempt += 1) {
        statuses.push((await app.login(email, PASSWORD)).status);
      }
      assert.deepEqual(statuses, [401, 401, 401, 429, 429]);
      assert.equal((await app.request('GET', '/health')).status, 200);
    } finally {
      await app.stop();
    }
  });
});

describe('production configuration', () => {
  it('hides the OpenAPI document and marks cookies Secure', async () => {
    const app = await startTestApp({
      NODE_ENV: 'production',
      LOG_LEVEL: 'silent',
      JWT_SECRET: 'production-grade-secret-of-sufficient-length',
    });
    try {
      assert.equal((await app.request('GET', '/openapi.json')).status, 404);
      const registered = await app.request('POST', '/auth/register', {
        body: { email: uniqueEmail(), password: PASSWORD, displayName: 'Prod' },
      });
      assert.match(registered.setCookie ?? '', /Secure/);
    } finally {
      await app.stop();
    }
  });
});
