export const ROLES = ['user', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

/** The authenticated caller, as established by the HTTP layer. */
export interface Principal {
  readonly userId: string;
  readonly role: Role;
}
