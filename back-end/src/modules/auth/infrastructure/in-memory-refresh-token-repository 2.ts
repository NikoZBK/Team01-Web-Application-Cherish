import type { RefreshTokenRecord, RefreshTokenRepository } from '../application/ports.ts';

export class InMemoryRefreshTokenRepository implements RefreshTokenRepository {
  readonly #byId = new Map<string, RefreshTokenRecord>();

  async insert(record: RefreshTokenRecord): Promise<void> {
    this.#byId.set(record.id, structuredClone(record));
  }

  async findByDigest(digest: string): Promise<RefreshTokenRecord | null> {
    for (const record of this.#byId.values()) {
      if (record.tokenDigest === digest) return structuredClone(record);
    }
    return null;
  }

  async revoke(id: string, at: Date): Promise<boolean> {
    const record = this.#byId.get(id);
    if (record === undefined || record.revokedAt !== null) return false;
    this.#byId.set(id, { ...record, revokedAt: at });
    return true;
  }

  async revokeFamily(familyId: string, at: Date): Promise<void> {
    this.#revokeWhere((record) => record.familyId === familyId, at);
  }

  async revokeAllForUser(userId: string, at: Date): Promise<void> {
    this.#revokeWhere((record) => record.userId === userId, at);
  }

  async deleteExpiredForUser(userId: string, now: Date): Promise<void> {
    for (const record of this.#byId.values()) {
      if (record.userId === userId && record.expiresAt <= now) this.#byId.delete(record.id);
    }
  }

  #revokeWhere(matches: (record: RefreshTokenRecord) => boolean, at: Date): void {
    for (const record of this.#byId.values()) {
      if (record.revokedAt === null && matches(record)) {
        this.#byId.set(record.id, { ...record, revokedAt: at });
      }
    }
  }
}
