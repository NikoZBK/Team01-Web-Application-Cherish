import { randomUUID } from 'node:crypto';
import { createApplication } from '../../src/composition/application.ts';
import { loadConfig } from '../../src/config/config.ts';

export const ALLOWED_ORIGIN = 'http://localhost:5173';
export const PASSWORD = 'correct horse battery';
const API = '/api/v1';

export interface RequestOptions {
  readonly token?: string;
  readonly body?: unknown;
  readonly cookie?: string;
  readonly headers?: Record<string, string>;
}

export interface TestResponse {
  readonly status: number;
  // Test code inspects arbitrary JSON payloads.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly body: any;
  readonly headers: Headers;
  /** `name=value` of the refresh cookie set by this response, if any. */
  readonly refreshCookie: string | undefined;
  readonly setCookie: string | undefined;
}

export interface TestSession {
  readonly token: string;
  readonly cookie: string;
  readonly userId: string;
  readonly email: string;
}

export interface TestApp {
  request(method: string, path: string, options?: RequestOptions): Promise<TestResponse>;
  register(): Promise<TestSession>;
  login(email: string, password: string): Promise<TestResponse>;
  stop(): Promise<void>;
}

export const uniqueEmail = () => `user-${randomUUID()}@example.com`;

/**
 * Boots the real application on an ephemeral port and talks to it over HTTP.
 * Set TEST_DATABASE_URL to run the same suite against PostgreSQL.
 */
export async function startTestApp(overrides: Record<string, string> = {}): Promise<TestApp> {
  const databaseUrl = process.env.TEST_DATABASE_URL;
  const config = loadConfig({
    NODE_ENV: 'test',
    PORT: '0',
    SCRYPT_COST: '10',
    RATE_LIMIT_MAX: '100000',
    RATE_LIMIT_AUTH_MAX: '100000',
    CORS_ORIGINS: ALLOWED_ORIGIN,
    ...(databaseUrl ? { PERSISTENCE_DRIVER: 'postgres', DATABASE_URL: databaseUrl } : {}),
    ...overrides,
  });
  const application = await createApplication(config);
  const baseUrl = await application.start();

  const request: TestApp['request'] = async (method, path, options = {}) => {
    const response = await fetch(`${baseUrl}${API}${path}`, {
      method,
      headers: {
        ...(options.body === undefined ? {} : { 'content-type': 'application/json' }),
        ...(options.token === undefined ? {} : { authorization: `Bearer ${options.token}` }),
        ...(options.cookie === undefined ? {} : { cookie: options.cookie }),
        ...options.headers,
      },
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    });
    const text = await response.text();
    const setCookie = response.headers.getSetCookie().find((value) => value.startsWith('refresh_token='));
    return {
      status: response.status,
      body: text === '' ? undefined : JSON.parse(text),
      headers: response.headers,
      setCookie,
      refreshCookie: setCookie?.split(';')[0],
    };
  };

  return {
    request,
    stop: () => application.stop(),
    login: (email, password) => request('POST', '/auth/login', { body: { email, password } }),
    register: async () => {
      const email = uniqueEmail();
      const response = await request('POST', '/auth/register', {
        body: { email, password: PASSWORD, displayName: 'Test User' },
      });
      if (response.status !== 201 || response.refreshCookie === undefined) {
        throw new Error(`registration failed: ${response.status} ${JSON.stringify(response.body)}`);
      }
      return {
        token: response.body.accessToken,
        cookie: response.refreshCookie,
        userId: response.body.user.id,
        email,
      };
    },
  };
}
