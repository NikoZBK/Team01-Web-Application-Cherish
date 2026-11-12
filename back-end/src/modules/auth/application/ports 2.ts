import type { Principal } from '../../../shared/domain/principal.ts';

export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  verify(plain: string, hash: string): Promise<boolean>;
}

export interface IssuedAccessToken {
  readonly token: string;
  readonly expiresInSeconds: number;
}

export interface AccessTokenIssuer {
  issue(principal: Principal): Promise<IssuedAccessToken>;
}

/** Creates high-entropy opaque tokens; only their digest is ever persisted. */
export interface OpaqueTokenFactory {
  generate(): { token: string; digest: string };
  digestOf(token: string): string;
}

export interface RefreshTokenRecord {
  readonly id: string;
  readonly userId: string;
  /** All tokens descending from one sign-in share a family. */
  readonly familyId: string;
  readonly tokenDigest: string;
  readonly expiresAt: Date;
  readonly revokedAt: Date | null;
  readonly createdAt: Date;
}

export interface RefreshTokenRepository {
  insert(record: RefreshTokenRecord): Promise<void>;
  findByDigest(digest: string): Promise<RefreshTokenRecord | null>;
  /** Atomically revokes an active token; resolves false if it was already revoked. */
  revoke(id: string, at: Date): Promise<boolean>;
  revokeFamily(familyId: string, at: Date): Promise<void>;
  revokeAllForUser(userId: string, at: Date): Promise<void>;
  deleteExpiredForUser(userId: string, now: Date): Promise<void>;
}
