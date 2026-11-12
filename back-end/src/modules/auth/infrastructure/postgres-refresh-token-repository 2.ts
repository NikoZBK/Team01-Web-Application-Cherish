import type { SqlClient } from '../../../platform/persistence/sql-client.ts';
import type { RefreshTokenRecord, RefreshTokenRepository } from '../application/ports.ts';

interface RefreshTokenRow {
  id: string;
  user_id: string;
  family_id: string;
  token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
  created_at: Date;
}

const COLUMNS = 'id, user_id, family_id, token_hash, expires_at, revoked_at, created_at';

export class PostgresRefreshTokenRepository implements RefreshTokenRepository {
  readonly #sql: SqlClient;

  constructor(sql: SqlClient) {
    this.#sql = sql;
  }

  async insert(record: RefreshTokenRecord): Promise<void> {
    await this.#sql.execute(
      `insert into refresh_tokens (${COLUMNS}) values ($1, $2, $3, $4, $5, $6, $7)`,
      [
        record.id,
        record.userId,
        record.familyId,
        record.tokenDigest,
        record.expiresAt,
        record.revokedAt,
        record.createdAt,
      ],
    );
  }

  async findByDigest(digest: string): Promise<RefreshTokenRecord | null> {
    const rows = await this.#sql.query<RefreshTokenRow>(
      `select ${COLUMNS} from refresh_tokens where token_hash = $1`,
      [digest],
    );
    const row = rows[0];
    if (row === undefined) return null;
    return {
      id: row.id,
      userId: row.user_id,
      familyId: row.family_id,
      tokenDigest: row.token_hash,
      expiresAt: row.expires_at,
      revokedAt: row.revoked_at,
      createdAt: row.created_at,
    };
  }

  async revoke(id: string, at: Date): Promise<boolean> {
    const affected = await this.#sql.execute(
      'update refresh_tokens set revoked_at = $2 where id = $1 and revoked_at is null',
      [id, at],
    );
    return affected === 1;
  }

  async revokeFamily(familyId: string, at: Date): Promise<void> {
    await this.#sql.execute(
      'update refresh_tokens set revoked_at = $2 where family_id = $1 and revoked_at is null',
      [familyId, at],
    );
  }

  async revokeAllForUser(userId: string, at: Date): Promise<void> {
    await this.#sql.execute(
      'update refresh_tokens set revoked_at = $2 where user_id = $1 and revoked_at is null',
      [userId, at],
    );
  }

  async deleteExpiredForUser(userId: string, now: Date): Promise<void> {
    await this.#sql.execute('delete from refresh_tokens where user_id = $1 and expires_at <= $2', [userId, now]);
  }
}
