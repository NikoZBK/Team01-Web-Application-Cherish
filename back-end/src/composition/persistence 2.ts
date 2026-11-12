import type { PersistenceConfig } from '../config/config.ts';
import type { RefreshTokenRepository } from '../modules/auth/application/ports.ts';
import { InMemoryRefreshTokenRepository } from '../modules/auth/infrastructure/in-memory-refresh-token-repository.ts';
import { PostgresRefreshTokenRepository } from '../modules/auth/infrastructure/postgres-refresh-token-repository.ts';
import type { DayRepository } from '../modules/days/application/day-repository.ts';
import { InMemoryDayRepository } from '../modules/days/infrastructure/in-memory-day-repository.ts';
import { PostgresDayRepository } from '../modules/days/infrastructure/postgres-day-repository.ts';
import type { UserRepository } from '../modules/users/application/user-repository.ts';
import { InMemoryUserRepository } from '../modules/users/infrastructure/in-memory-user-repository.ts';
import { PostgresUserRepository } from '../modules/users/infrastructure/postgres-user-repository.ts';
import { PostgresDatabase } from '../platform/persistence/postgres/postgres-database.ts';
import type { HealthProbe } from '../shared/application/ports.ts';

/** Everything the application needs from storage, independent of the engine behind it. */
export interface Persistence {
  readonly users: UserRepository;
  readonly refreshTokens: RefreshTokenRepository;
  readonly days: DayRepository;
  readonly probe: HealthProbe;
  close(): Promise<void>;
}

type PersistenceFactory<C extends PersistenceConfig> = (config: C) => Promise<Persistence>;

const createMemoryPersistence: PersistenceFactory<PersistenceConfig & { driver: 'memory' }> = async () => ({
  users: new InMemoryUserRepository(),
  refreshTokens: new InMemoryRefreshTokenRepository(),
  days: new InMemoryDayRepository(),
  probe: { ping: async () => undefined },
  close: async () => undefined,
});

const createPostgresPersistence: PersistenceFactory<PersistenceConfig & { driver: 'postgres' }> = async (
  config,
) => {
  const database = new PostgresDatabase(config.url, config.poolSize);
  try {
    await database.migrate();
  } catch (error) {
    await database.close();
    throw error;
  }
  return {
    users: new PostgresUserRepository(database),
    refreshTokens: new PostgresRefreshTokenRepository(database),
    days: new PostgresDayRepository(database),
    probe: database,
    close: () => database.close(),
  };
};

/** Add a storage engine by adding a driver to the config union and a factory here. */
export function createPersistence(config: PersistenceConfig): Promise<Persistence> {
  switch (config.driver) {
    case 'memory':
      return createMemoryPersistence(config);
    case 'postgres':
      return createPostgresPersistence(config);
  }
}
