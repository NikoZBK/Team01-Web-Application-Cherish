import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { PASSWORD, startTestApp, uniqueEmail, type TestApp } from './support/harness.ts';

describe('authentication', () => {
  let app: TestApp;
  before(async () => {
    app = await startTestApp();
  });
  after(() => app.stop());

  it('registers a user, returning an access token and an HttpOnly refresh cookie', async () => {
    const email = uniqueEmail();
    const response = await app.request('POST', '/auth/register', {
      body: { email: email.toUpperCase(), password: PASSWORD, displayName: '  Ada  ' },
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.user.email, email);
    assert.equal(response.body.user.displayName, 'Ada');
    assert.equal(response.body.user.role, 'user');
    assert.equal(response.body.tokenType, 'Bearer');
    assert.deepEqual(Object.keys(response.body.user).sort(), ['createdAt', 'displayName', 'email', 'id', 'role']);
    assert.match(response.setCookie ?? '', /HttpOnly/);
    assert.match(response.setCookie ?? '', /SameSite=Strict/);
    assert.match(response.setCookie ?? '', /Path=\/api\/v1\/auth/);
    assert.ok(!JSON.stringify(response.body).includes('scrypt'), 'no credential material in the body');
  });

  it('rejects a duplicate email, case-insensitively', async () => {
    const session = await app.register();
    const response = await app.request('POST', '/auth/register', {
      body: { email: session.email.toUpperCase(), password: PASSWORD, displayName: 'Dup' },
    });
    assert.equal(response.status, 409);
  });

  it('lets exactly one of several simultaneous sign-ups for the same email succeed', async () => {
    const email = uniqueEmail();
    const responses = await Promise.all(
      Array.from({ length: 5 }, () =>
        app.request('POST', '/auth/register', { body: { email, password: PASSWORD, displayName: 'Racer' } }),
      ),
    );
    assert.deepEqual(responses.map((response) => response.status).sort(), [201, 409, 409, 409, 409]);
  });

  it('rejects weak passwords and attempts to self-assign a role', async () => {
    const weak = await app.request('POST', '/auth/register', {
      body: { email: uniqueEmail(), password: 'short', displayName: 'Weak' },
    });
    assert.equal(weak.status, 400);
    assert.equal(weak.body.code, 'validation');

    const escalation = await app.request('POST', '/auth/register', {
      body: { email: uniqueEmail(), password: PASSWORD, displayName: 'Eve', role: 'admin' },
    });
    assert.equal(escalation.status, 400);
  });

  it('logs in with valid credentials and answers identically for unknown email and wrong password', async () => {
    const session = await app.register();

    const good = await app.login(session.email, PASSWORD);
    assert.equal(good.status, 200);
    assert.ok(good.body.accessToken);

    const wrongPassword = await app.login(session.email, 'not the password!');
    const unknownEmail = await app.login(uniqueEmail(), PASSWORD);
    assert.equal(wrongPassword.status, 401);
    assert.equal(unknownEmail.status, 401);
    assert.equal(wrongPassword.body.detail, unknownEmail.body.detail);
  });

  it('rotates the refresh token and revokes the session when an old token is replayed', async () => {
    const session = await app.register();

    const rotated = await app.request('POST', '/auth/refresh', { cookie: session.cookie });
    assert.equal(rotated.status, 200);
    assert.ok(rotated.refreshCookie);
    assert.notEqual(rotated.refreshCookie, session.cookie);

    const replay = await app.request('POST', '/auth/refresh', { cookie: session.cookie });
    assert.equal(replay.status, 401);

    const afterTheft = await app.request('POST', '/auth/refresh', { cookie: rotated.refreshCookie });
    assert.equal(afterTheft.status, 401, 'the whole token family is revoked');
  });

  it('rejects refresh without a cookie or with a forged one', async () => {
    assert.equal((await app.request('POST', '/auth/refresh')).status, 401);
    assert.equal((await app.request('POST', '/auth/refresh', { cookie: 'refresh_token=forged' })).status, 401);
  });

  it('logout revokes the refresh token and clears the cookie', async () => {
    const session = await app.register();

    const logout = await app.request('POST', '/auth/logout', { cookie: session.cookie });
    assert.equal(logout.status, 204);
    assert.match(logout.setCookie ?? '', /Max-Age=0/);

    assert.equal((await app.request('POST', '/auth/refresh', { cookie: session.cookie })).status, 401);
  });

  it('changing the password requires the current one and ends other sessions', async () => {
    const session = await app.register();
    const newPassword = 'a brand new passphrase';

    const wrong = await app.request('POST', '/auth/password', {
      token: session.token,
      body: { currentPassword: 'definitely wrong', newPassword },
    });
    assert.equal(wrong.status, 401);

    const changed = await app.request('POST', '/auth/password', {
      token: session.token,
      body: { currentPassword: PASSWORD, newPassword },
    });
    assert.equal(changed.status, 200);

    assert.equal((await app.request('POST', '/auth/refresh', { cookie: session.cookie })).status, 401);
    assert.equal((await app.login(session.email, PASSWORD)).status, 401);
    assert.equal((await app.login(session.email, newPassword)).status, 200);
  });
});
