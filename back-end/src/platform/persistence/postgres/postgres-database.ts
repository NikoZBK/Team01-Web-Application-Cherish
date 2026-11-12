import { readdir, readFile } from 'node:fs/promises';
import pg from 'pg';
import type { HealthProbe } from '../../../shared/application/ports.ts';
import type { SqlClient } from '../sql-client.ts';

const MIGRATIONS_DIR = new URL('./migrations/', import.meta.url);
const MIGRATION_LOCK_KEY = 4_815_162_342;
const UNIQUE_VIOLATION = '23505';

export function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: unknown }).code === UNIQUE_VIOLATION;
}

function reportIdleError(error: Error): void {
  console.error(`[postgres] idle connection lost: ${error.message}`);
}

export class PostgresDatabase implements SqlClient, HealthProbe {
  readonly #pool: pg.Pool;

  constructor(url: string, poolSize: number, onIdleError: (error: Error) => void = reportIdleError) {
    this.#pool = new pg.Pool({
      connectionString: url,
      max: poolSize,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      statement_timeout: 10_000,
    });
    // Without a listener, a dropped idle connection (database restart, network
    // blip) is an unhandled 'error' event and takes the whole process down.
    // The pool discards the broken client and reconnects on the next query.
    this.#pool.on('error', onIdleError);
  }

  async query<Row>(text: string, params: readonly unknown[] = []): Promise<Row[]> {
    const result = await this.#pool.query(text, [...params]);
    return result.rows as Row[];
  }

  async execute(text: string, params: readonly unknown[] = []): Promise<number> {
    const result = await this.#pool.query(text, [...params]);
    return result.rowCount ?? 0;
  }

  async ping(): Promise<void> {
    await this.#pool.query('select 1');
  }

  /** Applies pending SQL migrations in filename order, one transaction each. */
  async migrate(): Promise<void> {
    const files = (await readdir(MIGRATIONS_DIR)).filter((name) => name.endsWith('.sql')).sort();
    const client = await this.#pool.connect();
    try {
      // Serialise concurrent instances starting at the same time.
      await client.query('select pg_advisory_lock($1)', [MIGRATION_LOCK_KEY]);
      await client.query(
        'create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())',
      );
      const applied = new Set(
        (await client.query<{ name: string }>('select name from schema_migrations')).rows.map((row) => row.name),
      );
      for (const file of files) {
        if (applied.has(file)) continue;
        const sql = await readFile(new URL(file, MIGRATIONS_DIR), 'utf8');
        try {
          await client.query('begin');
          await client.query(sql);
          await client.query('insert into schema_migrations (name) values ($1)', [file]);
          await client.query('commit');
        } catch (error) {
          await client.query('rollback');
          throw error;
        }
      }
    } finally {
      await client.query('select pg_advisory_unlock($1)', [MIGRATION_LOCK_KEY]).catch(() => undefined);
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.#pool.end();
  }
}
