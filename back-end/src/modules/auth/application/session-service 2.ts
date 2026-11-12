import type { Clock, IdGenerator } from '../../../shared/application/ports.ts';
import { unauthenticated } from '../../../shared/domain/errors.ts';
import type { UserRepository } from '../../users/application/user-repository.ts';
import type { User } from '../../users/domain/user.ts';
import type { AccessTokenIssuer, OpaqueTokenFactory, RefreshTokenRepository } from './ports.ts';

export interface Session {
  readonly accessToken: string;
  readonly accessTokenExpiresIn: number;
  readonly refreshToken: string;
  readonly refreshTokenExpiresIn: number;
}

export interface SessionDependencies {
  readonly users: UserRepository;
  readonly refreshTokens: RefreshTokenRepository;
  readonly accessTokens: AccessTokenIssuer;
  readonly opaqueTokens: OpaqueTokenFactory;
  readonly clock: Clock;
  readonly ids: IdGenerator;
  readonly refreshTtlSeconds: number;
}

const INVALID_SESSION = 'Session is invalid or has expired';

/**
 * Owns the session lifecycle: short-lived access tokens paired with
 * single-use refresh tokens that rotate on every refresh. Presenting an
 * already-used refresh token is treated as theft and ends the whole family.
 */
export class SessionService {
  readonly #deps: SessionDependencies;

  constructor(deps: SessionDependencies) {
    this.#deps = deps;
  }

  async start(user: User): Promise<Session> {
    await this.#deps.refreshTokens.deleteExpiredForUser(user.id, this.#deps.clock.now());
    return this.#issue(user, this.#deps.ids.next());
  }

  async rotate(refreshToken: string): Promise<{ user: User; session: Session }> {
    const { refreshTokens, users, clock, opaqueTokens } = this.#deps;
    const now = clock.now();
    const record = await refreshTokens.findByDigest(opaqueTokens.digestOf(refreshToken));
    if (record === null) throw unauthenticated(INVALID_SESSION);

    const wasActive = await refreshTokens.revoke(record.id, now);
    if (!wasActive) {
      await refreshTokens.revokeFamily(record.familyId, now);
      throw unauthenticated(INVALID_SESSION);
    }
    if (record.expiresAt <= now) throw unauthenticated(INVALID_SESSION);

    const user = await users.findById(record.userId);
    if (user === null) throw unauthenticated(INVALID_SESSION);
    return { user, session: await this.#issue(user, record.familyId) };
  }

  /** Ends the session the token belongs to. Unknown tokens are ignored. */
  async end(refreshToken: string): Promise<void> {
    const { refreshTokens, opaqueTokens, clock } = this.#deps;
    const record = await refreshTokens.findByDigest(opaqueTokens.digestOf(refreshToken));
    if (record !== null) await refreshTokens.revokeFamily(record.familyId, clock.now());
  }

  endAllForUser(userId: string): Promise<void> {
    return this.#deps.refreshTokens.revokeAllForUser(userId, this.#deps.clock.now());
  }

  async #issue(user: User, familyId: string): Promise<Session> {
    const { accessTokens, opaqueTokens, refreshTokens, clock, ids, refreshTtlSeconds } = this.#deps;
    const now = clock.now();
    const refresh = opaqueTokens.generate();
    await refreshTokens.insert({
      id: ids.next(),
      userId: user.id,
      familyId,
      tokenDigest: refresh.digest,
      expiresAt: new Date(now.getTime() + refreshTtlSeconds * 1000),
      revokedAt: null,
      createdAt: now,
    });
    const accessToken = await accessTokens.issue({ userId: user.id, role: user.role });
    return {
      accessToken: accessToken.token,
      accessTokenExpiresIn: accessToken.expiresInSeconds,
      refreshToken: refresh.token,
      refreshTokenExpiresIn: refreshTtlSeconds,
    };
  }
}
