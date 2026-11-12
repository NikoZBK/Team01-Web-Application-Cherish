import type { Role } from '../../../shared/domain/principal.ts';

export interface User {
  readonly id: string;
  /** Always stored normalised; see `normalizeEmail`. */
  readonly email: string;
  readonly displayName: string;
  readonly passwordHash: string;
  readonly role: Role;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
