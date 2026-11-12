import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { SignJWT } from 'jose';
import { PASSWORD, startTestApp, uniqueEmail, type TestApp } from './support/harness.ts';

const SECRET = 'test-secret-test-secret-test-secret-123';
const ADMIN_EMAIL = uniqueEmail();

function forgeToken(claims: Record<string, unknown>, secret: string, expiresIn = '5m'): Promise<string> {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer('plugnplay-backend')
    .setAudience('plugnplay-clients')
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(new TextEncoder().encode(secret));
}

describe('access control', () => {
  let app: TestApp;
  let adminToken: string;

  before(async () => {
    app = await startTestApp({
      JWT_SECRET: SECRET,
      BOOTSTRAP_ADMIN_EMAIL: ADMIN_EMAIL,
      BOOTSTRAP_ADMIN_PASSWORD: PASSWORD,
    });
    adminToken = (await app.login(ADMIN_EMAIL, PASSWORD)).body.accessToken;
  });
  after(() => app.stop());

  const protectedRoutes: [string, string][] = [
    ['GET', '/users/me'],
    ['PATCH', '/users/me'],
    ['GET', '/users'],
    ['PUT', '/users/0190a000-0000-7000-8000-000000000000/role'],
    ['POST', '/auth/password'],
    ['GET', '/days'],
    ['DELETE', '/days'],
    ['GET', '/days/2024-12-10'],
    ['PUT', '/days/2024-12-10'],
  ];

  for (const [method, path] of protectedRoutes) {
    it(`${method} ${path} requires authentication`, async () => {
      const response = await app.request(method, path);
      assert.equal(response.status, 401);
      assert.equal(response.headers.get('www-authenticate'), 'Bearer');
      assert.match(response.headers.get('content-type') ?? '', /application\/problem\+json/);
    });
  }

  it('rejects malformed, tampered, wrongly-signed, unsigned and expired tokens', async () => {
    const { token, userId } = await app.register();
    const tampered = `${token.slice(0, -4)}AAAA`;
    const wrongKey = await forgeToken({ sub: userId, role: 'admin' }, 'another-secret-another-secret-another');
    const expired = await forgeToken({ sub: userId, role: 'user' }, SECRET, '-1m');
    const badRole = await forgeToken({ sub: userId, role: 'superuser' }, SECRET);
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ sub: userId, role: 'admin' })).toString('base64url');
    const unsigned = `${header}.${payload}.`;

    for (const candidate of ['garbage', tampered, wrongKey, expired, badRole, unsigned]) {
      const response = await app.request('GET', '/users/me', { token: candidate });
      assert.equal(response.status, 401, `token should be rejected: ${candidate.slice(0, 24)}`);
    }
    assert.equal((await app.request('GET', '/users/me', { token })).status, 200);
  });

  it('keeps regular users out of admin endpoints', async () => {
    const user = await app.register();
    const list = await app.request('GET', '/users', { token: user.token });
    const promote = await app.request('PUT', `/users/${user.userId}/role`, {
      token: user.token,
      body: { role: 'admin' },
    });
    assert.equal(list.status, 403);
    assert.equal(promote.status, 403);
  });

  it('lets an admin list users and change roles, but not their own', async () => {
    const user = await app.register();

    const list = await app.request('GET', '/users?limit=5', { token: adminToken });
    assert.equal(list.status, 200);
    assert.ok(list.body.total >= 2);
    assert.ok(list.body.items.length <= 5);
    assert.ok(!JSON.stringify(list.body).includes('passwordHash'));

    const promoted = await app.request('PUT', `/users/${user.userId}/role`, {
      token: adminToken,
      body: { role: 'admin' },
    });
    assert.equal(promoted.status, 200);
    assert.equal(promoted.body.role, 'admin');

    const me = await app.request('GET', '/users/me', { token: adminToken });
    const selfDemotion = await app.request('PUT', `/users/${me.body.id}/role`, {
      token: adminToken,
      body: { role: 'user' },
    });
    assert.equal(selfDemotion.status, 403);
  });

  it('lets a user update only whitelisted profile fields', async () => {
    const user = await app.register();
    const renamed = await app.request('PATCH', '/users/me', { token: user.token, body: { displayName: '  Grace ' } });
    assert.equal(renamed.status, 200);
    assert.equal(renamed.body.displayName, 'Grace');

    const escalation = await app.request('PATCH', '/users/me', { token: user.token, body: { role: 'admin' } });
    assert.equal(escalation.status, 400);
    assert.equal((await app.request('GET', '/users/me', { token: user.token })).body.role, 'user');
  });
});
