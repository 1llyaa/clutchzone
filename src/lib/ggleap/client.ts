import { isUserNotFound, secondsToMinutes, sumRemainingSeconds } from './hours';

/**
 * Minimal read-only ggLeap client.
 *
 * `GGLEAP_AUTH_TOKEN` is a center-wide secret, so it is read at call time and
 * never at module scope — the same shape as `createStripeClient()` in
 * `src/lib/stripe.ts`. When it is missing every lookup degrades to
 * `unavailable` rather than throwing, mirroring `getTransport()` in
 * `src/lib/email.ts`.
 *
 * A lookup costs two calls: `user-details` resolves the nickname to a UUID,
 * then `gamepasses/list` supplies the actual remaining time. `TimeRemaining` on
 * the user record is NOT usable — see `sumRemainingSeconds` in `./hours`.
 */

const API = 'https://api.ggleap.com';
const AUTH_URL = `${API}/production/authorization/public-api/auth`;
const TIMEOUT_MS = 5_000;
/** ggLeap JWTs live 10 minutes; renew at 5 so no in-flight call races the expiry. */
const JWT_TTL_MS = 5 * 60_000;

export interface GgLeapUser {
  username: string;
  minutes: number;
  locked: boolean;
  accountStatus: string | null;
}

export type GgLeapLookup =
  | { status: 'ok'; user: GgLeapUser }
  | { status: 'not_found' }
  | { status: 'unavailable' };

let jwtCache: { token: string; expiresAt: number } | null = null;

async function fetchJwt(): Promise<string | null> {
  const authToken = process.env.GGLEAP_AUTH_TOKEN;
  if (!authToken) return null;

  try {
    const res = await fetch(AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ AuthToken: authToken }),
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error('[ggleap] auth failed', res.status);
      return null;
    }
    const data = await res.json();
    const jwt = typeof data?.Jwt === 'string' ? data.Jwt : null;
    if (!jwt) {
      console.error('[ggleap] auth response had no Jwt');
      return null;
    }
    jwtCache = { token: jwt, expiresAt: Date.now() + JWT_TTL_MS };
    return jwt;
  } catch (err) {
    console.error('[ggleap] auth error', err instanceof Error ? err.message : err);
    return null;
  }
}

async function getJwt(forceRefresh = false): Promise<string | null> {
  if (!forceRefresh && jwtCache && jwtCache.expiresAt > Date.now()) return jwtCache.token;
  jwtCache = null;
  return fetchJwt();
}

async function rawGet(path: string, jwt: string): Promise<Response | null> {
  try {
    return await fetch(`${API}${path}`, {
      headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    console.error('[ggleap] request error', path, err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * GET with the shared JWT, retrying once against a fresh token — a cached JWT
 * can expire between two calls of the same lookup. Returns the raw body text
 * because ggLeap's not-found signal lives in the body, not the status.
 */
async function authedGet(path: string): Promise<{ status: number; body: string } | null> {
  let jwt = await getJwt();
  if (!jwt) return null;

  let res = await rawGet(path, jwt);
  if (res?.status === 401) {
    jwt = await getJwt(true);
    if (!jwt) return null;
    res = await rawGet(path, jwt);
  }
  if (!res) return null;

  try {
    return { status: res.status, body: await res.text() };
  } catch {
    return null;
  }
}

export async function lookupUser(username: string): Promise<GgLeapLookup> {
  const trimmed = username.trim();
  if (!trimmed) return { status: 'not_found' };

  const userRes = await authedGet(`/beta/users/user-details?Username=${encodeURIComponent(trimmed)}`);
  if (!userRes) return { status: 'unavailable' };

  if (userRes.status < 200 || userRes.status >= 300) {
    if (isUserNotFound(userRes.status, userRes.body)) return { status: 'not_found' };
    console.error('[ggleap] user-details failed', userRes.status);
    return { status: 'unavailable' };
  }

  let user: Record<string, unknown> | undefined;
  try {
    user = (JSON.parse(userRes.body) as { User?: Record<string, unknown> })?.User;
  } catch {
    return { status: 'unavailable' };
  }
  if (!user || typeof user.Username !== 'string' || typeof user.Uuid !== 'string') {
    return { status: 'not_found' };
  }

  // `IncludeInactive=false` leaves only passes with time left on them.
  const passRes = await authedGet(
    `/beta/users/gamepasses/list?UserUuid=${encodeURIComponent(user.Uuid)}&IncludeInactive=false`,
  );
  if (!passRes || passRes.status < 200 || passRes.status >= 300) {
    console.error('[ggleap] gamepasses/list failed', passRes?.status ?? 'no response');
    return { status: 'unavailable' };
  }

  let offers: unknown;
  try {
    offers = (JSON.parse(passRes.body) as { Offers?: unknown })?.Offers;
  } catch {
    return { status: 'unavailable' };
  }

  return {
    status: 'ok',
    user: {
      username: user.Username,
      minutes: secondsToMinutes(sumRemainingSeconds(offers)),
      locked: user.Locked === true,
      accountStatus: typeof user.AccountStatus === 'string' ? user.AccountStatus : null,
    },
  };
}
