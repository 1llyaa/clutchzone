export const MAINTENANCE_COOKIE = 'cz_maintenance_auth';

/**
 * Behind a reverse proxy, request.nextUrl's host can resolve to the
 * container's own bind address (e.g. 0.0.0.0:3000) instead of the real
 * domain. Prefer the standard forwarded headers, which proxies set to the
 * original public host/protocol.
 */
export function resolveOrigin(request: {
  headers: { get(name: string): string | null };
  nextUrl: URL;
}): string {
  const forwardedHost = request.headers.get('x-forwarded-host');
  if (!forwardedHost) return request.nextUrl.origin;

  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https';
  return `${forwardedProto}://${forwardedHost}`;
}

export async function maintenanceToken(user: string, pass: string): Promise<string> {
  const data = new TextEncoder().encode(`${user}:${pass}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function expectedMaintenanceToken(): Promise<string | null> {
  const user = process.env.MAINTENANCE_USER;
  const pass = process.env.MAINTENANCE_PASS;
  if (!user || !pass) return null;
  return maintenanceToken(user, pass);
}
