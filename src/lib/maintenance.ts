export const MAINTENANCE_COOKIE = 'cz_maintenance_auth';

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
