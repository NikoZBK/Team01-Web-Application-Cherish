import type { Clock } from '../../../shared/application/ports.ts';
import { forbidden, notFound } from '../../../shared/domain/errors.ts';
import type { Page, PageRequest } from '../../../shared/domain/pagination.ts';
import type { Principal, Role } from '../../../shared/domain/principal.ts';
import type { User } from '../domain/user.ts';
import type { UserRepository } from './user-repository.ts';

export class UserService {
  readonly #users: UserRepository;
  readonly #clock: Clock;

  constructor(users: UserRepository, clock: Clock) {
    this.#users = users;
    this.#clock = clock;
  }

  async getById(id: string): Promise<User> {
    const user = await this.#users.findById(id);
    if (user === null) throw notFound('User');
    return user;
  }

  async updateProfile(id: string, changes: { displayName?: string }): Promise<User> {
    const user = await this.getById(id);
    return this.#save({ ...user, displayName: changes.displayName?.trim() ?? user.displayName });
  }

  list(page: PageRequest): Promise<Page<User>> {
    return this.#users.list(page);
  }

  async changeRole(actor: Principal, targetId: string, role: Role): Promise<User> {
    // Guarantees an admin can never remove the last admin: themselves.
    if (actor.userId === targetId) throw forbidden('Administrators cannot change their own role');
    const user = await this.getById(targetId);
    return this.#save({ ...user, role });
  }

  async #save(user: User): Promise<User> {
    const updated = { ...user, updatedAt: this.#clock.now() };
    await this.#users.update(updated);
    return updated;
  }
}
