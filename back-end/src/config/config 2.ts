import { randomBytes } from 'node:crypto';

export type Environment = 'development' | 'test' | 'production';
export type SameSite = 'strict' | 'lax' | 'none';

export interface HttpConfig {
  readonly host: string;
  readonly port: number;
  readonly basePath: string;
  /** Browser origins allowed to call the API (CORS and CSRF origin check). */
  readonly corsOrigins: readonly string[];
  readonly trustProxy: boolean;
  readonly bodyLimitBytes: number;
  readonly logLevel: string;
  readonly exposeOpenApi: boolean;
  readonly rateLimit: {
    readonly windowMs: number;
    readonly standardMax: number;
    readonly strictMax: number;
  };
  readonly cookie: { readonly secure: boolean; readonly sameSite: SameSite };
}

export interface AuthConfig {
  readonly jwtSecret: string;
  readonly issuer: string;
  readonly audience: string;
  readonly accessTtlSeconds: number;
  readonly refreshTtlSeconds: number;
  /** scrypt work factor: N = 2^cost. */
  readonly scryptCost: number;
  readonly bootstrapAdmin: { readonly email: string; readonly password: string } | null;
}

export type PersistenceConfig =
  | { readonly driver: 'memory' }
  | { readonly driver: 'postgres'; readonly url: string; readonly poolSize: number };

export interface AppConfig {
  readonly env: Environment;
  readonly http: HttpConfig;
  readonly auth: AuthConfig;
  readonly persistence: PersistenceConfig;
  /** Non-fatal configuration notes to log at startup. */
  readonly warnings: readonly string[];
}

export class ConfigError extends Error {
  constructor(problems: readonly string[]) {
    super(`Invalid configuration:\n${problems.map((p) => `  - ${p}`).join('\n')}`);
    this.name = 'ConfigError';
  }
}

type Env = Readonly<Record<string, string | undefined>>;

const MIN_SECRET_LENGTH = 32;

/** Reads typed values from the environment, collecting every problem before failing. */
class EnvReader {
  readonly problems: string[] = [];
  readonly #env: Env;

  constructor(env: Env) {
    this.#env = env;
  }

  optional(name: string): string | undefined {
    const value = this.#env[name]?.trim();
    return value === undefined || value === '' ? undefined : value;
  }

  string(name: string, fallback: string): string {
    return this.optional(name) ?? fallback;
  }

  integer(name: string, fallback: number, min: number, max: number): number {
    const raw = this.optional(name);
    if (raw === undefined) return fallback;
    const value = Number(raw);
    if (!Number.isInteger(value) || value < min || value > max) {
      this.problems.push(`${name} must be an integer between ${min} and ${max}`);
      return fallback;
    }
    return value;
  }

  boolean(name: string, fallback: boolean): boolean {
    const raw = this.optional(name);
    if (raw === undefined) return fallback;
    if (raw === 'true' || raw === 'false') return raw === 'true';
    this.problems.push(`${name} must be "true" or "false"`);
    return fallback;
  }

  oneOf<T extends string>(name: string, allowed: readonly T[], fallback: T): T {
    const raw = this.optional(name);
    if (raw === undefined) return fallback;
    if ((allowed as readonly string[]).includes(raw)) return raw as T;
    this.problems.push(`${name} must be one of: ${allowed.join(', ')}`);
    return fallback;
  }

  list(name: string, fallback: readonly string[]): readonly string[] {
    const raw = this.optional(name);
    if (raw === undefined) return fallback;
    return raw.split(',').map((item) => item.trim()).filter((item) => item !== '');
  }
}

export function loadConfig(env: Env): AppConfig {
  const read = new EnvReader(env);
  const warnings: string[] = [];
  const environment = read.oneOf('NODE_ENV', ['development', 'test', 'production'], 'development');
  const production = environment === 'production';

  const corsOrigins = read.list('CORS_ORIGINS', production ? [] : ['http://localhost:5173']);
  for (const origin of corsOrigins) {
    if (!isOrigin(origin)) {
      read.problems.push(`CORS_ORIGINS entry "${origin}" must be an exact origin like https://app.example.com`);
    }
  }
  if (production && corsOrigins.length === 0) {
    warnings.push('CORS_ORIGINS is empty: no browser front end can call this API');
  }

  const sameSite = read.oneOf('COOKIE_SAMESITE', ['strict', 'lax', 'none'], 'strict');
  const cookieSecure = read.boolean('COOKIE_SECURE', production);
  if (production && !cookieSecure) read.problems.push('COOKIE_SECURE must be true in production');
  if (sameSite === 'none' && !cookieSecure) {
    read.problems.push('COOKIE_SAMESITE=none requires COOKIE_SECURE=true');
  }

  let jwtSecret = read.optional('JWT_SECRET');
  if (jwtSecret !== undefined && jwtSecret.length < MIN_SECRET_LENGTH) {
    read.problems.push(`JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters`);
  }
  if (jwtSecret === undefined) {
    if (production) read.problems.push('JWT_SECRET is required in production');
    else warnings.push('JWT_SECRET not set: using a random secret, sessions end when the server restarts');
    jwtSecret = randomBytes(48).toString('base64url');
  }

  const driver = read.oneOf('PERSISTENCE_DRIVER', ['memory', 'postgres'], 'memory');
  const databaseUrl = read.optional('DATABASE_URL');
  if (driver === 'postgres' && databaseUrl === undefined) {
    read.problems.push('DATABASE_URL is required when PERSISTENCE_DRIVER=postgres');
  }
  if (driver === 'memory' && production) {
    warnings.push('PERSISTENCE_DRIVER=memory in production: all data is lost on restart');
  }

  const adminEmail = read.optional('BOOTSTRAP_ADMIN_EMAIL');
  const adminPassword = read.optional('BOOTSTRAP_ADMIN_PASSWORD');
  if ((adminEmail === undefined) !== (adminPassword === undefined)) {
    read.problems.push('BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD must be set together');
  }

  const config: AppConfig = {
    env: environment,
    warnings,
    http: {
      host: read.string('HOST', '127.0.0.1'),
      port: read.integer('PORT', 3000, 0, 65_535),
      basePath: '/api/v1',
      corsOrigins,
      trustProxy: read.boolean('TRUST_PROXY', false),
      bodyLimitBytes: read.integer('BODY_LIMIT_BYTES', 100_000, 1_000, 10_000_000),
      logLevel: read.string('LOG_LEVEL', environment === 'test' ? 'silent' : 'info'),
      exposeOpenApi: read.boolean('EXPOSE_OPENAPI', !production),
      rateLimit: {
        windowMs: read.integer('RATE_LIMIT_WINDOW_MS', 60_000, 1_000, 3_600_000),
        standardMax: read.integer('RATE_LIMIT_MAX', 120, 1, 1_000_000),
        strictMax: read.integer('RATE_LIMIT_AUTH_MAX', 10, 1, 1_000_000),
      },
      cookie: { secure: cookieSecure, sameSite },
    },
    auth: {
      jwtSecret,
      issuer: read.string('JWT_ISSUER', 'plugnplay-backend'),
      audience: read.string('JWT_AUDIENCE', 'plugnplay-clients'),
      accessTtlSeconds: read.integer('ACCESS_TOKEN_TTL_SECONDS', 900, 30, 86_400),
      refreshTtlSeconds: read.integer('REFRESH_TOKEN_TTL_SECONDS', 2_592_000, 60, 31_536_000),
      scryptCost: read.integer('SCRYPT_COST', 17, 10, 20),
      bootstrapAdmin:
        adminEmail !== undefined && adminPassword !== undefined
          ? { email: adminEmail, password: adminPassword }
          : null,
    },
    persistence:
      driver === 'postgres'
        ? { driver, url: databaseUrl ?? '', poolSize: read.integer('DATABASE_POOL_SIZE', 10, 1, 200) }
        : { driver },
  };

  if (read.problems.length > 0) throw new ConfigError(read.problems);
  return config;
}

function isOrigin(value: string): boolean {
  try {
    return new URL(value).origin === value;
  } catch {
    return false;
  }
}
