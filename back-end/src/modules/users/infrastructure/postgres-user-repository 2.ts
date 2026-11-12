import { isUniqueViolation } from '../../../platform/persistence/postgres/postgres-database.ts';
import type { SqlClient } from '../../../platform/persistence/sql-client.ts';
import { conflict } from '../../../shared/domain/errors.ts';
import type { Page, PageRequest } from '../../../shared/domain/pagination.ts';
import type { Role } from '../../../shared/domain/principal.ts';
import type { UserRepository } from '../application/user-repository.ts';
import type { User } from '../domain/user.ts';

interface UserRow {
  id: string;
  email: string;
  display_name: string;
  password_hash: string;
  role: Role;
  created_at: Date;
  updated_at: Date;
}

const COLUMNS = 'id, email, display_name, password_hash, role, created_at, updated_at';

export class PostgresUserRepository implements UserRepository {
  readonly #sql: SqlClient;

  constructor(sql: SqlClient) {
    this.#sql = sql;
  }

  async findById(id: string): Promise<User | null> {
    const rows = await this.#sql.query<UserRow>(`select ${COLUMNS} from users where id = $1`, [id]);
    return rows[0] ? toUser(rows[0]) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const rows = await this.#sql.query<UserRow>(`select ${COLUMNS} from users where email = $1`, [email]);
    return rows[0] ? toUser(rows[0]) : null;
  }

  async insert(user: User): Promise<void> {
    try {
      await this.#sql.execute(
        `insert into users (${COLUMNS}) values ($1, $2, $3, $4, $5, $6, $7)`,
        [user.id, user.email, user.displayName, user.passwordHash, user.role, user.createdAt, user.updatedAt],
      );
    } catch (error) {
      if (isUniqueViolation(error)) throw conflict('Email is already registered');
      throw error;
    }
  }

  async update(user: User): Promise<void> {
    await this.#sql.execute(
      'update users set display_name = $2, password_hash = $3, role = $4, updated_at = $5 where id = $1',
      [user.id, user.displayName, user.passwordHash, user.role, user.updatedAt],
    );
  }

  async list(page: PageRequest): Promise<Page<User>> {
    const [rows, counts] = await Promise.all([
      this.#sql.query<UserRow>(
        `select ${COLUMNS} from users order by created_at, id limit $1 offset $2`,
        [page.limit, page.offset],
      ),
      this.#sql.query<{ total: number }>('select count(*)::int as total from users'),
    ]);
    return { items: rows.map(toUser), total: counts[0]?.total ?? 0, ...page };
  }
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    passwordHash: row.password_hash,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
