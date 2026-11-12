import { Type } from '@sinclair/typebox';
import { unauthenticated } from '../../../shared/domain/errors.ts';
import type { AppModule } from '../../../shared/http/module.ts';
import {
  access,
  defineRoute,
  noContent,
  type HttpResponse,
  type ResponseCookie,
} from '../../../shared/http/route.ts';
import { strict } from '../../../shared/http/schemas.ts';
import { DisplayNameSchema, toUserDto, UserDto } from '../../users/http/user-dto.ts';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  type AuthResult,
  type AuthService,
} from '../application/auth-service.ts';

export interface AuthHttpOptions {
  /** Absolute URL path the refresh cookie is scoped to (the auth routes only). */
  readonly cookiePath: string;
}

const REFRESH_COOKIE = 'refresh_token';

const EmailSchema = Type.String({ format: 'email', maxLength: 254 });
const NewPasswordSchema = Type.String({ minLength: PASSWORD_MIN_LENGTH, maxLength: PASSWORD_MAX_LENGTH });
/** Existing passwords are only bounded, so a policy change never locks anyone out. */
const PresentedPasswordSchema = Type.String({ minLength: 1, maxLength: PASSWORD_MAX_LENGTH });

const SessionDto = Type.Object({
  user: UserDto,
  accessToken: Type.String(),
  tokenType: Type.Literal('Bearer'),
  expiresIn: Type.Integer({ description: 'Access token lifetime in seconds' }),
});

/**
 * The access token travels in the response body (kept in memory by the
 * client); the refresh token only ever travels in an HttpOnly cookie, out of
 * reach of scripts.
 */
export function createAuthModule(auth: AuthService, options: AuthHttpOptions): AppModule {
  const refreshCookie = (value: string, maxAgeSeconds: number): ResponseCookie => ({
    name: REFRESH_COOKIE,
    value,
    path: options.cookiePath,
    maxAgeSeconds,
  });

  const sessionResponse = (status: number, { user, session }: AuthResult): HttpResponse => ({
    status,
    body: {
      user: toUserDto(user),
      accessToken: session.accessToken,
      tokenType: 'Bearer',
      expiresIn: session.accessTokenExpiresIn,
    },
    cookies: [refreshCookie(session.refreshToken, session.refreshTokenExpiresIn)],
  });

  return {
    name: 'auth',
    routes: [
      defineRoute({
        method: 'POST',
        path: '/auth/register',
        summary: 'Create an account and sign in',
        access: access.public,
        throttle: 'strict',
        request: {
          body: Type.Object(
            { email: EmailSchema, password: NewPasswordSchema, displayName: DisplayNameSchema },
            strict,
          ),
        },
        responses: { 201: SessionDto },
        handler: async ({ body }) => sessionResponse(201, await auth.register(body)),
      }),
      defineRoute({
        method: 'POST',
        path: '/auth/login',
        summary: 'Sign in with email and password',
        access: access.public,
        throttle: 'strict',
        request: {
          body: Type.Object({ email: EmailSchema, password: PresentedPasswordSchema }, strict),
        },
        responses: { 200: SessionDto },
        handler: async ({ body }) => sessionResponse(200, await auth.login(body.email, body.password)),
      }),
      defineRoute({
        method: 'POST',
        path: '/auth/refresh',
        summary: 'Exchange the refresh cookie for a new session',
        // Authenticated by the refresh cookie rather than an access token.
        access: access.public,
        throttle: 'strict',
        responses: { 200: SessionDto },
        handler: async ({ cookies }) => {
          const token = cookies[REFRESH_COOKIE];
          if (token === undefined) throw unauthenticated('Session is invalid or has expired');
          return sessionResponse(200, await auth.refresh(token));
        },
      }),
      defineRoute({
        method: 'POST',
        path: '/auth/logout',
        summary: 'End the current session',
        // Public so that a client with an expired access token can still sign out.
        access: access.public,
        throttle: 'strict',
        responses: { 204: null },
        handler: async ({ cookies }) => {
          const token = cookies[REFRESH_COOKIE];
          if (token !== undefined) await auth.logout(token);
          return { ...noContent(), cookies: [refreshCookie('', 0)] };
        },
      }),
      defineRoute({
        method: 'POST',
        path: '/auth/password',
        summary: 'Change password and sign out of all other sessions',
        access: access.authenticated,
        throttle: 'strict',
        request: {
          body: Type.Object(
            { currentPassword: PresentedPasswordSchema, newPassword: NewPasswordSchema },
            strict,
          ),
        },
        responses: { 200: SessionDto },
        handler: async ({ principal, body }) =>
          sessionResponse(
            200,
            await auth.changePassword(principal.userId, body.currentPassword, body.newPassword),
          ),
      }),
    ],
  };
}
