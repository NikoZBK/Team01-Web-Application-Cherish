import { Type, type Static } from '@sinclair/typebox';
import { ROLES } from '../../../shared/domain/principal.ts';
import type { User } from '../domain/user.ts';

export const RoleSchema = Type.Union(ROLES.map((role) => Type.Literal(role)));

export const DisplayNameSchema = Type.String({ minLength: 1, maxLength: 100, pattern: '\\S' });

export const UserDto = Type.Object({
  id: Type.String({ format: 'uuid' }),
  email: Type.String({ format: 'email' }),
  displayName: Type.String(),
  role: RoleSchema,
  createdAt: Type.String({ format: 'date-time' }),
});

/** The only shape in which a user ever leaves the API: no credential material. */
export function toUserDto(user: User): Static<typeof UserDto> {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}
