import type { AppConfig } from '../config/config.ts';
import { AuthService } from '../modules/auth/application/auth-service.ts';
import { SessionService } from '../modules/auth/application/session-service.ts';
import { createAuthModule } from '../modules/auth/http/auth-module.ts';
import { JwtAccessTokenService } from '../modules/auth/infrastructure/jwt-access-token-service.ts';
import { ScryptPasswordHasher } from '../modules/auth/infrastructure/scrypt-password-hasher.ts';
import { Sha256OpaqueTokenFactory } from '../modules/auth/infrastructure/sha256-opaque-token-factory.ts';
import { DayService } from '../modules/days/application/day-service.ts';
import { createDaysModule } from '../modules/days/http/days-module.ts';
import { createHealthModule } from '../modules/health/health-module.ts';
import { UserService } from '../modules/users/application/user-service.ts';
import { createUsersModule } from '../modules/users/http/users-module.ts';
import { createFastifyServer } from '../platform/http/fastify-server.ts';
import { SystemClock, UuidV7Generator } from '../shared/infrastructure/system.ts';
import type { AppModule } from '../shared/http/module.ts';
import { createPersistence } from './persistence.ts';

export interface Application {
  /** Starts serving and resolves with the base URL. */
  start(): Promise<string>;
  /** Drains in-flight requests, then releases storage connections. */
  stop(): Promise<void>;
}

/**
 * Composition root: the one place where concrete adapters are chosen and
 * wired to the modules. To plug in a feature, build its service here and add
 * its module to the list.
 */
export async function createApplication(config: AppConfig): Promise<Application> {
  const persistence = await createPersistence(config.persistence);
  try {
    const clock = new SystemClock();
    const ids = new UuidV7Generator(clock);

    const accessTokens = new JwtAccessTokenService(
      {
        secret: config.auth.jwtSecret,
        issuer: config.auth.issuer,
        audience: config.auth.audience,
        ttlSeconds: config.auth.accessTtlSeconds,
      },
      clock,
    );
    const sessions = new SessionService({
      users: persistence.users,
      refreshTokens: persistence.refreshTokens,
      accessTokens,
      opaqueTokens: new Sha256OpaqueTokenFactory(),
      clock,
      ids,
      refreshTtlSeconds: config.auth.refreshTtlSeconds,
    });
    const auth = new AuthService({
      users: persistence.users,
      hasher: new ScryptPasswordHasher(config.auth.scryptCost),
      sessions,
      clock,
      ids,
    });

    if (config.auth.bootstrapAdmin !== null) {
      await auth.ensureAdmin(config.auth.bootstrapAdmin.email, config.auth.bootstrapAdmin.password);
    }

    const modules: AppModule[] = [
      createHealthModule(persistence.probe),
      createAuthModule(auth, { cookiePath: `${config.http.basePath}/auth` }),
      createUsersModule(new UserService(persistence.users, clock)),
      createDaysModule(new DayService(persistence.days, clock, ids)),
    ];

    const server = await createFastifyServer({ config: config.http, modules, authenticator: accessTokens });

    return {
      start: () => server.listen(),
      stop: async () => {
        await server.close();
        await persistence.close();
      },
    };
  } catch (error) {
    await persistence.close();
    throw error;
  }
}
