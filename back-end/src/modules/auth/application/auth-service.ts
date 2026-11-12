import { randomBytes } from 'node:crypto';
import type { Clock, IdGenerator } from '../../../shared/application/ports.ts';
import { unauthenticated, validationFailed } from '../../../shared/domain/errors.ts';
import type { Role } from '../../../shared/domain/principal.ts';
import type { UserRepository } from '../../users/application/user-repository.ts';
import { normalizeEmail, type User } from '../../users/domain/user.ts';
import type { PasswordHasher } from './ports.ts';
import type { Session, SessionService } from './session-service.ts';

export const PASSWORD_MIN_LENGTH = 12;
/** Upper bound keeps hashing cost predictable (no multi-megabyte passwords). */
export const PASSWORD_MAX_LENGTH = 128;

export interface AuthResult {
  readonly user: User;
  readonly session: Session;
}

export interface Registration {
  readonly email: string;
  readonly password: string;
  readonly displayName: string;
}

export interface AuthDependencies {
  readonly users: UserRepository;
  readonly hasher: PasswordHasher;
  readonly sessions: SessionService;
  readonly clock: Clock;
  readonly ids: IdGenerator;
}

export class AuthService {
  readonly #deps: AuthDependencies;
  #decoyHash: Promise<string> | null = null;

  constructor(deps: AuthDependencies) {
    this.#deps = deps;
  }

  /** Self-service sign-up always creates a regular user. */
  async register(registration: Registration): Promise<AuthResult> {
    const user = await this.#createUser(registration, 'user');
    return { user, session: await this.#deps.sessions.start(user) };
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await this.#deps.users.findByEmail(normalizeEmail(email));
    // Verify against a decoy when the account is unknown so that response
    // time does not reveal which emails are registered.
    const hash = user?.passwordHash ?? (await this.#decoy());
    const matches = await this.#deps.hasher.verify(password, hash);
    if (user === null || !matches) throw unauthenticated('Invalid email or password');
    return { user, session: await this.#deps.sessions.start(user) };
  }

  refresh(refreshToken: string): Promise<AuthResult> {
    return this.#deps.sessions.rotate(refreshToken);
  }

  logout(refreshToken: string): Promise<void> {
    return this.#deps.sessions.end(refreshToken);
  }

  /** Changing the password signs the user out everywhere and starts a fresh session. */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<AuthResult> {
    const { users, hasher, sessions, clock } = this.#deps;
    const user = await users.findById(userId);
    if (user === null || !(await hasher.verify(currentPassword, user.passwordHash))) {
      throw unauthenticated('Current password is incorrect');
    }
    const updated: User = { ...user, passwordHash: await hasher.hash(newPassword), updatedAt: clock.now() };
    await users.update(updated);
    await sessions.endAllForUser(user.id);
    return { user: updated, session: await sessions.start(updated) };
  }

  /** Creates the first administrator from configuration; a no-op once the account exists. */
  async ensureAdmin(email: string, password: string): Promise<void> {
    if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
      throw validationFailed(
        `Administrator password must be ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} characters`,
      );
    }
    if ((await this.#deps.users.findByEmail(normalizeEmail(email))) !== null) return;
    await this.#createUser({ email, password, displayName: 'Administrator' }, 'admin');
  }

  async #createUser(registration: Registration, role: Role): Promise<User> {
    const { users, hasher, clock, ids } = this.#deps;
    const now = clock.now();
    const user: User = {
      id: ids.next(),
      email: normalizeEmail(registration.email),
      displayName: registration.displayName.trim(),
      passwordHash: await hasher.hash(registration.password),
      role,
      createdAt: now,
      updatedAt: now,
    };
    await users.insert(user);
    return user;
  }

  #decoy(): Promise<string> {
    this.#decoyHash ??= this.#deps.hasher.hash(randomBytes(24).toString('base64url'));
    return this.#decoyHash;
  }
}
