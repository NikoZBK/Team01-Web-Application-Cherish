import type { Page, PageRequest } from '../../../shared/domain/pagination.ts';
import type { User } from '../domain/user.ts';

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  /** Rejects with a `conflict` error when the email is already registered. */
  insert(user: User): Promise<void>;
  update(user: User): Promise<void>;
  list(page: PageRequest): Promise<Page<User>>;
}
