/**
 * Client for the Cherish back end (see /back-end).
 *
 * The access token lives in memory only. The refresh token is an HttpOnly
 * cookie the browser handles by itself; scripts cannot read it. The API is
 * reached on the page's own origin (the dev server forwards /api to it), which
 * is what lets the browser send that cookie.
 */
const API = "/api/v1";

let accessToken = null;

/** Thrown for every non-2xx answer; `problem` is the server's RFC 9457 body. */
export class ApiError extends Error {
  constructor(problem) {
    super(problem.detail);
    this.name = "ApiError";
    this.problem = problem;
  }
}

async function parse(response) {
  if (response.status === 204) return undefined;
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { status: response.status, code: "unexpected", detail: response.statusText || "Server unreachable" };
  }
  if (!response.ok) throw new ApiError(body);
  return body;
}

/** Starts a session and remembers its access token. Resolves to the user. */
async function startSession(path, body) {
  const response = await fetch(`${API}${path}`, {
    method: "POST",
    credentials: "include",
    ...(body === undefined
      ? {}
      : { headers: { "content-type": "application/json" }, body: JSON.stringify(body) }),
  });
  const session = await parse(response);
  accessToken = session.accessToken;
  return session.user;
}

export const register = (email, password, displayName) =>
  startSession("/auth/register", { email, password, displayName });

export const login = (email, password) => startSession("/auth/login", { email, password });

export async function logout() {
  accessToken = null;
  await fetch(`${API}/auth/logout`, { method: "POST", credentials: "include" });
}

/**
 * Trades the refresh cookie for a new access token. Resolves to the user, or
 * null when nobody is signed in.
 *
 * A refresh token works exactly once, and the back end ends the session if one
 * is presented twice. So refreshes must never overlap: the shared promise
 * covers this tab, the Web Lock covers other tabs of the same site.
 */
let refreshing = null;

export function refresh() {
  refreshing ??= navigator.locks
    .request("auth-refresh", () => startSession("/auth/refresh"))
    .catch((error) => {
      accessToken = null;
      if (error instanceof ApiError && error.problem.status === 401) return null;
      throw error;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

/** Authenticated request. Refreshes the access token once if it has expired. */
export async function api(method, path, body) {
  const send = () =>
    fetch(`${API}${path}`, {
      method,
      headers: {
        ...(accessToken === null ? {} : { authorization: `Bearer ${accessToken}` }),
        ...(body === undefined ? {} : { "content-type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

  let response = await send();
  if (response.status === 401 && (await refresh()) !== null) response = await send();
  return parse(response);
}
