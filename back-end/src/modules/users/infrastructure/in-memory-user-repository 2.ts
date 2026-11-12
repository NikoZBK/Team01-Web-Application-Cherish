import { conflict } from '../../../shared/domain/errors.ts';
import type { Page, PageRequest } from '../../../shared/domain/pagination.ts';
import type { UserRepository } from '../application/user-repository.ts';
import type { User } from '../domain/user.ts';

export class InMemoryUserRepository implements UserRepository {
  readonly #byId = new Map<string, User>();

  async findById(id: string): Promise<User | null> {
    return copy(this.#byId.get(id));
  }

  async findByEmail(email: string): Promise<User | null> {
    return copy(this.#withEmail(email));
  }

  async insert(user: User): Promise<void> {
    // Check and write in the same tick so concurrent sign-ups cannot both pass.
    if (this.#withEmail(user.email) !== undefined) throw conflict('Email is already registered');
    this.#byId.set(user.id, structuredClone(user));
  }

  async update(user: User): Promise<void> {
    if (this.#byId.has(user.id)) this.#byId.set(user.id, structuredClone(user));
  }

  async list(page: PageRequest): Promise<Page<User>> {
    const all = [...this.#byId.values()].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime() || compareIds(a.id, b.id),
    );
    const items = all.slice(page.offset, page.offset + page.limit).map((user) => structuredClone(user));
    return { items, total: all.length, ...page };
  }

  #withEmail(email: string): User | undefined {
    for (const user of this.#byId.values()) {
      if (user.email === email) return user;
    }
    return undefined;
  }
}

/** Same ordering PostgreSQL applies to uuid columns. */
function compareIds(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function copy(user: User | undefined): User | null {
  return user === undefined ? null : structuredClone(user);
}
