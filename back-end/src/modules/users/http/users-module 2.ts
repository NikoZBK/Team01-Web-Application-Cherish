import { Type } from '@sinclair/typebox';
import { mapPage } from '../../../shared/domain/pagination.ts';
import type { AppModule } from '../../../shared/http/module.ts';
import { access, defineRoute, ok } from '../../../shared/http/route.ts';
import { IdParams, PageQuery, pageOf, strict } from '../../../shared/http/schemas.ts';
import type { UserService } from '../application/user-service.ts';
import { DisplayNameSchema, RoleSchema, toUserDto, UserDto } from './user-dto.ts';

export function createUsersModule(users: UserService): AppModule {
  return {
    name: 'users',
    routes: [
      defineRoute({
        method: 'GET',
        path: '/users/me',
        summary: 'Get the signed-in user',
        access: access.authenticated,
        responses: { 200: UserDto },
        handler: async ({ principal }) => ok(toUserDto(await users.getById(principal.userId))),
      }),
      defineRoute({
        method: 'PATCH',
        path: '/users/me',
        summary: 'Update the signed-in user',
        access: access.authenticated,
        request: {
          body: Type.Object({ displayName: Type.Optional(DisplayNameSchema) }, strict),
        },
        responses: { 200: UserDto },
        handler: async ({ principal, body }) =>
          ok(toUserDto(await users.updateProfile(principal.userId, body))),
      }),
      defineRoute({
        method: 'GET',
        path: '/users',
        summary: 'List all users (admin)',
        access: access.roles('admin'),
        request: { query: PageQuery },
        responses: { 200: pageOf(UserDto) },
        handler: async ({ query }) => ok(mapPage(await users.list(query), toUserDto)),
      }),
      defineRoute({
        method: 'PUT',
        path: '/users/:id/role',
        summary: "Change a user's role (admin)",
        access: access.roles('admin'),
        request: { params: IdParams, body: Type.Object({ role: RoleSchema }, strict) },
        responses: { 200: UserDto },
        handler: async ({ principal, params, body }) =>
          ok(toUserDto(await users.changeRole(principal, params.id, body.role))),
      }),
    ],
  };
}
