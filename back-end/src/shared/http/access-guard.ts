import { forbidden, unauthenticated } from '../domain/errors.ts';
import type { Principal } from '../domain/principal.ts';
import type { AccessPolicy } from './route.ts';

/** Turns a bearer access token into a principal, or throws `unauthenticated`. */
export interface Authenticator {
  authenticate(accessToken: string): Promise<Principal>;
}

const BEARER = /^Bearer ([A-Za-z0-9\-._~+/]+=*)$/;

/** Single enforcement point for every route's access policy. */
export class AccessGuard {
  readonly #authenticator: Authenticator;

  constructor(authenticator: Authenticator) {
    this.#authenticator = authenticator;
  }

  async resolve(policy: AccessPolicy, authorization: string | undefined): Promise<Principal | null> {
    if (policy.kind === 'public') return null;

    const token = authorization === undefined ? undefined : BEARER.exec(authorization)?.[1];
    if (token === undefined) throw unauthenticated();

    const principal = await this.#authenticator.authenticate(token);
    if (policy.kind === 'roles' && !policy.roles.includes(principal.role)) throw forbidden();
    return principal;
  }
}
