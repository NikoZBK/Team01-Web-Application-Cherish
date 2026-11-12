import { randomUUID } from 'node:crypto';
import { jwtVerify, SignJWT } from 'jose';
import type { Clock } from '../../../shared/application/ports.ts';
import { unauthenticated } from '../../../shared/domain/errors.ts';
import { isRole, type Principal } from '../../../shared/domain/principal.ts';
import type { Authenticator } from '../../../shared/http/access-guard.ts';
import type { AccessTokenIssuer, IssuedAccessToken } from '../application/ports.ts';

export interface JwtOptions {
  readonly secret: string;
  readonly issuer: string;
  readonly audience: string;
  readonly ttlSeconds: number;
}

const ALGORITHM = 'HS256';

/** Signed, short-lived JWT access tokens. Pinned algorithm, issuer and audience. */
export class JwtAccessTokenService implements AccessTokenIssuer, Authenticator {
  readonly #key: Uint8Array;
  readonly #options: JwtOptions;
  readonly #clock: Clock;

  constructor(options: JwtOptions, clock: Clock) {
    this.#key = new TextEncoder().encode(options.secret);
    this.#options = options;
    this.#clock = clock;
  }

  async issue(principal: Principal): Promise<IssuedAccessToken> {
    const issuedAt = Math.floor(this.#clock.now().getTime() / 1000);
    const token = await new SignJWT({ role: principal.role })
      .setProtectedHeader({ alg: ALGORITHM })
      .setSubject(principal.userId)
      .setIssuer(this.#options.issuer)
      .setAudience(this.#options.audience)
      .setIssuedAt(issuedAt)
      .setExpirationTime(issuedAt + this.#options.ttlSeconds)
      .setJti(randomUUID())
      .sign(this.#key);
    return { token, expiresInSeconds: this.#options.ttlSeconds };
  }

  async authenticate(accessToken: string): Promise<Principal> {
    try {
      const { payload } = await jwtVerify(accessToken, this.#key, {
        algorithms: [ALGORITHM],
        issuer: this.#options.issuer,
        audience: this.#options.audience,
        requiredClaims: ['sub', 'exp'],
        currentDate: this.#clock.now(),
      });
      if (typeof payload.sub === 'string' && isRole(payload.role)) {
        return { userId: payload.sub, role: payload.role };
      }
    } catch {
      // Fall through: every failure looks the same to the caller.
    }
    throw unauthenticated('Access token is invalid or has expired');
  }
}
