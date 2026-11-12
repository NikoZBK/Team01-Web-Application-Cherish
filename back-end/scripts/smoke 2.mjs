// Boots the server exactly as production does (`npm start` command line,
// NODE_ENV=production), waits for readiness, then checks graceful shutdown.
// The test suite builds the app in-process, so this is the only check of
// src/main.ts, production configuration and signal handling.
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { createServer } from 'node:net';

const TIMEOUT_MS = 30_000;

const port = await freePort();
const server = spawn(process.execPath, ['--experimental-strip-types', 'src/main.ts'], {
  env: {
    ...process.env,
    NODE_ENV: 'production',
    HOST: '127.0.0.1',
    PORT: String(port),
    JWT_SECRET: randomBytes(48).toString('base64url'),
    LOG_LEVEL: 'warn',
  },
  stdio: 'inherit',
});
const exited = new Promise((resolve) => server.on('exit', (code, signal) => resolve({ code, signal })));
const timer = setTimeout(() => fail(`timed out after ${TIMEOUT_MS} ms`), TIMEOUT_MS);

try {
  await waitUntilReady(`http://127.0.0.1:${port}/api/v1/health/ready`);

  const spec = await fetch(`http://127.0.0.1:${port}/api/v1/openapi.json`);
  if (spec.status !== 404) fail(`OpenAPI must be hidden in production, got ${spec.status}`);
  const guarded = await fetch(`http://127.0.0.1:${port}/api/v1/users/me`);
  if (guarded.status !== 401) fail(`protected route answered ${guarded.status} without a token`);

  server.kill('SIGTERM');
  const { code, signal } = await exited;
  if (code !== 0) fail(`expected a clean exit on SIGTERM, got code=${code} signal=${signal}`);
  clearTimeout(timer);
  console.log('smoke test passed');
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

async function waitUntilReady(url) {
  for (;;) {
    if (server.exitCode !== null) throw new Error(`server exited early with code ${server.exitCode}`);
    try {
      const response = await fetch(url);
      if (response.status === 200) return;
    } catch {
      // Not listening yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

function freePort() {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const { port: chosen } = probe.address();
      probe.close(() => resolve(chosen));
    });
  });
}

function fail(message) {
  console.error(`smoke test failed: ${message}`);
  server.kill('SIGKILL');
  process.exit(1);
}
