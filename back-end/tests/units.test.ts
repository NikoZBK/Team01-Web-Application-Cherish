import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ConfigError, loadConfig } from '../src/config/config.ts';
import { ScryptPasswordHasher } from '../src/modules/auth/infrastructure/scrypt-password-hasher.ts';
import { UuidV7Generator } from '../src/shared/infrastructure/system.ts';

describe('configuration', () => {
  it('runs with zero configuration in development', () => {
    const config = loadConfig({});
    assert.equal(config.env, 'development');
    assert.equal(config.persistence.driver, 'memory');
    assert.ok(config.auth.jwtSecret.length >= 32);
    assert.equal(config.warnings.length, 1);
  });

  it('refuses to start in production without a strong secret and secure cookies', () => {
    assert.throws(() => loadConfig({ NODE_ENV: 'production' }), /JWT_SECRET is required/);
    assert.throws(() => loadConfig({ NODE_ENV: 'production', JWT_SECRET: 'short' }), /at least 32/);
    assert.throws(
      () => loadConfig({ NODE_ENV: 'production', JWT_SECRET: 'x'.repeat(32), COOKIE_SECURE: 'false' }),
      /COOKIE_SECURE must be true/,
    );
  });

  it('reports every problem at once', () => {
    assert.throws(
      () => loadConfig({ PORT: 'abc', CORS_ORIGINS: '*', PERSISTENCE_DRIVER: 'postgres', COOKIE_SAMESITE: 'none' }),
      (error: unknown) =>
        error instanceof ConfigError &&
        ['PORT', 'CORS_ORIGINS', 'DATABASE_URL', 'COOKIE_SAMESITE'].every((name) => error.message.includes(name)),
    );
  });
});

describe('scrypt password hasher', () => {
  const hasher = new ScryptPasswordHasher(10);

  it('verifies the right password only, with a unique salt per hash', async () => {
    const first = await hasher.hash('correct horse battery');
    const second = await hasher.hash('correct horse battery');
    assert.notEqual(first, second);
    assert.equal(await hasher.verify('correct horse battery', first), true);
    assert.equal(await hasher.verify('correct horse batterx', first), false);
  });

  it('treats malformed hashes as a mismatch instead of throwing', async () => {
    for (const hash of ['', 'plain', 'scrypt$99$abc$def', 'bcrypt$10$abc$def', 'scrypt$10$abc$def']) {
      assert.equal(await hasher.verify('anything', hash), false);
    }
  });
});

describe('UUIDv7 generator', () => {
  it('produces valid, unique, time-ordered identifiers', () => {
    let time = 1_700_000_000_000;
    const ids = new UuidV7Generator({ now: () => new Date(time++) });
    const generated = Array.from({ length: 50 }, () => ids.next());
    assert.ok(generated.every((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id)));
    assert.equal(new Set(generated).size, 50);
    assert.deepEqual([...generated].sort(), generated);
  });

  it('stays strictly increasing within one millisecond and when the clock steps back', () => {
    const times = [1_700_000_000_000, 1_700_000_000_000, 1_700_000_000_000, 1_699_999_999_000, 1_700_000_000_001];
    let call = 0;
    const ids = new UuidV7Generator({ now: () => new Date(times[Math.min(call++, times.length - 1)]!) });
    const generated = Array.from({ length: 200 }, () => ids.next());
    assert.deepEqual([...generated].sort(), generated);
    assert.equal(new Set(generated).size, 200);
  });
});
